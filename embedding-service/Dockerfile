# ============================================================
# Embedding Service — Dockerfile
# ============================================================
# Python FastAPI server for text embeddings.
# Model weights are pre-downloaded at build time for fast startup.
#
# Build:  docker build -t embedding-service .
# Run:    docker run -p 8001:8001 embedding-service
# ============================================================

FROM python:3.11-slim AS base

WORKDIR /app

# Install system deps for torch
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the model at build time so startup is fast
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('nomic-ai/nomic-embed-text-v1.5', trust_remote_code=True)"

COPY app.py .

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health')" || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]
