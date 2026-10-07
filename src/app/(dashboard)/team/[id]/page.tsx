import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { MemberDetail } from "./MemberDetail";

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  return <MemberDetail id={id} />;
}
