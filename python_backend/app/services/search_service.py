from sqlalchemy.orm import Session
from sentence_transformers import SentenceTransformer
from app.models.pdf_vector import PDFVector
from pgvector.sqlalchemy import Vector

# Modelimizi yüklüyoruz (Worker'daki ile aynı model olmalı!)
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

def search_top_k(db: Session, query: str, file_hash: str, k: int = 3):
    # 1. Soruyu vektöre çevir
    query_embedding = model.encode(query).tolist()
    
    # 2. pgvector ile benzerlik araması yap
    # cosine_distance kullanarak en yakın 'k' adet sonucu getiriyoruz
    results = db.query(
        PDFVector.content,
        PDFVector.embedding.cosine_distance(query_embedding).label("distance")
    ).filter(PDFVector.file_hash == file_hash)\
     .order_by("distance")\
     .limit(k)\
     .all()
    
    return results