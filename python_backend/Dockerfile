# UV için optimize edilmiş Python imajı
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Sistem bağımlılıkları
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# UV ile paket kurulumu
COPY pyproject.toml . 
RUN uv pip install --system -r pyproject.toml

# --- AI Model Pre-download (Yeni Eklenen Kısım) ---
# Modeli imajın içine build aşamasında indiriyoruz. 
# Bu sayede konteynır ayağa kalktığında internete ihtiyaç duymaz ve anında çalışır.
# RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
# --------------------------------------------------

COPY . .

# Uygulamayı başlat
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]