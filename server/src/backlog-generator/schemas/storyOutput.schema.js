import { z } from "zod";
const SubtaskSchema = z.object({
  title: z.string().default("Subtask Title"),
  description: z.string(),
  acceptance_criteria: z.array(z.string()),
  priority: z.enum(["Highest", "High", "Medium", "Low", "Lowest"]).default("Medium").catch("Medium"),
  story_points: z.union([z.literal(0.5), z.literal(1), z.literal(2), z.literal(3)]).default(1).catch(1)
});
const StoryOutputSchema = z.object({
  story_id: z.string().default("story_x"),
  user_story: z.string().default("User Story"),
  description: z.string(),
  acceptance_criteria: z.array(z.string()),
  priority: z.enum(["Highest", "High", "Medium", "Low", "Lowest"]).default("Medium").catch("Medium"),
  story_points: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(5),
    z.literal(8),
    z.literal("needs_splitting")
  ]).default(3).catch(3),
  sprint: z.number().default(1).catch(1),
  subtasks: z.array(SubtaskSchema).default([])
});
export {
  StoryOutputSchema,
  SubtaskSchema
};
