import type { UserDTO } from "@/types";
import { userRepo } from "./user.repo";

export type DirectoryEntry = Pick<UserDTO, "id" | "name" | "role" | "specialization" | "skills">;

export const userService = {
  /** Team directory for the UI. Never includes password hashes. */
  list: (): Promise<UserDTO[]> => userRepo.listPublic(),

  /** Directory sent to the AI: managers and agents only, no emails or passwords. */
  async aiDirectory(): Promise<DirectoryEntry[]> {
    const users = await userRepo.listPublic();
    return users
      .filter((u) => u.role !== "ADMIN")
      .map(({ id, name, role, specialization, skills }) => ({ id, name, role, specialization, skills }));
  },
};
