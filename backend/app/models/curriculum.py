from sqlalchemy import Boolean, Column, Float, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    title = Column(String, nullable=False)
    ca_domain = Column(String, nullable=False)  # e.g. "8.NS"
    description = Column(Text, default="")
    order_index = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)

    subject = relationship("Subject", back_populates="units")
    lessons = relationship("Lesson", back_populates="unit", order_by="Lesson.order_index")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    title = Column(String, nullable=False)
    ca_standard = Column(String, nullable=False)  # e.g. "8.NS.1"
    content = Column(Text, default="")  # markdown
    estimated_minutes = Column(Integer, default=45)
    order_index = Column(Integer, default=0)
    is_published = Column(Boolean, default=False)

    unit = relationship("Unit", back_populates="lessons")
    progress = relationship("LessonProgress", back_populates="lesson")


class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    status = Column(String, default="not_started")  # not_started, in_progress, completed
    score = Column(Float, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="lesson_progress")
    lesson = relationship("Lesson", back_populates="progress")
