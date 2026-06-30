import { model } from "../../services/ai/model.service.js";
import { storyWriterPrompt } from "../prompts/storyWriter.prompt.js";
import { StoryOutputSchema } from "../schemas/storyOutput.schema.js";
import { llmQueue } from "../utils/queue.js";
const storyWriterNode = async (input) => {
  const structuredChain = model.withStructuredOutput(StoryOutputSchema, {
    method: "jsonMode",
    name: "story_output",
  });
  const chain = storyWriterPrompt.pipe(structuredChain);
  let output;
  try {
    output = await llmQueue.add(() => chain.invoke({
      businessSummary: input.business_summary,
      epicTitle: input.epic_context.title,
      epicDescription: input.epic_context.description,
      epicGoal: input.epic_context.business_goal,
      epicPriority: input.epic_context.priority,
      prdChunks: input.prd_chunks.join("\n---\n"),
      jiraChunks: input.jira_chunks.join("\n---\n"),
      bizChunks: input.biz_chunks ? input.biz_chunks.join("\n---\n") : "",
      velocityRef: JSON.stringify(input.velocity_reference, null, 2),
      storyStub: JSON.stringify(input.story_stub, null, 2)
    }));
  } catch (error) {
    const errorMessage = error.message || error.toString();
    console.error(`Story writer failed for ${input.story_id}:`, errorMessage);
    const failedStory = {
      story_id: input.story_id,
      user_story: "Failed to generate",
      description: "",
      acceptance_criteria: [],
      priority: "P2",
      story_points: "needs_splitting",
      sprint: input.story_stub.sprint,
      subtasks: [],
      validation_status: "failed",
      retry_count: input.retry_count,
      epic_id: input.epic_context.id,
      failure_reasons: [`LLM generation error: ${errorMessage}`]
    };
    return { current_batch: [failedStory] };
  }
  const writtenStory = {
    ...output,
    validation_status: "passed",
    // optimistic, validation node will check
    retry_count: input.retry_count,
    epic_id: input.epic_context.id
  };
  return { current_batch: [writtenStory] };
};
export {
  storyWriterNode
};
