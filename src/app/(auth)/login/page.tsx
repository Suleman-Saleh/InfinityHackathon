import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "AGENT" ? "/my-tasks" : "/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-100 via-white to-white px-4 py-12">
      <LoginForm />
    </div>
  );
}
