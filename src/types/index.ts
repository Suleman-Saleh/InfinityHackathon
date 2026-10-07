// Shared API contract between backend and frontend.

export type Role = "ADMIN" | "MANAGER" | "AGENT";

export type CurrentUser = { id: string; name: string; email: string; role: Role };

export type UserDTO = {
  id: string;
  name: string;
  email: string;
  role: Role;
  specialization: string;
  skills: string[];
};

export type PersonRef = { id: string; name: string };

export type ProjectDTO = {
  id: string;
  name: string;
  clientName: string;
  description: string;
  deadline: string; // YYYY-MM-DD
  manager: PersonRef;
  taskCount: number;
  totalHours: number;
};

export type TaskDTO = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  deadline: string; // YYYY-MM-DD
  estimatedHours: number;
  assignee: PersonRef;
};

export type ProjectDetailDTO = ProjectDTO & { tasks: TaskDTO[] };

export type MyTaskDTO = TaskDTO & { project: { id: string; name: string; clientName: string; manager: PersonRef } };

export type TranscriptResultDTO = {
  runId: string;
  model: string;
  projects: ProjectDTO[];
  taskCount: number;
};

export type ApiError = { error: string; issues?: string[] };
