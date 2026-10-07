import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { ProjectDetail } from "./ProjectDetail";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  return <ProjectDetail id={id} role={user.role} />;
}
