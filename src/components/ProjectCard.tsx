import Link from "next/link";
import { formatDate } from "@/lib/dates";
import type { ProjectDTO } from "@/types";
import { ArrowRightIcon, CalendarIcon, CheckListIcon, ClockIcon } from "./icons";
import { Avatar, Card } from "./ui";

export function ProjectCard({ project }: { project: ProjectDTO }) {
  return (
    <Link href={`/projects/${project.id}`} className="group block focus-visible:outline-none">
      <Card className="flex h-full flex-col p-5 transition-all group-hover:border-brand-200 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-brand-600">
        <div className="mb-4">
          <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{project.name}</h3>
          <p className="text-sm text-slate-500">{project.clientName}</p>
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm text-slate-700">
          <Avatar name={project.manager.name} role="MANAGER" size="sm" />
          <span>{project.manager.name}</span>
          <span className="text-slate-400">· Manager</span>
        </div>

        <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-sm">
          <div>
            <dt className="flex items-center gap-1 text-xs text-slate-500">
              <CalendarIcon className="h-3.5 w-3.5" /> Deadline
            </dt>
            <dd className="mt-0.5 font-medium text-slate-900">{formatDate(project.deadline)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-slate-500">
              <CheckListIcon className="h-3.5 w-3.5" /> Tasks
            </dt>
            <dd className="mt-0.5 font-medium text-slate-900">{project.taskCount}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-slate-500">
              <ClockIcon className="h-3.5 w-3.5" /> Estimate
            </dt>
            <dd className="mt-0.5 font-medium text-slate-900">{project.totalHours} hrs</dd>
          </div>
        </dl>

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
          View project <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Card>
    </Link>
  );
}
