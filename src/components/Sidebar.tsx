"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api-client";
import type { CurrentUser } from "@/types";
import { BuildingIcon, CheckListIcon, DashboardIcon, LogoutIcon, MenuIcon, SparkleIcon, UsersIcon } from "./icons";
import { Avatar, RoleBadge } from "./ui";

type NavItem = { href: string; label: string; icon: React.ReactNode; match: (path: string) => boolean };

function navFor(user: CurrentUser): NavItem[] {
  const team: NavItem = { href: "/team", label: "Team Directory", icon: <UsersIcon />, match: (p) => p === "/team" };
  const clients: NavItem = { href: "/clients", label: "Clients", icon: <BuildingIcon />, match: (p) => p.startsWith("/clients") };
  if (user.role === "AGENT") {
    return [
      {
        href: "/my-tasks",
        label: "My Tasks",
        icon: <CheckListIcon />,
        match: (p) => p === "/my-tasks" || p.startsWith("/projects"),
      },
      clients,
      team,
    ];
  }
  const home: NavItem = {
    href: "/",
    label: user.role === "ADMIN" ? "Dashboard" : "My Projects",
    icon: <DashboardIcon />,
    match: (p) => p === "/" || p.startsWith("/projects"),
  };
  if (user.role === "MANAGER") return [home, clients, team];
  return [
    home,
    { href: "/transcript", label: "Create from Transcript", icon: <SparkleIcon />, match: (p) => p === "/transcript" },
    clients,
    team,
  ];
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <SparkleIcon className="h-4 w-4" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-slate-900">NovaWorks</span>
        <span className="block text-xs text-slate-500">AI Project Manager</span>
      </span>
    </Link>
  );
}

export function Sidebar({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const items = navFor(user);

  async function logout() {
    setLoggingOut(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const userCard = (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} role={user.role} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
          <RoleBadge role={user.role} />
        </div>
      </div>
      <button
        onClick={logout}
        disabled={loggingOut}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
      >
        <LogoutIcon />
        {loggingOut ? "Logging out..." : "Logout"}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between border-r border-slate-200 bg-white p-4 lg:flex">
        <div className="flex flex-col gap-8">
          <div className="px-2 pt-2">
            <Logo />
          </div>
          {nav}
        </div>
        {userCard}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <Logo />
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
        {open && (
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3">
            {nav}
            {userCard}
          </div>
        )}
      </header>
    </>
  );
}
