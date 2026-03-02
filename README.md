# AI PDF Analyzer 🚀

A high-performance, scalable RAG (Retrieval-Augmented Generation) application built with a modern backend-first approach. This system allows users to upload PDF documents, processes them using a streaming architecture, and provides intelligent insights via Llama 3.3.

## 🌟 Key Features

- **RAM-Efficient Streaming Upload:** Handles large PDF files using 64KB chunked streaming to prevent memory overflows (OOM protection).
- **Smart Deduplication (SHA-256):** Cryptographic hashing prevents duplicate uploads, saving storage costs in Cloudinary and Database entries.
- **Hybrid Storage Architecture:** \* **MongoDB:** Stores document metadata.
  - **Cloudinary:** Securely hosts binary PDF assets.
  - **pgvector (PostgreSQL):** High-speed vector similarity search for RAG.
  - **Redis:** Manages the Celery task queue for background processing.
- **Asynchronous Task Processing:** Celery workers handle heavy embedding and PDF parsing tasks outside the main request/response cycle.
- **Modern Frontend:** Next.js 15 with a session-based document history manager for seamless context switching.

## 🛠️ Tech Stack

| Layer             | Technology                                     |
| :---------------- | :--------------------------------------------- |
| **Backend**       | FastAPI (Python), Uvicorn                      |
| **Frontend**      | Next.js 15, TypeScript, Tailwind CSS (Planned) |
| **AI/LLM**        | Llama 3.3 (via Groq), LangChain                |
| **Vector DB**     | pgvector (PostgreSQL)                          |
| **Primary DB**    | MongoDB                                        |
| **Caching/Queue** | Redis, Celery                                  |
| **Storage**       | Cloudinary API                                 |

## 🏗️ System Architecture

1.  **Ingestion:** User uploads PDF -> SHA-256 Hash calculated -> Deduplication check.
2.  **Processing:** Celery worker triggers -> PDF parsed -> Text chunked -> OpenAI/HuggingFace Embeddings generated.
3.  **Storage:** Metadata to MongoDB, Vectors to pgvector, PDF to Cloudinary.
4.  **Query:** User asks question -> Semantic search via pgvector -> Context provided to Llama 3.3 -> Natural language response returned.

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Docker (for Redis, MongoDB, and Postgres with pgvector)

### Installation

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/your-username/ai-pdf-analyzer.git
    ```
2.  **Backend Setup:**
    ```bash
    cd ai-pdf-backend
    uv sync
    uv run uvicorn app.main:app --reload
    ```
3.  **Frontend Setup:**
    ```bash
    cd ai-pdf-frontend
    npm install
    npm run dev
    ```

---

**Built by Özenç Dönmezer • 2026 AI Backend Portfolio Project**
