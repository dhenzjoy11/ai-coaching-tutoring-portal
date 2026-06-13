from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ChatMessageCreate(BaseModel):
    content: str
    session_id: Optional[int] = None
    subject: Optional[str] = "general"


class ChatMessageRead(BaseModel):
    id: int
    role: str
    content: str
    has_audio: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionCreate(BaseModel):
    subject: Optional[str] = "general"
    title: Optional[str] = "New Session"


class ChatSessionRead(BaseModel):
    id: int
    subject: str
    title: str
    created_at: datetime
    messages: List[ChatMessageRead] = []

    class Config:
        from_attributes = True
