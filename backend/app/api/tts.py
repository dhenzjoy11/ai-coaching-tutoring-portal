import hashlib
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import openai
from openai import AuthenticationError, RateLimitError, APIError
from app.config import get_settings

router = APIRouter()

CACHE_DIR = Path("/tmp/tts_cache")
MAX_CHARS = 4096  # OpenAI TTS limit per request


class TTSRequest(BaseModel):
    text: str
    voice: str = "nova"  # nova = warm female voice, good for teaching


@router.post("/speak")
def speak(body: TTSRequest):
    settings = get_settings()
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="TTS not available: OPENAI_API_KEY not configured",
        )

    text = body.text.strip()[:MAX_CHARS]
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    cache_key = hashlib.md5(f"{body.voice}:{text}".encode()).hexdigest()
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE_DIR / f"{cache_key}.mp3"

    if not cache_file.exists():
        client = openai.OpenAI(api_key=settings.openai_api_key)
        try:
            response = client.audio.speech.create(
                model="tts-1",
                voice=body.voice,
                input=text,
            )
            response.stream_to_file(str(cache_file))
        except AuthenticationError:
            raise HTTPException(status_code=401, detail="Invalid OpenAI API key — check your .env file")
        except RateLimitError:
            raise HTTPException(status_code=402, detail="OpenAI quota exceeded — add billing credits at platform.openai.com/settings/billing")
        except APIError as e:
            raise HTTPException(status_code=502, detail=f"OpenAI error: {str(e)}")

    return FileResponse(
        str(cache_file),
        media_type="audio/mpeg",
        headers={"Cache-Control": "public, max-age=86400"},
    )
