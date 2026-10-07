"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { Avatar, Card, ErrorBanner, LoadingBlock, PageHeader, RoleBadge } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api-client";
import type { Role, UserDTO } from "@/types";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "MANAGER", label: "Managers" },
  { key: "AGENT", label: "Agents" },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

const ROLE_ORDER = { ADMIN: 0, MANAGER: 1, AGENT: 2 };

// Agents can only open their own profile; the API enforces the same rule.
const canOpen = (viewer: { id: string; role: Role }, member: UserDTO) => viewer.role !== "AGENT" || member.id === viewer.id;

export function TeamDirectory({ viewer }: { viewer: { id: string; role: Role } }) {
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
        {shown.map((u) =>
          canOpen(viewer, u) ? (
            <Link key={u.id} href={`/team/${u.id}`} className="group block focus-visible:outline-none">
              <MemberCard
                member={u}
                isYou={u.id === viewer.id}
                className="transition-all group-hover:border-brand-200 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-brand-600"
                footer={
                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-brand-600">
                    {u.id === viewer.id ? "View your work" : u.role === "MANAGER" ? "View projects" : "View work"}
                    <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                }
              />
            </Link>
          ) : (
            <MemberCard key={u.id} member={u} isYou={false} />
          ),
        )}
      </div>
    </>
  );
}

function MemberCard({
  member: u,
  isYou,
  className = "",
  footer,
}: {
  member: UserDTO;
  isYou: boolean;
  className?: string;
  footer?: React.ReactNode;
}) {
  return (
    <Card className={`flex h-full flex-col p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <Avatar name={u.name} role={u.role} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`font-semibold text-slate-900 ${footer ? "group-hover:text-brand-700" : ""}`}>{u.name}</p>
            <RoleBadge role={u.role} />
            {isYou && <span className="text-xs font-medium text-slate-500">(you)</span>}
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
      {footer}
    </Card>
  );
}
