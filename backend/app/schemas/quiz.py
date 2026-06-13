from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Any


class QuizGenerateRequest(BaseModel):
    subject: str
    topic: str
    difficulty: Optional[str] = "medium"
    num_questions: Optional[int] = 5


class QuizQuestionRead(BaseModel):
    id: int
    question_text: str
    question_type: str
    options: Optional[List[str]]
    order_index: int

    class Config:
        from_attributes = True


class QuizQuestionWithAnswer(QuizQuestionRead):
    correct_answer: str
    explanation: str


class QuizCreate(BaseModel):
    subject: str
    topic: str
    difficulty: str = "medium"


class QuizRead(BaseModel):
    id: int
    subject: str
    topic: str
    difficulty: str
    created_at: datetime
    questions: List[QuizQuestionRead] = []

    class Config:
        from_attributes = True


class QuizAttemptCreate(BaseModel):
    quiz_id: int
    answers: dict


class QuizAttemptRead(BaseModel):
    id: int
    quiz_id: int
    score: float
    total_questions: int
    correct_answers: int
    completed_at: datetime
    feedback: Optional[List[dict]] = None

    class Config:
        from_attributes = True
