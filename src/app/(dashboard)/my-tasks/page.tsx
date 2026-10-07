import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { MyTasks } from "./MyTasks";

export default async function MyTasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "AGENT") redirect("/");

  return <MyTasks />;
}
