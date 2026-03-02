from sentence_transformers import SentenceTransformer
from loguru import logger

class EmbeddingService:
  _model_name = "all-MiniLM-L6-v2"
  _model = None

  @classmethod
  def _get_model(cls):
    """Modeli Ram'de bir kez oluşturur (Lazy Loading)"""
    if cls._model is None:
      logger.info(f"AI Model loaded: {cls._model_name}...")
      cls._model = SentenceTransformer(cls._model_name)
      logger.success(f"AI Model loaded: {cls._model_name}...")

    return cls._model

  @classmethod
  def get_embeddings(cls, text_list: list[str]):
    """Metin listesini alır ve sayısal vektörlere dönüştürür"""

    try:
      model = cls._get_model()
      logger.info(f"{len(text_list)} text converted to embeddings...")

      embeddings = model.encode(text_list)

      return embeddings.tolist()

    except Exception as e:
      logger.error(f"Failed to convert text to embeddings: {e}")
      raise e