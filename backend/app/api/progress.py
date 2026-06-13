from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User
from app.models.progress import UserProgress, UserActivity
from app.models.session import ChatSession
from app.models.quiz import QuizAttempt
from app.schemas.progress import UserProgressRead, UserActivityRead, DashboardStats
from app.services.auth_service import get_current_user

router = APIRouter()


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).count()

    total_minutes = db.query(func.sum(UserActivity.duration_minutes)).filter(
        UserActivity.user_id == current_user.id
    ).scalar() or 0

    quiz_attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).all()
    quizzes_completed = len(quiz_attempts)
    avg_score = (
        sum(a.score for a in quiz_attempts) / quizzes_completed
        if quizzes_completed > 0 else 0
    )

    active_subjects = db.query(func.count(func.distinct(UserActivity.subject))).filter(
        UserActivity.user_id == current_user.id
    ).scalar() or 0

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_activities = (
        db.query(UserActivity)
        .filter(
            UserActivity.user_id == current_user.id,
            UserActivity.created_at >= thirty_days_ago,
        )
        .order_by(UserActivity.created_at.desc())
        .limit(10)
        .all()
    )

    progress_rows = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).all()
    progress_by_subject = [
        {
            "learning_path_id": p.learning_path_id,
            "completion_percentage": p.completion_percentage,
            "completed_steps": p.completed_steps,
            "total_steps": p.total_steps,
        }
        for p in progress_rows
    ]

    return DashboardStats(
        total_sessions=total_sessions,
        total_study_minutes=float(total_minutes),
        quizzes_completed=quizzes_completed,
        average_quiz_score=round(avg_score, 2),
        subjects_active=active_subjects,
        streak_days=0,
        recent_activities=recent_activities,
        progress_by_subject=progress_by_subject,
    )


@router.get("/activities", response_model=List[UserActivityRead])
def list_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(UserActivity)
        .filter(UserActivity.user_id == current_user.id)
        .order_by(UserActivity.created_at.desc())
        .limit(50)
        .all()
    )


@router.get("/paths", response_model=List[UserProgressRead])
def list_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(UserProgress).filter(UserProgress.user_id == current_user.id).all()
