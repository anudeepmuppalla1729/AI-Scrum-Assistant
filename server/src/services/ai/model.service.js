import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config();

const MIMO_BASE_URL = process.env.MIMO_API_BASE || "https://api.xiaomimimo.com/v1";
const MIMO_API_KEY = process.env.MIMO_API_KEY;

if (!MIMO_API_KEY) {
  throw new Error("Missing MIMO_API_KEY in environment variables.");
}

export const model = new ChatOpenAI({
  apiKey: MIMO_API_KEY,
  modelName: "mimo-v2.5",
  configuration: {
    baseURL: MIMO_BASE_URL,
  },
  temperature: 0.4,
  maxTokens: 8192,
  modelKwargs: {
    extra_body: {
      enable_thinking: false // Bypass reasoning token mismatch for multi-turn tool loops
    }
  }
});
