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
This endpoint handles document ingestion using a **Memory-Efficient Streaming Architecture**.
* **🚀 RAM Optimization:** Chunked Streaming (64KB) prevents OOM crashes.
* **Smart Deduplication:** SHA-256 hash skip cloud storage for existing files.
* **Automated Cleanup:** Purges temporary data immediately after processing.
    """,
    response_description="Returns the metadata of the uploaded or existing PDF."
)
async def pdf_upload(file: UploadFile = File(...)):
    storage_service = CloudinaryService()
    logger.info(f"--- [YÜKLEME BAŞLADI] Dosya: {file.filename} ---")

    if file.content_type != "application/pdf":
        logger.error(f"Geçersiz dosya tipi: {file.content_type}")
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    if file.size is None or file.size > 10 * 1024 * 1024: # 10MB
        logger.error(f"Dosya boyutu çok büyük: {file.size}")
        raise HTTPException(status_code=400, detail="File size limit exceeded (Max 10MB)")

    temp_path = None

    try:
        # 1. Geçici dosya oluştur ve parça parça oku (RAM Dostu)
        logger.info("Adım 1: Dosya geçici diske yazılıyor...")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_path = temp_file.name
            while chunk := await file.read(64 * 1024):
                temp_file.write(chunk)
        logger.info(f"Adım 1 Tamam: Dosya diske yazıldı. Yol: {temp_path}")

        # 2. Hash hesapla
        logger.info("Adım 2: SHA-256 Hash hesaplanıyor...")
        file_hash = calculate_hash_file(temp_path)
        logger.info(f"Adım 2 Tamam: Hash hesaplandı -> {file_hash}")

        # 3. Veritabanında kontrol et (Deduplication)
        logger.info("Adım 3: Veritabanında mükerrer kayıt kontrolü yapılıyor...")
        existing_pdf = await pdf_collection.find_one({"file_hash": file_hash})

        if existing_pdf:
            logger.info(f"!!! [DUPLICATE] Dosya zaten var. Veritabanı ID: {existing_pdf['_id']}")
            # Geçici dosyayı hemen sil, sistemde yer kaplamasın
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
                logger.info("Temp dosya silindi (Duplicate durumu).")

            return {
                "success": True,
                "message": "File is already in your library",
                "data": {
                    "id": str(existing_pdf["_id"]),
                    "filename": existing_pdf["filename"],
                    "file_hash": existing_pdf["file_hash"],
                    "cloudinary_url": existing_pdf["cloudinary_url"],
                    "is_duplicate": True
                }
            }
        
        # 4. Dosya yeniyse Cloudinary'ye yükle
        logger.info("Adım 4: Yeni dosya tespit edildi. Cloudinary yüklemesi başlatılıyor...")
        original_filename = file.filename if file.filename else f"{file_hash}.pdf"
        file_url = await storage_service.upload(temp_path, original_filename)

        if not file_url:
            logger.error(f"Cloudinary yüklemesi başarısız: {original_filename}")
            raise HTTPException(status_code=500, detail="File upload to cloud failed")
        logger.info(f"Adım 4 Tamam: Cloudinary URL -> {file_url}")
    
        # 5. Metadata hazırla ve Veritabanına kaydet
        logger.info("Adım 5: Metadata veritabanına kaydediliyor...")
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
        logger.info(f"Adım 5 Tamam: MongoDB kaydı yapıldı (ID: {result.inserted_id})")

        # 6. AI Analiz Görevini Başlat (Celery Worker)
        logger.info("Adım 6: Celery Worker görevi tetikleniyor...")
        process_pdf_task.delay(temp_path, file_hash)
        logger.info("Adım 6 Tamam: Görev kuyruğa gönderildi.")

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
        # Hata durumunda kalan temp dosyayı temizle
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
            logger.warning(f"Hata oluştuğu için temp dosya temizlendi: {temp_path}")
        
        logger.error(f"--- [KRİTİK HATA] ---: {type(e).__name__} - {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sunucu hatası: {str(e)}")