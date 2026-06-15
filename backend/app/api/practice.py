import json
import math
import random
import re
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.curriculum import Lesson
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter()

SEEDS_DIR = Path(__file__).parent.parent / "seeds" / "lessons"
QUESTIONS_PER_SET = 12


def compute_passing_score(total: int) -> float:
    """Allow up to 2 wrong answers OR require 90%, whichever needs fewer correct."""
    required_at_90pct = math.ceil(total * 0.9)
    required_with_2_wrong = max(total - 2, 0)
    required = min(required_at_90pct, required_with_2_wrong)
    return round(required / total, 4) if total > 0 else 0.9


def _practice_file(ca_standard: str) -> Path:
    key = re.sub(r"[\s.,]+", "", ca_standard).upper()
    return SEEDS_DIR / f"practice_{key}.json"


def _load_bank(lesson: Lesson) -> list:
    path = _practice_file(lesson.ca_standard)
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"No practice question bank available for {lesson.ca_standard} yet.",
        )
    with open(path) as f:
        return json.load(f)


def _pick_set(bank: list, exclude_ids=None) -> list:
    """Randomly pick QUESTIONS_PER_SET questions, avoiding exclude_ids if possible."""
    pool = [q for q in bank if q["id"] not in (exclude_ids or set())]
    if len(pool) < QUESTIONS_PER_SET:
        pool = bank  # fall back to full bank if exclusions leave too few
    return random.sample(pool, min(QUESTIONS_PER_SET, len(pool)))


def _build_response(lesson: Lesson, problems: list) -> dict:
    return {
        "lesson_id": lesson.id,
        "lesson_title": lesson.title,
        "ca_standard": lesson.ca_standard,
        "bank_size": None,  # don't expose bank size to client
        "problems": problems,
        "passing_score": compute_passing_score(len(problems)),
    }


@router.get("/lessons/{lesson_id}")
def get_practice_problems(
    lesson_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    bank = _load_bank(lesson)
    problems = _pick_set(bank)
    return _build_response(lesson, problems)


@router.post("/lessons/{lesson_id}/new-set")
def get_new_set(
    lesson_id: int,
    body: dict = {},
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Return a fresh random set, avoiding questions the student just saw."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    bank = _load_bank(lesson)
    seen_ids = set(body.get("seen_ids", []))
    problems = _pick_set(bank, exclude_ids=seen_ids)
    return _build_response(lesson, problems)
