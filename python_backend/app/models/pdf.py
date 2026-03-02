from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class PDFMetadata(BaseModel):
  model_config = ConfigDict(
    populate_by_name=True,
    arbitrary_types_allowed=True #veri tipleri her zaman standart Python tipleri (str, int, list) olmayabilir. Bazen başka kütüphanelerden gelen karmaşık objeleri de sana parametre olarak geçebilirim
  )

  id: Optional[str] = Field(default=None, alias="_id")
  filename: str
  cloudinary_url: str
  user_id: str
  file_size: int
  file_type: str
  file_hash: str
  created_at: datetime = Field(default_factory=datetime.now)
  summary: Optional[str] = None # AI generated summary