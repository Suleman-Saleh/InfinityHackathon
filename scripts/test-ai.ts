/**
 * Runs the AI transcript pipeline (prompt → Groq → schema → validation) without a database
 * and compares the result with the organizer answer key.
 *
 *   npm run ai:test                         # supplied transcript
 *   npm run ai:test -- path/to/other.txt    # any transcript (answer-key check skipped)
 */
import { readFileSync } from "node:fs";
import { completeJSON } from "@/lib/ai";
import { buildMessages } from "@/modules/transcript/transcript.prompt";
import { aiDraftSchema } from "@/modules/transcript/transcript.schema";
import { validateDraft } from "@/modules/transcript/transcript.validate";
import { demoUsers } from "../prisma/demo-users";

const EXPECTED: Record<string, [string, string, number]> = {
  "Product catalog UI": ["DEV01", "2026-10-12", 12],
  "Demo cart UI": ["DEV01", "2026-10-15", 8],
  "Product and cart APIs": ["DEV02", "2026-10-14", 14],
  "Website integration and testing": ["DEV01", "2026-10-19", 6],
  "Login and profile screens": ["DEV03", "2026-10-12", 8],
  "Service booking screens": ["DEV03", "2026-10-17", 12],
  "Booking and account APIs": ["DEV02", "2026-10-16", 16],
  "Mobile integration and testing": ["DEV04", "2026-10-22", 10],
  "FAQ document processing": ["DEV06", "2026-10-13", 10],
  "Assistant answer generation": ["DEV05", "2026-10-17", 14],
  "Human escalation flow": ["DEV05", "2026-10-18", 6],
  "Assistant evaluation and testing": ["DEV06", "2026-10-21", 8],
};

async function main() {
  const file = process.argv[2] ?? "docs/transcript.txt";
  const transcript = readFileSync(file, "utf8");
  const directory = demoUsers
    .filter((u) => u.role !== "ADMIN")
    .map(({ id, name, role, specialization, skills }) => ({ id, name, role, specialization, skills }));

  const started = Date.now();
  const ai = await completeJSON(buildMessages(transcript, directory, "2026-10-07"), (raw) => aiDraftSchema.parse(raw));
  console.log(`Model: ${ai.model} · ${((Date.now() - started) / 1000).toFixed(1)}s\n`);

  const draft = ai.output;
  const result = validateDraft(draft, directory);
  if (!result.ok) {
    console.log("VALIDATION ISSUES:");
    result.issues.forEach((i) => console.log("  -", i));
  }

  const names = new Map(demoUsers.map((u) => [u.id, u.name.split(" ")[0]]));
  let mismatches = 0;
  for (const p of draft.projects) {
    const hours = p.tasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);
    console.log(`${p.name} | ${p.clientName} | ${names.get(p.managerId ?? "")} | ${p.deadline} | ${p.tasks.length} tasks | ${hours} h`);
    for (const t of p.tasks) {
      const exp = file.endsWith("docs/transcript.txt") ? EXPECTED[t.title ?? ""] : undefined;
      const ok = !exp || (exp[0] === t.assigneeId && exp[1] === t.deadline && exp[2] === t.estimatedHours);
      if (!ok) mismatches++;
      console.log(`   ${ok ? "✓" : "✗"} ${t.title} | ${names.get(t.assigneeId ?? "")} | ${t.deadline} | ${t.estimatedHours} h${ok ? "" : `   expected ${names.get(exp![0])} ${exp![1]} ${exp![2]} h`}`);
    }
  }

  if (file.endsWith("docs/transcript.txt")) {
    const titles = new Set(draft.projects.flatMap((p) => p.tasks.map((t) => t.title)));
    const missing = Object.keys(EXPECTED).filter((t) => !titles.has(t));
    const totalTasks = draft.projects.reduce((n, p) => n + p.tasks.length, 0);
    console.log(`\nProjects: ${draft.projects.length}/3 · Tasks: ${totalTasks}/12 · Mismatches: ${mismatches} · Missing titles: ${missing.length ? missing.join(", ") : "none"}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
