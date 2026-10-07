import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Removes generated projects, tasks and transcript runs; keeps the seeded users.
async function main() {
  const [tasks, projects, runs] = await prisma.$transaction([
    prisma.task.deleteMany(),
    prisma.project.deleteMany(),
    prisma.transcriptRun.deleteMany(),
  ]);
  console.log(`Deleted ${projects.count} projects, ${tasks.count} tasks, ${runs.count} transcript runs. Users kept.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
