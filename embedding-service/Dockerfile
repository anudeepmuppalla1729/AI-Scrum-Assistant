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
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY app.py .

EXPOSE 8001

ENV PORT=8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=5 \
  CMD python -c "import urllib.request, os; urllib.request.urlopen(f'http://localhost:{os.environ.get(\"PORT\", \"8001\")}/health')" || exit 1

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8001}"]
