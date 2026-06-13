from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, default="")
    icon = Column(String, default="book")
    color = Column(String, default="#6366f1")

    learning_paths = relationship("LearningPath", back_populates="subject")


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    difficulty = Column(String, default="beginner")  # beginner, intermediate, advanced
    estimated_hours = Column(Float, default=0)
    order_index = Column(Integer, default=0)

    subject = relationship("Subject", back_populates="learning_paths")
    steps = relationship("LearningStep", back_populates="learning_path", order_by="LearningStep.order_index")
    progress = relationship("UserProgress", back_populates="learning_path")


class LearningStep(Base):
    __tablename__ = "learning_steps"

    id = Column(Integer, primary_key=True, index=True)
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, default="")
    step_type = Column(String, default="lesson")  # lesson, exercise, quiz
    order_index = Column(Integer, default=0)

    learning_path = relationship("LearningPath", back_populates="steps")
