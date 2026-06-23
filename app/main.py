# backend/app/main.py
import os
import traceback 
import asyncio
import bcrypt
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# --- FILE EXTRACTOR IMPORTS ---
from app.features.extraction.slide_extractor import process_slide_file
from app.features.flashcards.flashcard_engine import generate_flashcards
from app.features.transcription.whisper_engine import transcribe_audio
from app.features.mindmap.map_engine import generate_mindmap
from app.features.podcast.podcast_engine import generate_podcast
from app.features.viva.viva_engine import generate_viva_quiz, grade_viva_answer
from app.database import bookmarks_collection, history_collection, users_collection

app = FastAPI(title="SlideSync AI API")

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class VivaSubmission(BaseModel):
    question: str
    user_answer: str

class BookmarkRequest(BaseModel):
    concept: str
    email: str

# Allow React frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- AUTH ROUTES ---
@app.post("/api/register")
async def register_user(user: UserCreate):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    password_bytes = user.password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    new_user = {"name": user.name, "email": user.email, "password": hashed_password}
    await users_collection.insert_one(new_user)
    
    return {"message": "Success", "user": {"name": user.name, "email": user.email}}


@app.post("/api/login")
async def login_user(user: UserLogin):
    db_user = await users_collection.find_one({"email": user.email})
    
    if db_user:
        password_bytes = user.password.encode('utf-8')
        db_password_bytes = db_user["password"].encode('utf-8')
        password_matches = bcrypt.checkpw(password_bytes, db_password_bytes)
    else:
        password_matches = False

    if not db_user or not password_matches:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    return {"message": "Success", "user": {"name": db_user["name"], "email": db_user["email"]}}


# --- MAIN PIPELINE UPLOAD ROUTE ---
@app.post("/api/upload")
async def process_lecture_files(
    audio_file: Optional[UploadFile] = File(None),
    slide_file: Optional[UploadFile] = File(None),
    user_email: str = Form(...)
):
    if not audio_file and not slide_file:
        raise HTTPException(status_code=400, detail="Must upload at least one file.")

    response_data = {
        "processed": [], 
        "flashcards": None, 
        "transcript": None,
        "mindmap": None, 
        "podcast": None,
        "viva_quiz": None,  # FIXED: Renamed key from viva_question to viva_quiz for consistency
        "mode": "Unknown"
    }
    combined_master_text = ""

    # SCENARIO 1: AUDIO
    if audio_file:
        audio_path = os.path.join(UPLOAD_DIR, audio_file.filename)
        with open(audio_path, "wb") as buffer:
            buffer.write(await audio_file.read())
        
        try:
            transcript_text = transcribe_audio(audio_path)
            response_data["transcript"] = transcript_text
            response_data["processed"].append("audio")
            combined_master_text += transcript_text + "\n\n"
        except Exception as e:
            print("🚨 AUDIO PIPELINE CRASH:")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

    # SCENARIO 2: SLIDES
    if slide_file:
        slide_path = os.path.join(UPLOAD_DIR, slide_file.filename)
        with open(slide_path, "wb") as buffer:
            buffer.write(await slide_file.read())
        
        try:
            extracted_slides = process_slide_file(slide_path)
            
            slide_text_string = ""
            if isinstance(extracted_slides, list):
                for slide in extracted_slides:
                    if isinstance(slide, dict):
                        slide_text_string += f"Slide {slide.get('slide', '')}: {slide.get('text', '')}\n"
                    else:
                        slide_text_string += str(slide) + "\n"
            else:
                slide_text_string = str(extracted_slides)

            response_data["processed"].append("slides")
            combined_master_text += slide_text_string + "\n\n"
            
        except Exception as e:
            print("🚨 SLIDE PIPELINE CRASH:")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Error reading slides: {str(e)}")

    # SCENARIO 3: AI GENERATORS
    if combined_master_text.strip():
        if len(combined_master_text) > 12000:
            print("⚠️ Truncating text heavily to fit into llama-3.1-8b-instant limits.")
            combined_master_text = combined_master_text[:12000]

        try:
            base_name = slide_file.filename.split('.')[0] if slide_file else "audio_lecture"
            podcast_filename = f"podcast_{base_name}.mp3"
            
            # Stagger generation calls with intervals to preserve rate parameters safely
            response_data["flashcards"] = generate_flashcards(combined_master_text)
            await asyncio.sleep(1.2)
            
            response_data["mindmap"] = generate_mindmap(combined_master_text)
            await asyncio.sleep(1.2)
            
            response_data["podcast"] = generate_podcast(combined_master_text, podcast_filename)
            await asyncio.sleep(1.2)
            
            response_data["viva_quiz"] = generate_viva_quiz(combined_master_text)
        except Exception as e:
            print("🚨 AI GENERATOR CRASH:")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Error generating AI materials: {str(e)}")

    if audio_file and slide_file: response_data["mode"] = "Full Sync Mode"
    elif slide_file: response_data["mode"] = "Slide Only Mode"
    elif audio_file: response_data["mode"] = "Audio Only Mode"

    # Save to MongoDB History Vault
    try:
        session_to_save = response_data.copy()
        session_to_save["created_at"] = datetime.now().isoformat()
        session_to_save["title"] = slide_file.filename if slide_file else audio_file.filename
        session_to_save["user_email"] = user_email 

        await history_collection.insert_one(session_to_save)
    except Exception as e:
        print(f"⚠️ Warning: Could not save session to DB: {e}")

    return response_data


# --- ORAL EVALUATION ROUTE ---
@app.post("/api/viva/grade_speech")
async def grade_speech_viva(
    audio_file: UploadFile = File(...),
    question: str = Form(...)
):
    try:
        audio_path = os.path.join(UPLOAD_DIR, "temp_viva_answer.webm")
        with open(audio_path, "wb") as buffer:
            buffer.write(await audio_file.read())
        
        transcript = transcribe_audio(audio_path)
        result = grade_viva_answer(question, transcript)
        result["transcript"] = transcript 
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- STUDY GUIDE & ARCHIVE DATA MANAGEMENT ---
@app.post("/api/bookmark")
async def create_bookmark(req: BookmarkRequest):
    from app.features.bookmarks.bookmark_engine import generate_study_guide_entry
    try:
        entry = generate_study_guide_entry(req.concept)
        if entry:
            db_entry = entry.copy()
            
            # --- THE FIX: Bind this bookmark note securely to the logged-in user ---
            db_entry["user_email"] = str(req.email)
            # ----------------------------------------------------------------------
            
            await bookmarks_collection.insert_one(db_entry)
            return entry
        raise HTTPException(status_code=500, detail="Failed to generate bookmark.")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/bookmarks")
async def get_all_bookmarks(email: str):  # <--- NEW: Expect an email string parameter
    bookmarks = []
    
    # Force Python to use the function argument explicitly to avoid global scope module mixing
    search_query = str(email)
    
    # --- THE FIX: Filter bookmark records by the user's unique email context ---
    cursor = bookmarks_collection.find({"user_email": search_query})
    # --------------------------------------------------------------------------
    
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        bookmarks.append(doc)
    return bookmarks


@app.get("/api/history")
async def get_history(email: str):
    sessions = []
    search_query = str(email)
    cursor = history_collection.find({"user_email": search_query}).sort("created_at", -1)
    
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        sessions.append(doc)
    return sessions