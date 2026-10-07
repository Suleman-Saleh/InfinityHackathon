# API Reference

NovaWorks AI Project Manager · Team **Dual Byte** · The Infinity Hack '26

| | |
|---|---|
| **Interactive docs (Swagger UI)** | [`/api-docs`](https://infinity-hackathon.vercel.app/api-docs): read every endpoint and call it with "Try it out" |
| **OpenAPI 3 spec** | [`public/openapi.yaml`](../public/openapi.yaml), served at [`/openapi.yaml`](https://infinity-hackathon.vercel.app/openapi.yaml) |
| **Base URL** | `https://infinity-hackathon.vercel.app` (live) · `http://localhost:3000` (local) |
| **Format** | JSON request and response bodies |

---

## 1. Authentication

1. `POST /api/auth/login` with an email and password.
2. The server sets an **httpOnly `session` cookie**: a JWT signed with `SESSION_SECRET` (HS256), valid for 8 hours, `Secure` in production, `SameSite=Lax`.
3. Every other endpoint reads the user **only from that cookie**. A role or user ID in the request body is never trusted.

In Swagger UI, log in first with "Try it out" on `/api/auth/login`. The browser stores the cookie and sends it with every later call.

With curl, keep the cookie in a file:

```sh
B=https://infinity-hackathon.vercel.app/api
curl -c jar.txt -H 'Content-Type: application/json' \
  -d '{"email":"admin@novaworks.example","password":"Demo123!"}' $B/auth/login
curl -b jar.txt $B/projects
```

Demo accounts (fictional, password `Demo123!`): `admin@`, `ayesha@`, `bilal@`, `hina@` (managers), `ali@`, `hamza@`, `sara@`, `usman@`, `zain@`, `maryam@` (agents), all `@novaworks.example`.

## 2. Access rules

Enforced in the database queries for every request, not just hidden in the UI.

| Role | Projects | Tasks | Clients | Transcript |
|---|---|---|---|---|
| **ADMIN** | All · edit | All · add / edit / delete | All · edit + rename | ✅ |
| **MANAGER** | Projects they manage · edit (no reassign) | All tasks in their projects · add / edit / delete | Clients of their projects · edit (no rename) | ❌ 403 |
| **AGENT** | Projects containing their tasks | **Only their own** | Clients of those projects · read-only, `notes` hidden | ❌ 403 |

## 3. Errors

Every error uses one shape:

```json
{ "error": "Human-readable message", "issues": ["optional list of specific problems"] }
```

| Status | Meaning |
|---|---|
| `400` | Invalid input or AI result could not be validated. `issues` lists what to fix. **Nothing was saved.** |
| `401` | Not logged in / session expired |
| `403` | Logged in, but not allowed (wrong role, or someone else's project / client) |
| `404` | Does not exist |
| `502` | AI provider unavailable or rate-limited after retries. Nothing was saved. |
| `500` | Unexpected error (details are logged on the server, never sent to the client) |

---

## 4. Endpoints

| Method | Path | Who | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Log in, set session cookie |
| `POST` | `/api/auth/logout` | Anyone | Clear session cookie |
| `GET` | `/api/auth/me` | Logged in | Current user |
| `GET` | `/api/users` | Logged in | Team directory |
| `GET` | `/api/users/{id}` | Logged in | Team member profile + work (filtered by viewer) |
| `GET` | `/api/projects` | Logged in | Projects visible to the user |
| `GET` | `/api/projects/{id}` | Logged in | Project detail + tasks (+ `canEdit`) |
| `PATCH` | `/api/projects/{id}` | Admin / project's manager | Correct project name, description, deadline (manager: admin only) |
| `POST` | `/api/projects/{id}/tasks` | Admin / project's manager | Add a task the AI missed |
| `PATCH` | `/api/tasks/{id}` | Admin / project's manager | Correct a task |
| `DELETE` | `/api/tasks/{id}` | Admin / project's manager | Delete a task the AI should not have created |
| `GET` | `/api/tasks/mine` | Agent | The agent's own tasks |
| `GET` | `/api/clients` | Logged in | Clients visible to the user |
| `GET` | `/api/clients/{id}` | Logged in | Client detail + visible projects |
| `PATCH` | `/api/clients/{id}` | Admin / client's manager | Update client details |
| `POST` | `/api/transcript` | **Admin** | AI: transcript → projects + tasks |

### Auth

#### `POST /api/auth/login`
```json
// request
{ "email": "admin@novaworks.example", "password": "Demo123!" }
// 200
{ "user": { "id": "ADMIN", "name": "Admin", "email": "admin@novaworks.example", "role": "ADMIN" } }
```
`400` if a field is missing · `401 { "error": "Invalid email or password" }` (same message for an unknown email and a wrong password).

#### `POST /api/auth/logout`
`200 { "ok": true }`. Deletes the cookie.

#### `GET /api/auth/me`
`200 { "user": CurrentUser }` · `401`.

### Team

#### `GET /api/users`
Array of `User`: `{ id, name, email, role, specialization, skills[] }`. Never includes password hashes.

#### `GET /api/users/{id}`
```json
{
  "user": { "id": "DEV02", "name": "Hamza Shah", "role": "AGENT", "...": "..." },
  "projects": [],                 // projects this person manages (managers only)
  "tasks": [ /* MyTask[] */ ],    // tasks assigned to this person (agents only)
  "limited": true                 // part of this person's work is hidden from the viewer
}
```
Filtered by the **viewer**: admin sees all of the person's work, a manager sees only work in their own projects, an agent sees only their own tasks. `404` if the user doesn't exist.

### Projects

#### `GET /api/projects`
```json
[
  {
    "id": "cmux…", "name": "UrbanCart Website",
    "clientName": "UrbanCart Clothing", "clientId": "cmux…",
    "description": "Responsive website … Excludes real payment gateway and inventory integration.",
    "deadline": "2026-10-20",
    "manager": { "id": "PM01", "name": "Ayesha Khan" },
    "taskCount": 4, "totalHours": 40
  }
]
```
For agents, `taskCount` and `totalHours` count only their own tasks.

#### `GET /api/projects/{id}`
`Project` plus `tasks[]`:
```json
{ "...Project": "...", "tasks": [
  { "id": "…", "projectId": "…", "title": "Product catalog UI", "description": "…",
    "deadline": "2026-10-12", "estimatedHours": 12, "assignee": { "id": "DEV01", "name": "Ali Raza" } }
] }
```
Agents receive only their own tasks. `403` if the project is outside the user's access, `404` if it doesn't exist.

### Correcting AI results (projects and tasks)

If the AI extracts something wrongly, the **admin** or the **manager of that project** can fix it. Agents get `403`. Every endpoint below returns the updated `ProjectDetail`, so the UI just swaps it in. The same rules as the AI conversion apply:
- The task owner must be an **AGENT**; a new manager must be a **MANAGER** (admin only).
- Hours must be more than 0, dates must be valid `YYYY-MM-DD`, and **task deadline ≤ project deadline**.
- A project deadline can't move before its latest task deadline.
- Unknown fields are rejected.

#### `PATCH /api/projects/{id}`
```json
// request (any subset)
{ "name": "UrbanCart Website", "description": "Updated scope", "deadline": "2026-10-21", "managerId": "PM02" }
// 400
{ "error": "Please fix the following and save again.",
  "issues": ["Project deadline 2026-10-15 is before a task deadline (2026-10-19). Move the task first."] }
```
`403` for agents, other managers, or a manager trying to change `managerId`.

#### `POST /api/projects/{id}/tasks` → `201`
```json
{ "title": "Accessibility review", "description": "Check contrast and keyboard navigation",
  "assigneeId": "DEV01", "deadline": "2026-10-18", "estimatedHours": 3 }
```

#### `PATCH /api/tasks/{id}`
Any subset of the task fields above. Example: `{ "estimatedHours": 12, "deadline": "2026-10-23" }`.
```json
// 400
{ "error": "Please fix the following and save again.",
  "issues": ["Task deadline 2026-10-25 is after the project deadline 2026-10-20."] }
```

#### `DELETE /api/tasks/{id}`
Removes the task and returns the updated project. `404` if it was already deleted.

### Tasks

#### `GET /api/tasks/mine`
Agent only (`403` for others). Array of `Task` plus `project: { id, name, clientName, manager }`, ordered by deadline.

### Clients (CRM)

#### `GET /api/clients`
```json
[
  {
    "id": "cmux…", "name": "UrbanCart Clothing",
    "industry": "Fashion retail", "contactName": "Sana Iqbal",
    "contactEmail": "sana@urbancart.example", "contactPhone": "+92 300 1234567",
    "website": "urbancart.example", "notes": "…",
    "projectCount": 1, "taskCount": 4, "totalHours": 40, "nextDeadline": "2026-10-20",
    "managers": [{ "id": "PM01", "name": "Ayesha Khan" }],
    "canEdit": true, "updatedAt": "2026-10-07T07:12:00.000Z"
  }
]
```
Stats cover only what the user can see. `notes` is always `""` for agents.

#### `GET /api/clients/{id}`
`Client` plus `projects[]` (visible projects). `403` / `404`.

#### `PATCH /api/clients/{id}`
All fields optional: `name` (admin only), `industry`, `contactName`, `contactEmail`, `contactPhone`, `website`, `notes`.
```json
// request
{ "contactName": "Sana Iqbal", "contactEmail": "sana@urbancart.example" }
// 400
{ "error": "Please fix the following and save again.",
  "issues": ["Contact email is not a valid email address"] }
```
Rules: valid email or empty · phone may contain only digits, spaces and `+ ( ) - .` · unknown fields rejected · rename must not clash with another client (case-insensitive). A rename is copied to all of the client's projects in the same transaction. `403` for agents, other managers, or a manager trying to rename.

### Transcript (AI)

#### `POST /api/transcript`
Admin only. Body: `{ "transcript": "<meeting text, max 50,000 characters>" }`. Typical duration **10–25 s**.

```json
// 201
{
  "runId": "cmux…",
  "model": "openai/gpt-oss-120b",
  "projects": [ /* Project[] */ ],
  "taskCount": 12
}
// 400: required information missing, nothing saved
{
  "error": "Some required information could not be resolved. Please correct the transcript and try again. Nothing was saved.",
  "issues": [
    "Client Portal for BrightBank: project manager could not be identified.",
    "Client Portal for BrightBank / Login page: task owner could not be identified."
  ]
}
// 502: AI busy
{ "error": "The AI service is busy (rate limit reached). Please wait about a minute and try again." }
```

What happens on the server:
1. Load the directory of managers and agents: id, name, role, specialization, skills. **No emails or passwords are sent to the AI.**
2. Call Groq `openai/gpt-oss-120b` (temperature 0, JSON mode). On a rate limit, wait as instructed and retry. On failure or malformed JSON, retry with fallback `openai/gpt-oss-20b`.
3. Check the JSON shape (zod), then the business rules: manager is a MANAGER, assignee is an AGENT, hours > 0, valid dates, task deadline ≤ project deadline.
4. Invalid → `400` with `issues`, **nothing saved**.
5. Valid → in **one transaction**: find or create each client (case-insensitive), create projects and tasks, record a `TranscriptRun`.

---

## 5. Data shapes (TypeScript)

The single source of truth is [`src/types/index.ts`](../src/types/index.ts):

```ts
type Role = "ADMIN" | "MANAGER" | "AGENT";
type PersonRef = { id: string; name: string };
type CurrentUser = { id; name; email; role: Role };
type UserDTO = { id; name; email; role; specialization; skills: string[] };
type ProjectDTO = { id; name; clientName; clientId: string | null; description; deadline; manager: PersonRef; taskCount; totalHours };
type TaskDTO = { id; projectId; title; description; deadline; estimatedHours; assignee: PersonRef };
type ProjectDetailDTO = ProjectDTO & { tasks: TaskDTO[]; canEdit: boolean };
type TaskInput = { title; description; assigneeId; deadline; estimatedHours };          // POST / PATCH (subset) tasks
type ProjectUpdateInput = Partial<{ name; description; deadline; managerId }>;          // PATCH project
type MyTaskDTO = TaskDTO & { project: { id; name; clientName; manager: PersonRef } };
type TeamMemberDTO = { user: UserDTO; projects: ProjectDTO[]; tasks: MyTaskDTO[]; limited: boolean };
type ClientDTO = { id; name; industry; contactName; contactEmail; contactPhone; website; notes;
                   projectCount; taskCount; totalHours; nextDeadline: string | null; managers: PersonRef[]; canEdit; updatedAt };
type ClientDetailDTO = ClientDTO & { projects: ProjectDTO[] };
type TranscriptResultDTO = { runId; model; projects: ProjectDTO[]; taskCount };
type ApiError = { error: string; issues?: string[] };
```

Dates are `YYYY-MM-DD` strings. Hours are numbers.
