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

export type ProjectDetailDTO = ProjectDTO & {
  tasks: TaskDTO[];
  canEdit: boolean; // admin, or the manager of this project: may fix what the AI extracted
};

/** Body for creating a task (all fields) or updating one (any subset). */
export type TaskInput = { title: string; description: string; assigneeId: string; deadline: string; estimatedHours: number };

/** Body for correcting a project. `managerId` may only be changed by the admin. */
export type ProjectUpdateInput = Partial<{ name: string; description: string; deadline: string; managerId: string }>;

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

/** A team member's profile and work. Only includes what the viewer is allowed to see. */
export type TeamMemberDTO = {
  user: UserDTO;
  projects: ProjectDTO[]; // projects this person manages
  tasks: MyTaskDTO[]; // tasks assigned to this person
  limited: boolean; // true when the viewer can only see part of this person's work
};

export type ApiError = { error: string; issues?: string[] };
