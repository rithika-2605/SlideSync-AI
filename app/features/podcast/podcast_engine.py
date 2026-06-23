# backend/app/features/podcast/podcast_engine.py
import os
from openai import OpenAI
from gtts import gTTS
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

client = OpenAI(
    api_key=api_key if api_key else "dummy_key",
    base_url="https://api.groq.com/openai/v1"
)

def generate_podcast(text_content, filename="recap_podcast.mp3"):
    """
    Writes an engaging script using LLM and converts it to speech.
    """
    print("🎧 Writing podcast script...")
    
    # Force the AI to act like an energetic podcaster
    system_prompt = """
    You are an engaging, energetic educational podcast host. 
    Summarize the core concepts of this lecture into a short, punchy 1-minute audio script. 
    Speak directly to the student. DO NOT use speaker labels, sound effect tags (like [upbeat music]), or markdown formatting. 
    Just output the raw, conversational text that you will speak out loud.
    """
    
    try:
        # 1. Generate the Script
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Create a podcast script for this lecture:\n\n{text_content}"}
            ],
            temperature=0.7
        )
        script = response.choices[0].message.content
        
        # 2. Convert to Audio
        print("🎙️ Recording audio (TTS)...")
        output_path = os.path.join("uploads", filename)
        
        tts = gTTS(text=script, lang='en', slow=False)
        tts.save(output_path)
        
        # Return both the script and the URL to the audio file
        return {
            "script": script,
            "audio_url": f"http://localhost:8000/uploads/{filename}"
        }
        
    except Exception as e:
        print(f"❌ Podcast Generation Error: {e}")
        return None