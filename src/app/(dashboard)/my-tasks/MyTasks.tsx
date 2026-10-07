"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon, CalendarIcon, CheckListIcon, ClockIcon } from "@/components/icons";
import { Avatar, Card, EmptyState, ErrorBanner, LoadingBlock, PageHeader } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api-client";
import { formatDate } from "@/lib/dates";
import type { MyTaskDTO } from "@/types";

type Group = { project: MyTaskDTO["project"]; tasks: MyTaskDTO[] };

function groupByProject(tasks: MyTaskDTO[]): Group[] {
  const groups = new Map<string, Group>();
  for (const t of [...tasks].sort((a, b) => a.deadline.localeCompare(b.deadline))) {
    const g = groups.get(t.project.id) ?? { project: t.project, tasks: [] };
    g.tasks.push(t);
    groups.set(t.project.id, g);
  }
  // Projects with the earliest upcoming task first.
  return [...groups.values()];
}

export function MyTasks() {
  const [tasks, setTasks] = useState<MyTaskDTO[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<MyTaskDTO[]>("/api/tasks/mine")
      .then(setTasks)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Could not load your tasks."));
  }, []);

  const totalHours = tasks?.reduce((sum, t) => sum + t.estimatedHours, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="My Tasks"
        subtitle={
          tasks && tasks.length > 0
            ? `${tasks.length} task${tasks.length === 1 ? "" : "s"} assigned to you · ${totalHours} estimated hours`
            : "Tasks assigned to you"
        }
      />

      {error && <ErrorBanner message={error} />}
      {!tasks && !error && <LoadingBlock label="Loading your tasks..." />}

      {tasks && tasks.length === 0 && (
        <EmptyState
          icon={<CheckListIcon className="h-6 w-6" />}
          title="No tasks assigned yet"
          text="When the administrator creates projects from a meeting, the tasks assigned to you will appear here."
        />
      )}

      <div className="space-y-8">
        {tasks &&
          groupByProject(tasks).map(({ project, tasks: projectTasks }) => (
            <section key={project.id}>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{project.name}</h2>
                  <p className="flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
                    <span>{project.clientName}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <Avatar name={project.manager.name} role="MANAGER" size="sm" /> Manager: {project.manager.name}
                    </span>
                  </p>
                </div>
                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Open project <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>

              <ul className="space-y-3">
                {projectTasks.map((t) => (
                  <li key={t.id}>
                    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{t.title}</p>
                        {t.description && <p className="mt-0.5 text-sm text-slate-500">{t.description}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-sm">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <CalendarIcon className="text-slate-400" /> Due {formatDate(t.deadline)}
                        </span>
                        <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
                          <ClockIcon className="h-3.5 w-3.5" /> {t.estimatedHours} hrs
                        </span>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>
    </>
  );
}
