# AI Coaching & Tutoring Portal

A full-stack AI-powered tutoring platform built with FastAPI and React.

## Features
- **AI Chat Tutoring** — Streaming conversations with Claude-powered tutor
- **Learning Paths** — AI-generated subject-specific learning paths
- **Quiz Generator** — Dynamic quizzes with instant feedback
- **Progress Dashboard** — Charts and activity tracking
- **Voice Input** — Whisper-powered voice-to-text for chat

## Tech Stack
- **Backend**: Python, FastAPI, SQLAlchemy, SQLite
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **AI**: Anthropic Claude (chat, quiz, learning paths), OpenAI Whisper (voice)

## Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in API keys
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Environment Variables
```
ANTHROPIC_API_KEY=   # for AI tutoring, quizzes, learning paths
OPENAI_API_KEY=      # for Whisper voice transcription
SECRET_KEY=          # JWT secret key
```
