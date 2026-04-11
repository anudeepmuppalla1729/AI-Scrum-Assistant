import { z } from "zod";

const JiraIssueTypeEnum = z.enum(["Epic", "Story", "Task", "Subtask", "Bug"]);

const JiraIssueSchema = z.object({
  type: JiraIssueTypeEnum.describe(
    "Type of Jira issue (Epic, Story, Task, etc.)"
  ),

  summary: z
    .string()
    .min(5)
    .describe("Short, descriptive title of the Jira issue."),

  description: z
    .string()
    .min(10)
    .describe(
      "Detailed description, including purpose, details, and acceptance criteria."
    ),

  priority: z
    .enum(["Highest", "High", "Medium", "Low", "Lowest"])
    .optional()
    .default("Medium")
    .describe("Priority level as recognized by Jira."),

  assignee: z.string().optional().describe("User assigned to the issue."),

  labels: z
    .array(z.string())
    .optional()
    .describe("Tags for grouping or filtering issues."),

  parent_ref: z
    .string()
    .optional()
    .describe(
      "The title or summary of the parent issue (Epic → Story → Task)."
    ),

  epic_name: z.string().optional().describe("Used only when creating an Epic."),

  story_points: z
    .number()
    .optional()
    .describe("Story point estimate for Scrum boards."),

  acceptance_criteria: z
    .array(z.string())
    .optional()
    .describe("Conditions for completion."),

  // nested tasks or subtasks allowed for deep hierarchy
  sub_issues: z
    .array(
      z.object({
        type: JiraIssueTypeEnum,
        summary: z.string(),
        description: z.string(),
        priority: z
          .enum(["Highest", "High", "Medium", "Low", "Lowest"])
          .optional()
          .default("Medium"),
        parent_ref: z.string().optional(),
        story_points: z.number().optional(),
        acceptance_criteria: z.array(z.string()).optional(),
      })
    )
    .optional()
    .describe("Tasks or subtasks belonging to this Story."),
});

export const PRDParserSchema = z.object({
  epics: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        issues: z.array(JiraIssueSchema).optional(),
      })
    )
    .optional()
    .describe("Top-level Epics, each containing Stories/Tasks hierarchy."),

  jira_issues: z
    .array(JiraIssueSchema)
    .optional()
    .describe("Flat list for independent issues without Epic hierarchy."),
});

const AISuggestionsSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: PRDParserSchema, // reuse existing epics/jira_issues shape
});

export const PushAISuggestionsBodySchema = z.object({
  projectKey: z.string().min(2, "projectKey is required"),
  suggestions: AISuggestionsSchema,
});