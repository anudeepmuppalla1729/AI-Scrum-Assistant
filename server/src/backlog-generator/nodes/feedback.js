import { model } from "../../services/ai/model.service.js";
import { feedbackPrompt } from "../prompts/feedback.prompt.js";
import { StoryOutputSchema } from "../schemas/storyOutput.schema.js";
import { addLLMJob, registerLLMJobHandler } from "../utils/llmQueue.js";

// Register the BullMQ job handler at module level
const structuredChain = model.withStructuredOutput(StoryOutputSchema, {
  method: "jsonMode",
  name: "story_output",
});
const chain = feedbackPrompt.pipe(structuredChain);

registerLLMJobHandler("revise-story", async (data) => {
  return await chain.invoke(data);
});

const feedbackNode = async (state) => {
  const { current_batch, orchestrator_contract } = state;
  console.log(`\n🔄 FEEDBACK NODE: Rewriting ${current_batch.length} failed stories...`);
  const fixedBatch = [];
  for (const failedStory of current_batch) {
    const epic = orchestrator_contract.epics.find((e) => e.id === failedStory.epic_id);
    const storyStub = epic?.stories.find((s) => s.id === failedStory.story_id);
    try {
      const output = await addLLMJob("revise-story", {
        storyStub: JSON.stringify(storyStub, null, 2),
        failedOutput: JSON.stringify(failedStory, null, 2),
        failureReasons: failedStory.failure_reasons?.join(", ") || "Unknown"
      });
      fixedBatch.push({
        ...output,
        validation_status: "passed",
        retry_count: failedStory.retry_count + 1,
        epic_id: failedStory.epic_id
      });
    } catch (e) {
      const errorMessage = e.message || e.toString();
      console.error(`Feedback loop failed for ${failedStory.story_id}:`, errorMessage);
      fixedBatch.push({
        ...failedStory,
        failure_reasons: [...(failedStory.failure_reasons || []), `Feedback loop error: ${errorMessage}`],
        retry_count: failedStory.retry_count + 1
      });
    }
    // Small delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return { 
    current_batch: { _replace: true, items: fixedBatch },
    revision_count: (state.revision_count || 0) + 1
  };
};
export {
  feedbackNode
};
