# backend/app/features/mindmap/map_engine.py
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

def generate_mindmap(text_content):
    """
    Asks the LLM to break down the text into a node/edge graph structure.
    """
    print("🧠 Generating Mind-Map...")
    
    system_prompt = """
    You are an expert data visualizer. Extract the core concepts from the lecture text and build a mind map.
    Respond ONLY with a valid JSON object. Do not include markdown formatting or explanations.
    
    The JSON must have this exact structure:
    {
      "nodes": [
        {"id": "1", "data": {"label": "Main Topic"}},
        {"id": "2", "data": {"label": "Subtopic A"}}
      ],
      "edges": [
        {"id": "e1-2", "source": "1", "target": "2"}
      ]
    }
    Extract a maximum of 12 nodes. Keep the labels incredibly short (1-3 words).
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Create a mind map for this lecture:\n\n{text_content}"}
            ],
            temperature=0.3,
            response_format={"type": "json_object"} # Forces perfect JSON
        )
        
        map_json = json.loads(response.choices[0].message.content)
        return map_json
    
    except Exception as e:
        print(f"❌ Map Generation Error: {e}")
        return None