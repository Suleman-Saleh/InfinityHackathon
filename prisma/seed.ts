import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo123!";

const users: { id: string; name: string; email: string; role: Role; specialization: string; skills: string[] }[] = [
  { id: "ADMIN", name: "Admin", email: "admin@novaworks.example", role: "ADMIN", specialization: "Administrator", skills: ["Company overview", "Transcript creation"] },
  { id: "PM01", name: "Ayesha Khan", email: "ayesha@novaworks.example", role: "MANAGER", specialization: "Web PM", skills: ["Web projects", "Client coordination"] },
  { id: "PM02", name: "Bilal Ahmed", email: "bilal@novaworks.example", role: "MANAGER", specialization: "Mobile PM", skills: ["Mobile projects", "Delivery planning"] },
  { id: "PM03", name: "Hina Malik", email: "hina@novaworks.example", role: "MANAGER", specialization: "AI PM", skills: ["AI projects", "Requirement review"] },
  { id: "DEV01", name: "Ali Raza", email: "ali@novaworks.example", role: "AGENT", specialization: "Full-Stack", skills: ["React", "Frontend integration"] },
  { id: "DEV02", name: "Hamza Shah", email: "hamza@novaworks.example", role: "AGENT", specialization: "Full-Stack", skills: ["Node.js", "Databases", "APIs"] },
  { id: "DEV03", name: "Sara Noor", email: "sara@novaworks.example", role: "AGENT", specialization: "App Developer", skills: ["Flutter", "Mobile UI"] },
  { id: "DEV04", name: "Usman Tariq", email: "usman@novaworks.example", role: "AGENT", specialization: "App Developer", skills: ["Flutter", "Integration", "Testing"] },
  { id: "DEV05", name: "Zain Abbas", email: "zain@novaworks.example", role: "AGENT", specialization: "AI Developer", skills: ["LLMs", "Extraction", "Prompts"] },
  { id: "DEV06", name: "Maryam Asif", email: "maryam@novaworks.example", role: "AGENT", specialization: "AI Developer", skills: ["Retrieval", "Document processing"] },
];

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
