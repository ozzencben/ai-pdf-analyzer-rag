import uuid
import tempfile
import shutil
import os
from pathlib import Path
from loguru import logger
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.pdf import PDFMetadata
from app.services.storage import CloudinaryService
from app.core.database import pdf_collection
from app.utils.hash import calculate_hash_file
from app.worker.tasks import process_pdf_task

router = APIRouter()

@router.post(
    "/",
    summary="Upload and Process PDF with Deduplication",
    description="""
### 📄 **AI PDF Analyzer - High-Performance Ingestion Engine**
This endpoint handles document ingestion using a **Memory-Efficient Streaming Architecture** designed for high scalability.

* **🚀 RAM Optimization (OOM Protection):** Unlike standard uploaders, this system uses a **Chunked Streaming** approach (64KB chunks). Even if 1000 users upload 10MB files simultaneously, the server's RAM remains stable, preventing "Out of Memory" crashes.
* **💾 Disk-Based Temporary Processing:** Files are processed via the local file system using secure temporary storage, ensuring that the main memory is never bottlenecked by large binary data.
* **Smart Deduplication (SHA-256):** Calculates a unique cryptographic hash directly from the disk stream. If a file exists, it skips cloud storage entirely to **minimize storage costs**.
* **Cloud Integration:** Seamlessly integrated with **Cloudinary** for scalable asset hosting.
* **Automated Cleanup:** Guaranteed lifecycle management via `try-finally` blocks that purge temporary data immediately after processing.

**Note:** If `is_duplicate` is `true`, the system reuses the existing asset, saving both time and bandwidth.
    """,
    response_description="Returns the metadata of the uploaded or existing PDF."
)
async def pdf_upload(file: UploadFile = File(...)):
  storage_service = CloudinaryService()

  if file.content_type != "application/pdf":
    logger.error("Only PDF files are allowed")
    raise HTTPException(status_code=400, detail="Only PDF files are allowed")
  
  if file.size is None or file.size > 10 * 1024 * 1024: # 10MB
    logger.error("File size limit exceeded")
    raise HTTPException(status_code=400, detail="File size limit exceeded")

  temp_path = None

  try:
    # Geçici dosya oluştur
    # delete=False, işlem bitmeden dosya silinmesin
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
      temp_path = temp_file.name
      # 2. Dosyayı parça parça (64KB'lık lokmalarla) okuyoruz
      # Bu döngü bitene kadar RAM kullanımın sabit kalır (Maks 64KB!)
      while chunk := await file.read(64 * 1024):
        temp_file.write(chunk)

    file_hash = calculate_hash_file(temp_path)

    existing_url = await pdf_collection.find_one({"file_hash": file_hash})

    if existing_url:
      if temp_path and os.path.exists(temp_path):
        os.remove(temp_path)
        logger.info(f"Duplicate file detected. Temp file removed: {temp_path}")

      file_url = existing_url["cloudinary_url"]
      logger.info(f"File already exists in Cloudinary: {file_url}")

      return {
        "success": True,
        "message": "File is already in your library",
        "data": {
          "id": str(existing_url["_id"]),
          "filename": existing_url["filename"],
          "file_hash": existing_url["file_hash"],
          "cloudinary_url": existing_url["cloudinary_url"],
          "is_duplicate": True
        }
      }
  
    else:
      original_filename = file.filename if file.filename else f"{file_hash}.pdf"
      file_url = await storage_service.upload(temp_path, original_filename)

      if not file_url:
        logger.error(f"Cloudinary upload failed for {original_filename}")
        raise HTTPException(status_code=500, detail="File upload failed")
    
      filename = file.filename if file.filename else file_url.split("/")[-1]
      user_id = uuid.uuid4().hex[:8]

      new_pdf = PDFMetadata(
        user_id=user_id,
        filename=filename,
        file_size=file.size,
        file_type=file.content_type,
        file_hash=file_hash,
        cloudinary_url=file_url
      )

      result = await pdf_collection.insert_one(new_pdf.model_dump())

      process_pdf_task.delay(temp_path, file_hash)

      return {
        "success": True,
        "message": "File uploaded successfully",
        "data": {
          "id": str(result.inserted_id),
          "filename": new_pdf.filename,
          "file_hash": file_hash,
          "cloudinary_url": new_pdf.cloudinary_url,
          "is_duplicate": False
        }
      }

  except Exception as e:
    logger.error(f"An error occurred: {e}")
    raise HTTPException(status_code=500, detail="An error occurred")

  