# backend/app/features/flashcards/flashcard_engine.py
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    api_key = "dummy_key"

client = OpenAI(
    api_key=api_key,
    base_url="https://api.groq.com/openai/v1"
)

def generate_flashcards(text_content):
    """
    Takes raw lecture text and asks the LLM to generate Q&A pairs in JSON format.
    """
    print("🧠 Generating Flashcards...")
    
    system_prompt = """
    You are an expert AI tutor. Your goal is to extract the most important concepts 
    from the provided lecture text and convert them into highly effective flashcards.
    
    Respond ONLY with a valid JSON object matching this exact structure:
    {
      "flashcards": [
        {"question": "What is X?", "answer": "X is Y."},
        {"question": "How does A work?", "answer": "A works by B."}
      ]
    }
    Make sure the answers are concise but fully explain the concept. Generate up to 10 flashcards.
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant", #   ADDED THIS LINE
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Create study flashcards from this lecture:\n\n{text_content}"}
            ],
            temperature=0.3,
            response_format={"type": "json_object"} 
        )
        
        flashcard_data = json.loads(response.choices[0].message.content)
        return flashcard_data.get("flashcards", [])
    
    except Exception as e:
        print(f"❌ Flashcard Generation Error: {e}")
        return []