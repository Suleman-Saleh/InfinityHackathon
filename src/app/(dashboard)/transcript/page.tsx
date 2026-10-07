import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { TranscriptForm } from "./TranscriptForm";

export default async function TranscriptPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Only the admin may create from a transcript. The API checks this as well.
  if (user.role !== "ADMIN") redirect(user.role === "AGENT" ? "/my-tasks" : "/");

  return <TranscriptForm />;
}
