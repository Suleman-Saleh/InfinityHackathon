import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getCurrentUser } from "@/modules/auth/session";

// Every dashboard page needs a logged-in user. The API enforces access too; this only handles navigation.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <Sidebar user={user} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
