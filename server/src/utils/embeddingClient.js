/**
 * Embedding Client — HTTP client for the remote embedding service.
 *
 * Replaces the local CustomHuggingFaceEmbeddings class.
 * Calls the Python FastAPI embedding service over HTTP.
 */

import dotenv from "dotenv";
dotenv.config();

const EMBEDDING_SERVICE_URL =
  process.env.EMBEDDING_SERVICE_URL || "http://localhost:8001";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Make an HTTP request to the embedding service with retries.
 */
async function request(endpoint, body, retries = MAX_RETRIES) {
  const url = `${EMBEDDING_SERVICE_URL}${endpoint}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Embedding service returned ${response.status}: ${text}`
        );
      }

      return await response.json();
    } catch (error) {
      if (attempt < retries) {
        console.warn(
          `Embedding service request failed (attempt ${attempt + 1}/${retries + 1}): ${error.message}. Retrying...`
        );
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      } else {
        throw error;
      }
    }
  }
}

/**
 * Embed a single query text. Returns a float array (768-dim).
 */
export async function embedQuery(text) {
  const data = await request("/embed-query", { text });
  return data.embedding;
}

/**
 * Embed multiple texts in a batch. Returns an array of float arrays.
 */
export async function embedDocuments(texts) {
  const data = await request("/embed", { texts });
  return data.embeddings;
}

/**
 * Check if the embedding service is healthy.
 */
export async function checkHealth() {
  const response = await fetch(`${EMBEDDING_SERVICE_URL}/health`);
  if (!response.ok) return null;
  return await response.json();
}

/**
 * Drop-in replacement object matching the old CustomHuggingFaceEmbeddings interface.
 * Used by consumers that expect an object with .embedQuery() and .embedDocuments() methods.
 */
export const embeddingClient = {
  embedQuery,
  embedDocuments,
};
