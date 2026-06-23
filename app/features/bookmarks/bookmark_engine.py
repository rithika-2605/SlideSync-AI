# backend/app/features/bookmarks/bookmark_engine.py
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

def generate_study_guide_entry(concept_text):
    """Takes a short concept and expands it into a detailed study note."""
    print(f"🔖 Expanding bookmark for study guide...")
    
    system_prompt = """
    You are an expert tutor. The user has bookmarked a specific flashcard or concept.
    Your job is to expand this concept into a comprehensive, easy-to-read study note.
    
    Respond ONLY with a valid JSON object matching this exact structure:
    {
      "title": "Main Concept Name",
      "definition": "A clear, concise 1-2 sentence definition.",
      "key_points": ["Important detail 1", "Important detail 2", "Important detail 3"],
      "example": "A real-world example or helpful analogy to make it stick."
    }
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Create a deep-dive study note for this: {concept_text}"}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"❌ Bookmark Error: {e}")
        return None