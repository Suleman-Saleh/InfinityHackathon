import type { Role } from "@prisma/client";

export const DEMO_PASSWORD = "Demo123!";

export type DemoUser = { id: string; name: string; email: string; role: Role; specialization: string; skills: string[] };

// IDs match the challenge reference codes, so AI output (PM01, DEV01...) maps directly to database IDs.
export const demoUsers: DemoUser[] = [
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
