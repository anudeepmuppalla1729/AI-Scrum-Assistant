import customEmbeddings from "../../utils/customEmbeddings.cjs";
const HuggingFaceTransformersEmbeddings = customEmbeddings.CustomHuggingFaceEmbeddings;
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from "dotenv";
dotenv.config();
import { modelProgressCallback } from "../../utils/modelProgress.js";

const getEmbeddings = () => {
  return new HuggingFaceTransformersEmbeddings({
    model: "nomic-ai/nomic-embed-text-v1.5",
    pretrainedOptions: {
      dtype: "q8",
      progress_callback: modelProgressCallback,
    }
  });
};

class MemoryVectorStore {
  constructor(embeddings) {
    this.embeddings = embeddings;
    this.memoryVectors = [];
  }

  async addDocuments(documents) {
    const texts = documents.map(d => d.pageContent);
    if (texts.length === 0) return;
    const embeddings = await this.embeddings.embedDocuments(texts);
    for (let i = 0; i < documents.length; i++) {
      this.memoryVectors.push({
        content: documents[i].pageContent,
        metadata: documents[i].metadata,
        embedding: embeddings[i],
        id: documents[i].id
      });
    }
  }

  async similaritySearch(query, k = 4, filter = undefined) {
    const queryEmbedding = await this.embeddings.embedQuery(query);
    const dotProduct = (a, b) => a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitude = (a) => Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    
    // cosine similarity
    let scored = this.memoryVectors.map(v => {
      const dp = dotProduct(queryEmbedding, v.embedding);
      const magQ = magnitude(queryEmbedding);
      const magV = magnitude(v.embedding);
      return {
        ...v,
        score: dp / (magQ * magV)
      };
    });

    if (filter) {
      if (typeof filter === "function") {
        scored = scored.filter(filter);
      } else {
        scored = scored.filter(v => {
          for (const [key, val] of Object.entries(filter)) {
            if (v.metadata[key] !== val) return false;
          }
          return true;
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map(v => ({
      pageContent: v.content,
      metadata: v.metadata
    }));
  }

  asRetriever(k = 4) {
    return {
      getRelevantDocuments: async (query) => {
        return this.similaritySearch(query, k);
      }
    };
  }
}

const createMemoryStore = async (prdText, businessDocs, jiraContextStr) => {
  const store = new MemoryVectorStore(getEmbeddings());
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 50
  });
  const prdChunks = await splitter.createDocuments([prdText || ""]);
  const bizChunks = await splitter.createDocuments(businessDocs || []);
  const jiraChunks = await splitter.createDocuments([jiraContextStr || ""]);
  const addDocs = async (chunks, source) => {
    if (chunks.length === 0) return;
    const docs = chunks.map((c) => ({
      pageContent: c.pageContent,
      metadata: { source }
    }));
    await store.addDocuments(docs);
  };
  await addDocs(prdChunks, "prd");
  await addDocs(bizChunks, "business");
  await addDocs(jiraChunks, "jira");
  return store;
};
export {
  createMemoryStore,
  getEmbeddings
};
