"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EyeIcon, EyeOffIcon, SparkleIcon } from "@/components/icons";
import { Avatar, Card, RoleBadge, Spinner, buttonClass } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api-client";
import type { CurrentUser, Role } from "@/types";

// Fictional demo accounts from the challenge pack (all use Demo123!). Shown for judges' convenience.
const DEMO_PASSWORD = "Demo123!";
const DEMO_ACCOUNTS: { name: string; email: string; role: Role; note: string }[] = [
  { name: "Admin", email: "admin@novaworks.example", role: "ADMIN", note: "All projects, transcript" },
  { name: "Ayesha Khan", email: "ayesha@novaworks.example", role: "MANAGER", note: "Web PM" },
  { name: "Bilal Ahmed", email: "bilal@novaworks.example", role: "MANAGER", note: "Mobile PM" },
  { name: "Hina Malik", email: "hina@novaworks.example", role: "MANAGER", note: "AI PM" },
  { name: "Ali Raza", email: "ali@novaworks.example", role: "AGENT", note: "Full-Stack" },
  { name: "Hamza Shah", email: "hamza@novaworks.example", role: "AGENT", note: "Full-Stack" },
  { name: "Sara Noor", email: "sara@novaworks.example", role: "AGENT", note: "App Developer" },
  { name: "Usman Tariq", email: "usman@novaworks.example", role: "AGENT", note: "App Developer" },
  { name: "Zain Abbas", email: "zain@novaworks.example", role: "AGENT", note: "AI Developer" },
  { name: "Maryam Asif", email: "maryam@novaworks.example", role: "AGENT", note: "AI Developer" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await api<{ user: CurrentUser }>("/api/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });
      router.replace(user.role === "AGENT" ? "/my-tasks" : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Login failed. Please try again.");
      setLoading(false);
    }
  }

  function fillDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    setError("");
  }

  return (
    <div className="w-full max-w-md">
      <Card className="p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <SparkleIcon className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-semibold text-slate-900">Sign in to NovaWorks</h1>
          <p className="mt-1 text-sm text-slate-500">Use your NovaWorks demo account</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@novaworks.example"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-10 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className={buttonClass("primary", "w-full py-2.5")}>
            {loading && <Spinner />}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </Card>

      <details className="group mt-4 rounded-xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur" open>
        <summary className="cursor-pointer list-none px-5 py-3 text-sm font-medium text-slate-700">
          <span className="flex items-center justify-between">
            Demo accounts <span className="text-xs font-normal text-slate-500">password: {DEMO_PASSWORD} · click to fill</span>
          </span>
        </summary>
        <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto border-t border-slate-200">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <button
                type="button"
                onClick={() => fillDemo(a)}
                className="flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-brand-50/60"
              >
                <Avatar name={a.name} role={a.role} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">{a.name}</span>
                  <span className="block truncate text-xs text-slate-500">{a.email}</span>
                </span>
                <span className="hidden text-xs text-slate-500 sm:inline">{a.note}</span>
                <RoleBadge role={a.role} />
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
