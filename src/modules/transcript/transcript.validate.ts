import type { DirectoryEntry } from "@/modules/users/user.service";
import type { AIDraft, ValidProject } from "./transcript.schema";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(s: string | null | undefined): s is string {
  if (!s || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export type ValidationResult = { ok: true; projects: ValidProject[] } | { ok: false; issues: string[] };

/** Business validation of the AI draft. Nothing is saved unless this returns ok. */
export function validateDraft(draft: AIDraft, directory: DirectoryEntry[]): ValidationResult {
  const issues: string[] = [];
  const byId = new Map(directory.map((u) => [u.id, u]));
  const projects: ValidProject[] = [];

  if (draft.projects.length === 0) {
    return { ok: false, issues: ["No projects could be identified in the transcript."] };
  }

  draft.projects.forEach((p, pi) => {
    const label = p.name || `Project #${pi + 1}`;

    if (!p.name) issues.push(`${label}: project name is missing.`);
    if (!p.clientName) issues.push(`${label}: client name is missing.`);

    const manager = p.managerId ? byId.get(p.managerId) : undefined;
    if (!p.managerId) issues.push(`${label}: project manager could not be identified.`);
    else if (!manager) issues.push(`${label}: manager "${p.managerId}" is not in the team directory.`);
    else if (manager.role !== "MANAGER") issues.push(`${label}: ${manager.name} is not a manager.`);

    const projectDateOk = isValidDate(p.deadline);
    if (!projectDateOk) issues.push(`${label}: project deadline is missing or invalid (${p.deadline ?? "none"}).`);

    if (p.tasks.length === 0) issues.push(`${label}: no tasks were identified.`);

    p.tasks.forEach((t, ti) => {
      const tLabel = `${label} / ${t.title || `Task #${ti + 1}`}`;

      if (!t.title) issues.push(`${tLabel}: task title is missing.`);

      const agent = t.assigneeId ? byId.get(t.assigneeId) : undefined;
      if (!t.assigneeId) issues.push(`${tLabel}: task owner could not be identified.`);
      else if (!agent) issues.push(`${tLabel}: assignee "${t.assigneeId}" is not in the team directory.`);
      else if (agent.role !== "AGENT") issues.push(`${tLabel}: ${agent.name} is not a developer agent.`);

      if (t.estimatedHours == null || !Number.isFinite(t.estimatedHours) || t.estimatedHours <= 0) {
        issues.push(`${tLabel}: estimated hours must be a positive number (got ${t.estimatedHours ?? "none"}).`);
      }

      if (!isValidDate(t.deadline)) {
        issues.push(`${tLabel}: task deadline is missing or invalid (${t.deadline ?? "none"}).`);
      } else if (projectDateOk && t.deadline > p.deadline!) {
        issues.push(`${tLabel}: task deadline ${t.deadline} is after the project deadline ${p.deadline}.`);
      }
    });

    projects.push({
      name: p.name ?? "",
      clientName: p.clientName ?? "",
      description: p.description ?? "",
      managerId: p.managerId ?? "",
      deadline: p.deadline ?? "",
      tasks: p.tasks.map((t) => ({
        title: t.title ?? "",
        description: t.description ?? "",
        assigneeId: t.assigneeId ?? "",
        deadline: t.deadline ?? "",
        estimatedHours: t.estimatedHours ?? 0,
      })),
    });
  });

  return issues.length ? { ok: false, issues } : { ok: true, projects };
}
