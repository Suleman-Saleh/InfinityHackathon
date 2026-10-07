"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, BriefcaseIcon, CalendarIcon, CheckListIcon, ClockIcon, LockIcon, UsersIcon } from "@/components/icons";
import { ProjectCard } from "@/components/ProjectCard";
import { Avatar, Card, EmptyState, ErrorBanner, LoadingBlock, RoleBadge, StatCard } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api-client";
import { formatDate } from "@/lib/dates";
import type { MyTaskDTO, TeamMemberDTO } from "@/types";

type State =
  | { status: "loading" }
  | { status: "ready"; member: TeamMemberDTO }
  | { status: "notFound" }
  | { status: "error"; message: string };

const earliest = (dates: string[]) => (dates.length ? [...dates].sort()[0] : null);

export function MemberDetail({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    api<TeamMemberDTO>(`/api/users/${encodeURIComponent(id)}`)
      .then((member) => setState({ status: "ready", member }))
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 404) setState({ status: "notFound" });
        else setState({ status: "error", message: err instanceof Error ? err.message : "Could not load team member." });
      });
  }, [id]);

  if (state.status === "loading") return <LoadingBlock label="Loading team member..." />;
  if (state.status === "notFound")
    return (
      <EmptyState
        icon={<UsersIcon className="h-6 w-6" />}
        title="Team member not found"
        text="This person isn't in the NovaWorks team directory."
        action={
          <Link href="/team" className="text-sm font-medium text-brand-600 hover:underline">
            Back to Team Directory
          </Link>
        }
      />
    );
  if (state.status === "error") return <ErrorBanner message={state.message} />;

  const { user, projects, tasks, limited } = state.member;

  return (
    <>
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/team" className="flex items-center gap-1 hover:text-brand-600">
          <ArrowLeftIcon className="h-3.5 w-3.5" /> Team Directory
        </Link>
        <span>/</span>
        <span className="truncate text-slate-700">{user.name}</span>
      </nav>

      <Card className="mb-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar name={user.name} role={user.role} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{user.name}</h1>
              <RoleBadge role={user.role} />
            </div>
            <p className="mt-0.5 text-sm text-slate-600">{user.specialization}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
            {user.skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {user.skills.map((s) => (
                  <span key={s} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {limited && (
        <p className="mb-6 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          You only see the part of {user.name.split(" ")[0]}&apos;s work that you have access to.
        </p>
      )}

      {user.role === "MANAGER" && <ManagerWork name={user.name} projects={projects} limited={limited} />}
      {user.role === "AGENT" && <AgentWork name={user.name} tasks={tasks} limited={limited} />}
      {user.role === "ADMIN" && (
        <EmptyState
          icon={<UsersIcon className="h-6 w-6" />}
          title="Administrator account"
          text="The administrator creates projects from meeting transcripts and is not assigned project work."
        />
      )}
    </>
  );
}

function ManagerWork({ name, projects, limited }: { name: string; projects: TeamMemberDTO["projects"]; limited: boolean }) {
  const taskCount = projects.reduce((n, p) => n + p.taskCount, 0);
  const hours = projects.reduce((n, p) => n + p.totalHours, 0);
  const next = earliest(projects.map((p) => p.deadline));

  if (projects.length === 0)
    return (
      <EmptyState
        icon={<BriefcaseIcon className="h-6 w-6" />}
        title={limited ? "No projects you can see" : "No projects yet"}
        text={
          limited
            ? `${name} doesn't manage any of the projects you have access to.`
            : `${name} isn't managing any projects yet. Projects appear here once they are created from a meeting transcript.`
        }
      />
    );

  return (
    <>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projects managed" value={projects.length} icon={<BriefcaseIcon className="h-5 w-5" />} />
        <StatCard label="Tasks" value={taskCount} icon={<CheckListIcon className="h-5 w-5" />} />
        <StatCard label="Total estimate" value={`${hours} hrs`} icon={<ClockIcon className="h-5 w-5" />} />
        <StatCard label="Next deadline" value={next ? formatDate(next) : "-"} icon={<CalendarIcon className="h-5 w-5" />} />
      </div>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Projects {name.split(" ")[0]} manages</h2>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </>
  );
}

function AgentWork({ name, tasks, limited }: { name: string; tasks: MyTaskDTO[]; limited: boolean }) {
  const hours = tasks.reduce((n, t) => n + t.estimatedHours, 0);
  const projectCount = new Set(tasks.map((t) => t.project.id)).size;
  const next = earliest(tasks.map((t) => t.deadline));

  if (tasks.length === 0)
    return (
      <EmptyState
        icon={<CheckListIcon className="h-6 w-6" />}
        title={limited ? "No tasks you can see" : "No tasks assigned yet"}
        text={
          limited
            ? `None of ${name}'s tasks are in projects you have access to.`
            : `${name} has no tasks yet. Tasks appear here once they are created from a meeting transcript.`
        }
      />
    );

  return (
    <>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tasks" value={tasks.length} icon={<CheckListIcon className="h-5 w-5" />} />
        <StatCard label="Projects" value={projectCount} icon={<BriefcaseIcon className="h-5 w-5" />} />
        <StatCard label="Estimated hours" value={`${hours} hrs`} icon={<ClockIcon className="h-5 w-5" />} />
        <StatCard label="Next due" value={next ? formatDate(next) : "-"} icon={<CalendarIcon className="h-5 w-5" />} />
      </div>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">What {name.split(" ")[0]} is working on</h2>
      <Card className="divide-y divide-slate-100">
        {[...tasks]
          .sort((a, b) => a.deadline.localeCompare(b.deadline))
          .map((t) => (
            <div key={t.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{t.title}</p>
                {t.description && <p className="mt-0.5 text-sm text-slate-500">{t.description}</p>}
                <Link
                  href={`/projects/${t.project.id}`}
                  className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  {t.project.name} <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-sm">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <CalendarIcon className="text-slate-400" /> Due {formatDate(t.deadline)}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
                  <ClockIcon className="h-3.5 w-3.5" /> {t.estimatedHours} hrs
                </span>
              </div>
            </div>
          ))}
      </Card>
    </>
  );
}
