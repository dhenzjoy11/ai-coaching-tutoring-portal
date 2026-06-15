from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.subject import Subject, LearningPath, LearningStep
from app.schemas.subject import SubjectRead, LearningPathRead
from app.services.auth_service import get_current_user
from app.services.ai_service import generate_learning_path

router = APIRouter()

DEFAULT_SUBJECTS = [
    {"name": "Mathematics", "description": "Algebra, calculus, statistics and more", "icon": "calculator", "color": "#6366f1", "is_active": True},
    {"name": "Programming", "description": "Coding, algorithms, data structures", "icon": "code", "color": "#f59e0b", "is_active": False},
]


def seed_subjects():
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        if not db.query(Subject).first():
            for s in DEFAULT_SUBJECTS:
                db.add(Subject(**s))
            db.commit()
    finally:
        db.close()


@router.get("", response_model=List[SubjectRead])
def list_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).all()


@router.get("/{subject_id}", response_model=SubjectRead)
def get_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


@router.post("/{subject_id}/learning-paths", response_model=LearningPathRead)
def create_learning_path(
    subject_id: int,
    topic: str,
    difficulty: str = "beginner",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    path_data = generate_learning_path(subject.name, topic, difficulty)

    path = LearningPath(
        subject_id=subject_id,
        title=path_data["title"],
        description=path_data["description"],
        difficulty=difficulty,
        estimated_hours=path_data.get("estimated_hours", 5),
    )
    db.add(path)
    db.flush()

    for i, step_data in enumerate(path_data.get("steps", [])):
        step = LearningStep(
            learning_path_id=path.id,
            title=step_data["title"],
            content=step_data["content"],
            step_type=step_data.get("step_type", "lesson"),
            order_index=i,
        )
        db.add(step)

    db.commit()
    db.refresh(path)
    return path
