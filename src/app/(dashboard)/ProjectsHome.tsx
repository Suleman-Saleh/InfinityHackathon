"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BriefcaseIcon, CheckListIcon, ClockIcon, FileTextIcon, SparkleIcon } from "@/components/icons";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader, StatCard, buttonClass } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api-client";
import type { ProjectDTO, Role } from "@/types";

export function ProjectsHome({ role }: { role: Exclude<Role, "AGENT"> }) {
  const isAdmin = role === "ADMIN";
  const [projects, setProjects] = useState<ProjectDTO[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<ProjectDTO[]>("/api/projects")
      .then(setProjects)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Could not load projects."));
  }, []);

  const createButton = isAdmin && (
    <Link href="/transcript" className={buttonClass("primary")}>
      <SparkleIcon /> Create from Transcript
    </Link>
  );

  const taskCount = projects?.reduce((sum, p) => sum + p.taskCount, 0) ?? 0;
  const totalHours = projects?.reduce((sum, p) => sum + p.totalHours, 0) ?? 0;

  return (
    <>
      <PageHeader
        title={isAdmin ? "Dashboard" : "My Projects"}
        subtitle={isAdmin ? "All client projects at NovaWorks Technologies" : "Projects you manage"}
        action={projects && projects.length > 0 ? createButton : undefined}
      />

      {error && <ErrorBanner message={error} />}
      {!projects && !error && <LoadingBlock label="Loading projects..." />}

      {projects && projects.length === 0 && (
        <EmptyState
          icon={<FileTextIcon className="h-6 w-6" />}
          title="No projects yet"
          text={
            isAdmin
              ? "Paste a meeting transcript and AI will create the projects, tasks, owners, deadlines and estimates for you."
              : "No projects are assigned to you yet. They will appear here once the administrator creates them from a meeting."
          }
          action={createButton}
        />
      )}

      {projects && projects.length > 0 && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="Projects" value={projects.length} icon={<BriefcaseIcon className="h-5 w-5" />} />
            <StatCard label="Tasks" value={taskCount} icon={<CheckListIcon className="h-5 w-5" />} />
            <StatCard label="Total estimate" value={`${totalHours} hrs`} icon={<ClockIcon className="h-5 w-5" />} />
          </div>

          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {isAdmin ? "All projects" : "Your projects"}
          </h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
