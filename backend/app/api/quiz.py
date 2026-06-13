from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt
from app.models.progress import UserActivity
from app.schemas.quiz import QuizGenerateRequest, QuizRead, QuizAttemptCreate, QuizAttemptRead
from app.services.auth_service import get_current_user
from app.services.ai_service import generate_quiz

router = APIRouter()


@router.post("/generate", response_model=QuizRead)
def create_quiz(
    req: QuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    questions_data = generate_quiz(req.subject, req.topic, req.difficulty, req.num_questions)

    quiz = Quiz(subject=req.subject, topic=req.topic, difficulty=req.difficulty)
    db.add(quiz)
    db.flush()

    for i, q in enumerate(questions_data):
        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q["question_text"],
            question_type=q.get("question_type", "multiple_choice"),
            options=q.get("options"),
            correct_answer=q["correct_answer"],
            explanation=q.get("explanation", ""),
            order_index=i,
        )
        db.add(question)

    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("", response_model=List[QuizRead])
def list_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Quiz).order_by(Quiz.created_at.desc()).limit(20).all()


@router.get("/{quiz_id}", response_model=QuizRead)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


@router.post("/attempt", response_model=QuizAttemptRead)
def submit_attempt(
    attempt_in: QuizAttemptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = db.query(Quiz).filter(Quiz.id == attempt_in.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()
    correct = 0
    feedback = []

    for q in questions:
        user_answer = attempt_in.answers.get(str(q.id), "")
        is_correct = user_answer.strip().lower() == q.correct_answer.strip().lower()
        if is_correct:
            correct += 1
        feedback.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "user_answer": user_answer,
            "correct_answer": q.correct_answer,
            "is_correct": is_correct,
            "explanation": q.explanation,
        })

    score = (correct / len(questions) * 100) if questions else 0

    attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_id=quiz.id,
        answers=attempt_in.answers,
        score=score,
        total_questions=len(questions),
        correct_answers=correct,
    )
    db.add(attempt)

    activity = UserActivity(
        user_id=current_user.id,
        activity_type="quiz",
        subject=quiz.subject,
        duration_minutes=len(questions) * 1.5,
        score=score,
    )
    db.add(activity)
    db.commit()
    db.refresh(attempt)

    result = QuizAttemptRead.model_validate(attempt)
    result.feedback = feedback
    return result
