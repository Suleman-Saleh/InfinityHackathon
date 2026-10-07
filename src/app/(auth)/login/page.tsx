import { redirect } from "next/navigation";
import { CheckCircleIcon, LockIcon, SparkleIcon } from "@/components/icons";
import { getCurrentUser } from "@/modules/auth/session";
import { LoginForm } from "./LoginForm";

const POINTS = [
  { icon: <SparkleIcon className="h-4 w-4" />, text: "AI follows the final decisions and ignores rejected scope" },
  { icon: <LockIcon className="h-4 w-4" />, text: "Everyone sees only their own work, enforced on the server" },
  { icon: <CheckCircleIcon className="h-4 w-4" />, text: "Checked before saving, and saved all-or-nothing" },
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
