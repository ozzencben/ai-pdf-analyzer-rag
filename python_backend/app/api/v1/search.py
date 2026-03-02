from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.search import SearchRequest, SearchResponse
from app.services.search_service import search_top_k
from app.services.llm_service import llm_service

router = APIRouter()

@router.post("/query", response_model=SearchResponse)
def query_pdf(request: SearchRequest, db: Session = Depends(get_db)):
    # 1. Vektör aramasını yap
    raw_results = search_top_k(
        db=db,
        query=request.query,
        file_hash=request.file_hash,
        k=request.top_k
    )

    if not raw_results:
        raise HTTPException(status_code=404, detail="No results found")

    # 2. Gemini'ye sadece içerikleri (string) gönder
    # raw_results -> [(content, distance), ...] formatında olduğu için:
    context_chunks = [result[0] for result in raw_results]
    
    answer = llm_service.ask_llm(
        query=request.query,
        context_chunks=context_chunks
    )

    # 3. Response Model'e (SearchResponse) tam uyumlu dönüş yap
    return {
        "answer": answer,
        "results": [
            {"content": res[0], "distance": float(res[1])} 
            for res in raw_results
        ]
    }