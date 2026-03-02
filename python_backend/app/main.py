from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from contextlib import asynccontextmanager
from app.core.database import check_db_conn, sync_engine, Base
from dotenv import load_dotenv
from app.api.v1.pdf_upload import router as pdf_upload_router
from app.api.v1.search import router as search_router

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
  try:
    logger.info("The application is starting...")
    # MongoDB Connection
    await check_db_conn()

    # PostgreSQL Connection
    logger.info("Checking/Creating PostgreSQL tables...")
    Base.metadata.create_all(bind=sync_engine)
    logger.info("PostgreSQL tables created/checked successfully...")

  except Exception as e:
    logger.error(f"An error occurred while closing the application.: {e}")
  #TODO: Canlıya geçmeden önce veritabanı bağlantısı hatasında uygulamanın açılmasını engelleyecek şekilde yield kullanımını düzenle!
  yield
  logger.info("The application is shutting down...")

app = FastAPI(
    title="AI PDF Analyzer",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router Configurations
api_router = APIRouter(prefix="/api/v1")
api_router.include_router(pdf_upload_router, prefix="/pdf-upload", tags=["PDF Upload"])
api_router.include_router(search_router, prefix="/search", tags=["Search"])
app.include_router(api_router)