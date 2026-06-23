# backend/app/features/transcription/whisper_engine.py
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

client = OpenAI(
    api_key=api_key if api_key else "dummy_key",
    base_url="https://api.groq.com/openai/v1"
)

def transcribe_audio(audio_file_path):
    print(f"🎙️ Listening to audio: {audio_file_path}...")
    try:
        with open(audio_file_path, "rb") as file:
            # Pass the file directly and request unbreakable raw text
            transcription = client.audio.transcriptions.create(
                file=file, 
                model="whisper-large-v3", # Fall back to the most stable model
                response_format="text",   # Request a string, not a JSON object
            )
        return transcription
    
    except Exception as e:
        print(f"❌ Transcription Error: {e}")
        return f"Error transcribing audio: {str(e)}"