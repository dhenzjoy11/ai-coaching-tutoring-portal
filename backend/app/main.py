from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.api import chat, subjects, progress, quiz, voice, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="AI Coaching & Tutoring Portal",
    description="AI-powered coaching and tutoring platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(subjects.router, prefix="/api/subjects", tags=["subjects"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(voice.router, prefix="/api/voice", tags=["voice"])


@app.get("/")
async def root():
    return {"message": "AI Coaching & Tutoring Portal API"}


@app.get("/health")
async def health():
    return {"status": "ok"}
