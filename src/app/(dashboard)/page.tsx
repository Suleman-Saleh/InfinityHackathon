import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { ProjectsHome } from "./ProjectsHome";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "AGENT") redirect("/my-tasks");

  return <ProjectsHome role={user.role} />;
}
