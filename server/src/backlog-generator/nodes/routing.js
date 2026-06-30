import { vectorStoreCache } from "./prdIngestion.js";
import { buildVelocityRef } from "../utils/velocityRef.js";
import { Send } from "@langchain/langgraph";
const routingNode = async (state) => {
  const { orchestrator_contract, business_docs, jira_context, userId } = state;
  const store = vectorStoreCache.get(userId);
  const send_list = [];
  const business_summary = business_docs.join("\n\n").substring(0, 2e3);
  const velocity_reference = buildVelocityRef(jira_context);
  for (const epic of orchestrator_contract.epics) {
    for (const story of epic.stories) {
      let prd_chunks = [];
      let jira_chunks = [];
      let biz_chunks = [];
      if (store) {
        const pChunks = await store.similaritySearch(story.prd_tags.join(" "), 6, (doc) => doc.metadata.source === "prd");
        prd_chunks = pChunks.map((c) => c.pageContent);
        const jChunks = await store.similaritySearch(story.jira_tags.join(" "), 3, (doc) => doc.metadata.source === "jira");
        jira_chunks = jChunks.map((c) => c.pageContent);
        const bChunks = await store.similaritySearch(story.prd_tags.join(" ") + " " + story.title, 4, (doc) => doc.metadata.source === "business");
        biz_chunks = bChunks.map((c) => c.pageContent);
      }
      const payload = {
        epic_context: {
          id: epic.id,
          title: epic.title,
          description: epic.description,
          business_goal: epic.business_goal,
          priority: epic.priority
        },
        story_stub: story,
        prd_chunks,
        jira_chunks,
        biz_chunks,
        business_summary,
        velocity_reference,
        retry_count: 0,
        story_id: story.id
      };
      send_list.push(new Send("story_writer", payload));
    }
  }
  return { send_list, current_batch: [] };
};
export {
  routingNode
};
