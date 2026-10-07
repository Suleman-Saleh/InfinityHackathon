# Team Task Division

**Team:** Muhammad Ali (Backend + AI) · Malik Muhammad Suleman Saleh (Frontend + Integration)
**Stack:** Next.js (App Router) · Prisma · PostgreSQL (Aiven) · Groq · Vercel
**Build time:** 3 hours

---

## Ownership (avoid merge conflicts)

| Area | Owner | Files / folders |
|---|---|---|
| Project setup, schema, seed | **Ali** | `prisma/`, `lib/db.ts`, `package.json` |
| Auth + sessions | **Ali** | `lib/auth.ts`, `app/api/auth/*` |
| Role-based data API | **Ali** | `app/api/projects/*`, `app/api/tasks/*`, `app/api/users/*` |
| AI transcript conversion | **Ali** | `lib/ai.ts`, `lib/validate.ts`, `app/api/transcript/*` |
| Pages + UI components | **Suleman** | `app/(pages)/*`, `components/*` |
| Styling | **Suleman** | `app/globals.css`, Tailwind config |
| README, `.env.example`, demo video | **Suleman** | `README.md`, `.env.example` |
| Deployment | **Both** | Vercel + Aiven |

**Git rule:** each person works on their own branch (`backend`, `frontend`), commits small, and merges into `main` at the checkpoints below. Don't edit the other person's files without telling them.

---

## API Contract (agree on this first, then work in parallel)

Suleman can build every screen against this contract using mock data, then switch to the real API.

| Method | Route | Access | Response |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | `{ user }` + sets session cookie · `401 { error }` |
| `POST` | `/api/auth/logout` | Logged in | `{ ok: true }` |
| `GET` | `/api/auth/me` | Logged in | `{ user }` · `401` |
| `GET` | `/api/users` | Logged in | `User[]` (no passwords) |
| `GET` | `/api/projects` | Logged in | `Project[]` filtered by role |
| `GET` | `/api/projects/:id` | Logged in | `Project & { tasks: Task[] }` · `403` / `404` |
| `GET` | `/api/tasks/mine` | Agent | `(Task & { project })[]` |
| `POST` | `/api/transcript` | Admin | `201 { projects, taskCount }` · `400 { error, issues[] }` · `403` |

**Shapes**
```ts
User    { id, name, email, role: "ADMIN"|"MANAGER"|"AGENT", specialization, skills: string[] }
Project { id, name, clientName, description, deadline, manager: { id, name } , taskCount, totalHours }
Task    { id, projectId, title, description, deadline, estimatedHours, assignee: { id, name } }
```

---

## Muhammad Ali — Backend + AI

### Phase 1 · Setup (0:00 – 0:20)
- [ ] `npx create-next-app` (TypeScript, Tailwind, App Router), push to `main`
- [ ] Install `prisma`, `@prisma/client`, `bcryptjs`, `jose` (JWT), `zod`
- [ ] Create Aiven Postgres, put `DATABASE_URL` in `.env`
- [ ] Write Prisma schema: `User`, `Project`, `Task` (+ `Role` enum)
- [ ] `npx prisma migrate dev`
- [ ] **Checkpoint:** push so Suleman can pull the skeleton

### Phase 2 · Seed + Auth (0:20 – 0:45)
- [ ] `prisma/seed.ts`: upsert 10 users by email (IDs `ADMIN`, `PM01–PM03`, `DEV01–DEV06`), bcrypt hash `Demo123!`
- [ ] Verify re-running seed creates no duplicates
- [ ] `lib/auth.ts`: sign/verify JWT in httpOnly cookie, `getCurrentUser()` from cookie only
- [ ] Login / logout / me routes

### Phase 3 · Role-based API (0:45 – 1:05)
- [ ] `GET /api/users`
- [ ] `GET /api/projects` — ADMIN all · MANAGER `managerId = me` · AGENT projects containing my tasks
- [ ] `GET /api/projects/:id` — `403` if not in my project list; AGENT receives only own tasks
- [ ] `GET /api/tasks/mine`
- [ ] **Checkpoint:** merge `backend` → `main`, tell Suleman API is live

### Phase 4 · AI Transcript (1:05 – 1:50)
- [ ] `lib/ai.ts`: call Groq (`https://api.groq.com/openai/v1`) with transcript + directory (id, name, role, skills — **no passwords**), request JSON output
- [ ] Prompt rules: use **final** decisions, ignore rejected features, only existing IDs, never invent people, dates `YYYY-MM-DD` in 2026
- [ ] Backup Groq model (`GROQ_FALLBACK_MODEL`) if the first fails / rate-limits
- [ ] `lib/validate.ts` (zod): required fields, manager is MANAGER, assignee is AGENT, hours > 0, task deadline ≤ project deadline
- [ ] `POST /api/transcript`: admin-only, reject empty, validate, save in **one `prisma.$transaction`**, return summary or `issues[]`
- [ ] **Checkpoint:** merge → `main`

### Phase 5 · Testing (1:50 – 2:20)
- [ ] Supplied transcript → 3 projects, 12 tasks, hours 40 / 46 / 38
- [ ] Changed-input test: QuickServe integration 12 h, 23 Oct → only that task changes
- [ ] No Kamran, no payment / inventory / maps / email tasks
- [ ] Direct access check: Ali calling another project's `/api/projects/:id` → `403`
- [ ] Add a `npm run reset` script that deletes projects/tasks but keeps users

---

## Malik Muhammad Suleman Saleh — Frontend + Integration

### Phase 1 · Layout + Login (0:00 – 0:30)
- [ ] Pull skeleton once Ali pushes; create `frontend` branch
- [ ] App shell: navbar with user name, role badge, logout button
- [ ] `/login` page: email + password, error message on bad login, redirect by role
- [ ] `lib/mock.ts` with sample data matching the API contract

### Phase 2 · Core Screens (0:30 – 1:10)
- [ ] `/` home — redirects per role
- [ ] **Admin dashboard** — project cards (name, client, manager, deadline, task count, hours) + **Create from Transcript** button
- [ ] **Project detail** `/projects/[id]` — client, manager, deadline, description, task table (title, description, assignee, deadline, hours)
- [ ] **Team directory** `/team` — read-only list of names, roles, specializations
- [ ] **Manager home** — same cards, only their projects

### Phase 3 · Transcript + Agent Screens (1:10 – 1:50)
- [ ] `/transcript` page (admin only): large textarea, **Create** button
  - [ ] Disable button + spinner while processing
  - [ ] Success: show created projects + task counts, link to each
  - [ ] Error: show message + `issues[]` list, keep transcript so admin can fix and retry
- [ ] **Agent "My Tasks"** `/my-tasks` — task cards grouped by project (project name + manager visible)
- [ ] Empty states ("No projects yet — create from transcript")

### Phase 4 · Integration (1:50 – 2:20)
- [ ] Replace mock data with real API calls
- [ ] Handle `401` → redirect to login, `403` → "Not allowed" page
- [ ] Test as Admin, Ayesha (only UrbanCart), Ali (3 tasks), Hamza (2 tasks across 2 projects)
- [ ] Refresh check — data persists

### Phase 5 · Submission (2:20 – 2:45)
- [ ] Fill `README.md` from template (commands, env vars, accounts, test steps, links, limitations)
- [ ] `.env.example`: `DATABASE_URL`, `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_FALLBACK_MODEL`, `SESSION_SECRET`
- [ ] Save transcript as `docs/transcript.txt` for judges

---

## Together

| Time | Task |
|---|---|
| 0:00 – 0:05 | Read this file, agree on API contract |
| 1:05 | Sync: Suleman starts using real API |
| 2:20 – 2:45 | Deploy: Vercel project, env vars, `prisma migrate deploy`, seed hosted DB, test live |
| 2:45 – 3:00 | Record demo video, rehearse demo, final push |

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
