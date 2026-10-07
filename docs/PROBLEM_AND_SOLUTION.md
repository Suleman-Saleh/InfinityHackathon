# AI Project Manager: Meeting to Execution

**The Infinity Hack '26** | Team: Muhammad Ali, Malik Muhammad Suleman Saleh

---

## 1. Problem Identification

### Background
NovaWorks Technologies (Lahore) builds websites, mobile apps, and AI tools for clients. The team has 1 administrator, 3 project managers, and 6 developers. Client work is planned in meetings, where the team agrees on projects, owners, deadlines, and effort estimates.

### The Problem
After every planning meeting, someone has to turn the discussion into projects and tasks by hand. This is:

- **Slow:** one meeting produced 3 projects and 12 tasks, each with an owner, deadline, and estimate.
- **Error-prone:** meetings change decisions along the way, so it is easy to save an earlier value instead of the final one:
  - The UrbanCart deadline moved from 18 to 20 October.
  - The QuickServe integration estimate went from 8 to 10 hours.
  - HelpDeskPro testing moved from Zain to Maryam.
- **Noisy:** meetings also mention features that were rejected (payments, inventory, maps, email) and people who are not employees (Kamran, a client contact). A careless record would include them.
- **Not visible to the team:** once tasks are written down, each person needs to see their own work, and nobody should see work that isn't theirs.

### Core Pain Points
| # | Pain point | Impact |
|---|---|---|
| 1 | Manual data entry after meetings | Wasted manager time and delayed project start |
| 2 | Changed decisions get recorded wrongly | Wrong deadlines, owners, or estimates |
| 3 | Rejected scope sneaks into the plan | Developers work on features the client never agreed to |
| 4 | No role-based view of work | Managers and developers can't quickly find their own projects and tasks |
| 5 | Partial or inconsistent records | Half-saved plans are worse than none |

### Who Is Affected
- **Administrator:** turns meetings into plans for the whole company.
- **Project managers:** need to see only their own projects and the tasks in them.
- **Developers (agents):** need a clear list of their own tasks, with deadlines and estimates.

---

## 2. Proposed Solution

### Overview
A simple **project management CRM with AI transcript conversion**. The administrator pastes the meeting transcript, clicks **Create from Transcript**, and the system creates the projects and tasks, assigns them to the right people, checks the result, and saves it. Each user then logs in and sees only the work they are allowed to see.

```
Login  →  Paste meeting transcript  →  AI extracts projects & tasks  →  Validate  →  Save  →  Role-based views
```

### Key Features
| Feature | Description |
|---|---|
| **Simple login** | 10 seeded demo accounts (admin, managers, agents). No signup needed. Passwords are hashed. |
| **Create from Transcript** | The admin pastes the meeting. AI returns structured projects and tasks using the existing team directory. |
| **Smart extraction** | The AI keeps final decisions over earlier ones, ignores rejected features, and never invents employees. |
| **Validation before save** | Checks that managers and agents exist with the right role, dates are valid, hours are positive, and task deadlines fall on or before the project deadline. |
| **All-or-nothing save** | Everything is saved in a single database transaction, so a failure never leaves half a plan. |
| **Clear feedback** | Loading state, the button is disabled while processing, a success summary, or an understandable error the admin can fix and retry. |
| **Role-based access** | Admin sees all projects. A manager sees only their projects. An agent sees only their own tasks. This is enforced on the server, not just hidden in the UI. |
| **Project and task screens** | Project cards, a project detail page (client, manager, deadline), and task rows (title, description, assignee, deadline, hours). |
| **Team directory** | Read-only list of employees and their specializations. |
| **Saved data** | Records are stored in a database and are still there after a refresh. |

### How It Works
1. **Directory as context:** the AI receives the transcript plus the team directory (IDs, names, roles, skills). Passwords are never sent.
2. **Structured output:** the AI returns JSON in a fixed shape: `projects[]`, each containing `tasks[]`, with references like `PM01` and `DEV01`.
3. **Validation:** the server checks every field. Any problem is shown to the admin and nothing is saved.
4. **Transaction:** valid results are saved together. The app, not the AI, generates the project and task IDs.
5. **Access control:** every request identifies the user from the login session, never from a role or ID the client sends.

### Data Model
- **User:** name, email, passwordHash, role (ADMIN / MANAGER / AGENT), specialization, skills
- **Project:** name, clientName, description, managerId → User (MANAGER), deadline
- **Task:** projectId → Project, title, description, assigneeId → User (AGENT), deadline, estimatedHours

### Technology Stack
| Layer | Choice |
|---|---|
| Frontend + backend | Next.js (React + API routes) |
| Database | PostgreSQL (Aiven, hosted) via Prisma ORM |
| AI | Groq API (Llama 3.3 70B, JSON mode, with a backup Groq model) |
| Auth | Session cookie / JWT. Passwords hashed with bcrypt |
| Deployment | Vercel + Aiven Postgres |

### Expected Result (supplied transcript)
| Project | Manager | Deadline | Tasks | Hours |
|---|---|---|---|---|
| UrbanCart Website | Ayesha Khan | 2026-10-20 | 4 | 40 |
| QuickServe Mobile App | Bilal Ahmed | 2026-10-24 | 4 | 46 |
| HelpDeskPro AI Assistant | Hina Malik | 2026-10-22 | 4 | 38 |

### Why This Solution Is Useful
- **Saves time:** a whole meeting becomes a plan in seconds, not a long manual entry session.
- **Accurate:** the AI follows the final decisions, and server-side checks catch bad output before anything is saved.
- **Safe:** all-or-nothing saving and server-side role checks keep data consistent and private.
- **Simple:** every user sees only what matters to them.

### Out of Scope (by design)
Signup, password reset, user management, cost calculation, progress tracking, and charts.

### Future Improvements
- Edit or approve the AI draft before saving
- Upload meeting audio and transcribe it automatically
- Task status updates and progress tracking
- Notifications to assignees when tasks are created
- Workload balancing suggestions based on each developer's hours
