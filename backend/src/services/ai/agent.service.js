import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";

import { model } from "./model.service.js";

const checkPointer = new MemorySaver();

const agent = createAgent({
  model,
  tools: [],
  checkPointer
});

export default agent;
