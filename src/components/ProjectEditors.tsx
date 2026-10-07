"use client";

import { useEffect, useRef, useState } from "react";
import { ApiRequestError } from "@/lib/api-client";
import type { ProjectDetailDTO, ProjectUpdateInput, TaskDTO, TaskInput, UserDTO } from "@/types";
import { TrashIcon, XIcon } from "./icons";
import { Card, ErrorBanner, Spinner, buttonClass } from "./ui";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

type SaveError = { message: string; issues: string[] };
const toSaveError = (err: unknown): SaveError =>
  err instanceof ApiRequestError ? { message: err.message, issues: err.issues } : { message: "Could not save. Please try again.", issues: [] };

/** Add or correct a task. Delete is offered for existing tasks, with an in-dialog confirmation step. */
export function TaskEditorDialog({
  task,
  agents,
  projectDeadline,
  onSave,
  onDelete,
  onClose,
}: {
  task: TaskDTO | null; // null = new task
  agents: UserDTO[];
  projectDeadline: string;
  onSave: (input: TaskInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    assigneeId: task?.assignee.id ?? "",
    deadline: task?.deadline ?? projectDeadline,
    estimatedHours: task ? String(task.estimatedHours) : "",
  });
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<SaveError | null>(null);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy("save");
    setError(null);
    try {
      await onSave({ ...form, estimatedHours: Number(form.estimatedHours) });
    } catch (err) {
      setError(toSaveError(err));
      setBusy(null);
    }
  }

  async function remove() {
    if (!onDelete || busy) return;
    setBusy("delete");
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      setError(toSaveError(err));
      setBusy(null);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="task-editor-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <form onSubmit={save} className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="task-editor-title" className="text-lg font-semibold text-slate-900">
                {task ? "Edit task" : "Add task"}
              </h2>
              <p className="text-sm text-slate-500">
                {task ? "Correct anything the AI extracted wrongly." : "Add a task the AI missed."}
              </p>
            </div>
            <button type="button" onClick={onClose} disabled={!!busy} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          <div>
            <label htmlFor="task-title" className={labelClass}>Title</label>
            <input id="task-title" ref={firstField} required value={form.title} onChange={set("title")} className={inputClass} />
          </div>
          <div>
            <label htmlFor="task-description" className={labelClass}>Description</label>
            <textarea id="task-description" rows={3} value={form.description} onChange={set("description")} className={`${inputClass} resize-y`} />
          </div>
          <div>
            <label htmlFor="task-assignee" className={labelClass}>Owner</label>
            <select id="task-assignee" required value={form.assigneeId} onChange={set("assigneeId")} className={inputClass}>
              <option value="" disabled>Choose a developer…</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.specialization}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="task-deadline" className={labelClass}>Deadline</label>
              <input id="task-deadline" type="date" required max={projectDeadline} value={form.deadline} onChange={set("deadline")} className={inputClass} />
            </div>
            <div>
              <label htmlFor="task-hours" className={labelClass}>Estimated hours</label>
              <input id="task-hours" type="number" required min="0.5" step="0.5" value={form.estimatedHours} onChange={set("estimatedHours")} className={inputClass} />
            </div>
          </div>
          <p className="text-xs text-slate-500">The task deadline must be on or before the project deadline.</p>

          {error && <ErrorBanner message={error.message} issues={error.issues} />}

          {confirmDelete ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-800">Delete this task permanently?</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)} disabled={!!busy} className={buttonClass("secondary")}>
                  Keep it
                </button>
                <button type="button" onClick={remove} disabled={!!busy} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                  {busy === "delete" && <Spinner />} Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {task && onDelete ? (
                <button type="button" onClick={() => setConfirmDelete(true)} disabled={!!busy} className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700">
                  <TrashIcon /> Delete task
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-3">
                <button type="button" onClick={onClose} disabled={!!busy} className={buttonClass("secondary")}>
                  Cancel
                </button>
                <button type="submit" disabled={!!busy} className={buttonClass("primary")}>
                  {busy === "save" && <Spinner />}
                  {busy === "save" ? "Saving..." : task ? "Save changes" : "Add task"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

/** Inline form to correct project details. Only the admin can change the manager. */
export function ProjectEditForm({
  project,
  managers,
  canChangeManager,
  onSave,
  onCancel,
}: {
  project: ProjectDetailDTO;
  managers: UserDTO[];
  canChangeManager: boolean;
  onSave: (input: ProjectUpdateInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    deadline: project.deadline,
    managerId: project.manager.id,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<SaveError | null>(null);
  const latestTask = project.tasks.reduce((max, t) => (t.deadline > max ? t.deadline : max), "");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    const body: ProjectUpdateInput = { name: form.name, description: form.description, deadline: form.deadline };
    if (canChangeManager) body.managerId = form.managerId;
    try {
      await onSave(body);
    } catch (err) {
      setError(toSaveError(err));
      setSaving(false);
    }
  }

  return (
    <Card className="mb-8 p-6">
      <form onSubmit={save} className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Edit project</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="project-name" className={labelClass}>Project name</label>
            <input id="project-name" required value={form.name} onChange={set("name")} className={inputClass} />
          </div>
          <div>
            <label htmlFor="project-deadline" className={labelClass}>Deadline</label>
            <input id="project-deadline" type="date" required min={latestTask || undefined} value={form.deadline} onChange={set("deadline")} className={inputClass} />
          </div>
          {canChangeManager && (
            <div>
              <label htmlFor="project-manager" className={labelClass}>Manager</label>
              <select id="project-manager" value={form.managerId} onChange={set("managerId")} className={inputClass}>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.specialization}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div>
          <label htmlFor="project-description" className={labelClass}>Description</label>
          <textarea id="project-description" rows={3} value={form.description} onChange={set("description")} className={`${inputClass} resize-y`} />
        </div>
        {latestTask && <p className="text-xs text-slate-500">The deadline can&apos;t be earlier than the latest task ({latestTask}).</p>}
        {error && <ErrorBanner message={error.message} issues={error.issues} />}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={saving} className={buttonClass("secondary")}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={buttonClass("primary")}>
            {saving && <Spinner />}
            {saving ? "Saving..." : "Save project"}
          </button>
        </div>
      </form>
    </Card>
  );
}
