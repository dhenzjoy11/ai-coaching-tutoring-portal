from pydantic import BaseModel
from typing import List, Optional


class LearningStepRead(BaseModel):
    id: int
    title: str
    content: str
    step_type: str
    order_index: int

    class Config:
        from_attributes = True


class LearningPathRead(BaseModel):
    id: int
    subject_id: int
    title: str
    description: str
    difficulty: str
    estimated_hours: float
    order_index: int
    steps: List[LearningStepRead] = []

    class Config:
        from_attributes = True


class SubjectRead(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    color: str
    learning_paths: List[LearningPathRead] = []

    class Config:
        from_attributes = True
