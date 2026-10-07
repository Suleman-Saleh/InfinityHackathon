import { z } from "zod";

// Fields are nullable on purpose: the AI returns null for missing values,
// and validateDraft() turns those into readable issues for the admin.
const nullableString = z.string().trim().nullish();

export const aiTaskSchema = z.object({
  title: nullableString,
  description: nullableString,
  assigneeId: nullableString,
  deadline: nullableString,
  estimatedHours: z.coerce.number().nullish(),
});

export const aiProjectSchema = z.object({
  name: nullableString,
  clientName: nullableString,
  description: nullableString,
  managerId: nullableString,
  deadline: nullableString,
  tasks: z.array(aiTaskSchema).default([]),
});

export const aiDraftSchema = z.object({
  projects: z.array(aiProjectSchema),
});

export type AIDraft = z.infer<typeof aiDraftSchema>;

export type ValidTask = {
  title: string;
  description: string;
  assigneeId: string;
  deadline: string;
  estimatedHours: number;
};

export type ValidProject = {
  name: string;
  clientName: string;
  description: string;
  managerId: string;
  deadline: string;
  tasks: ValidTask[];
};
