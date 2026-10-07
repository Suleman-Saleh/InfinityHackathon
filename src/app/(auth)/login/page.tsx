import { redirect } from "next/navigation";
import { CheckCircleIcon, FileTextIcon, LockIcon, SparkleIcon } from "@/components/icons";
import { getCurrentUser } from "@/modules/auth/session";
import { LoginForm } from "./LoginForm";

const POINTS = [
  { icon: <SparkleIcon className="h-4 w-4" />, text: "AI follows the final decisions and ignores rejected scope" },
  { icon: <LockIcon className="h-4 w-4" />, text: "Everyone sees only their own work, enforced on the server" },
  { icon: <CheckCircleIcon className="h-4 w-4" />, text: "Checked before saving, and saved all-or-nothing" },
];

// Illustration only: shows the idea of the product, not live data.
const PREVIEW = [
  { name: "UrbanCart Website", who: "Ayesha", tasks: 4, hours: 40 },
  { name: "QuickServe Mobile App", who: "Bilal", tasks: 4, hours: 46 },
  { name: "HelpDeskPro AI Assistant", who: "Hina", tasks: 4, hours: 38 },
];

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "AGENT" ? "/my-tasks" : "/");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <SparkleIcon className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-semibold">NovaWorks</span>
            <span className="block text-sm text-indigo-100">AI Project Manager</span>
          </span>
        </div>

        <div className="relative max-w-lg">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">From meeting to execution in seconds.</h2>
          <p className="mt-4 text-indigo-100">
            Paste a meeting transcript. AI creates the projects and tasks, assigns the right people, and sets deadlines and
            estimates.
          </p>

          {/* Transcript → plan illustration */}
          <div className="mt-8 space-y-3">
            <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
              <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-indigo-100">
                <FileTextIcon className="h-3.5 w-3.5" /> Meeting transcript
              </p>
              <p className="font-mono text-[13px] leading-relaxed text-white/90">
                Ayesha: The client confirmed final delivery can be <span className="rounded bg-white/20 px-1">20 October</span>.
                <br />
                Usman: Make the final estimate <span className="rounded bg-white/20 px-1">10 hours</span>.
              </p>
            </div>
            <div className="flex items-center gap-2 pl-4 text-xs font-medium text-indigo-100">
              <SparkleIcon className="h-3.5 w-3.5" /> AI extracts, validates and saves
            </div>
            <div className="rounded-xl bg-white p-4 text-slate-900 shadow-xl shadow-indigo-900/20">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-green-700">
                <CheckCircleIcon className="h-4 w-4" /> 3 projects and 12 tasks created
              </p>
              <ul className="space-y-2 text-sm">
                {PREVIEW.map((p) => (
                  <li key={p.name} className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {p.who} · {p.tasks} tasks · {p.hours} h
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <ul className="relative space-y-2.5 text-sm text-indigo-50">
          {POINTS.map((p) => (
            <li key={p.text} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">{p.icon}</span>
              {p.text}
            </li>
          ))}
        </ul>
      </aside>

      {/* Sign-in */}
      <main className="flex items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 py-12 sm:px-8 lg:bg-none lg:bg-white">
        <LoginForm />
      </main>
    </div>
  );
}
