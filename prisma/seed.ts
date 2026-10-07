import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD, demoUsers as users } from "./demo-users";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Upsert by unique email: re-running never duplicates users.
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, specialization: u.specialization, skills: u.skills, passwordHash },
      create: { ...u, passwordHash },
    });
  }

  console.log(`Seeded ${users.length} demo users (password: ${DEMO_PASSWORD})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
