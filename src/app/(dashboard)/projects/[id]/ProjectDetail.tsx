"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, CalendarIcon, CheckCircleIcon, CheckListIcon, ClockIcon, PencilIcon, PlusIcon } from "@/components/icons";
import { ProjectEditForm, TaskEditorDialog } from "@/components/ProjectEditors";
import { TaskTable } from "@/components/TaskTable";
import { AccessDenied, Avatar, Card, EmptyState, ErrorBanner, LoadingBlock, RoleBadge, buttonClass } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api-client";
import { formatDate } from "@/lib/dates";
import type { ProjectDetailDTO, ProjectUpdateInput, Role, TaskDTO, TaskInput, UserDTO } from "@/types";

type State =
  | { status: "loading" }
  | { status: "ready"; project: ProjectDetailDTO }
  | { status: "forbidden" }
  | { status: "notFound" }
  | { status: "error"; message: string };

export function ProjectDetail({ id, role }: { id: string; role: Role }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [specializations, setSpecializations] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [editingProject, setEditingProject] = useState(false);
  // undefined = dialog closed, null = adding a new task, TaskDTO = editing that task
  const [editingTask, setEditingTask] = useState<TaskDTO | null | undefined>(undefined);
  const [notice, setNotice] = useState("");
  const backHref = role === "AGENT" ? "/my-tasks" : "/";
  const backLabel = role === "AGENT" ? "Back to My Tasks" : role === "ADMIN" ? "Back to Dashboard" : "Back to My Projects";

  useEffect(() => {
    api<ProjectDetailDTO>(`/api/projects/${encodeURIComponent(id)}`)
      .then((project) => setState({ status: "ready", project }))
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 403) setState({ status: "forbidden" });
        else if (err instanceof ApiRequestError && err.status === 404) setState({ status: "notFound" });
        else setState({ status: "error", message: err instanceof Error ? err.message : "Could not load project." });
      });
    // Specializations are a nice-to-have under each assignee's name.
    api<UserDTO[]>("/api/users")
      .then((users) => {
        setUsers(users);
        setSpecializations(Object.fromEntries(users.map((u) => [u.id, u.specialization])));
      })
      .catch(() => {});
  }, [id]);

  if (state.status === "loading") return <LoadingBlock label="Loading project..." />;
  if (state.status === "forbidden") return <AccessDenied backHref={backHref} backLabel={backLabel} />;
  if (state.status === "notFound")
    return (
      <EmptyState
        icon={<CheckListIcon className="h-6 w-6" />}
        title="Project not found"
        text="This project doesn't exist or has been removed."
        action={
          <Link href={backHref} className="text-sm font-medium text-brand-600 hover:underline">
            {backLabel}
          </Link>
        }
      />
    );
  if (state.status === "error") return <ErrorBanner message={state.message} />;

  const { project } = state;
  const agents = users.filter((u) => u.role === "AGENT");
  const managers = users.filter((u) => u.role === "MANAGER");

  // Every edit endpoint returns the updated project, so the page simply swaps it in.
  function applyUpdate(updated: ProjectDetailDTO, message: string) {
    setState({ status: "ready", project: updated });
    setNotice(message);
  }
  async function saveProject(input: ProjectUpdateInput) {
    const updated = await api<ProjectDetailDTO>(`/api/projects/${project.id}`, { method: "PATCH", body: input });
    setEditingProject(false);
    applyUpdate(updated, "Project updated.");
  }
  async function saveTask(input: TaskInput) {
    const updated = editingTask
      ? await api<ProjectDetailDTO>(`/api/tasks/${editingTask.id}`, { method: "PATCH", body: input })
      : await api<ProjectDetailDTO>(`/api/projects/${project.id}/tasks`, { method: "POST", body: input });
    applyUpdate(updated, editingTask ? "Task updated." : "Task added.");
    setEditingTask(undefined);
  }
  async function deleteTask() {
    if (!editingTask) return;
    const updated = await api<ProjectDetailDTO>(`/api/tasks/${editingTask.id}`, { method: "DELETE" });
    applyUpdate(updated, "Task deleted.");
    setEditingTask(undefined);
  }

  return (
    <>
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href={backHref} className="flex items-center gap-1 hover:text-brand-600">
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          {role === "AGENT" ? "My Tasks" : role === "ADMIN" ? "Dashboard" : "My Projects"}
        </Link>
        <span>/</span>
        <span className="truncate text-slate-700">{project.name}</span>
      </nav>

      {notice && (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          <CheckCircleIcon className="h-4 w-4 text-green-600" /> {notice}
        </p>
      )}

      {editingProject ? (
        <ProjectEditForm
          project={project}
          managers={managers}
          canChangeManager={role === "ADMIN"}
          onSave={saveProject}
          onCancel={() => setEditingProject(false)}
        />
      ) : (
      <Card className="mb-8 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{project.name}</h1>
          {project.canEdit && (
            <button type="button" onClick={() => { setNotice(""); setEditingProject(true); }} className={buttonClass("secondary", "shrink-0")}>
              <PencilIcon /> Edit project
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Client:{" "}
          {project.clientId ? (
            <Link href={`/clients/${project.clientId}`} className="font-medium text-brand-600 hover:underline">
              {project.clientName}
            </Link>
          ) : (
            <span className="font-medium text-slate-700">{project.clientName}</span>
          )}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Avatar name={project.manager.name} role="MANAGER" size="sm" />
            <span className="text-slate-700">{project.manager.name}</span>
            <RoleBadge role="MANAGER" />
          </span>
          <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700">
            <CalendarIcon className="text-slate-400" /> Deadline: <strong className="font-medium">{formatDate(project.deadline)}</strong>
          </span>
          <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700">
            <CheckListIcon className="text-slate-400" /> {role === "AGENT" ? "Your tasks" : "Tasks"}: <strong className="font-medium">{project.taskCount}</strong>
          </span>
          <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700">
            <ClockIcon className="text-slate-400" /> {role === "AGENT" ? "Your estimate" : "Total estimate"}: <strong className="font-medium">{project.totalHours} hrs</strong>
          </span>
        </div>

        {project.description && <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-600">{project.description}</p>}
      </Card>
      )}

      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{role === "AGENT" ? "Your tasks in this project" : "Tasks"}</h2>
        {role === "AGENT" && (
          <p className="text-sm text-slate-500">
            Only your own tasks are shown
          </p>
        )}
        {project.canEdit && (
          <button type="button" onClick={() => { setNotice(""); setEditingTask(null); }} className={buttonClass("primary")}>
            <PlusIcon /> Add task
          </button>
        )}
      </div>

      {project.tasks.length > 0 ? (
        <TaskTable
          tasks={project.tasks}
          specializations={specializations}
          onEdit={project.canEdit ? (t) => { setNotice(""); setEditingTask(t); } : undefined}
        />
      ) : (
        <EmptyState icon={<CheckListIcon className="h-6 w-6" />} title="No tasks" text="This project has no tasks yet." />
      )}

      {project.canEdit && editingTask !== undefined && (
        <TaskEditorDialog
          key={editingTask?.id ?? "new"}
          task={editingTask}
          agents={agents}
          projectDeadline={project.deadline}
          onSave={saveTask}
          onDelete={editingTask ? deleteTask : undefined}
          onClose={() => setEditingTask(undefined)}
        />
      )}
    </>
  );
}
