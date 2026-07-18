"""
Embedding Service — FastAPI server for text embeddings.

Exposes the nomic-ai/nomic-embed-text-v1.5 model via HTTP endpoints.
Used by the Node.js server for RAG and vector search operations.
"""

import os
import logging
import threading

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer

# ── Config ──────────────────────────────────────────────────────
MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
HOST = os.getenv("EMBEDDING_HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", os.getenv("EMBEDDING_PORT", "8001")))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("embedding-service")

# ── Model state ─────────────────────────────────────────────────
model: SentenceTransformer | None = None
model_loading = False
model_error: str | None = None


def load_model():
    """Load the model in a background thread."""
    global model, model_loading, model_error
    model_loading = True
    try:
        logger.info(f"Loading embedding model: {MODEL_NAME}")
        model = SentenceTransformer(MODEL_NAME)
        logger.info(f"Model loaded. Embedding dimension: {model.get_embedding_dimension()}")
    except Exception as e:
        model_error = str(e)
        logger.error(f"Failed to load model: {e}")
    finally:
        model_loading = False


# Start model loading in background thread immediately
threading.Thread(target=load_model, daemon=True).start()

app = FastAPI(
    title="Embedding Service",
    description="Text embedding API using nomic-embed-text-v1.5",
    version="1.0.0",
)


# ── Request / Response models ───────────────────────────────────
class EmbedRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, description="List of texts to embed")


class EmbedResponse(BaseModel):
    embeddings: list[list[float]]
    model: str
    dimension: int


class EmbedQueryRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Single text to embed")


class EmbedQueryResponse(BaseModel):
    embedding: list[float]
    model: str
    dimension: int


class HealthResponse(BaseModel):
    status: str
    model: str
    dimension: int | None = None


# ── Endpoints ───────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint. Returns 200 even during model loading."""
    if model is not None:
        return HealthResponse(
            status="ok",
            model=MODEL_NAME,
            dimension=model.get_embedding_dimension(),
        )
    elif model_loading:
        return HealthResponse(status="loading", model=MODEL_NAME)
    else:
        return HealthResponse(status="error", model=MODEL_NAME)


@app.post("/embed", response_model=EmbedResponse)
async def embed(req: EmbedRequest):
    """Embed a batch of texts. Returns one vector per input text."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    try:
        embeddings = model.encode(req.texts, normalize_embeddings=True)
        return EmbedResponse(
            embeddings=embeddings.tolist(),
            model=MODEL_NAME,
            dimension=model.get_embedding_dimension(),
        )
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/embed-query", response_model=EmbedQueryResponse)
async def embed_query(req: EmbedQueryRequest):
    """Embed a single query text."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    try:
        embedding = model.encode(req.text, normalize_embeddings=True)
        return EmbedQueryResponse(
            embedding=embedding.tolist(),
            model=MODEL_NAME,
            dimension=model.get_embedding_dimension(),
        )
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
