import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { ClientDetail } from "./ClientDetail";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  return <ClientDetail id={id} role={user.role} />;
}
