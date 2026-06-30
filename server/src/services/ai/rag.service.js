import { ChromaClient } from "chromadb";
import customEmbeddings from "../../utils/customEmbeddings.cjs";
const HuggingFaceTransformersEmbeddings = customEmbeddings.CustomHuggingFaceEmbeddings;
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from "dotenv";
import {
  LEGACY_COLLECTION_NAME,
  buildBoardCollectionName,
  getCandidateCollectionNames,
  normalizeBoardId,
} from "./rag.context.js";
dotenv.config();

// Initialize ChromaDB Client
const client = new ChromaClient({
  path: "http://localhost:8000",
});

import { modelProgressCallback } from "../../utils/modelProgress.js";

// Initialize Embeddings with local model
const embeddings = new HuggingFaceTransformersEmbeddings({
  model: "nomic-ai/nomic-embed-text-v1.5",
  pretrainedOptions: {
    dtype: "q8",
    progress_callback: modelProgressCallback,
  }
});

const collectionCache = new Map();
const embeddingFunction = {
  generate: async (texts) => {
    return await Promise.all(texts.map((t) => embeddings.embedQuery(t)));
  },
};

const getCollectionByName = async (collectionName) => {
  if (collectionCache.has(collectionName)) {
    return collectionCache.get(collectionName);
  }
  try {
    const collection = await client.getOrCreateCollection({
      name: collectionName,
      embeddingFunction,
    });
    collectionCache.set(collectionName, collection);
    return collection;
  } catch (error) {
    console.error("Error connecting to ChromaDB:", error);
    throw new Error("Failed to connect to ChromaDB");
  }
};

const resolveCollectionNameForBoard = (boardId) => {
  const normalizedBoardId = normalizeBoardId(boardId);
  return normalizedBoardId
    ? buildBoardCollectionName(normalizedBoardId)
    : LEGACY_COLLECTION_NAME;
};

const mapResults = (results, collectionName) => {
  const docs = results?.documents?.[0] || [];
  const metadatas = results?.metadatas?.[0] || [];
  return docs.map((doc, i) => ({
    content: doc,
    metadata: metadatas[i],
    collectionName,
  }));
};

export const upsertTicket = async (ticket, options = {}) => {
  const boardId = normalizeBoardId(options.boardId);
  const collectionName = resolveCollectionNameForBoard(boardId);
  const col = await getCollectionByName(collectionName);
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
        ...(boardId ? { boardId } : {}),
      },
    ],
    documents: [text],
  });
  console.log(`Upserted ticket ${ticket.key} in ${collectionName}`);
};

export const upsertSprint = async (sprint, options = {}) => {
  const boardId = normalizeBoardId(
    options.boardId || sprint.originBoardId || sprint.boardId,
  );
  const collectionName = resolveCollectionNameForBoard(boardId);
  const col = await getCollectionByName(collectionName);
  const text = `Sprint: ${sprint.name} (ID: ${sprint.id})
State: ${sprint.state}
Goal: ${sprint.goal || "No goal"}
Start Date: ${sprint.startDate}
End Date: ${sprint.endDate}`;

  const embedding = await embeddings.embedQuery(text);

  await col.upsert({
    ids: [`sprint-${sprint.id}`],
    embeddings: [embedding],
    metadatas: [
      {
        type: "sprint",
        sprintId: sprint.id,
        state: sprint.state,
        ...(boardId ? { boardId } : {}),
      },
    ],
    documents: [text],
  });
  console.log(`Upserted sprint ${sprint.name} in ${collectionName}`);
};

export const upsertPRD = async (prdText, filename, options = {}) => {
  const boardId = normalizeBoardId(options.boardId);
  const collectionName = resolveCollectionNameForBoard(boardId);
  const col = await getCollectionByName(collectionName);
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
    ...(boardId ? { boardId } : {}),
  }));

  await col.upsert({
    ids,
    embeddings: embeddingsBatch,
    metadatas,
    documents: texts,
  });
  console.log(
    `Upserted PRD ${filename} in ${docs.length} chunks to ${collectionName}`,
  );
};

export const queryKnowledgeBase = async (query, nResults = 5, options = {}) => {
  const boardId = normalizeBoardId(options.boardId);
  const includeLegacyFallback = options.includeLegacyFallback !== false;
  const candidateCollectionNames = getCandidateCollectionNames(boardId, {
    includeLegacyFallback,
  });
  const queryEmbedding = await embeddings.embedQuery(query);

  for (const collectionName of candidateCollectionNames) {
    const col = await getCollectionByName(collectionName);
    const results = await col.query({
      queryEmbeddings: [queryEmbedding],
      nResults,
    });

    const mapped = mapResults(results, collectionName);
    if (mapped.length > 0) return mapped;
  }

  return [];
};

export const migrateSharedCollectionToBoardCollections = async ({
  defaultBoardId = null,
  batchSize = 200,
  dryRun = false,
} = {}) => {
  const resolvedDefaultBoardId = normalizeBoardId(defaultBoardId);
  const sharedCollection = await getCollectionByName(LEGACY_COLLECTION_NAME);

  let offset = 0;
  let processed = 0;
  let migrated = 0;
  let skipped = 0;
  const migratedByCollection = {};

  while (true) {
    const batch = await sharedCollection.get({
      limit: batchSize,
      offset,
      include: ["documents", "metadatas", "embeddings"],
    });

    const ids = batch?.ids || [];
    if (!ids.length) break;

    const documents = batch?.documents || [];
    const metadatas = batch?.metadatas || [];
    const embeddingsBatch = batch?.embeddings || [];
    const groupedRecords = new Map();

    ids.forEach((id, index) => {
      const metadata = metadatas[index] || {};
      const metadataBoardId = normalizeBoardId(metadata.boardId);
      const targetBoardId = metadataBoardId || resolvedDefaultBoardId;

      if (!targetBoardId) {
        skipped += 1;
        return;
      }

      const targetCollectionName = buildBoardCollectionName(targetBoardId);
      if (!groupedRecords.has(targetCollectionName)) {
        groupedRecords.set(targetCollectionName, {
          ids: [],
          documents: [],
          metadatas: [],
          embeddings: [],
          hasAnyEmbeddings: false,
          hasMissingEmbeddings: false,
        });
      }

      const group = groupedRecords.get(targetCollectionName);
      group.ids.push(id);
      group.documents.push(documents[index]);

      const enrichedMetadata = {
        ...metadata,
        boardId: targetBoardId,
        migratedFromCollection: LEGACY_COLLECTION_NAME,
      };
      group.metadatas.push(enrichedMetadata);

      const embedding = embeddingsBatch[index];
      if (Array.isArray(embedding) && embedding.length > 0) {
        group.hasAnyEmbeddings = true;
      } else {
        group.hasMissingEmbeddings = true;
      }
      group.embeddings.push(embedding);
    });

    for (const [collectionName, group] of groupedRecords.entries()) {
      if (!dryRun) {
        const targetCollection = await getCollectionByName(collectionName);
        const payload = {
          ids: group.ids,
          documents: group.documents,
          metadatas: group.metadatas,
        };

        if (group.hasAnyEmbeddings && !group.hasMissingEmbeddings) {
          payload.embeddings = group.embeddings;
        }

        await targetCollection.upsert(payload);
      }

      migrated += group.ids.length;
      migratedByCollection[collectionName] =
        (migratedByCollection[collectionName] || 0) + group.ids.length;
    }

    processed += ids.length;
    offset += ids.length;
  }

  return {
    sourceCollection: LEGACY_COLLECTION_NAME,
    dryRun,
    processed,
    migrated,
    skipped,
    migratedByCollection,
    defaultBoardId: resolvedDefaultBoardId,
  };
};

export const upsertBusinessDocument = async (id, content, filename, options = {}) => {
  const boardId = normalizeBoardId(options.boardId);
  const collectionName = resolveCollectionNameForBoard(boardId);
  const col = await getCollectionByName(collectionName);
  
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  
  const docs = await splitter.createDocuments([content]);
  const ids = docs.map((_, i) => `bizdoc-${id}-chunk-${i}`);
  const texts = docs.map((d) => d.pageContent);

  const embeddingsBatch = await Promise.all(
    texts.map((t) => embeddings.embedQuery(t))
  );

  const metadatas = docs.map((_, i) => ({
    type: "business_doc",
    docId: id,
    filename,
    chunkIndex: i,
    ...(boardId ? { boardId } : {}),
  }));

  await col.upsert({
    ids,
    embeddings: embeddingsBatch,
    metadatas,
    documents: texts,
  });
  console.log(`Upserted Business Document ${filename} (ID: ${id}) in ${docs.length} chunks to ${collectionName}`);
};

export const deleteBusinessDocument = async (id, options = {}) => {
  const boardId = normalizeBoardId(options.boardId);
  const collectionName = resolveCollectionNameForBoard(boardId);
  const col = await getCollectionByName(collectionName);

  // We have to delete all chunks by docId in metadata. 
  // Chroma node API doesn't support where filter in delete directly, so we query first.
  const results = await col.get({
    where: { docId: id }
  });

  if (results && results.ids && results.ids.length > 0) {
    await col.delete({
      ids: results.ids
    });
    console.log(`Deleted Business Document (ID: ${id}) from ${collectionName}`);
  }
};
