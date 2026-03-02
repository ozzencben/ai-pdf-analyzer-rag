from celery import Celery
from app.core.config import settings

REDIS_URL = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0"

celery_app = Celery(
    "worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.task_routes = {
  "app.worker.tasks.*": {"queue":"pdf_queue"}
}

celery_app.autodiscover_tasks(["app.worker"])