from fastapi import FastAPI
from pydantic import config
from src.logging_config import configure_logger
import logging


app = FastAPI()
configure_logger()

logger = logging.getLogger(__name__)


@app.get("/api/health")
def health():
    return {"status": "ok"}
