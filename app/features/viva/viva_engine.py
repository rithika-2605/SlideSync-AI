# backend/app/features/viva/viva_engine.py
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

client = OpenAI(
    api_key=api_key if api_key else "dummy_key",
    base_url="https://api.groq.com/openai/v1"
)

def generate_viva_quiz(text_content):
    """Generates a mixed-format interactive quiz."""
    print("👨‍🏫 Generating Interactive Viva Quiz...")
    system_prompt = """
    You are an expert university professor. Based on the lecture text, create a 3-question interactive quiz.
    
    You MUST respond with a valid JSON object matching this exact structure:
    {
      "quiz": [
        {
          "type": "mcq",
          "question": "What is the primary function of X?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Option A"
        },
        {
          "type": "fitb",
          "question": "The process of converting X to Y is called ______.",
          "answer": "Photosynthesis"
        },
        {
          "type": "speech",
          "question": "Explain the relationship between X and Y in your own words."
        }
      ]
    }
    The first question must be Multiple Choice (mcq).
    The second question must be Fill in the Blank (fitb).
    The third question must be a complex, open-ended conceptual question meant to be answered via speech (speech).
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text_content}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content).get("quiz", [])
    except Exception as e:
        print(f"❌ Viva Quiz Error: {e}")
        return []

def grade_viva_answer(question, user_answer):
    """Grades the user's spoken/transcribed answer."""
    print("📝 Grading Speech Answer...")
    system_prompt = """
    You are a strict but fair professor. Evaluate the student's transcribed audio answer.
    Note: It is a speech transcript, so ignore filler words like "um" or minor grammatical errors.
    
    Respond ONLY in valid JSON format:
    {
      "score": 8,
      "feedback": "Your explanation of X was good, but you forgot to mention Y."
    }
    The score must be out of 10.
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Question: {question}\n\nStudent's Transcribed Answer: {user_answer}"}
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"❌ Viva Grading Error: {e}")
        return {"score": 0, "feedback": "Error grading the answer."}