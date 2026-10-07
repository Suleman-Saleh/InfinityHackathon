"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertIcon, ArrowRightIcon, CalendarIcon, CheckCircleIcon, CheckListIcon, ClockIcon, FileTextIcon, SparkleIcon } from "@/components/icons";
import { Avatar, Card, ErrorBanner, PageHeader, RoleBadge, Spinner, buttonClass } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api-client";
import { formatDate } from "@/lib/dates";
import type { ProjectDTO, TranscriptResultDTO, UserDTO } from "@/types";

const MAX_CHARS = 50_000;

// Shown while waiting. The API doesn't report progress, so this is only a friendly hint, not real step tracking.
const WAIT_MESSAGES = [
  "Reading the transcript...",
  "Matching people to the team directory...",
  "Extracting projects, tasks, deadlines and estimates...",
  "Checking final decisions and validating...",
];

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; result: TranscriptResultDTO }
  | { kind: "error"; message: string; issues: string[] };

export function TranscriptForm() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [elapsed, setElapsed] = useState(0);
  const [team, setTeam] = useState<UserDTO[]>([]);
  const [existingProjects, setExistingProjects] = useState<number | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const loading = status.kind === "loading";

  useEffect(() => {
    api<UserDTO[]>("/api/users")
      .then((users) => setTeam(users.filter((u) => u.role !== "ADMIN")))
      .catch(() => {});
    api<ProjectDTO[]>("/api/projects")
      .then((p) => setExistingProjects(p.length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (status.kind === "success" || status.kind === "error") {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status.kind]);

  async function loadSample() {
    setLoadingSample(true);
    try {
      const res = await fetch("/sample-transcript.txt");
      setText(await res.text());
      setStatus({ kind: "idle" });
    } finally {
      setLoadingSample(false);
    }
  }

  async function submit() {
    if (loading) return; // guard against double submits
    if (!text.trim()) {
      setStatus({ kind: "error", message: "Please paste a meeting transcript first.", issues: [] });
      return;
    }
    setElapsed(0);
    setStatus({ kind: "loading" });
    try {
      const result = await api<TranscriptResultDTO>("/api/transcript", { method: "POST", body: { transcript: text } });
      setStatus({ kind: "success", result });
      setExistingProjects((n) => (n ?? 0) + result.projects.length);
    } catch (err) {
      if (err instanceof ApiRequestError) setStatus({ kind: "error", message: err.message, issues: err.issues });
      else setStatus({ kind: "error", message: "Something went wrong. Please try again.", issues: [] });
    }
  }

  const waitMessage = WAIT_MESSAGES[Math.min(Math.floor(elapsed / 4), WAIT_MESSAGES.length - 1)];

  return (
    <>
      <PageHeader
        title="Create from Transcript"
        subtitle="Paste a meeting transcript. AI extracts the projects, tasks, assignees, deadlines and estimated hours using your team directory."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <Card className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="transcript" className="text-sm font-medium text-slate-700">
                Meeting transcript
              </label>
              <button
                type="button"
                onClick={loadSample}
                disabled={loading || loadingSample}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
              >
                <FileTextIcon className="h-3.5 w-3.5" />
                {loadingSample ? "Loading..." : "Load supplied meeting transcript"}
              </button>
            </div>
            <textarea
              id="transcript"
              value={text}
              onChange={(e) => setText(e.target.value)}
              readOnly={loading}
              maxLength={MAX_CHARS}
              rows={16}
              placeholder={"Meeting: NovaWorks Client Delivery Planning\nDate: 7 October 2026\n\nAyesha: Good morning. We have three client engagements to plan today..."}
              className={`w-full resize-y rounded-lg border border-slate-300 p-3 font-mono text-[13px] leading-relaxed shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 ${
                loading ? "bg-slate-50 text-slate-500" : ""
              }`}
            />
            <div className="mt-1 text-right text-xs text-slate-400">
              {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
            </div>

            {existingProjects !== null && existingProjects > 0 && status.kind !== "success" && (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {existingProjects} project{existingProjects === 1 ? " already exists" : "s already exist"}. Creating again adds new
                projects alongside them.
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setText("");
                  setStatus({ kind: "idle" });
                }}
                disabled={loading || !text}
                className={buttonClass("secondary")}
              >
                Clear
              </button>
              <button type="button" onClick={submit} disabled={loading} className={buttonClass("primary")}>
                {loading ? <Spinner /> : <SparkleIcon />}
                {loading ? "Processing..." : "Create from Transcript"}
              </button>
            </div>
          </Card>

          <div ref={resultRef} className="scroll-mt-6">
            {loading && (
              <Card className="flex items-center gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <SparkleIcon className="h-5 w-5 animate-pulse" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{waitMessage}</p>
                  <p className="text-sm text-slate-500">
                    This usually takes 5 to 20 seconds. Please don&apos;t refresh. ({elapsed}s)
                  </p>
                </div>
              </Card>
            )}

            {status.kind === "error" && (
              <div className="space-y-2">
                <ErrorBanner message={status.message} issues={status.issues} />
                <p className="text-sm text-slate-500">Nothing was saved. Edit the transcript above and try again.</p>
              </div>
            )}

            {status.kind === "success" && <SuccessResult result={status.result} onAnother={() => setStatus({ kind: "idle" })} />}
          </div>
        </div>

        <TeamPanel team={team} />
      </div>
    </>
  );
}

function SuccessResult({ result, onAnother }: { result: TranscriptResultDTO; onAnother: () => void }) {
  const totalHours = result.projects.reduce((sum, p) => sum + p.totalHours, 0);
  return (
    <div className="space-y-4">
      <div role="status" className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
        <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
        <div>
          <p className="font-medium">
            {result.projects.length} project{result.projects.length === 1 ? "" : "s"} and {result.taskCount} task
            {result.taskCount === 1 ? "" : "s"} created and saved
          </p>
          <p className="text-sm text-green-700">
            {totalHours} estimated hours in total · extracted by {result.model}
          </p>
        </div>
      </div>

      <Card className="divide-y divide-slate-100">
        {result.projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="group flex flex-col gap-3 p-4 hover:bg-slate-50 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900 group-hover:text-brand-700">{p.name}</p>
              <p className="text-sm text-slate-500">{p.clientName}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <Avatar name={p.manager.name} role="MANAGER" size="sm" /> {p.manager.name}
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5 text-slate-400" /> {formatDate(p.deadline)}
              </span>
              <span className="flex items-center gap-1">
                <CheckListIcon className="h-3.5 w-3.5 text-slate-400" /> {p.taskCount} tasks
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5 text-slate-400" /> {p.totalHours} hrs
              </span>
              <ArrowRightIcon className="hidden h-4 w-4 text-slate-400 group-hover:text-brand-600 sm:block" />
            </div>
          </Link>
        ))}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/" className={buttonClass("primary")}>
          View all projects
        </Link>
        <button type="button" onClick={onAnother} className={buttonClass("secondary")}>
          Create another
        </button>
      </div>
    </div>
  );
}

function TeamPanel({ team }: { team: UserDTO[] }) {
  return (
    <Card className="h-fit p-5">
      <h2 className="text-sm font-semibold text-slate-900">Team directory sent to AI</h2>
      <p className="mt-1 text-xs text-slate-500">Names, roles and skills only. Passwords and emails are never sent.</p>
      <ul className="mt-4 space-y-3">
        {team.map((u) => (
          <li key={u.id} className="flex items-center gap-3">
            <Avatar name={u.name} role={u.role} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{u.name}</p>
              <p className="truncate text-xs text-slate-500">
                {u.id} · {u.specialization}
              </p>
            </div>
            <RoleBadge role={u.role} />
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        AI only assigns work to existing team members. Anyone else mentioned in the meeting is ignored.
      </p>
    </Card>
  );
}
