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

/**
 * Build a rich ADF description that includes the description text
 * plus acceptance criteria as a bullet list.
 */
const descriptionWithAC = (description = "", acceptanceCriteria = []) => {
  const content = [];

  // Main description paragraph
  if (description) {
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: description }],
    });
  }

  // Acceptance criteria section
  if (Array.isArray(acceptanceCriteria) && acceptanceCriteria.length > 0) {
    content.push({
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Acceptance Criteria" }],
    });
    content.push({
      type: "bulletList",
      content: acceptanceCriteria.map((ac) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: String(ac) }],
          },
        ],
      })),
    });
  }

  if (content.length === 0) return undefined;

  return {
    type: "doc",
    version: 1,
    content,
  };
};

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

const withAcceptanceCriteria = (fields, acceptanceCriteria = []) => {
  const customFieldId = process.env.JIRA_AC_FIELD;
  if (!customFieldId || !Array.isArray(acceptanceCriteria) || acceptanceCriteria.length === 0) {
    return fields;
  }
  return {
    ...fields,
    [customFieldId]: acceptanceCriteria.join("\n"),
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
    description: descriptionWithAC(
      story.description,
      story.acceptance_criteria || story.acceptanceCriteria
    ),
  };

  fields = withPriority(fields, story.priority);
  fields = withStoryPoints(fields, story.story_points);
  fields = withAcceptanceCriteria(fields, story.acceptance_criteria || story.acceptanceCriteria);

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
    description: descriptionWithAC(
      subtask.description,
      subtask.acceptance_criteria || subtask.acceptanceCriteria
    ),
  };

  fields = withPriority(fields, subtask.priority);
  fields = withAcceptanceCriteria(fields, subtask.acceptance_criteria || subtask.acceptanceCriteria);

  return { fields };
};