const BLOCKLIST = ["works correctly", "functions as expected", "system should", "user can complete", "should work", "as expected"];
const validationNode = async (state) => {
  const { current_batch, written_stories = [] } = state;
  const validatedBatch = [];
  const nextSendList = [];
  for (const story of current_batch) {
    if (story.validation_status === "failed") {
      validatedBatch.push(story);
      continue;
    }
    const failures = [];
    if (!/As a[n]? .+ I want .+(so that|so I can|so|to) .+/i.test(story.user_story)) {
      failures.push("user_story does not match standard 'As a ... I want ... so that/so I can ...' format");
    }
    if (!story.acceptance_criteria || story.acceptance_criteria.length < 3) {
      failures.push("acceptance_criteria must have at least 3 items");
    } else {
      for (const ac of story.acceptance_criteria) {
        if (BLOCKLIST.some((blocked) => ac.toLowerCase().includes(blocked))) {
          failures.push(`acceptance_criteria contains generic phrase: "${ac}"`);
        }
      }
    }
    if (!story.subtasks || story.subtasks.length < 2) {
      failures.push("subtasks must have at least 2 items");
    } else {
      story.subtasks.forEach((st, idx) => {
        if (!st.description || st.description.length < 15) {
          failures.push(`subtask ${idx + 1} description must be at least 15 chars`);
        }
      });
    }
    if (!story.description || story.description.length < 50) {
      failures.push("description must be at least 50 chars");
    }
    if (failures.length > 0) {
      story.validation_status = "failed";
      story.failure_reasons = failures;
    } else {
      story.validation_status = "passed";
    }
    validatedBatch.push(story);
  }
  const newWrittenStories = [...written_stories];
  for (const story of validatedBatch) {
    if (story.validation_status === "failed" && story.retry_count < 2) {
    } else {
      newWrittenStories.push(story);
    }
  }
  const failingRetryable = validatedBatch.filter((s) => s.validation_status === "failed" && s.retry_count < 2);
  return {
    current_batch: { _replace: true, items: failingRetryable },
    written_stories: newWrittenStories
  };
};
export {
  validationNode
};
