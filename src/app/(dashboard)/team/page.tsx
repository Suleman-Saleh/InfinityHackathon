import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { userService } from "@/modules/users/user.service";
import { TeamDirectory } from "./TeamDirectory";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Which cards are clickable. The API applies the same rule to /api/users/[id].
  const openable = await userService.openableMemberIds(user);

  return <TeamDirectory viewer={{ id: user.id, role: user.role }} openableIds={openable === "ALL" ? null : openable} />;
}
