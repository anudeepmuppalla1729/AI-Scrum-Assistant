import "dotenv/config";

const textToADF = (text = "") => ({
  type: "doc",
  version: 1,
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text }],
    },
  ],
});

const withPriority = (fields, priorityName) => {
  if (!priorityName) return fields;
  return {
    ...fields,
    priority: { name: priorityName },
  };
};

const withStoryPoints = (fields, storyPoints) => {
  const customFieldId = process.env.JIRA_STORY_POINTS_FIELD;
  if (!customFieldId || storyPoints === undefined || storyPoints === null) {
    return fields;
  }
  return {
    ...fields,
    [customFieldId]: storyPoints,
  };
};


export const toEpicCreatePayload = ({ projectKey, epic }) => {
  return {
    fields: {
      project: { key: projectKey },
      issuetype: { name: "Epic" },
      summary: epic.title,
      description: epic.description ? textToADF(epic.description) : undefined,
    },
  };
};

export const toStoryCreatePayload = ({ projectKey, story, epicId }) => {
  let fields = {
    project: { key: projectKey },
    issuetype: { name: "Story" },
    parent: { id: epicId },
    summary: story.summary,
    description: story.description ? textToADF(story.description) : undefined,
  };

  fields = withPriority(fields, story.priority);
  fields = withStoryPoints(fields, story.story_points);

  return { fields };
};

export const toSubtaskCreatePayload = ({
  projectKey,
  subtask,
  storyId,
  issueTypeId,
}) => {
  let fields = {
    project: { key: projectKey },
    issuetype: issueTypeId ? { id: issueTypeId } : { name: "Subtask" },
    parent: { id: storyId },
    summary: subtask.summary,
    description: subtask.description
      ? textToADF(subtask.description)
      : undefined,
  };

  fields = withPriority(fields, subtask.priority);

  return { fields };
};