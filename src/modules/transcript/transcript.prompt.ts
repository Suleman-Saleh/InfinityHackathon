import type { ChatMessage } from "@/lib/ai";
import type { DirectoryEntry } from "@/modules/users/user.service";

const SYSTEM_PROMPT = `You are a project-planning assistant for NovaWorks Technologies.
You convert a meeting transcript into projects and tasks.

Return ONLY a JSON object with exactly this shape:
{
  "projects": [
    {
      "name": "string",
      "clientName": "string",
      "description": "string - short scope summary, including what is explicitly excluded",
      "managerId": "string - id of a MANAGER from the directory",
      "deadline": "YYYY-MM-DD",
      "tasks": [
        {
          "title": "string",
          "description": "string - what the task covers",
          "assigneeId": "string - id of an AGENT from the directory",
          "deadline": "YYYY-MM-DD",
          "estimatedHours": number
        }
      ]
    }
  ]
}

Rules:
1. Use only FINAL agreed decisions. When a deadline, estimate, owner or name is changed later in the meeting, use the latest value. A final recap overrides earlier discussion.
2. Do NOT create tasks for features that were rejected, excluded, postponed or described as future work.
3. Assign people only by matching names to the TEAM DIRECTORY. managerId must be a MANAGER id; assigneeId must be an AGENT id.
4. Never invent employees. People who are not in the directory (clients, contacts, end users) must not be assigned anything.
5. Use the task and project names agreed in the meeting. Keep separately agreed tasks separate, even if they have the same owner.
6. estimatedHours is the developer effort in hours as stated, not calendar days. Do not add management hours.
7. Dates: use YYYY-MM-DD. If a year is not stated, use the meeting year.
8. If a required value (manager, assignee, deadline, hours) is genuinely not stated, set it to null. Do not guess.
9. Output JSON only, no explanations.`;

export function buildMessages(transcript: string, directory: DirectoryEntry[], meetingDate: string): ChatMessage[] {
  const directoryText = directory
    .map((u) => `- ${u.id} | ${u.name} | ${u.role} | ${u.specialization} | skills: ${u.skills.join(", ")}`)
    .join("\n");

  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `TODAY'S DATE: ${meetingDate}\n\nTEAM DIRECTORY (id | name | role | specialization | skills):\n${directoryText}\n\nMEETING TRANSCRIPT:\n"""\n${transcript}\n"""`,
    },
  ];
}
