from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.curriculum import Unit, Lesson, LessonProgress
from app.models.user import User
from app.schemas.curriculum import UnitRead, LessonRead, LessonProgressRead, LessonProgressUpdate
from app.services.auth_service import get_current_user

router = APIRouter()


@router.get("/units", response_model=List[UnitRead])
def list_units(subject_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Unit)
    if subject_id:
        q = q.filter(Unit.subject_id == subject_id)
    return q.order_by(Unit.order_index).all()


@router.get("/units/{unit_id}", response_model=UnitRead)
def get_unit(unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit


@router.get("/lessons/{lesson_id}", response_model=LessonRead)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.post("/lessons/{lesson_id}/progress", response_model=LessonProgressRead)
def update_lesson_progress(
    lesson_id: int,
    body: LessonProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    record = db.query(LessonProgress).filter(
        LessonProgress.user_id == current_user.id,
        LessonProgress.lesson_id == lesson_id,
    ).first()

    now = datetime.now(timezone.utc)

    if not record:
        record = LessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            status=body.status,
            score=body.score,
            started_at=now if body.status in ("in_progress", "completed") else None,
            completed_at=now if body.status == "completed" else None,
        )
        db.add(record)
    else:
        record.status = body.status
        if body.score is not None:
            record.score = body.score
        if body.status == "in_progress" and not record.started_at:
            record.started_at = now
        if body.status == "completed":
            record.completed_at = now

    db.commit()
    db.refresh(record)
    return record


@router.get("/progress", response_model=List[LessonProgressRead])
def get_my_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(LessonProgress).filter(
        LessonProgress.user_id == current_user.id
    ).all()
