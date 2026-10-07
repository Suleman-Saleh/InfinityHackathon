# Team Task Division

**Team:** Muhammad Ali (Backend + AI) · Malik Muhammad Suleman Saleh (Frontend + Integration)
**Stack:** Next.js 16 (App Router) · Prisma 6 · PostgreSQL (Aiven) · Groq · Vercel
**Build time:** 3 hours · **Architecture:** see [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Current Status

| Area | Status |
|---|---|
| Project setup (Next.js, Tailwind, `.gitignore`, `.env.example`) | ✅ Done |
| Dependencies install | ✅ Done (Prisma pinned to 6.19.3) |
| Database schema, seed, reset scripts | ✅ Migrated + seeded on Aiven, seed re-run creates no duplicates |
| Auth, role-based API | ✅ **Tested end-to-end** (login, 401/403/404, per-role project + task visibility) |
| AI transcript conversion | ✅ **Tested with Groq: 12/12 tasks match the answer key**, changed-input test passes, rate-limit retry + fallback works |
| Shared API types (`src/types/index.ts`) | ✅ Done |
| Root layout + global styles | ✅ Done |
| Frontend pages + components | ✅ All 6 pages built on `frontend` branch (login, dashboard, project detail, transcript, my tasks, team); end-to-end role test passed, merged to `main` |
| **Clients (CRM)** | ✅ Client records with contact details, client list + detail pages, edit form, role-based access (`frontend` branch, see **Clients (CRM) feature**) |
| Database | ✅ **Shared Aiven Postgres**, migrated + seeded (10 users). Both of us use it (see **Note for Suleman**) |
| AI models | `openai/gpt-oss-120b` primary, `openai/gpt-oss-20b` fallback (Llama 3.3 is no longer on our Groq account) |
| Groq API key in `.env` | ✅ Added |
| README, deployment, demo video | ⬜ Not started |

**Legend:** `[x]` done · `[~]` written but not run/tested · `[ ]` to do

---

## 💬 Message from Ali to Suleman

Hi Suleman, great work on the frontend: I reviewed it (type-check, lint, production build, page access for every role) and it all passes. Here's what changed on my side and what I need from you:

**What I added**
1. **Clients (CRM) feature**: `/clients` list + `/clients/[id]` detail with contact person, email, phone, website, notes, an **Edit details** form, and a **Clients** link in the sidebar. Details in the **Clients (CRM) feature** section below.
2. **Database migration `add_clients`** is already applied on Aiven. Your 6 test projects were automatically linked to 3 clients.
3. **Login page:** I removed the demo accounts list (cleaner for judges). The accounts must therefore be listed in the **README**.
4. **Aiven connection fix:** the free plan ran out of connection slots, so `DATABASE_URL` now ends with `&connection_limit=3`.

**What I need from you**
- [ ] `git pull`, then `npm install` (runs `prisma generate` so the new `Client` type exists)
- [ ] Add `&connection_limit=3` to the end of `DATABASE_URL` in your `.env`, otherwise your dev server blocks mine
- [ ] Stop dev servers / Prisma Studio you're not using (each one holds database connections)
- [ ] Reply OK so we can run `npm run db:reset` together. It clears your 6 duplicate projects + test clients. I'll run it, you don't need to.
- [ ] README: include the **10 demo accounts table** (login page no longer shows them), the **Clients** feature, and `connection_limit` in the env-var notes
- [ ] Have a quick look at the Clients pages and tell me if anything looks off with your design

**What I'm doing next:** reset the DB (after your OK) → deploy to Vercel (`connection_limit=1` there) → live test → send you the live URL for the README.

---

## 📨 Note for Suleman: We Both Use Aiven

We now use **one shared Aiven cloud database** for development and the demo, so we both see the same data. Docker is no longer needed.

The Aiven database is **already migrated and seeded** (10 demo users, 0 projects). You do **not** need to run migrate or seed.

1. Ali sends you the Aiven connection string **privately**. Copy it as text, not from a screenshot, and delete the chat message after saving.
2. Put it in your `.env` as `DATABASE_URL="postgres://avnadmin:...@pg-...aivencloud.com:16751/defaultdb?sslmode=require&connection_limit=3"`
   ⚠️ **Add `&connection_limit=3` at the end.** Aiven's free plan has very few connection slots; without the limit each dev server / Prisma Studio grabs ~20 and everyone gets `remaining connection slots are reserved`.
3. Never commit it or post it in group chats. `.env` is already in `.gitignore`.

**Rules for the shared database**
- ⚠️ **`npm run db:reset` deletes ALL projects and tasks for both of us.** Message the other person before running it.
- 🧪 Each "Create from Transcript" adds 3 more projects. Run `db:reset` (after telling each other) before creating again, so there are no duplicates.
- 🗂️ Schema changes (`prisma/schema.prisma`) are **Ali's only**. Ali runs `npx prisma migrate dev` and pushes the migration. You just `git pull` and run `npx prisma generate`.
- 🎬 Before the demo: reset once, so judges see the transcript create the projects live.
- 🛟 If Aiven is down: `docker start novaworks-db` (Ali's machine) and use the local URL commented in `.env`.

---

## Local Setup (for both)

```sh
git pull && npm install         # npm install also runs `prisma generate`
cp .env.example .env            # fill in DATABASE_URL (Aiven, from Ali), GROQ_API_KEY, SESSION_SECRET
npm run dev                     # http://localhost:3000

npm run db:reset                # ⚠️ deletes projects/tasks for everyone, tell the other person first
npm run ai:test                 # check AI against the answer key (doesn't touch the database)
```

Demo login: `admin@novaworks.example` / `Demo123!` (all 10 accounts in the README template).

---

## Clients (CRM) feature

Added by Ali on the `frontend` branch (migration `add_clients` is already applied on Aiven):

- **`Client` table**: name, industry, contact person, email, phone, website, notes. Each project links to its client.
- **AI transcript flow** finds or creates the client by name (case-insensitive), so re-running a transcript never duplicates clients.
- **`/clients`**: client cards with contact person, managers, project count, hours, next deadline, plus search.
- **`/clients/[id]`**: contact card (email / phone / website links), stats, the client's projects, **Edit details** form.
- **Access**: admin sees all clients; managers see clients they manage projects for; agents see clients of projects they have tasks in (stats only cover their own tasks). Admin and the client's manager can edit; only admin can rename.
- Project detail now links the client name to its client page.
- `npm run db:reset` also deletes clients.
- After pulling: run `npx prisma generate` (or `npm install`) to get the new `Client` type.

---

## Ownership (avoid merge conflicts)

| Area | Owner | Files / folders |
|---|---|---|
| Project setup, schema, seed | **Ali** | `prisma/`, `src/lib/db.ts`, `src/lib/env.ts`, `src/lib/errors.ts`, `src/lib/http.ts`, `src/lib/format.ts`, `package.json` |
| Auth + sessions | **Ali** | `src/modules/auth/*`, `src/app/api/auth/*` |
| Role-based data API | **Ali** | `src/modules/{users,projects,tasks,clients}/*`, `src/app/api/{users,projects,tasks,clients}/*` |
| AI transcript conversion | **Ali** | `src/lib/ai/*`, `src/modules/transcript/*`, `src/app/api/transcript/*` |
| Shared API types | **Ali** (done) | `src/types/index.ts` (frontend imports from here, don't redefine) |
| Pages + UI components | **Suleman** | `src/app/login/*`, `src/app/(dashboard)/*`, `src/components/*`, `src/lib/api-client.ts` |
| Styling | **Suleman** | `src/app/globals.css`, `src/app/layout.tsx` |
| README, demo video | **Suleman** | `README.md` |
| Deployment | **Both** | Vercel + Aiven |

**Git rule:** each person works on their own branch (`backend`, `frontend`), commits small, and merges into `main` at the checkpoints below. Don't edit the other person's files without telling them.

---

## API Contract (implemented)

All types live in `src/types/index.ts`. Every error response is `{ error: string, issues?: string[] }`.

| Method | Route | Access | Response |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | body `{ email, password }` → `{ user: CurrentUser }` + session cookie · `400` / `401` |
| `POST` | `/api/auth/logout` | Anyone | `{ ok: true }` |
| `GET` | `/api/auth/me` | Logged in | `{ user: CurrentUser }` · `401` |
| `GET` | `/api/users` | Logged in | `UserDTO[]` (no passwords) |
| `GET` | `/api/projects` | Logged in | `ProjectDTO[]` filtered by role (agents get their own task count/hours) |
| `GET` | `/api/projects/:id` | Logged in | `ProjectDetailDTO` (agents get only their own tasks) · `403` / `404` |
| `GET` | `/api/clients` | Logged in | `ClientDTO[]` filtered by role |
| `GET` | `/api/clients/:id` | Logged in | `ClientDetailDTO` (client + visible projects) · `403` / `404` |
| `PATCH` | `/api/clients/:id` | Admin / client's manager | contact fields (`name` admin only) → `ClientDetailDTO` · `400 { issues[] }` · `403` |
| `GET` | `/api/tasks/mine` | Agent | `MyTaskDTO[]` (task + project name, client, manager) · `403` for non-agents |
| `POST` | `/api/transcript` | Admin | body `{ transcript }` → `201 TranscriptResultDTO` · `400 { error, issues[] }` · `403` · `502` (AI unavailable) |

**Shapes**
```ts
CurrentUser       { id, name, email, role: "ADMIN" | "MANAGER" | "AGENT" }
UserDTO           { id, name, email, role, specialization, skills: string[] }
ProjectDTO        { id, name, clientName, description, deadline: "YYYY-MM-DD", manager: { id, name }, taskCount, totalHours }
TaskDTO           { id, projectId, title, description, deadline: "YYYY-MM-DD", estimatedHours, assignee: { id, name } }
ProjectDetailDTO  ProjectDTO & { tasks: TaskDTO[] }
MyTaskDTO         TaskDTO & { project: { id, name, clientName, manager: { id, name } } }
TranscriptResultDTO { runId, model, projects: ProjectDTO[], taskCount }
```

---

## Muhammad Ali — Backend + AI

### Phase 1 · Setup
- [x] Next.js 16 project (TypeScript, Tailwind, App Router, `src/`)
- [x] `.gitignore` (keeps `.env` out of git) and `.env.example`
- [x] Install `@prisma/client@6.19.3`, `prisma@6.19.3`, `bcryptjs`, `jose`, `zod`, `tsx`
- [x] Local Postgres in Docker for first tests (now replaced by Aiven)
- [x] Aiven Postgres: `migrate deploy` + `db:seed` done; app tested against Aiven
- [x] Share Aiven connection string privately with Suleman
- [x] Add Groq key to `.env` (`GROQ_API_KEY`) and a random `SESSION_SECRET`
- [x] Prisma schema: `User`, `Project`, `Task`, `TranscriptRun` (+ `Role`, `RunStatus` enums, indexes)
- [x] `npx prisma migrate dev --name init`
- [x] Add npm scripts: `db:migrate`, `db:deploy`, `db:seed`, `db:reset`, `typecheck`, `ai:test`
- [x] **Checkpoint:** commit + push so Suleman can pull

### Phase 2 · Seed + Auth
- [x] `prisma/seed.ts`: upsert 10 users by email (IDs `ADMIN`, `PM01–PM03`, `DEV01–DEV06`), bcrypt hash `Demo123!`
- [x] Verify re-running seed creates no duplicates
- [x] `src/modules/auth/session.ts`: JWT in httpOnly cookie, `getCurrentUser()` / `requireUser(...roles)`
- [x] `src/modules/auth/auth.service.ts`: login with bcrypt compare
- [x] Login / logout / me routes

### Phase 3 · Role-based API
- [x] `GET /api/users`
- [x] `GET /api/projects` (policy in `project.policy.ts`)
- [x] `GET /api/projects/:id`: `403` if not visible, agents get only own tasks (`task.policy.ts`)
- [x] `GET /api/tasks/mine`
- [x] **Checkpoint:** API is live on `main`

### Phase 4 · AI Transcript
- [x] `src/lib/ai/`: `AIProvider` interface, Groq implementation, retries on rate limit (waits as told), fallback model, retry on malformed output
- [x] `transcript.prompt.ts`: final decisions only, ignore rejected features, directory IDs only, never invent people
- [x] `transcript.schema.ts` (zod) + `transcript.validate.ts`: readable issues for missing manager/assignee, wrong role, bad dates, hours ≤ 0, task after project deadline
- [x] `transcript.service.ts`: admin-only, empty / too-long check, one `prisma.$transaction`, logs every run to `TranscriptRun`
- [x] `POST /api/transcript` (tested: 201 with 3 projects / 12 tasks; invalid transcript → 400 with issues, nothing saved)
- [x] **Checkpoint:** merged to `main`

### Phase 5 · Run + Test
- [x] `npx tsc --noEmit` passes
- [ ] `npm run build`
- [x] Seed database, log in via `curl` as each role
- [x] Supplied transcript → 3 projects, 12 tasks, hours 40 / 46 / 38 (`npm run ai:test`)
- [x] Changed-input test: QuickServe integration 12 h, 23 Oct → only that task changes
- [x] No Kamran, no payment / inventory / maps / email tasks
- [x] Direct access check: Ali / Ayesha calling QuickServe or HelpDeskPro → `403`; forged cookie → `401`
- [x] `prisma/reset.ts` deletes projects/tasks/runs but keeps users (needs npm script)

### Phase 6 · Review Frontend + Deploy
- [x] Pull the `frontend` branch, run it locally, check the pages call the API correctly (type-check, lint, page access per role)
- [x] Review / approve merge of `frontend` → `main` (merged by Suleman)
- [x] `npm run build` passes on `main` with the frontend included
- [x] Removed demo accounts list from the login page
- [x] **Clients (CRM)**: `Client` table + migration (applied on Aiven), API, `/clients` + `/clients/[id]` pages, edit form, tested per role
- [x] Fix Aiven connection limit locally (`&connection_limit=3`)
- [ ] Vercel: import the GitHub repo, set env vars (`DATABASE_URL` with `&connection_limit=1`, `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_FALLBACK_MODEL`, `SESSION_SECRET`), deploy `main`
- [ ] Check the transcript route finishes within Vercel's time limit (`maxDuration = 60`); if it times out, switch the primary model to the faster fallback
- [ ] Live test: login as each role, run the supplied transcript, then the changed-input test (QuickServe integration 12 h, 23 Oct)
- [ ] Send Suleman the live URL for the README
- [ ] Before judging: agree with Suleman, run `npm run db:reset` so judges see projects created live

---

## Malik Muhammad Suleman Saleh — Frontend + Integration

> Built on the `frontend` branch directly against the real API. All types come from `@/types`.
> Auth checks for navigation run in server layouts/pages via `getCurrentUser()`; the API still enforces every rule.

### Phase 1 · Layout + Login
- [x] Pull `main`, create `frontend` branch
- [x] `src/lib/api-client.ts`: `api<T>(path, { method, body })` throws `ApiRequestError` with `status` and `issues[]`; `401` → back to `/login`
- [x] App shell (`src/app/(dashboard)/layout.tsx` + `src/components/Sidebar.tsx`): redirects to `/login` when logged out; sidebar with name, role badge, role-based links, logout (collapses to a top menu on mobile)
- [x] `/login` page: email + password, show/hide password, error on bad login, redirect by role; click-to-fill demo accounts list

### Phase 2 · Core Screens
- [x] `/` home: admin → "Dashboard", manager → "My Projects" (project cards + totals); agent → redirect to `/my-tasks`
- [x] **Project cards** (`src/components/ProjectCard.tsx`): name, client, manager, deadline, task count, total hours; admin sees **Create from Transcript** button
- [x] **Project detail** `/projects/[id]`: client, manager, deadline, description, task table (`src/components/TaskTable.tsx`); `403` → "You don't have access", `404` → "Project not found"; agents see only their own tasks
- [x] **Team directory** `/team`: 9 employees with role, specialization, skills; All / Managers / Agents filter

### Phase 3 · Transcript + Agent Screens
- [x] `/transcript` page (admin only): large textarea + **Create from Transcript** button, "Load supplied meeting transcript" button (`public/sample-transcript.txt`), team directory panel
  - [x] Disable button + spinner + elapsed timer while processing
  - [x] Success: created projects + task counts + hours, link to each
  - [x] Error: show `error` + `issues[]` list, keep the transcript so admin can fix and retry
  - [x] Warning when projects already exist (creating again adds more)
- [x] **Agent "My Tasks"** `/my-tasks`: tasks grouped by project, sorted by deadline (project name + manager visible)
- [x] Empty states ("No projects yet", "No tasks assigned yet")
- [x] Inter font + indigo / teal / amber role styling

### Phase 4 · Integration Testing
- [x] `tsc --noEmit` and `eslint src` pass
- [x] Page access per role: logged out → `/login`; manager blocked from `/transcript`; agent sent to `/my-tasks`; admin blocked from `/my-tasks`
- [x] Run supplied transcript (same request as the UI button): `201` in ~12 s, 3 projects / 12 tasks, hours 40 / 46 / 38, **12/12 tasks match the answer key**
- [x] Test as Admin, Ayesha (only UrbanCart), Ali (3 tasks, only his own visible), Hamza (2 tasks across UrbanCart + QuickServe); other projects → `403`; non-admins → `403` on `/api/transcript`
- [x] Refresh check: data persists (new session sees the same projects/tasks)
- [x] Logout works; visiting a page after logout → `/login`
- [x] Merge `frontend` → `main`
- [ ] ⚠️ Shared DB has **6 projects**: we both ran the transcript at the same time. Agree, then `npm run db:reset`
- [~] ⚠️ Aiven hit **"too many database connections"** during testing (free plan limit). Fixed locally with `&connection_limit=3` (Ali). **Suleman: add it to your `.env` too.** On Vercel use `&connection_limit=1`

### Phase 5 · Submission
- [ ] Fill `README.md` from template (commands, env vars, accounts, test steps, links, limitations). Include the **demo accounts table** (removed from the login page) and the **Clients** feature
- [x] `.env.example`: `DATABASE_URL`, `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_FALLBACK_MODEL`, `SESSION_SECRET`
- [x] Save transcript as `docs/transcript.txt` for judges

---

## Together

| Step | Task |
|---|---|
| Now | Frontend merged + reviewed · Clients (CRM) added · Suleman: pull, add `connection_limit=3`, OK the reset, README · Ali: `db:reset` (after OK), deploy |
| After merge | `db:reset` (agreed), README, Vercel deploy |
| Deploy | Vercel project + env vars (Aiven already migrated + seeded), `db:reset` before demo, test live |
| Final | Record demo video, rehearse demo, final push |

### Demo script (both should know it)
1. Show seed / no signup → 2. Admin login, paste transcript, create → 3. Open UrbanCart → 4. Ayesha sees only UrbanCart → 5. Ali sees 3 tasks, blocked from others → 6. Hamza sees 2 tasks across projects → 7. Refresh → 8. Modified transcript

### Each person must be able to explain
- **Ali → Suleman:** schema, how session/role check works, prompt, validation, transaction
- **Suleman → Ali:** page flow, how screens call the API, deployment setup

---

## Priority if time runs short
1. **Must:** login · transcript → saved records · role-based API · project + task screens
2. **Should:** loading/error states · team directory · deployment
3. **Skip:** editing tasks, charts, extra polish
