import { formatDate } from "@/lib/dates";
import type { TaskDTO } from "@/types";
import { Avatar, Card } from "./ui";

/** Task rows: title, description, assigned agent, deadline and estimated hours. */
export function TaskTable({ tasks, specializations = {} }: { tasks: TaskDTO[]; specializations?: Record<string, string> }) {
  const sorted = [...tasks].sort((a, b) => a.deadline.localeCompare(b.deadline));

  return (
    <Card className="overflow-hidden">
      {/* Desktop table */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3 font-medium">Task</th>
            <th className="px-5 py-3 font-medium">Assigned agent</th>
            <th className="px-5 py-3 font-medium">Deadline</th>
            <th className="px-5 py-3 text-right font-medium">Est. hours</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((t) => (
            <tr key={t.id} className="align-top hover:bg-slate-50/60">
              <td className="px-5 py-4">
                <p className="font-medium text-slate-900">{t.title}</p>
                {t.description && <p className="mt-0.5 max-w-md text-slate-500">{t.description}</p>}
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name={t.assignee.name} role="AGENT" />
                  <div>
                    <p className="font-medium text-slate-900">{t.assignee.name}</p>
                    {specializations[t.assignee.id] && (
                      <p className="text-xs text-slate-500">{specializations[t.assignee.id]}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-slate-700">{formatDate(t.deadline)}</td>
              <td className="px-5 py-4 text-right font-medium text-slate-900">{t.estimatedHours}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile list */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {sorted.map((t) => (
          <li key={t.id} className="p-4">
            <p className="font-medium text-slate-900">{t.title}</p>
            {t.description && <p className="mt-0.5 text-sm text-slate-500">{t.description}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-700">
              <span className="flex items-center gap-2">
                <Avatar name={t.assignee.name} role="AGENT" size="sm" />
                {t.assignee.name}
              </span>
              <span>{formatDate(t.deadline)}</span>
              <span className="font-medium">{t.estimatedHours} hrs</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
