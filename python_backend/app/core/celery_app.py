import os
from celery import Celery
from app.core.config import settings

# 1. Önce .env içindeki REDIS_URL'i dene, yoksa eski config'den fallback yap
# ÖNEMLİ: Upstash için URL mutlaka 'rediss://' ile başlamalı (SSL desteği için)
REDIS_URL = os.getenv("REDIS_URL", f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0")

celery_app = Celery(
    "worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# SSL/TLS Bağlantısı için Upstash/Render gibi platformlarda bu ayar gerekebilir
celery_app.conf.update(
    broker_use_ssl={'ssl_cert_reqs': 'none'},
    redis_backend_use_ssl={'ssl_cert_reqs': 'none'}
)

celery_app.conf.task_routes = {
  "app.worker.tasks.*": {"queue": "pdf_queue"}
}

celery_app.autodiscover_tasks(["app.worker"])