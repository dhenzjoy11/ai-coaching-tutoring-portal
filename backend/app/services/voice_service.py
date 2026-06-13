import openai
import base64
import tempfile
import os
from app.config import get_settings

settings = get_settings()


def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    client = openai.OpenAI(api_key=settings.openai_api_key)

    ext = "webm"
    if "mp4" in mime_type or "m4a" in mime_type:
        ext = "m4a"
    elif "wav" in mime_type:
        ext = "wav"
    elif "mp3" in mime_type:
        ext = "mp3"

    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
            )
        return transcript.text
    finally:
        os.unlink(tmp_path)


def decode_base64_audio(b64_data: str) -> bytes:
    if "," in b64_data:
        b64_data = b64_data.split(",")[1]
    return base64.b64decode(b64_data)
