from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class UserProgressRead(BaseModel):
    id: int
    learning_path_id: int
    completed_steps: int
    total_steps: int
    completion_percentage: float
    last_accessed: datetime

    class Config:
        from_attributes = True


class UserActivityRead(BaseModel):
    id: int
    activity_type: str
    subject: str
    duration_minutes: float
    score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_sessions: int
    total_study_minutes: float
    quizzes_completed: int
    average_quiz_score: float
    subjects_active: int
    streak_days: int
    recent_activities: List[UserActivityRead]
    progress_by_subject: List[dict]
