"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, CalendarIcon, CheckListIcon, ClockIcon } from "@/components/icons";
import { TaskTable } from "@/components/TaskTable";
import { AccessDenied, Avatar, Card, EmptyState, ErrorBanner, LoadingBlock, RoleBadge } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api-client";
import { formatDate } from "@/lib/dates";
import type { ProjectDetailDTO, Role, UserDTO } from "@/types";

type State =
  | { status: "loading" }
  | { status: "ready"; project: ProjectDetailDTO }
  | { status: "forbidden" }
  | { status: "notFound" }
  | { status: "error"; message: string };

export function ProjectDetail({ id, role }: { id: string; role: Role }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [specializations, setSpecializations] = useState<Record<string, string>>({});
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
      .then((users) => setSpecializations(Object.fromEntries(users.map((u) => [u.id, u.specialization]))))
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

      <Card className="mb-8 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{project.name}</h1>
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

      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{role === "AGENT" ? "Your tasks in this project" : "Tasks"}</h2>
        {role === "AGENT" && (
          <p className="text-sm text-slate-500">
            Only your own tasks are shown
          </p>
        )}
      </div>

      {project.tasks.length > 0 ? (
        <TaskTable tasks={project.tasks} specializations={specializations} />
      ) : (
        <EmptyState icon={<CheckListIcon className="h-6 w-6" />} title="No tasks" text="This project has no tasks yet." />
      )}
    </>
  );
}
