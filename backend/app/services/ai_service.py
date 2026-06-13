import anthropic
import json
from typing import AsyncGenerator, List, Dict
from app.config import get_settings

settings = get_settings()


def get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


TUTOR_SYSTEM_PROMPT = """You are an expert AI tutor and coach. Your role is to:
- Explain concepts clearly and at the appropriate level for the student
- Break down complex topics into understandable parts
- Ask guiding questions to help students discover answers themselves
- Provide encouragement and constructive feedback
- Adapt your teaching style to the subject and student's level
- Use examples, analogies, and real-world applications
- If asked about {subject}, focus your expertise on that subject area

Always be patient, supportive, and thorough in your explanations."""


async def stream_chat_response(
    messages: List[Dict[str, str]],
    subject: str = "general",
) -> AsyncGenerator[str, None]:
    client = get_client()
    system = TUTOR_SYSTEM_PROMPT.format(subject=subject)

    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=system,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield text


def chat_response(
    messages: List[Dict[str, str]],
    subject: str = "general",
) -> str:
    client = get_client()
    system = TUTOR_SYSTEM_PROMPT.format(subject=subject)

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=system,
        messages=messages,
    )
    return response.content[0].text


def generate_quiz(subject: str, topic: str, difficulty: str, num_questions: int) -> List[Dict]:
    client = get_client()

    prompt = f"""Generate {num_questions} quiz questions about "{topic}" in {subject}.
Difficulty level: {difficulty}.

Return a JSON array with this exact structure:
[
  {{
    "question_text": "...",
    "question_type": "multiple_choice",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct_answer": "A) ...",
    "explanation": "Brief explanation of why this is correct"
  }}
]

Mix question types: include some true/false (question_type: "true_false", options: ["True", "False"])
and short answer (question_type: "short_answer", options: null) questions too.
Return ONLY the JSON array, no other text."""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)


def generate_learning_path(subject: str, topic: str, difficulty: str) -> Dict:
    client = get_client()

    prompt = f"""Create a structured learning path for "{topic}" in {subject} at {difficulty} level.

Return JSON with this structure:
{{
  "title": "...",
  "description": "...",
  "estimated_hours": 10,
  "steps": [
    {{
      "title": "Step title",
      "content": "Detailed content/description of what to learn in this step",
      "step_type": "lesson",
      "order_index": 0
    }}
  ]
}}

Include 5-8 steps. Step types: lesson, exercise, quiz. Return ONLY the JSON, no other text."""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)
