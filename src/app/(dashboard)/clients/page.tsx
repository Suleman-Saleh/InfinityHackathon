"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRightIcon, BriefcaseIcon, BuildingIcon, CalendarIcon, ClockIcon, SearchIcon, UserIcon } from "@/components/icons";
import { Avatar, Card, EmptyState, ErrorBanner, LoadingBlock, PageHeader, StatCard } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api-client";
import { formatDate } from "@/lib/dates";
import type { ClientDTO } from "@/types";

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientDTO[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    api<ClientDTO[]>("/api/clients")
      .then(setClients)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Could not load clients."));
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!clients || !q) return clients ?? [];
    return clients.filter((c) =>
      [c.name, c.industry, c.contactName, c.contactEmail, ...c.managers.map((m) => m.name)].some((v) => v.toLowerCase().includes(q)),
    );
  }, [clients, query]);

  const totalProjects = clients?.reduce((n, c) => n + c.projectCount, 0) ?? 0;
  const totalHours = clients?.reduce((n, c) => n + c.totalHours, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Client accounts, their contacts and the projects NovaWorks delivers for them"
        action={
          clients && clients.length > 0 ? (
            <label className="relative block w-full sm:w-72">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clients, contacts, managers..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </label>
          ) : undefined
        }
      />

      {error && <ErrorBanner message={error} />}
      {!clients && !error && <LoadingBlock label="Loading clients..." />}

      {clients && clients.length === 0 && (
        <EmptyState
          icon={<BuildingIcon className="h-6 w-6" />}
          title="No clients yet"
          text="Clients are created automatically when projects are generated from a meeting transcript."
        />
      )}

      {clients && clients.length > 0 && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="Clients" value={clients.length} icon={<BuildingIcon className="h-5 w-5" />} />
            <StatCard label="Projects" value={totalProjects} icon={<BriefcaseIcon className="h-5 w-5" />} />
            <StatCard label="Total estimate" value={`${totalHours} hrs`} icon={<ClockIcon className="h-5 w-5" />} />
          </div>

          {shown.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No clients match &ldquo;{query}&rdquo;.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {shown.map((c) => (
                <ClientCard key={c.id} client={c} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

function ClientCard({ client }: { client: ClientDTO }) {
  return (
    <Link href={`/clients/${client.id}`} className="group block focus-visible:outline-none">
      <Card className="flex h-full flex-col p-5 transition-all group-hover:border-brand-200 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-brand-600">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <BuildingIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900 group-hover:text-brand-700">{client.name}</h3>
            <p className="truncate text-sm text-slate-500">{client.industry || "Industry not set"}</p>
          </div>
        </div>

        <p className="mb-4 flex items-center gap-2 text-sm text-slate-600">
          <UserIcon className="h-3.5 w-3.5 text-slate-400" />
          {client.contactName || <span className="text-slate-400">No contact person yet</span>}
        </p>

        {client.managers.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-700">
            {client.managers.map((m) => (
              <span key={m.id} className="flex items-center gap-1.5">
                <Avatar name={m.name} role="MANAGER" size="sm" /> {m.name}
              </span>
            ))}
          </div>
        )}

        <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-sm">
          <div>
            <dt className="flex items-center gap-1 text-xs text-slate-500">
              <BriefcaseIcon className="h-3.5 w-3.5" /> Projects
            </dt>
            <dd className="mt-0.5 font-medium text-slate-900">{client.projectCount}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-slate-500">
              <ClockIcon className="h-3.5 w-3.5" /> Estimate
            </dt>
            <dd className="mt-0.5 font-medium text-slate-900">{client.totalHours} hrs</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-slate-500">
              <CalendarIcon className="h-3.5 w-3.5" /> Next due
            </dt>
            <dd className="mt-0.5 font-medium text-slate-900">{client.nextDeadline ? formatDate(client.nextDeadline) : "-"}</dd>
          </div>
        </dl>

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
          View client <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Card>
    </Link>
  );
}
