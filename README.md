# NovaWorks AI Project Manager - AI Meeting to Project CRM

A simple project management CRM for NovaWorks Technologies. The administrator pastes a meeting transcript, and AI creates the projects and tasks, assigns the right managers and developers, and sets deadlines and estimated hours. Each user then logs in and sees only the work they are allowed to see.

Built for **The Infinity Hack '26**.

## Team
- Team name: **Dual Byte**
- Two members and responsibilities:
  - **Muhammad Ali**: backend, database, authentication, role-based API, AI transcript conversion, Clients (CRM) feature
  - **Malik Muhammad Suleman Saleh**: frontend pages and components, UI/UX, team member detail page, integration testing, README
- Repository: https://github.com/Suleman-Saleh/InfinityHackathon

## What Works
- **Seeded login**: 10 demo accounts (1 admin, 3 managers, 6 agents), passwords hashed with bcrypt. No signup, password reset or user management.
- **Create from Transcript (admin only)**: paste a meeting transcript (or click *Load supplied meeting transcript*), click **Create from Transcript**, and AI creates the projects and tasks. The button is disabled with a spinner while processing, and a summary of created projects is shown afterwards.
  - Follows the **final** decisions (e.g. UrbanCart deadline 20 Oct, not 18), ignores rejected features (payments, inventory, maps, email) and never invents employees (e.g. Kamran is ignored).
  - The AI output is checked on the server before anything is saved: managers and agents must exist with the right role, dates must be valid, hours must be positive, and task deadlines must fall on or before the project deadline.
  - If anything can't be resolved, a clear list of issues is shown, **nothing is saved**, and the transcript stays in the box so the admin can correct it and try again.
  - Valid results are saved in **one database transaction** (all-or-nothing).
- **Role-based access, enforced on the server** (not just hidden in the UI):
  - **Admin**: all projects, clients, and the transcript page.
  - **Manager**: only the projects they manage (and those projects' clients).
  - **Agent**: only their own tasks, plus the related project name and manager. Other agents' tasks are never returned.
  - Opening someone else's project directly by URL shows *"You don't have access"* (`403`).
- **Screens**: login, dashboard with project cards and totals, project detail with task table, Create from Transcript, My Tasks (agents), Team Directory (read-only) with a detail page per person, Clients.
- **Team member detail**: click anyone in the Team Directory to see what they are working on (an agent's tasks, or the projects a manager runs), with tasks, hours and next deadline. It only shows work the viewer is already allowed to see: the admin sees everything, a manager sees an agent's tasks only in the manager's own projects, and an agent sees no other agent's tasks.
- **Clients (CRM)**: client list with search, and a client detail page with contact person, email, phone, website, notes and the client's projects. Clients are created automatically from the transcript (matched by name, so re-running never duplicates them). The admin and the client's project manager can edit details; only the admin can rename.
- **Saved records**: everything is stored in PostgreSQL and remains after a refresh.

## Technology Stack
- Frontend: Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript
- Backend: Next.js API routes (Node.js ≥ 20.9), Prisma ORM 6.19, zod validation
- Database: PostgreSQL on Aiven (free plan)
- AI: Groq API, `openai/gpt-oss-120b` with `openai/gpt-oss-20b` as automatic fallback (JSON output, retries on rate limits)
- Authentication/session: email + password checked against a bcrypt hash; on success the server sets a signed JWT in an httpOnly cookie (`jose`). Every API request reads the current user from that cookie only, never from a role or ID sent by the browser.

## Links
- Live application: **https://infinity-hackathon.vercel.app** (log in with any demo account below)
- Demo video: Live demo at the link above
- API docs (Swagger UI): https://infinity-hackathon.vercel.app/api-docs
- Documentation: [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md) (complete app docs) · [`docs/API.md`](docs/API.md) (API reference)

## Requirements
- Node.js 20.9 or newer, npm
- A PostgreSQL database (we use Aiven; any PostgreSQL 14+ works)
- A Groq API key (free at https://console.groq.com)

## Run Locally
1. Clone this repository and enter its directory:
   ```sh
   git clone https://github.com/Suleman-Saleh/InfinityHackathon.git
   cd InfinityHackathon
   ```
2. Install dependencies (this also runs `prisma generate`):
   ```sh
   npm install
   ```
3. Copy the example environment file:
   ```sh
   cp .env.example .env
   ```
4. Fill in `.env` with your own values (see **Environment Variables** below).
5. Create the database tables:
   ```sh
   npm run db:deploy
   ```
6. Seed the ten demo users (safe to re-run, it never duplicates users):
   ```sh
   npm run db:seed
   ```
7. Start the app:
   ```sh
   npm run dev
   ```
   Open http://localhost:3000. Keep this terminal running.

Other useful commands:
| Command | What it does |
| --- | --- |
| `npm run db:reset` | Deletes all projects, tasks, clients and transcript runs. **Keeps the users.** Use it to repeat the demo from a clean state. |
| `npm run ai:test` | Runs the supplied transcript through the AI and compares the result with the answer key (does not touch the database) |
| `npm run typecheck` | TypeScript check |
| `npm run build` / `npm start` | Production build and server |

## Environment Variables
| Variable | Purpose | Where configured |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. On Aiven's free plan, end it with `&connection_limit=3` locally (`&connection_limit=1` on Vercel) so the app doesn't run out of database connections. | Server (`.env` / Vercel) |
| `GROQ_API_KEY` | Groq API key | Server only |
| `GROQ_MODEL` | Primary AI model (`openai/gpt-oss-120b`) | Server |
| `GROQ_FALLBACK_MODEL` | Model used if the primary fails or is rate-limited (`openai/gpt-oss-20b`) | Server |
| `SESSION_SECRET` | Long random string used to sign the login cookie | Server only |

`.env.example` contains placeholders only. Real keys and database passwords are never committed, and no secret is exposed to the browser (no `NEXT_PUBLIC_*` variables).

## Demo Login Accounts
These emails are fictional identifiers, not mailboxes. Signup, email verification and forgot password are not needed. The accounts are created by `npm run db:seed` (already done on the live database).

| Role | Name | Demo email | Password |
| --- | --- | --- | --- |
| Admin | Admin | admin@novaworks.example | Demo123! |
| Manager | Ayesha Khan (Web PM) | ayesha@novaworks.example | Demo123! |
| Manager | Bilal Ahmed (Mobile PM) | bilal@novaworks.example | Demo123! |
| Manager | Hina Malik (AI PM) | hina@novaworks.example | Demo123! |
| Agent | Ali Raza (Full-Stack) | ali@novaworks.example | Demo123! |
| Agent | Hamza Shah (Full-Stack) | hamza@novaworks.example | Demo123! |
| Agent | Sara Noor (App Developer) | sara@novaworks.example | Demo123! |
| Agent | Usman Tariq (App Developer) | usman@novaworks.example | Demo123! |
| Agent | Zain Abbas (AI Developer) | zain@novaworks.example | Demo123! |
| Agent | Maryam Asif (AI Developer) | maryam@novaworks.example | Demo123! |

## How Judges Can Test
1. Log in as **admin** and open **Create from Transcript**.
2. Click **Load supplied meeting transcript** (the same text is in [`docs/transcript.txt`](docs/transcript.txt)), or paste your own.
3. Click **Create from Transcript**. Expect **3 projects and 12 tasks** after about 10–20 seconds:

   | Project | Manager | Deadline | Tasks | Hours |
   | --- | --- | --- | --- | --- |
   | UrbanCart Website | Ayesha Khan | 20 Oct 2026 | 4 | 40 |
   | QuickServe Mobile App | Bilal Ahmed | 24 Oct 2026 | 4 | 46 |
   | HelpDeskPro AI Assistant | Hina Malik | 22 Oct 2026 | 4 | 38 |

4. Open **UrbanCart Website**: client UrbanCart Clothing, manager Ayesha, deadline 20 October 2026, four tasks (Website integration and testing is due 19 October).
5. Log out and log in as **Ayesha**: only UrbanCart appears.
6. Log in as **Ali**: only his three UrbanCart tasks appear (26 hours).
7. Log in as **Hamza**: his two API tasks span UrbanCart and QuickServe.
8. Check direct access: as admin, copy a QuickServe project URL; as Ali, open it. You'll see *"You don't have access to this project"*. The API returns `403` for the same request.
9. Refresh any page: the data is still there.
10. Changed input: load the transcript, change Usman's final QuickServe integration estimate to **12 hours, 23 October**, and create again. On the live site this adds a **new set of 3 projects** next to the existing ones (there is no reset button for judges). Open the new **QuickServe Mobile App** and check *Mobile integration and testing* is **12 hours, due 23 October** (QuickServe total **48 hours**); every other task is unchanged.

**Resetting between tests (local runs only):** `npm run db:reset` removes generated projects, tasks, clients and transcript runs but keeps the ten seeded users. Creating from the same transcript twice without a reset adds a second copy of the projects (clients are reused).

## Deployment Details
- Deployment status: **Live**
- Frontend and backend host: Vercel (one Next.js app serves both the pages and the API routes), https://infinity-hackathon.vercel.app
- Database: Aiven PostgreSQL (free plan), SSL required
- Deployed branch/commit: `main`, auto-deployed by Vercel on every push (live-tested at `07acc36`; includes the team member page from `db41d51`)
- Verified on the live site (7 Oct 2026):
  - All 10 demo accounts log in; wrong password → `401`; session cookie is `Secure` + `HttpOnly`
  - Supplied transcript → 3 projects / 12 tasks / 40 · 46 · 38 hours
  - Changed-input test (QuickServe integration 12 h, 23 Oct) → only that task changes, QuickServe 48 h; finished in ~22 s
  - Ayesha sees only UrbanCart; Ali sees only his 3 tasks; Hamza sees his 2 tasks across UrbanCart + QuickServe; every other project / client → `403`; non-admins → `403` on the transcript API

### How We Deployed
1. Imported the GitHub repository into Vercel (framework preset: Next.js). Build command `npm run build` (runs `prisma generate && next build`), default output.
2. No separate backend: the API routes are deployed with the app as serverless functions. The transcript route allows up to 60 seconds for the AI call.
3. Created a free Aiven PostgreSQL service and copied its connection string (`sslmode=require`).
4. Set these environment variables in Vercel (values not shown): `DATABASE_URL` (with `&connection_limit=1`), `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_FALLBACK_MODEL`, `SESSION_SECRET`.
5. Ran `npm run db:deploy` and `npm run db:seed` against the Aiven database.
6. No cross-origin setup is needed: the pages and the API share the same domain.
7. Judges can open the live URL and log in with any demo account above. Transcript creation calls Groq from the server.

## Known Limitations
- **AI rate limits**: Groq's free tier can rate-limit. The app retries and falls back to a second model; if both are busy, it shows "The AI service is busy (rate limit reached). Please wait about a minute and try again." and saves nothing.
- **Processing time**: creating from a transcript takes about 10–25 seconds (about 22 s on the live site).
- **Database connections**: Aiven's free plan allows few connections, so the app keeps its connection pool small (`connection_limit`).
- **Duplicates**: running the same transcript twice creates the projects twice. Use `npm run db:reset` between demo runs.
- **No editing of projects or tasks**: created projects and tasks are read-only (editing was optional in the brief). Client details can be edited.
- Out of scope by design: signup, password reset, user management, cost calculation, progress tracking and charts.

## Submission Summary
- Source repository: https://github.com/Suleman-Saleh/InfinityHackathon
- Live link: https://infinity-hackathon.vercel.app · Demo video: live demo at the link above
- Setup and seed commands: documented above
- Demo login accounts: confirmed working
- Features completed: seeded login, role-based access, AI transcript → projects and tasks with validation and all-or-nothing save, project/task screens, My Tasks, Team Directory with team member detail, Clients (CRM)
