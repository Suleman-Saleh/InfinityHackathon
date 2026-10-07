import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { TeamDirectory } from "./TeamDirectory";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <TeamDirectory viewer={{ id: user.id, role: user.role }} />;
}
