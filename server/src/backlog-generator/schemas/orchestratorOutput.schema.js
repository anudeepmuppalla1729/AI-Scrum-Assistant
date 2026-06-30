import { z } from "zod";
const StoryStubSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(7)),
  title: z.string().default("Untitled Story"),
  points_hint: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(5),
    z.literal(8),
    z.literal("needs_splitting")
  ]).default("needs_splitting"),
  sprint: z.number().default(1),
  prd_tags: z.array(z.string()).default([]),
  jira_tags: z.array(z.string()).default([])
});
const EpicSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(7)),
  title: z.string().default("Untitled Epic"),
  description: z.string().default(""),
  business_goal: z.string().default(""),
  priority: z.enum(["Highest", "High", "Medium", "Low", "Lowest"]).default("Medium"),
  stories: z.array(StoryStubSchema).default([])
});
const OrchestratorOutputSchema = z.object({
  epics: z.array(EpicSchema).default([]),
  capacity_per_sprint: z.number().default(20),
  total_sprints: z.number().default(1)
});
export {
  EpicSchema,
  OrchestratorOutputSchema,
  StoryStubSchema
};
