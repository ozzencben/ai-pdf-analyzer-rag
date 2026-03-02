from app.core.config import settings
from loguru import logger
import uuid
import cloudinary
import cloudinary.uploader
from app.models.pdf import PDFMetadata
from app.core.database import pdf_collection

class CloudinaryService:
  def __init__(self):
    cloudinary.config(
      cloud_name=settings.CLOUDINARY_CLOUD_NAME,
      api_key=settings.CLOUDINARY_API_KEY,
      api_secret=settings.CLOUDINARY_API_SECRET,
      secure=True
    )

  async def upload(self, file_path, original_filename: str):
    try:
      random_id = uuid.uuid4().hex[:8]
      unique_name = f"{random_id}_{original_filename}"

      upload_result = cloudinary.uploader.upload(
        file_path,
        public_id=unique_name,
        folder="ai_analyzer_pdfs",
        resource_type="raw",
      )

      secure_url = upload_result.get("secure_url")
      logger.info(f"File uploaded to Cloudinary: {secure_url}")

      return secure_url
    except Exception as e:
      logger.error(f"Failed to upload file to Cloudinary: {e}")
      raise e

storage_service = CloudinaryService()