"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertIcon, ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon, SparkleIcon } from "@/components/icons";
import { Spinner, buttonClass } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api-client";
import type { CurrentUser } from "@/types";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";

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

  return (
    <div className="w-full max-w-sm">
      {/* Logo (the brand panel is hidden on small screens) */}
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
          <SparkleIcon className="h-5 w-5" />
        </span>
        <span className="leading-tight">
          <span className="block font-semibold text-slate-900">NovaWorks</span>
          <span className="block text-sm text-slate-500">AI Project Manager</span>
        </span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mt-1.5 text-sm text-slate-500">Sign in to your NovaWorks workspace.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <MailIcon />
            </span>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@novaworks.example"
              className={`${inputClass} pr-3`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <LockIcon />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3.5 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={buttonClass("primary", "group w-full rounded-xl py-3 shadow-md shadow-brand-600/20")}
        >
          {loading && <Spinner />}
          {loading ? "Signing in..." : "Sign in"}
          {!loading && <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-slate-400">NovaWorks Technologies · Lahore</p>
    </div>
  );
}
