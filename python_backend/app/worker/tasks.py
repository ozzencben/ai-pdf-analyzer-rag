import os
from loguru import logger
from app.core.celery_app import celery_app
from app.services.pdf_service import PDFService
from app.services.embedding_service import EmbeddingService
from app.core.database import SessionLocal
from app.models.pdf_vector import PDFVector

# TODO: (Production Migration): > Şu an Windows ortamında geliştirme yapıldığı için Celery worker -P solo modunda çalıştırılmaktadır. Uygulama Linux/Docker tabanlı bir sunucuya taşındığında, yüksek performanslı paralel işleme (Parallel Processing) için bu mod kaldırılmalı ve varsayılan prefork havuzuna geçilmelidir.

@celery_app.task(name="process_pdf_task")
def process_pdf_task(file_path: str, file_hash: str):
  db = SessionLocal()
  try:
    logger.info(f"Processing PDF: {file_path} with hash: {file_hash}...")

    # Extract text from the PDF
    text = PDFService.extract_text_from_path(file_path)

    # Split text into chunks
    chunks = PDFService.split_text(text)
    logger.info(f"Total chunks created: {len(chunks)}")

    # Generate embeddings
    embedding = EmbeddingService.get_embeddings(chunks)
    logger.info(f"Total embeddings generated: {len(embedding)}")

    # Save embeddings to the database    
    vector_objs = []
    for i, chunk_text in enumerate(chunks):
      vector_objs.append(
        PDFVector(
          file_hash=file_hash,
          content=chunk_text,
          embedding=embedding[i]
        )
      )
    
    db.bulk_save_objects(vector_objs)
    db.commit()

    logger.success(f"Successfully saved {len(vector_objs)} vectors to PostgreSQL for hash: {file_hash}")
    return {
      "status": "completed",
      "file_hash": file_hash,
      "chunk_prossessed": f"PDF processed successfully. {len(vector_objs)} vectors saved to PostgreSQL."
    }
  except Exception as e:
    db.rollback() # Hata olurda veritabanı işlemlerini geri al
    logger.error(f"Failed to process PDF: {e}")
    raise e
  finally:
    db.close() # Veritabanı bağlantısını kapat
    if file_path and os.path.exists(file_path):
      os.remove(file_path)
      logger.info(f"Temporary file cleaned up: {file_path}")