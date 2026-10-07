import Link from "next/link";
import { initials } from "@/lib/dates";
import type { Role } from "@/types";
import { AlertIcon, LockIcon } from "./icons";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const ROLE_STYLE: Record<Role, { label: string; badge: string; avatar: string }> = {
  ADMIN: { label: "Admin", badge: "bg-brand-50 text-brand-700 ring-brand-100", avatar: "bg-brand-100 text-brand-700" },
  MANAGER: { label: "Manager", badge: "bg-teal-50 text-teal-700 ring-teal-100", avatar: "bg-teal-100 text-teal-700" },
  AGENT: { label: "Agent", badge: "bg-amber-50 text-amber-700 ring-amber-100", avatar: "bg-amber-100 text-amber-800" },
};

export function RoleBadge({ role }: { role: Role }) {
  const s = ROLE_STYLE[role];
  return (
    <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", s.badge)}>
      {s.label}
    </span>
  );
}

export function Avatar({ name, role = "AGENT", size = "md" }: { name: string; role?: Role; size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-11 w-11 text-sm" }[size];
  return (
    <span
      className={cx("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", dims, ROLE_STYLE[role].avatar)}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-xl font-semibold text-slate-900">{value}</p>
      </div>
    </Card>
  );
}

const BUTTON = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 disabled:bg-brand-600/60",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60",
};

export function buttonClass(variant: keyof typeof BUTTON = "primary", className?: string) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed",
    BUTTON[variant],
    className,
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={cx("animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function LoadingBlock({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-sm text-slate-500">
      <Spinner className="h-5 w-5 text-brand-600" />
      {label}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">{icon}</span>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-slate-500">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}

export function ErrorBanner({ message, issues = [] }: { message: string; issues?: string[] }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <div className="flex gap-3">
        <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div>
          <p className="font-medium">{message}</p>
          {issues.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-red-700">
              {issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function AccessDenied({
  backHref,
  backLabel,
  what = "project",
}: {
  backHref: string;
  backLabel: string;
  what?: "project" | "client" | "team member";
}) {
  const reason = {
    project: "This project isn't assigned to you. Contact your project manager if you think this is a mistake.",
    client: "None of this client's projects are assigned to you.",
    "team member": "You can open your own profile and, as a manager, the agents working on your projects. Other people's work is private.",
  }[what];
  return (
    <Card className="mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <LockIcon className="h-6 w-6" />
      </span>
      <h2 className="text-lg font-semibold text-slate-900">You don&apos;t have access to this {what}</h2>
      <p className="mt-1 text-sm text-slate-500">{reason}</p>
      <Link href={backHref} className={buttonClass("primary", "mt-6")}>
        {backLabel}
      </Link>
    </Card>
  );
}
