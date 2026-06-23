# backend/app/database.py
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Defaults to local MongoDB if MONGODB_URL is not set in your .env file
MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

print("🔌 Connecting to MongoDB...")
client = AsyncIOMotorClient(MONGO_URL)

db = client.slidesync_db

# Collections for our application
bookmarks_collection = db.get_collection("bookmarks")
history_collection = db.get_collection("history")

# Add this below your other collections
users_collection = db.get_collection("users")

# This forces MongoDB to ensure emails are unique!
users_collection.create_index("email", unique=True)