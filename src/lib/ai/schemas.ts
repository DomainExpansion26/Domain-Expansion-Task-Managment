import { z } from "zod";

export const TaskGenerationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  taskType: z.enum(["TASK", "BUG", "STORY", "FEATURE", "IMPROVEMENT", "SUBTASK"]).default("TASK"),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  suggestedAssigneeName: z.string().optional(),
  estimatedHours: z.number().nonnegative().optional().default(0),
  dueDate: z.string().optional(), // ISO date or formatted
  subtasks: z.array(z.string()).optional().default([]),
});

export const RequirementBreakdownSchema = z.object({
  parentTitle: z.string().min(3),
  summary: z.string(),
  architectureNotes: z.string().optional(),
  subtasks: z.array(
    z.object({
      title: z.string().min(3),
      category: z.enum(["Frontend", "Backend", "Database", "Security", "QA", "General"]).default("General"),
      estimatedHours: z.number().default(4),
    })
  ).min(1, "Must contain at least 1 subtask"),
});

export type TaskGenerationOutput = z.infer<typeof TaskGenerationSchema>;
export type RequirementBreakdownOutput = z.infer<typeof RequirementBreakdownSchema>;
