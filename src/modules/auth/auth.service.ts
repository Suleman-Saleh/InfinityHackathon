import bcrypt from "bcryptjs";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { userRepo } from "@/modules/users/user.repo";
import type { CurrentUser } from "@/types";
import { createSession } from "./session";

export const authService = {
  async login(email: unknown, password: unknown): Promise<CurrentUser> {
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      throw new ValidationError("Email and password are required");
    }

    const user = await userRepo.findByEmail(email.trim().toLowerCase());
    // Same message for unknown email and wrong password.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const current: CurrentUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    await createSession(current);
    return current;
  },
};
