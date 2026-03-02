import fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter

class PDFService:
  @staticmethod
  def extract_text_from_path(pdf_path: str, max_pages: int = 100) -> str:
    extracted_text = []
    with fitz.open(pdf_path) as doc:
      pages_to_read = min(len(doc), max_pages)

      for page_num in range(pages_to_read):
        page = doc.load_page(page_num)
        extracted_text.append(page.get_text())

    return "\n".join(extracted_text)

  @staticmethod
  def split_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200):
    """
    Ham metni anlamlı parçalara (chunks) böler.
    chunk_size: Her parçanın yaklaşık karakter sayısı.
    chunk_overlap: Parçalar arasındaki ortak karakter sayısı (bağlamın korunması için).
    """

    text_splitter = RecursiveCharacterTextSplitter(
      chunk_size=chunk_size,
      chunk_overlap=chunk_overlap,
      length_function=len,
      is_separator_regex=True
    )

    chunks = text_splitter.split_text(text)
    return chunks