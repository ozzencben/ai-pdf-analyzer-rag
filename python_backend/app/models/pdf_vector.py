from sqlalchemy import Column, Integer, String, Text
from pgvector.sqlalchemy import Vector

from app.core.database import Base

class PDFVector(Base):
  """
  Bu sınıf PostgreSQL'deki 'pdf_vectors' tablosunu temsil eder.
  Her bir satır, bir PDF'in küçük bir parçasını ve o parçanın vektörünü tutar.
  """
  __tablename__ = "pdf_vectors"

  id = Column(Integer, primary_key=True, autoincrement=True)
  file_hash = Column(String, index=True, nullable=False)
  content = Column(Text, nullable=False)

  # Bizim modelimiz 384 boyutlu vektör ürettiği için burası 384 olmalı
  embedding = Column(Vector(384))