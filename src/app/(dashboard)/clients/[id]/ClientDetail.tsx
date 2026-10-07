"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckListIcon,
  ClockIcon,
  GlobeIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  UserIcon,
} from "@/components/icons";
import { ProjectCard } from "@/components/ProjectCard";
import { AccessDenied, Avatar, Card, EmptyState, ErrorBanner, LoadingBlock, Spinner, StatCard, buttonClass } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api-client";
import { formatDate } from "@/lib/dates";
import type { ClientContact, ClientDetailDTO, ClientUpdateInput, Role } from "@/types";

type State =
  | { status: "loading" }
  | { status: "ready"; client: ClientDetailDTO }
  | { status: "forbidden" }
  | { status: "notFound" }
  | { status: "error"; message: string };

export function ClientDetail({ id, role }: { id: string; role: Role }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [editing, setEditing] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    api<ClientDetailDTO>(`/api/clients/${encodeURIComponent(id)}`)
      .then((client) => setState({ status: "ready", client }))
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 403) setState({ status: "forbidden" });
        else if (err instanceof ApiRequestError && err.status === 404) setState({ status: "notFound" });
        else setState({ status: "error", message: err instanceof Error ? err.message : "Could not load client." });
      });
  }, [id]);

  if (state.status === "loading") return <LoadingBlock label="Loading client..." />;
  if (state.status === "forbidden") return <AccessDenied what="client" backHref="/clients" backLabel="Back to Clients" />;
  if (state.status === "notFound")
    return (
      <EmptyState
        icon={<BuildingIcon className="h-6 w-6" />}
        title="Client not found"
        text="This client doesn't exist or has been removed."
        action={
          <Link href="/clients" className="text-sm font-medium text-brand-600 hover:underline">
            Back to Clients
          </Link>
        }
      />
    );
  if (state.status === "error") return <ErrorBanner message={state.message} />;

  const { client } = state;
  const isAgent = role === "AGENT";

  return (
    <>
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/clients" className="flex items-center gap-1 hover:text-brand-600">
          <ArrowLeftIcon className="h-3.5 w-3.5" /> Clients
        </Link>
        <span>/</span>
        <span className="truncate text-slate-700">{client.name}</span>
      </nav>

      <Card className="mb-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <BuildingIcon className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{client.name}</h1>
              <p className="mt-0.5 text-sm text-slate-500">{client.industry || "Industry not set"}</p>
              {client.managers.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                  <span className="text-slate-500">Account {client.managers.length === 1 ? "manager" : "managers"}:</span>
                  {client.managers.map((m) => (
                    <span key={m.id} className="flex items-center gap-1.5">
                      <Avatar name={m.name} role="MANAGER" size="sm" /> {m.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {client.canEdit && !editing && (
            <button type="button" onClick={() => setEditing(true)} className={buttonClass("secondary")}>
              <PencilIcon /> Edit details
            </button>
          )}
        </div>
        {savedAt && !editing && (
          <p role="status" className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            <CheckCircleIcon className="h-4 w-4 text-green-600" /> Client details saved.
          </p>
        )}
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={isAgent ? "Your projects" : "Projects"} value={client.projectCount} icon={<BriefcaseIcon className="h-5 w-5" />} />
        <StatCard label={isAgent ? "Your tasks" : "Tasks"} value={client.taskCount} icon={<CheckListIcon className="h-5 w-5" />} />
        <StatCard label={isAgent ? "Your estimate" : "Estimate"} value={`${client.totalHours} hrs`} icon={<ClockIcon className="h-5 w-5" />} />
        <StatCard
          label="Next deadline"
          value={client.nextDeadline ? formatDate(client.nextDeadline) : "-"}
          icon={<CalendarIcon className="h-5 w-5" />}
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">{isAgent ? "Projects you work on" : "Projects"}</h2>
            {client.projects.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {client.projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            ) : (
              <EmptyState icon={<BriefcaseIcon className="h-6 w-6" />} title="No projects" text="This client has no projects yet." />
            )}
          </div>
        </div>

        {editing ? (
          <EditClientForm
            client={client}
            canRename={role === "ADMIN"}
            onCancel={() => setEditing(false)}
            onSaved={(updated) => {
              setState({ status: "ready", client: updated });
              setEditing(false);
              setSavedAt(Date.now());
            }}
          />
        ) : (
          <ContactCard client={client} showNotes={!isAgent} />
        )}
      </div>
    </>
  );
}

function ContactRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <div className="break-words text-sm text-slate-900">{children}</div>
      </div>
    </div>
  );
}

const missing = <span className="text-slate-400">Not set</span>;

function ContactCard({ client, showNotes }: { client: ClientDetailDTO; showNotes: boolean }) {
  const website = client.website && (/^https?:\/\//i.test(client.website) ? client.website : `https://${client.website}`);
  return (
    <Card className="h-fit p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Client contact</h2>
      <div className="space-y-4">
        <ContactRow icon={<UserIcon />} label="Contact person">
          {client.contactName || missing}
        </ContactRow>
        <ContactRow icon={<MailIcon />} label="Email">
          {client.contactEmail ? (
            <a href={`mailto:${client.contactEmail}`} className="text-brand-600 hover:underline">
              {client.contactEmail}
            </a>
          ) : (
            missing
          )}
        </ContactRow>
        <ContactRow icon={<PhoneIcon />} label="Phone">
          {client.contactPhone ? (
            <a href={`tel:${client.contactPhone.replace(/\s/g, "")}`} className="text-brand-600 hover:underline">
              {client.contactPhone}
            </a>
          ) : (
            missing
          )}
        </ContactRow>
        <ContactRow icon={<GlobeIcon />} label="Website">
          {website ? (
            <a href={website} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
              {client.website}
            </a>
          ) : (
            missing
          )}
        </ContactRow>
      </div>
      {showNotes && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Notes</p>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{client.notes || <span className="text-slate-400">No notes yet</span>}</p>
        </div>
      )}
      <p className="mt-4 text-xs text-slate-400">Last updated {formatDate(client.updatedAt.slice(0, 10))}</p>
    </Card>
  );
}

const FIELDS: { key: keyof ClientContact; label: string; type?: string; placeholder: string }[] = [
  { key: "industry", label: "Industry", placeholder: "e.g. Fashion retail" },
  { key: "contactName", label: "Contact person", placeholder: "e.g. Sana Iqbal" },
  { key: "contactEmail", label: "Email", type: "email", placeholder: "contact@client.example" },
  { key: "contactPhone", label: "Phone", type: "tel", placeholder: "+92 300 1234567" },
  { key: "website", label: "Website", placeholder: "client.example" },
];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

function EditClientForm({
  client,
  canRename,
  onCancel,
  onSaved,
}: {
  client: ClientDetailDTO;
  canRename: boolean;
  onCancel: () => void;
  onSaved: (client: ClientDetailDTO) => void;
}) {
  const [form, setForm] = useState({
    name: client.name,
    industry: client.industry,
    contactName: client.contactName,
    contactEmail: client.contactEmail,
    contactPhone: client.contactPhone,
    website: client.website,
    notes: client.notes,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ message: string; issues: string[] } | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    const body: ClientUpdateInput = { ...form };
    if (!canRename) delete body.name;
    try {
      onSaved(await api<ClientDetailDTO>(`/api/clients/${client.id}`, { method: "PATCH", body }));
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? { message: err.message, issues: err.issues } : { message: "Could not save. Try again.", issues: [] },
      );
      setSaving(false);
    }
  }

  return (
    <Card className="h-fit p-5">
      <form onSubmit={save} className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Edit client details</h2>

        {canRename && (
          <div>
            <label htmlFor="client-name" className="mb-1 block text-sm font-medium text-slate-700">
              Client name
            </label>
            <input id="client-name" required value={form.name} onChange={set("name")} className={inputClass} />
          </div>
        )}

        {FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={`client-${f.key}`} className="mb-1 block text-sm font-medium text-slate-700">
              {f.label}
            </label>
            <input
              id={`client-${f.key}`}
              type={f.type ?? "text"}
              value={form[f.key]}
              onChange={set(f.key)}
              placeholder={f.placeholder}
              className={inputClass}
            />
          </div>
        ))}

        <div>
          <label htmlFor="client-notes" className="mb-1 block text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            id="client-notes"
            rows={4}
            value={form.notes}
            onChange={set("notes")}
            placeholder="Relationship notes, preferences, next steps..."
            className={`${inputClass} resize-y`}
          />
        </div>

        {error && <ErrorBanner message={error.message} issues={error.issues} />}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={saving} className={buttonClass("secondary")}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={buttonClass("primary")}>
            {saving && <Spinner />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Card>
  );
}
