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
| Frontend pages + components | ⬜ Not started |
| Database | ✅ **Shared Aiven Postgres**, migrated + seeded (10 users). Both of us use it (see **Note for Suleman**) |
| AI models | `openai/gpt-oss-120b` primary, `openai/gpt-oss-20b` fallback (Llama 3.3 is no longer on our Groq account) |
| Groq API key in `.env` | ✅ Added |
| README, deployment, demo video | ⬜ Not started |

**Legend:** `[x]` done · `[~]` written but not run/tested · `[ ]` to do

---

## 📨 Note for Suleman: We Both Use Aiven

We now use **one shared Aiven cloud database** for development and the demo, so we both see the same data. Docker is no longer needed.

The Aiven database is **already migrated and seeded** (10 demo users, 0 projects). You do **not** need to run migrate or seed.

1. Ali sends you the Aiven connection string **privately**. Copy it as text, not from a screenshot, and delete the chat message after saving.
2. Put it in your `.env` as `DATABASE_URL="postgres://avnadmin:...@pg-...aivencloud.com:16751/defaultdb?sslmode=require"`
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

## Ownership (avoid merge conflicts)

| Area | Owner | Files / folders |
|---|---|---|
| Project setup, schema, seed | **Ali** | `prisma/`, `src/lib/db.ts`, `src/lib/env.ts`, `src/lib/errors.ts`, `src/lib/http.ts`, `src/lib/format.ts`, `package.json` |
| Auth + sessions | **Ali** | `src/modules/auth/*`, `src/app/api/auth/*` |
| Role-based data API | **Ali** | `src/modules/{users,projects,tasks}/*`, `src/app/api/{users,projects,tasks}/*` |
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

---

## Malik Muhammad Suleman Saleh — Frontend + Integration

> The backend is already written, so **no mock data is needed**. Build directly against the real API once the database is seeded. Import all types from `@/types`.
> Note: the default `src/app/page.tsx` was removed; the home page needs to be created.

### Phase 1 · Layout + Login
- [ ] Pull `main`, create `frontend` branch
- [ ] `src/lib/api-client.ts`: `api<T>(path, { method, body })` that throws an error with `status` and `issues[]`
- [ ] App shell (`src/app/(dashboard)/layout.tsx`): calls `/api/auth/me`, redirects to `/login` on `401`; navbar with name, role badge, role-based links, logout
- [ ] `/login` page: email + password, error message on bad login, redirect by role; show demo accounts list for convenience

### Phase 2 · Core Screens
- [ ] `/` home: admin/manager → project cards; agent → redirect to `/my-tasks`
- [ ] **Project cards**: name, client, manager, deadline, task count, total hours; admin sees **Create from Transcript** button
- [ ] **Project detail** `/projects/[id]`: client, manager, deadline, description, task table (title, description, assignee, deadline, hours); `403` → "You don't have access" message
- [ ] **Team directory** `/team`: read-only list of names, roles, specializations, skills

### Phase 3 · Transcript + Agent Screens
- [ ] `/transcript` page (admin only): large textarea + **Create from Transcript** button
  - [ ] Disable button + spinner while processing (can take 5–20 s)
  - [ ] Success: created projects + task counts, link to each
  - [ ] Error: show `error` + `issues[]` list, keep the transcript so admin can fix and retry
- [ ] **Agent "My Tasks"** `/my-tasks`: tasks grouped by project (project name + manager visible)
- [ ] Empty states ("No projects yet. Create from a transcript")

### Phase 4 · Integration Testing
- [ ] Test as Admin, Ayesha (only UrbanCart), Ali (3 tasks), Hamza (2 tasks across 2 projects)
- [ ] Refresh check: data persists
- [ ] Logout works; visiting a page after logout → login

### Phase 5 · Submission
- [ ] Fill `README.md` from template (commands, env vars, accounts, test steps, links, limitations)
- [x] `.env.example`: `DATABASE_URL`, `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_FALLBACK_MODEL`, `SESSION_SECRET`
- [x] Save transcript as `docs/transcript.txt` for judges

---

## Together

| Step | Task |
|---|---|
| Now | Ali: backend done and tested · Suleman: put the Aiven string in `.env`, run `npm run dev`, start pages |
| After push | Suleman builds against the live local API |
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
