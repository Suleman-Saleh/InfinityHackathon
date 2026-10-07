import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Removes generated projects, tasks, clients and transcript runs; keeps the seeded users.
async function main() {
  const [tasks, projects, runs, clients] = await prisma.$transaction([
    prisma.task.deleteMany(),
    prisma.project.deleteMany(),
    prisma.transcriptRun.deleteMany(),
    prisma.client.deleteMany(),
  ]);
  console.log(
    `Deleted ${projects.count} projects, ${tasks.count} tasks, ${clients.count} clients, ${runs.count} transcript runs. Users kept.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
