from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.voice_service import transcribe_audio, decode_base64_audio

router = APIRouter()


class Base64AudioRequest(BaseModel):
    audio_data: str  # base64 encoded
    mime_type: str = "audio/webm"


@router.post("/transcribe")
async def transcribe_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be audio")

    audio_bytes = await file.read()
    try:
        text = transcribe_audio(audio_bytes, file.content_type)
        return {"transcript": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post("/transcribe/base64")
async def transcribe_base64(
    req: Base64AudioRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        audio_bytes = decode_base64_audio(req.audio_data)
        text = transcribe_audio(audio_bytes, req.mime_type)
        return {"transcript": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
