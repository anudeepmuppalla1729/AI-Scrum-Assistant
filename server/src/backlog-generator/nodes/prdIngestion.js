import { estimateTokenCount, getComplexityTier } from "../utils/tokenizer.js";
import { createMemoryStore } from "../utils/vectorStore.js";
const vectorStoreCache = /* @__PURE__ */ new Map();
const prdIngestionNode = async (state) => {
  const { raw_prd, business_docs, jira_context, userId } = state;
  const combinedText = raw_prd + "\n" + (business_docs ? business_docs.join("\n") : "");
  const prd_token_count = estimateTokenCount(combinedText);
  const complexity_tier = getComplexityTier(prd_token_count);
  const jiraContextStr = JSON.stringify(jira_context, null, 2);
  const store = await createMemoryStore(raw_prd, business_docs, jiraContextStr);
  vectorStoreCache.set(userId, store);
  return {
    prd_token_count,
    complexity_tier,
    business_docs_count: business_docs ? business_docs.length : 0
  };
};
export {
  prdIngestionNode,
  vectorStoreCache
};
