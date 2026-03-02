from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from loguru import logger
import sys
import os
from typing import Optional

class Settings(BaseSettings):
    """
    Uygulama ayarlarını .env dosyasından veya ortam değişkenlerinden (Environment Variables) yükler.
    Default=None ve Field(default=...) kullanımı Pylance/VS Code hatalarını engeller.
    """

    # --- Veritabanı Ayarları ---
    DATABASE_URL: str = Field(default="postgresql+asyncpg://admin:password123@localhost:5433/nexus_db", alias="DATABASE_URL")
    SYNC_DATABASE_URL: str = Field(default="postgresql://admin:password123@localhost:5433/nexus_db", alias="SYNC_DATABASE_URL")
    MONGO_URL: str = Field(default="mongodb://admin:password123@localhost:27017/ai_pdf_db?authSource=admin", alias="MONGO_URL")

    # --- Redis & Celery ---
    REDIS_HOST: str = Field(default="localhost", alias="REDIS_HOST")
    REDIS_PORT: int = Field(default=6379, alias="REDIS_PORT")
    REDIS_URL: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    # --- AI & LLM Keys ---
    GEMINI_API_KEY: Optional[str] = Field(default=None, alias="GEMINI_API_KEY")
    GROQ_API_KEY: Optional[str] = Field(default=None, alias="GROQ_API_KEY")

    # --- Cloudinary ---
    CLOUDINARY_CLOUD_NAME: Optional[str] = Field(default=None, alias="CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY: Optional[str] = Field(default=None, alias="CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET: Optional[str] = Field(default=None, alias="CLOUDINARY_API_SECRET")

    HF_TOKEN: Optional[str] = Field(default=None, alias="HF_TOKEN")

    # Pydantic Settings Yapılandırması
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding='utf-8', 
        extra="ignore"
    )

# Ayarları yükle (Validation)
try:
    settings = Settings()
    logger.info("✅ Settings successfully loaded from environment.")
except Exception as e:
    logger.error(f"❌ Configuration error: {e}")
    # Kritik bir hata varsa uygulamanın çalışmasını durdurabiliriz
    # raise e 

# --- Log Ayarları ---
logger.remove()
logger.add(
    sys.stdout, 
    format="<green>{time:HH:mm:ss.SSS}</green> | <level>{message}</level>", 
    backtrace=True, 
    diagnose=True, 
    colorize=True
)

if not os.path.exists("logs"):
    os.makedirs("logs")
logger.add("logs/backend.log", rotation="10 MB")