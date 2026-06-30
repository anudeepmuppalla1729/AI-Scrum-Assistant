import { proModel } from "../../services/ai/model.service.js";
import { orchestratorPrompt } from "../prompts/orchestrator.prompt.js";
import { OrchestratorOutputSchema } from "../schemas/orchestratorOutput.schema.js";
import { vectorStoreCache } from "./prdIngestion.js";
const orchestratorNode = async (state) => {
  const { complexity_tier, raw_prd, business_docs, jira_context, userId } = state;
  let prdContent = raw_prd;
  let bizContent = business_docs.join("\n\n").substring(0, 3e3);
  if (complexity_tier === "large" || complexity_tier === "xlarge") {
    const store = vectorStoreCache.get(userId);
    if (store) {
      const results = await store.similaritySearch("product features epics user stories", 40, (doc) => doc.metadata.source === "prd");
      prdContent = results.map((r) => r.pageContent).join("\n---\n");
      const bizResults = await store.similaritySearch("business rules goals requirements", 20, (doc) => doc.metadata.source === "business");
      if (bizResults.length > 0) {
        bizContent = bizResults.map((r) => r.pageContent).join("\n---\n");
      }
    }
  }
  const businessDocsSummary = bizContent;
  const jiraContextStr = JSON.stringify(jira_context, null, 2);
  const structuredChain = proModel.withStructuredOutput(OrchestratorOutputSchema, {
    method: "jsonMode",
    name: "orchestrator_output",
  });
  const chain = orchestratorPrompt.pipe(structuredChain);
  try {
    const output = await chain.invoke({
      jiraContext: jiraContextStr,
      businessDocs: businessDocsSummary,
      prdContent
    });
    return {
      orchestrator_contract: output
    };
  } catch (error) {
    console.warn("Orchestrator parse failed, returning empty fallback", error);
    throw new Error("Orchestrator failed to produce valid JSON");
  }
};
export {
  orchestratorNode
};
