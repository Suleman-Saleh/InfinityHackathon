"use client";

import { useEffect, useState } from "react";
import { Avatar, Card, ErrorBanner, LoadingBlock, PageHeader, RoleBadge } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api-client";
import type { UserDTO } from "@/types";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "MANAGER", label: "Managers" },
  { key: "AGENT", label: "Agents" },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

const ROLE_ORDER = { ADMIN: 0, MANAGER: 1, AGENT: 2 };

export default function TeamPage() {
  const [users, setUsers] = useState<UserDTO[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    api<UserDTO[]>("/api/users")
      .then((all) =>
        // The directory shows the nine employees; the admin account is a system login, not team staff.
        setUsers(all.filter((u) => u.role !== "ADMIN").sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.id.localeCompare(b.id))),
      )
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Could not load the team."));
  }, []);

  const shown = users?.filter((u) => filter === "ALL" || u.role === filter) ?? [];

  return (
    <>
      <PageHeader
        title="Team Directory"
        subtitle={users ? `${users.length} members at NovaWorks Technologies` : "NovaWorks Technologies"}
        action={
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f.key ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      />

      {error && <ErrorBanner message={error} />}
      {!users && !error && <LoadingBlock label="Loading team..." />}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((u) => (
          <Card key={u.id} className="p-5">
            <div className="flex items-start gap-3">
              <Avatar name={u.name} role={u.role} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{u.name}</p>
                  <RoleBadge role={u.role} />
                </div>
                <p className="text-sm text-slate-600">{u.specialization}</p>
                <p className="truncate text-xs text-slate-400">{u.email}</p>
              </div>
            </div>
            {u.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {u.skills.map((s) => (
                  <span key={s} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
