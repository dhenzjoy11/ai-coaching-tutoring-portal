from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class LessonSummary(BaseModel):
    id: int
    title: str
    ca_standard: str
    estimated_minutes: int
    order_index: int
    is_published: bool

    class Config:
        from_attributes = True


class LessonRead(BaseModel):
    id: int
    unit_id: int
    title: str
    ca_standard: str
    content: str
    estimated_minutes: int
    order_index: int
    is_published: bool

    class Config:
        from_attributes = True


class UnitRead(BaseModel):
    id: int
    subject_id: int
    title: str
    ca_domain: str
    description: str
    order_index: int
    is_published: bool
    lessons: List[LessonSummary] = []

    class Config:
        from_attributes = True


class LessonProgressRead(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    status: str
    score: Optional[float]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class LessonProgressUpdate(BaseModel):
    status: str  # not_started, in_progress, completed
    score: Optional[float] = None
