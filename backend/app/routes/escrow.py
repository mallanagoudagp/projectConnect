from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from app.services.db import get_db
from app.models.escrow import Escrow
from app.models.project_requests import ProjectRequest, Approval
from app.models.builders import Service, Builder
from app.models.parents import Parent
from app.models.children import Child
from app.services.payment_service import MockPaymentGateway
from app.services.auth_dependency import get_current_user, require_role
from datetime import datetime

router = APIRouter(prefix="/escrow", tags=["escrow"])


def _ensure_not_rejected(project: ProjectRequest):
    if project.status in ("Declined", "Rejected", "Rejected by Builder"):
        raise HTTPException(status_code=409, detail="Rejected projects are read-only. Create a new request to try again.")

@router.get("/refund-requests")
def list_refund_requests(db: Session = Depends(get_db), current_user: dict = Depends(require_role("admin"))):
    """
    Admin: list all escrow records in 'refund_requested' state.
    These are disputed projects where the builder has started work and the
    parent has requested a refund — awaiting admin approval.
    """
    rows = (
        db.query(Escrow, ProjectRequest, Service)
        .join(ProjectRequest, Escrow.project_request_id == ProjectRequest.id)
        .outerjoin(Service, ProjectRequest.service_id == Service.id)
        .filter(Escrow.status == "refund_requested")
        .all()
    )
    return [
        {
            "project_id": pr.id,
            "service_name": svc.type if svc else "Unknown",
            "progress": pr.progress,
            "amount": escrow.amount,
        }
        for escrow, pr, svc in rows
    ]


class FundRequest(BaseModel):
    payment_token: str # A mock card token like "tok_visa"

@router.post("/{project_id}/fund")
def fund_project(project_id: int, req: FundRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Parent pays for the project, creating an Escrow and Approving the request"""
    project = db.query(ProjectRequest).options(joinedload(ProjectRequest.service)).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project Request not found")
    _ensure_not_rejected(project)
        
    if not project.service:
        raise HTTPException(status_code=400, detail="Project Request has no associated service price")

    # Authorization / Ownership check:
    # Only the parent of the child associated with the project can fund it.
    parent = db.query(Parent).filter(Parent.email == current_user["email"]).first()
    child = db.query(Child).filter(Child.id == project.child_id).first()
    if not parent or not child or parent.family_id != child.family_id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You are not authorized to fund this project request."
        )
        
    # Check if already funded
    existing_escrow = db.query(Escrow).filter(Escrow.project_request_id == project_id).first()
    if existing_escrow:
        raise HTTPException(status_code=400, detail="Project is already funded in escrow.")
        
    amount = project.service.price
    
    # 1. Process payment via Gateway
    result = MockPaymentGateway.process_charge(amount, req.payment_token)
    if result["status"] != "success":
        raise HTTPException(status_code=400, detail="Payment failed")
        
    # 2. Create Escrow record
    escrow = Escrow(
        project_request_id=project_id,
        amount=amount,
        status="held"
    )
    db.add(escrow)
    
    # 3. Update Project Status & Approval
    project.status = "In Progress"
    approval = db.query(Approval).filter(Approval.request_id == project_id).first()
    if approval:
        approval.status = "Approved"
    
    db.commit()
    return {"message": "Payment successful and funds held in escrow.", "transaction_id": result["transaction_id"]}

@router.post("/{project_id}/release")
def release_funds(project_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Releases funds from Escrow to the Builder, provided project is 100% complete"""
    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _ensure_not_rejected(project)

    # Authorization / Ownership check:
    # Only the parent of the child associated with the project request or an admin can release funds.
    authorized = False
    if current_user["role"] == "parent":
        parent = db.query(Parent).filter(Parent.email == current_user["email"]).first()
        child = db.query(Child).filter(Child.id == project.child_id).first()
        if parent and child and parent.family_id == child.family_id:
            authorized = True
    elif current_user["role"] == "admin":
        authorized = True

    if not authorized:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only the parent or an admin can release escrow funds."
        )

    if project.progress < 100:
        raise HTTPException(status_code=400, detail="Project must be 100% complete to release funds")
        
    escrow = db.query(Escrow).filter(Escrow.project_request_id == project_id).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow record not found for this project")
        
    if escrow.status != "held":
        raise HTTPException(status_code=400, detail=f"Escrow funds already {escrow.status}")
        
    # Process Payout via Gateway
    # In a real app we'd look up the Builder's connected Stripe Account ID here.
    builder_account_id = "acct_mock_builder123" 
    result = MockPaymentGateway.transfer_to_builder(escrow.amount, builder_account_id)
    
    if result["status"] != "success":
        raise HTTPException(status_code=400, detail="Transfer to builder failed")
        
    escrow.status = "released"
    escrow.released_at = datetime.utcnow()
    project.status = "Completed"
    
    db.commit()
    return {"message": "Funds successfully released to the Builder."}

@router.post("/{project_id}/refund")
def refund_escrow(project_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Two-path refund policy (PRD):
      - progress == 0  → builder hasn't started; self-serve immediate refund via gateway.
      - progress  > 0  → builder has done real work; sets escrow to 'refund_requested'
                         and returns 202. No money moves until an admin calls
                         POST /escrow/{id}/refund/admin-approve.
    Row-locked to prevent a refund/release race (same pattern as payment_service.py).
    """
    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _ensure_not_rejected(project)

    # Authorization / Ownership check:
    # Only the parent of the child associated with the project can request a refund.
    parent = db.query(Parent).filter(Parent.email == current_user["email"]).first()
    child = db.query(Child).filter(Child.id == project.child_id).first()
    if not parent or not child or parent.family_id != child.family_id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You are not authorized to request a refund for this project request."
        )

    if project.progress >= 100:
        raise HTTPException(
            status_code=400,
            detail="Project is complete. Use /release to pay the builder, not /refund."
        )

    # Row lock — prevents concurrent release or double-refund from winning the race
    escrow = (
        db.query(Escrow)
        .filter(Escrow.project_request_id == project_id)
        .with_for_update()
        .first()
    )
    if not escrow:
        raise HTTPException(status_code=404, detail="No escrow record found for this project")

    if escrow.status != "held":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot refund: escrow is already '{escrow.status}'"
        )

    # Path A: no work started → immediate self-serve refund
    if project.progress == 0:
        result = MockPaymentGateway.refund_to_parent(escrow.amount)
        if result["status"] != "success":
            raise HTTPException(status_code=400, detail="Refund via payment gateway failed")

        escrow.status = "refunded"
        escrow.released_at = datetime.utcnow()
        project.status = "Cancelled"
        db.commit()
        return {
            "status": "refunded",
            "message": "Escrow funds refunded to the parent immediately (builder had not started work).",
            "refund_id": result["refund_id"],
            "amount": escrow.amount
        }

    # Path B: work has started → flag for admin review, no money moves yet
    escrow.status = "refund_requested"
    project.status = "Disputed"
    db.commit()
    # 202 Accepted: request is queued, not yet actioned
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=202,
        content={
            "status": "refund_requested",
            "message": (
                "The builder has already started work. Your refund request has been "
                "submitted for admin review. An admin will contact you within 1–2 business days."
            ),
            "amount": escrow.amount
        }
    )


@router.post("/{project_id}/refund/admin-approve")
def admin_approve_refund(project_id: int, db: Session = Depends(get_db), _user: dict = Depends(require_role("admin"))):
    """
    Admin-only: executes the gateway refund for a disputed project.
    Only callable when escrow.status == 'refund_requested' (set by the parent
    via /refund when progress > 0). In production this endpoint must be
    protected by an admin-role auth check.
    """
    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Row lock — prevents double-approval race
    escrow = (
        db.query(Escrow)
        .filter(Escrow.project_request_id == project_id)
        .with_for_update()
        .first()
    )
    if not escrow:
        raise HTTPException(status_code=404, detail="No escrow record found for this project")

    if escrow.status != "refund_requested":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve refund: escrow status is '{escrow.status}', expected 'refund_requested'"
        )

    result = MockPaymentGateway.refund_to_parent(escrow.amount)
    if result["status"] != "success":
        raise HTTPException(status_code=400, detail="Refund via payment gateway failed")

    escrow.status = "refunded"
    escrow.released_at = datetime.utcnow()
    project.status = "Cancelled"
    db.commit()
    return {
        "status": "refunded",
        "message": "Admin approved: escrow funds refunded to the parent.",
        "refund_id": result["refund_id"],
        "amount": escrow.amount
    }
