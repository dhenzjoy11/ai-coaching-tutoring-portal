from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.session import ChatSession, ChatMessage
from app.models.progress import UserActivity
from app.schemas.chat import ChatMessageCreate, ChatSessionCreate, ChatSessionRead
from app.services.auth_service import get_current_user
from app.services.ai_service import stream_chat_response

router = APIRouter()


@router.post("/sessions", response_model=ChatSessionRead)
def create_session(
    session_in: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = ChatSession(
        user_id=current_user.id,
        subject=session_in.subject,
        title=session_in.title,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions", response_model=List[ChatSessionRead])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )


@router.get("/sessions/{session_id}", response_model=ChatSessionRead)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: int,
    msg: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user_message = ChatMessage(session_id=session_id, role="user", content=msg.content)
    db.add(user_message)
    db.commit()

    history = [
        {"role": m.role, "content": m.content}
        for m in session.messages
    ]

    full_response = []

    async def generate():
        async for chunk in stream_chat_response(history, session.subject):
            full_response.append(chunk)
            yield f"data: {chunk}\n\n"

        ai_text = "".join(full_response)
        ai_message = ChatMessage(session_id=session_id, role="assistant", content=ai_text)
        db.add(ai_message)

        activity = UserActivity(
            user_id=current_user.id,
            activity_type="chat",
            subject=session.subject,
            duration_minutes=1,
        )
        db.add(activity)
        db.commit()
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
