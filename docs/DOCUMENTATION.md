# NovaWorks AI Project Manager: Documentation

**Team Dual Byte** (Muhammad Ali · Malik Muhammad Suleman Saleh) · The Infinity Hack '26

| | |
|---|---|
| Live app | https://infinity-hackathon.vercel.app |
| API docs (Swagger) | https://infinity-hackathon.vercel.app/api-docs · [docs/API.md](API.md) |
| Repository | https://github.com/Suleman-Saleh/InfinityHackathon |
| Related docs | [PROBLEM_AND_SOLUTION.md](PROBLEM_AND_SOLUTION.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [TEAM_TASKS.md](TEAM_TASKS.md) · [README](../README.md) |

---

## Contents
1. [Overview](#1-overview)
2. [User guide](#2-user-guide)
3. [Screens](#3-screens)
4. [How the AI conversion works](#4-how-the-ai-conversion-works)
5. [Access control](#5-access-control)
6. [Architecture](#6-architecture)
7. [Data model](#7-data-model)
8. [Code structure](#8-code-structure)
9. [Setup and commands](#9-setup-and-commands)
10. [Configuration](#10-configuration)
11. [Deployment](#11-deployment)
12. [Testing and verification](#12-testing-and-verification)
13. [Security](#13-security)
14. [Troubleshooting](#14-troubleshooting)
15. [Limitations and future work](#15-limitations-and-future-work)

---

## 1. Overview

NovaWorks Technologies plans client work in meetings. Turning a meeting into projects and tasks by hand is slow and error-prone, because decisions change during the meeting: deadlines move, estimates are revised, owners are swapped, features are rejected.

**This app automates that step.** The administrator pastes the meeting transcript and clicks **Create from Transcript**. The AI then:
- extracts the **projects**, their **client**, **manager** and **deadline**,
- extracts the **tasks**, each with an **owner**, **deadline** and **estimated hours**,
- uses only the **final** decisions, skips **rejected features**, and assigns work **only to existing employees**.

The app validates the result and saves everything in one transaction, or nothing at all. Each person then logs in and sees only their own work. A **Clients** section adds CRM features: client contacts, notes and each client's projects.

**Core flow**

```
Login → Paste meeting → AI extracts projects & tasks → Validate → Save (all-or-nothing) → Role-based views
```

---

## 2. User guide

### Accounts
Ten fictional demo accounts, all with password **`Demo123!`**. There is no signup or password reset; the accounts are created by the seed script.

| Role | Name | Email |
|---|---|---|
| Admin | Admin | admin@novaworks.example |
| Manager | Ayesha Khan (Web PM) | ayesha@novaworks.example |
| Manager | Bilal Ahmed (Mobile PM) | bilal@novaworks.example |
| Manager | Hina Malik (AI PM) | hina@novaworks.example |
| Agent | Ali Raza (Full-Stack) | ali@novaworks.example |
| Agent | Hamza Shah (Full-Stack) | hamza@novaworks.example |
| Agent | Sara Noor (App Developer) | sara@novaworks.example |
| Agent | Usman Tariq (App Developer) | usman@novaworks.example |
| Agent | Zain Abbas (AI Developer) | zain@novaworks.example |
| Agent | Maryam Asif (AI Developer) | maryam@novaworks.example |

### Administrator
1. Log in as `admin@novaworks.example`. The **Dashboard** shows every project with totals.
2. Click **Create from Transcript**.
3. Paste a transcript, or click **Load supplied meeting transcript**.
4. Click **Create from Transcript**. The button is disabled while the AI works (10–25 s).
5. **Success:** you see each created project with its manager, deadline, task count and hours, with links to open them.
   **Problem:** you see a list of what couldn't be resolved, for example *"project manager could not be identified"*. Nothing is saved. Fix the transcript and try again.
6. If the AI got something wrong, open the project: **Edit project** (name, deadline, description, manager), **Edit** on any task (title, description, owner, deadline, hours, or **Delete task**), or **Add task** for anything it missed. The same rules as the AI conversion are checked before saving.
7. Use **Clients** to add contact details and notes for each client, and **Team Directory** to see everyone's work.

### Manager (e.g. Ayesha)
- **My Projects** shows only the projects you manage. Open one to see all of its tasks.
- You can correct your own projects: **Edit project** (name, deadline, description, not the manager), **Edit** / **Delete** any task, and **Add task**.
- **Clients** shows the clients of your projects. You can **Edit details** (contact, industry, notes) but not rename.
- **Team Directory** shows everyone's profile. Opening a person shows only their work in your projects.

### Agent (e.g. Ali)
- **My Tasks** shows only your own tasks, grouped by project, with the project manager.
- Opening a project shows the project's details and **only your tasks** in it.
- **Clients** shows the clients of projects you work on: contact details (read-only), without internal notes.
- Opening any project or client you aren't part of shows *"You don't have access"*.

---

## 3. Screens

| Route | Who | What it shows |
|---|---|---|
| `/login` | Everyone | Email + password sign-in |
| `/` | Admin, Manager | Admin: **Dashboard** (all projects + totals + Create button). Manager: **My Projects**. Agents are redirected to `/my-tasks`. |
| `/transcript` | Admin | Transcript box, sample loader, progress, success summary or issues list, and the team directory sent to the AI |
| `/projects/[id]` | Anyone with access | Client (links to client page), manager, deadline, description, task table (title, description, assignee, deadline, hours). Admin and the project's manager also get **Edit project**, **Add task** and **Edit** per task (with delete) |
| `/my-tasks` | Agent | The agent's tasks grouped by project |
| `/team` | Everyone | Read-only directory: names, roles, specializations, skills, with role filters |
| `/team/[id]` | Everyone | A person's profile plus their projects/tasks, **limited to what the viewer may see** |
| `/clients` | Everyone (filtered) | Client cards: industry, contact person, managers, projects, hours, next deadline, with search |
| `/clients/[id]` | Anyone with access | Contact card, stats, the client's projects, **Edit details** (admin / client's manager) |
| `/api-docs` | Everyone | Interactive API documentation (Swagger UI) |

Every dashboard page checks the session on the server and redirects to `/login` if needed. The API checks again on every request.

---

## 4. How the AI conversion works

```mermaid
flowchart TD
    A[Admin pastes transcript] --> B{Admin? Non-empty? ≤ 50k chars?}
    B -- no --> X1[400 / 403]
    B -- yes --> C[Load team directory<br/>id, name, role, skills<br/>no emails / passwords]
    C --> D[Groq gpt-oss-120b<br/>temperature 0, JSON mode]
    D -- rate limit / error / bad JSON --> E[Wait if told, retry<br/>fallback gpt-oss-20b]
    E --> F
    D --> F[Shape check: zod]
    F --> G[Business rules]
    G -- issues --> X2[400 + issues list<br/>nothing saved<br/>run logged as INVALID]
    G -- ok --> H[One DB transaction:<br/>find/create clients,<br/>create projects + tasks,<br/>log TranscriptRun]
    H --> I[201: projects + task count]
```

### Prompt rules ([transcript.prompt.ts](../src/modules/transcript/transcript.prompt.ts))
1. Use only **final** decisions; a later change or the final recap overrides earlier values.
2. No tasks for **rejected, excluded, postponed or future** features.
3. Assign people only by matching names to the **team directory**: `managerId` must be a MANAGER, `assigneeId` an AGENT.
4. **Never invent employees.** Clients, contacts and end users (e.g. *Kamran*) get nothing.
5. Keep separately agreed tasks separate, even with the same owner.
6. `estimatedHours` is developer effort, not calendar days.
7. Dates are `YYYY-MM-DD`; the meeting year is used if missing.
8. If a required value is genuinely missing, return `null`. **Don't guess.**

### Validation ([transcript.validate.ts](../src/modules/transcript/transcript.validate.ts))
The AI output is treated as untrusted. Every project needs a name, client, an existing **MANAGER** and a valid deadline. Every task needs a title, an existing **AGENT**, hours > 0, and a valid deadline **on or before** the project deadline. Each failure becomes a readable issue for the admin.

### Results on the supplied transcript
| Project | Manager | Deadline | Tasks | Hours |
|---|---|---|---|---|
| UrbanCart Website | Ayesha Khan | 2026-10-20 | 4 | 40 |
| QuickServe Mobile App | Bilal Ahmed | 2026-10-24 | 4 | 46 |
| HelpDeskPro AI Assistant | Hina Malik | 2026-10-22 | 4 | 38 |

All 12 tasks match the organizer answer key, including the trap cases:
- the deadline moved from 18 to 20 Oct
- integration moved from 17 to 19 Oct
- the estimate changed from 8 h to 10 h
- the tester changed from Zain to Maryam
- Kamran gets nothing
- there are no payment, maps, inventory or email tasks

Both Groq models score 12/12. `npm run ai:test` re-checks this at any time.

---

## 5. Access control

The current user always comes from the **signed session cookie**, never from the request. All "who can see what" rules live in **policy** files and are applied inside the **database queries**, so a new endpoint can't leak data by accident.

| Policy | ADMIN | MANAGER | AGENT |
|---|---|---|---|
| `projectFilterFor` | all | `managerId = me` | projects with a task assigned to me |
| `taskFilterFor` (one project) | all tasks | all tasks | `assigneeId = me` |
| `taskVisibilityFor` (team member page) | all | tasks in my projects | my tasks |
| `clientFilterFor` | all | clients of my projects | clients of projects with my tasks |
| `canEditProject` (project + its tasks) | ✅ (+ change manager) | ✅ if I manage it | ❌ |
| `canEditClient` | ✅ (+ rename) | ✅ if I manage one of its projects | ❌ |
| Transcript | ✅ | ❌ | ❌ |

Agents never receive client `notes` (blanked in the API). Opening a project or client outside your access returns **403**; an unknown ID returns **404**.

---

## 6. Architecture

A **modular monolith**: one Next.js app (pages + API routes) and one PostgreSQL database, split into modules and layers so parts can be replaced or extracted later. Full design and scaling roadmap: [ARCHITECTURE.md](ARCHITECTURE.md).

```mermaid
flowchart LR
    B[Browser<br/>React pages] -->|HTTPS + session cookie| R[API routes<br/>thin]
    subgraph Next.js app on Vercel
      R --> S[Services<br/>business logic]
      S --> P[Policies<br/>access rules]
      S --> RP[Repositories<br/>Prisma queries]
      S --> AI[AIProvider<br/>Groq + fallback]
    end
    RP --> DB[(Aiven PostgreSQL)]
    AI --> G[Groq API]
```

| Layer | Responsibility |
|---|---|
| Pages / components | UI only; call the API through `src/lib/api-client.ts` |
| API routes | Parse request → call service → JSON; wrapped by `withHandler()` for consistent errors |
| Session | JWT cookie (`jose`), `requireUser(...roles)` |
| Services | Business logic (list projects, create from transcript, update client) |
| Policies | Role-based filters, one place |
| Repositories | Prisma queries |
| AI provider | Interface + Groq implementation with retries and fallback |

### Tech stack
| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript), React 19 |
| Styling | Tailwind CSS 4, own small component set + inline icons |
| Database | PostgreSQL on Aiven (free plan) |
| ORM | Prisma 6.19 |
| Validation | zod 4 (env vars, AI output, client updates) |
| Auth | bcryptjs password hashes + `jose` signed JWT in httpOnly cookie |
| AI | Groq: `openai/gpt-oss-120b`, fallback `openai/gpt-oss-20b` |
| Hosting | Vercel |
| API docs | OpenAPI 3 + Swagger UI |

---

## 7. Data model

```mermaid
erDiagram
    User ||--o{ Project : manages
    User ||--o{ Task : "assigned to"
    Client ||--o{ Project : has
    Project ||--o{ Task : contains
    User ||--o{ TranscriptRun : submitted
    TranscriptRun ||--o{ Project : created
```

| Table | Key fields | Notes |
|---|---|---|
| **User** | `id` (ADMIN, PM01–PM03, DEV01–DEV06), `email` (unique), `passwordHash`, `role`, `specialization`, `skills[]` | Seeded; IDs match the AI's references directly |
| **Client** | `name` (unique), `industry`, `contactName`, `contactEmail`, `contactPhone`, `website`, `notes` | Created automatically from transcripts, edited in the UI |
| **Project** | `name`, `clientName`, `clientId`, `description`, `managerId`, `deadline` (date), `transcriptRunId` | Index on `managerId`, `clientId` |
| **Task** | `projectId`, `title`, `description`, `assigneeId`, `deadline` (date), `estimatedHours` | Index on `projectId`, `assigneeId`; cascade-deleted with its project |
| **TranscriptRun** | `createdById`, `transcript`, `aiOutput` (JSON), `model`, `status` (SUCCESS / INVALID / FAILED), `issues[]` | Audit log of every conversion attempt |

Schema: [prisma/schema.prisma](../prisma/schema.prisma) · migrations: [prisma/migrations](../prisma/migrations).

---

## 8. Code structure

```
src/
├── app/
│   ├── (auth)/login/               login page
│   ├── (dashboard)/                logged-in pages (sidebar layout, server-side session check)
│   │   ├── page.tsx                dashboard / my projects
│   │   ├── transcript/             create from transcript (admin)
│   │   ├── projects/[id]/          project detail
│   │   ├── my-tasks/               agent tasks
│   │   ├── team/ · team/[id]/      team directory + member detail
│   │   └── clients/ · clients/[id]/ CRM pages
│   ├── api/                        REST endpoints (see docs/API.md)
│   └── api-docs/                   Swagger UI page
├── modules/                        business logic, one folder per domain
│   ├── auth/        session.ts, auth.service.ts
│   ├── users/       user.repo.ts, user.service.ts
│   ├── projects/    project.repo/service/policy.ts
│   ├── tasks/       task.repo/service/policy.ts
│   ├── clients/     client.repo/service/policy.ts
│   └── transcript/  transcript.prompt/schema/validate/service.ts
├── lib/
│   ├── ai/          provider.ts (interface), groq.ts, index.ts (retries + fallback)
│   ├── db.ts · env.ts · errors.ts · http.ts · format.ts · api-client.ts · dates.ts
├── components/      Sidebar, ProjectCard, TaskTable, ui.tsx, icons.tsx
└── types/index.ts   API contract shared by backend and frontend
prisma/              schema, migrations, seed.ts, demo-users.ts, reset.ts
scripts/test-ai.ts   AI accuracy check against the answer key
public/              openapi.yaml, sample-transcript.txt
docs/                project documentation
```

---

## 9. Setup and commands

**Requirements:** Node.js ≥ 20.9, npm, a PostgreSQL database (Aiven or local), a Groq API key. See [requirements.txt](../requirements.txt).

```sh
git clone https://github.com/Suleman-Saleh/InfinityHackathon.git
cd InfinityHackathon
npm install                 # also runs prisma generate
cp .env.example .env        # fill in the values (section 10)
npm run db:deploy           # create tables
npm run db:seed             # 10 demo users (safe to re-run)
npm run dev                 # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run db:migrate` | Create + apply a new migration (schema changes, development) |
| `npm run db:deploy` | Apply existing migrations (production / shared DB) |
| `npm run db:seed` | Upsert the 10 demo users |
| `npm run db:reset` | ⚠️ Delete all projects, tasks, clients, transcript runs; **keeps users** |
| `npm run ai:test [file]` | Run a transcript through the AI and compare with the answer key (no DB) |
| `npm run typecheck` · `npm run lint` | TypeScript / ESLint |
| `npx prisma studio` | Browse the database in the browser |

**Local database without Aiven (optional):**
```sh
docker run -d --name novaworks-db -e POSTGRES_USER=novaworks -e POSTGRES_PASSWORD=novaworks \
  -e POSTGRES_DB=novaworks -p 5434:5432 postgres:16-alpine
# DATABASE_URL="postgresql://novaworks:novaworks@localhost:5434/novaworks?schema=public"
```

---

## 10. Configuration

All variables are server-only (no `NEXT_PUBLIC_*`), validated by `src/lib/env.ts`. Never commit `.env`.

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | `postgres://avnadmin:…@pg-….aivencloud.com:16751/defaultdb?sslmode=require&connection_limit=3` |
| `GROQ_API_KEY` | Groq credential | `gsk_…` |
| `GROQ_MODEL` | Primary model | `openai/gpt-oss-120b` |
| `GROQ_FALLBACK_MODEL` | Fallback model | `openai/gpt-oss-20b` |
| `SESSION_SECRET` | Signs session cookies (≥ 16 chars) | `openssl rand -hex 32` |

**`connection_limit`:** Aiven's free plan has very few connection slots. Use `&connection_limit=3` locally and `&connection_limit=1` on Vercel (serverless). Otherwise you get *"remaining connection slots are reserved"*.

---

## 11. Deployment

| | |
|---|---|
| App (pages + API) | Vercel, project `infinity-hackathon`, branch `main`, auto-deploys on push |
| Database | Aiven PostgreSQL (free), SSL required |
| AI | Groq API (called from the server only) |

Steps:
1. Import the GitHub repo into Vercel (preset Next.js; `npm run build` runs `prisma generate && next build`).
2. Set the 5 environment variables (section 10) for Production and Preview, `DATABASE_URL` with `&connection_limit=1`.
3. Apply migrations and seed against Aiven once: `npm run db:deploy && npm run db:seed`.
4. Deploy. The transcript route allows up to 60 s (`maxDuration = 60`); live runs take about 22 s.

**Before judging:** `npm run db:reset` (agreed by both team members) so judges see the transcript create the projects live.

---

## 12. Testing and verification

| Check | How | Result |
|---|---|---|
| AI accuracy | `npm run ai:test` | 12/12 tasks match the answer key (both models) |
| Changed-input test | QuickServe integration → 12 h, 23 Oct | Only that task changes; QuickServe 48 h (local + live) |
| Missing information | Transcript with no manager / deadline / valid owner | `400` with 4 specific issues, **nothing saved** |
| Login | All 10 accounts, wrong password, no session | `200` / `401` / `401` |
| Role visibility | Admin, Ayesha, Bilal, Hina, Ali, Hamza | Each sees exactly their projects / tasks |
| Direct access | Other projects / clients by ID | `403` · unknown ID `404` |
| Client edits | Agent / other manager / manager rename / bad email / unknown field | `403` / `403` / `403` / `400` / `400` |
| Project / task corrections | Agent / other manager / manager reassigning a project | `403` / `403` / `403` |
| Correction rules | Owner is a manager / hours 0 / task after project deadline / invalid date / unknown field / project deadline before a task | all `400` with a specific issue |
| Corrections saved | Fix a task, add a task, edit project, admin changes manager, delete a task | `200` / `201`; totals update; agent's My Tasks reflects the change |
| Notes privacy | Agent fetches client | `notes: ""` |
| Persistence | Refresh, new session | Data remains |
| Build | `npm run typecheck && npm run lint && npm run build` | Pass |

---

## 13. Security

- Passwords hashed with **bcrypt**; never returned by the API and **never sent to the AI**.
- Session: **signed JWT** in an **httpOnly, Secure, SameSite=Lax** cookie, 8-hour expiry; the user is never taken from the request body.
- Access rules applied **in database queries**, not just hidden in the UI.
- **AI output is untrusted**: shape + business validation before any write; all-or-nothing transaction.
- Input limits: transcript ≤ 50,000 characters; client fields length- and format-checked; unknown fields rejected.
- Secrets only in server environment variables; `.env` is git-ignored; `.env.example` has placeholders.
- Unexpected errors return a generic message; details are only logged on the server.

---

## 14. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `remaining connection slots are reserved` | Aiven free plan connection limit | Add `&connection_limit=3` (local) / `=1` (Vercel); stop unused dev servers / Prisma Studio |
| "The AI service is busy (rate limit reached)" | Groq free-tier tokens-per-minute limit | Wait about a minute; the app already retries + uses the fallback model |
| `model_not_found` from Groq | Model retired on the account | Set `GROQ_MODEL` to a model listed by `GET https://api.groq.com/openai/v1/models` |
| Projects appear twice | Transcript created twice | `npm run db:reset` (tell your teammate first) |
| `Invalid environment configuration` | Missing / short env var | Check `.env` against `.env.example`; `SESSION_SECRET` ≥ 16 chars |
| Type errors about `Client` after pulling | Prisma client not regenerated | `npx prisma generate` (or `npm install`) |
| Redirected to `/login` | Session expired (8 h) or logged out | Log in again |

---

## 15. Limitations and future work

**Current limitations**
- Corrections happen after saving: the admin or the project's manager edits, adds or deletes tasks and fixes project details (there is no draft review step before the first save).
- Running the same transcript twice creates the projects twice (clients are reused).
- Free tiers: Groq rate limits (about 1 transcript per minute on the primary model) and Aiven connection limits.
- No signup, password reset, user management, cost tracking or progress tracking (out of scope by design).

**Next steps**
- Review the AI draft before the first save (corrections after saving already work).
- Task status (to do / in progress / done) and deadline reminders.
- Duplicate-meeting detection.
- Audio upload → speech-to-text → same pipeline.
- Background job queue for AI calls; multi-company support (`organizationId`). See the scaling roadmap in [ARCHITECTURE.md](ARCHITECTURE.md).
