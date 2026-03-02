import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from app.core.config import settings
from loguru import logger

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# MongoDB Connection Settings
mongo_db = settings.MONGO_URL
client = AsyncIOMotorClient(mongo_db)
db = client.ai_pdf_analyzer
pdf_collection = db.pdfs

async def check_db_conn():
  try:
    await client.admin.command("ping")
    logger.info("Connected to MongoDB")
  except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")

# PostgreSQL Connection Settings
sync_engine = create_engine(settings.SYNC_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

Base = declarative_base()

def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()