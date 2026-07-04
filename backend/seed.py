import os
from sqlalchemy.orm import Session
from app.services.db import SessionLocal, engine, Base
from app.models.parents import Parent
from app.models.families import Family
from app.models.children import Child
from app.models.builders import Builder, Service
from app.models.project_requests import ProjectRequest, Approval
from app.models.sessions import Session
from app.models.escrow import Escrow
from app.models.files import FileAttachment
from app.models.reviews import Review
import sys

def seed_db():
    print("Recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create Family
        family = Family(name="Demo Family")
        db.add(family)
        db.commit()
        db.refresh(family)
        
        # Create Parent
        parent = Parent(
            family_id=family.id, 
            name="Demo Parent", 
            email="parent@demo.com"
        )
        db.add(parent)
        db.commit()
        db.refresh(parent)
        
        # Create Child
        child = Child(
            family_id=family.id,
            name="Demo Student",
            grade="10th Grade",
            age=15
        )
        db.add(child)
        db.commit()
        db.refresh(child)
        
        # Create Builder
        builder = Builder(
            name="CraftWorks Studio",
            email="builder@demo.com",
            verification_status="verified",
            rating_avg=4.9,
            blurb="School models with sturdy finishes and clean presentation.",
            categories="[\"craft\", \"models\"]",
            portfolio="[\"/builder-portfolio.png\", \"/uploaded-media.png\", \"/model-masters.png\"]"
        )
        db.add(builder)
        db.commit()
        db.refresh(builder)
        
        # Create Service
        service = Service(
            builder_id=builder.id,
            type="Guided Learning",
            price=150.00,
            category="Science Fair"
        )
        db.add(service)
        db.commit()
        db.refresh(service)
        
        # Create Project Request
        project_req = ProjectRequest(
            child_id=child.id,
            service_id=service.id,
            status="In Progress",
            progress=40
        )
        db.add(project_req)
        db.commit()
        db.refresh(project_req)
        
        # Create Approval
        approval = Approval(
            request_id=project_req.id,
            parent_id=parent.id,
            status="Approved"
        )
        db.add(approval)
        db.commit()
        
        # Create Session
        from datetime import datetime, timedelta
        session = Session(
            project_request_id=project_req.id,
            topic="Initial Project Kickoff & Blueprinting",
            scheduled_at=datetime.utcnow() + timedelta(days=2),
            duration_minutes=60,
            meeting_link="https://zoom.us/j/demo123456",
            status="scheduled"
        )
        db.add(session)
        db.commit()
        
        # Create Escrow Payment
        escrow = Escrow(
            project_request_id=project_req.id,
            amount=100.0,
            status="held"
        )
        db.add(escrow)
        db.commit()
        
        # Create a mock File Attachment
        file_att = FileAttachment(
            project_request_id=project_req.id,
            uploader_role="builder",
            file_name="Blueprint_Draft.pdf",
            file_url="https://example.com/mock-blueprint.pdf"
        )
        db.add(file_att)
        # Create a mock Review for another completed project (or just for the builder)
        # We'll just assign it to the same project for demo purposes, but set status to Completed
        # Actually, let's just make a standalone Review so it shows up in Analytics.
        review = Review(
            project_request_id=project_req.id,
            parent_id=parent.id,
            builder_id=builder.id,
            rating=5,
            comment="The builder was absolutely fantastic! My child learned so much."
        )
        db.add(review)
        db.commit()
        
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
