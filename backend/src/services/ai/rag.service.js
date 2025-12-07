import { ChromaClient } from "chromadb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from "dotenv";
dotenv.config();

const COLLECTION_NAME = "scrum_knowledge_base_v2";

// Initialize ChromaDB Client
const client = new ChromaClient({
  path: "http://localhost:8000",
});

// Initialize Embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  modelName: "text-embedding-004", // or text-embedding-004
});

let collection;

const getCollection = async () => {
  if (collection) return collection;
  try {
    collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      embeddingFunction: {
        generate: async (texts) => {
          return await Promise.all(texts.map((t) => embeddings.embedQuery(t)));
        },
      },
    });
    return collection;
  } catch (error) {
    console.error("Error connecting to ChromaDB:", error);
    throw new Error("Failed to connect to ChromaDB");
  }
};

export const upsertTicket = async (ticket) => {
  const col = await getCollection();
  const text = `Ticket: ${ticket.key} - ${ticket.summary}
Status: ${ticket.status}
Assignee: ${ticket.assignee || "Unassigned"}
Description: ${ticket.description || "No description"}
Priority: ${ticket.priority}
Type: ${ticket.issuetype}`;

  const embedding = await embeddings.embedQuery(text);

  await col.upsert({
    ids: [ticket.key],
    embeddings: [embedding],
    metadatas: [
      {
        type: "ticket",
        key: ticket.key,
        status: ticket.status,
        updatedAt: ticket.updated || new Date().toISOString(),
      },
    ],
    documents: [text],
  });
  console.log(`Upserted ticket ${ticket.key}`);
};

export const upsertSprint = async (sprint) => {
  const col = await getCollection();
  const text = `Sprint: ${sprint.name} (ID: ${sprint.id})
State: ${sprint.state}
Goal: ${sprint.goal || "No goal"}
Start Date: ${sprint.startDate}
End Date: ${sprint.endDate}`;

  const embedding = await embeddings.embedQuery(text);

  await col.upsert({
    ids: [`sprint-${sprint.id}`],
    embeddings: [embedding],
    metadatas: [{ type: "sprint", sprintId: sprint.id, state: sprint.state }],
    documents: [text],
  });
  console.log(`Upserted sprint ${sprint.name}`);
};

export const upsertPRD = async (prdText, filename) => {
  const col = await getCollection();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await splitter.createDocuments([prdText]);

  const ids = docs.map((_, i) => `${filename}-chunk-${i}`);
  const texts = docs.map((d) => d.pageContent);

  // Batch embeddings
  const embeddingsBatch = await Promise.all(
    texts.map((t) => embeddings.embedQuery(t))
  );

  const metadatas = docs.map((_, i) => ({
    type: "prd",
    filename,
    chunkIndex: i,
  }));

  await col.upsert({
    ids,
    embeddings: embeddingsBatch,
    metadatas,
    documents: texts,
  });
  console.log(`Upserted PRD ${filename} in ${docs.length} chunks`);
};

export const queryKnowledgeBase = async (query, nResults = 5) => {
  const col = await getCollection();
  const queryEmbedding = await embeddings.embedQuery(query);

  const results = await col.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
  });

  return results.documents[0].map((doc, i) => ({
    content: doc,
    metadata: results.metadatas[0][i],
  }));
};
