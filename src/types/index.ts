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
  clientId: string | null;
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

export type ClientContact = {
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  notes: string; // always "" for agents
};

export type ClientDTO = ClientContact & {
  id: string;
  name: string;
  // Stats only cover the projects/tasks the current user is allowed to see.
  projectCount: number;
  taskCount: number;
  totalHours: number;
  nextDeadline: string | null; // YYYY-MM-DD, earliest project deadline
  managers: PersonRef[];
  canEdit: boolean;
  updatedAt: string; // ISO timestamp
};

export type ClientDetailDTO = ClientDTO & { projects: ProjectDTO[] };

export type ClientUpdateInput = Partial<ClientContact & { name: string }>;

export type ApiError = { error: string; issues?: string[] };
