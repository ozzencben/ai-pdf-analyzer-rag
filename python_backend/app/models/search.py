from pydantic import BaseModel
from typing import List

class SearchRequest(BaseModel):
  query: str
  file_hash: str
  top_k: int = 3

class SearchResult(BaseModel):
  content: str
  distance: float

class SearchResponse(BaseModel):
  answer: str
  results: List[SearchResult]