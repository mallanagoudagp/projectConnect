from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from app.services.db import get_db
from app.models.escrow import Escrow
from app.models.project_requests import ProjectRequest, Approval
from app.models.builders import Service
from app.services.payment_service import MockPaymentGateway
from datetime import datetime

router = APIRouter(prefix="/escrow", tags=["escrow"])

class FundRequest(BaseModel):
    payment_token: str # A mock card token like "tok_visa"

@router.post("/{project_id}/fund")
def fund_project(project_id: int, req: FundRequest, db: Session = Depends(get_db)):
    """Parent pays for the project, creating an Escrow and Approving the request"""
    project = db.query(ProjectRequest).options(joinedload(ProjectRequest.service)).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project Request not found")
        
    if not project.service:
        raise HTTPException(status_code=400, detail="Project Request has no associated service price")
        
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
def release_funds(project_id: int, db: Session = Depends(get_db)):
    """Releases funds from Escrow to the Builder, provided project is 100% complete"""
    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
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
