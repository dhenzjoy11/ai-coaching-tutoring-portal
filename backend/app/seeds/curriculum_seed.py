from app.database import SessionLocal
from app.models.subject import Subject
from app.models.curriculum import Unit, Lesson

UNITS = [
    {
        "order_index": 1,
        "title": "The Number System",
        "ca_domain": "8.NS",
        "description": "Numbers that cannot be expressed as fractions exist, and we can approximate and place them on a number line.",
        "lessons": [
            {"order_index": 1, "title": "Rational vs. Irrational Numbers", "ca_standard": "8.NS.1", "estimated_minutes": 45},
            {"order_index": 2, "title": "Decimal Expansions", "ca_standard": "8.NS.1", "estimated_minutes": 40},
            {"order_index": 3, "title": "Approximating Irrational Numbers on a Number Line", "ca_standard": "8.NS.2", "estimated_minutes": 45},
        ],
    },
    {
        "order_index": 2,
        "title": "Expressions & Equations",
        "ca_domain": "8.EE",
        "description": "Exponents, scientific notation, proportional relationships, and linear equations are tools for modeling real-world situations.",
        "lessons": [
            {"order_index": 1, "title": "Integer Exponent Rules", "ca_standard": "8.EE.1", "estimated_minutes": 50},
            {"order_index": 2, "title": "Square Roots and Cube Roots", "ca_standard": "8.EE.2", "estimated_minutes": 45},
            {"order_index": 3, "title": "Scientific Notation", "ca_standard": "8.EE.3, 8.EE.4", "estimated_minutes": 50},
            {"order_index": 4, "title": "Proportional Relationships and Slope", "ca_standard": "8.EE.5, 8.EE.6", "estimated_minutes": 55},
            {"order_index": 5, "title": "Solving One-Variable Linear Equations", "ca_standard": "8.EE.7", "estimated_minutes": 50},
            {"order_index": 6, "title": "Equations with Infinitely Many or No Solutions", "ca_standard": "8.EE.7b", "estimated_minutes": 45},
            {"order_index": 7, "title": "Introduction to Systems of Equations", "ca_standard": "8.EE.8", "estimated_minutes": 50},
            {"order_index": 8, "title": "Solving Systems — Substitution & Elimination", "ca_standard": "8.EE.8b", "estimated_minutes": 60},
        ],
    },
    {
        "order_index": 3,
        "title": "Functions",
        "ca_domain": "8.F",
        "description": "A function is a rule that assigns exactly one output to each input. Linear functions can model many real-world relationships.",
        "lessons": [
            {"order_index": 1, "title": "What is a Function?", "ca_standard": "8.F.1", "estimated_minutes": 45},
            {"order_index": 2, "title": "Reading and Interpreting Function Graphs", "ca_standard": "8.F.2", "estimated_minutes": 45},
            {"order_index": 3, "title": "Linear vs. Non-linear Functions", "ca_standard": "8.F.3", "estimated_minutes": 45},
            {"order_index": 4, "title": "Slope-Intercept Form", "ca_standard": "8.F.4", "estimated_minutes": 55},
            {"order_index": 5, "title": "Modeling Real-World Relationships with Functions", "ca_standard": "8.F.5", "estimated_minutes": 50},
        ],
    },
    {
        "order_index": 4,
        "title": "Geometry",
        "ca_domain": "8.G",
        "description": "Transformations explain congruence and similarity. The Pythagorean Theorem connects geometry to algebra and applies in both 2D and 3D.",
        "lessons": [
            {"order_index": 1, "title": "Translations, Reflections, and Rotations", "ca_standard": "8.G.1-3", "estimated_minutes": 55},
            {"order_index": 2, "title": "Dilations and Scale Factor", "ca_standard": "8.G.3", "estimated_minutes": 45},
            {"order_index": 3, "title": "Congruence via Transformations", "ca_standard": "8.G.2", "estimated_minutes": 45},
            {"order_index": 4, "title": "Similarity via Transformations", "ca_standard": "8.G.4", "estimated_minutes": 45},
            {"order_index": 5, "title": "Angle Relationships — Parallel Lines & Transversals", "ca_standard": "8.G.5", "estimated_minutes": 50},
            {"order_index": 6, "title": "Exterior Angle Theorem", "ca_standard": "8.G.5", "estimated_minutes": 40},
            {"order_index": 7, "title": "Pythagorean Theorem — Proof and Basics", "ca_standard": "8.G.6, 8.G.7", "estimated_minutes": 55},
            {"order_index": 8, "title": "Pythagorean Theorem in 3D", "ca_standard": "8.G.7", "estimated_minutes": 50},
            {"order_index": 9, "title": "Volume — Cylinders, Cones, and Spheres", "ca_standard": "8.G.9", "estimated_minutes": 55},
        ],
    },
    {
        "order_index": 5,
        "title": "Statistics & Probability",
        "ca_domain": "8.SP",
        "description": "Data in scatter plots can reveal patterns and be modeled with a line of best fit. Two-way tables summarize categorical data.",
        "lessons": [
            {"order_index": 1, "title": "Scatter Plots and Association", "ca_standard": "8.SP.1", "estimated_minutes": 45},
            {"order_index": 2, "title": "Lines of Best Fit", "ca_standard": "8.SP.2, 8.SP.3", "estimated_minutes": 50},
            {"order_index": 3, "title": "Interpreting Slope and Intercept in Context", "ca_standard": "8.SP.3", "estimated_minutes": 45},
            {"order_index": 4, "title": "Two-Way Tables", "ca_standard": "8.SP.4", "estimated_minutes": 45},
        ],
    },
]


def seed_curriculum():
    db = SessionLocal()
    try:
        math = db.query(Subject).filter(Subject.name == "Mathematics").first()
        if not math:
            print("Mathematics subject not found — run the subjects seed first.")
            return

        if db.query(Unit).filter(Unit.subject_id == math.id).first():
            return  # already seeded

        for unit_data in UNITS:
            lessons_data = unit_data.pop("lessons")
            unit = Unit(subject_id=math.id, **unit_data)
            db.add(unit)
            db.flush()

            for lesson_data in lessons_data:
                lesson = Lesson(unit_id=unit.id, **lesson_data)
                db.add(lesson)

        db.commit()
        print(f"Seeded {len(UNITS)} units and 29 lessons.")
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    seed_curriculum()
