# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TaskClearers is a recruitment platform with a public landing page and an admin panel for managing job applications. Built with Next.js 14, SQLite (via Drizzle ORM), and Tailwind CSS.

## Development Commands

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run lint             # Run ESLint

# Database
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run migrations
npm run db:push          # Push schema changes (dev only)
npm run db:studio        # Open Drizzle Studio GUI

# Seed scripts
npm run seed:admin       # Create admin user
npm run seed:jobs        # Migrate job data to DB
npm run seed:templates   # Seed email templates
npm run migrate:permissions  # Migrate user permissions
```

## Architecture

### Core Stack
- **Next.js 14** with App Router (not static export - uses server actions and API routes)
- **SQLite** with Drizzle ORM (`./data/taskclearers.db`)
- **Authentication**: Magic link login via JWT tokens (stored in `session` cookie)
- **Email**: Resend for admin notifications, Microsoft Graph API for applicant communication

### Directory Structure

```
app/
├── page.tsx                    # Public landing page
├── careers/                    # Public job listings
│   ├── positions.ts            # Static job data (legacy, DB is primary)
│   ├── [id]/                   # Dynamic job detail pages
│   └── general-application/    # General application page
├── admin/                      # Protected admin panel
│   ├── login/                  # Magic link login
│   ├── applications/           # Application management (list + Kanban)
│   └── jobs/                   # Job CRUD
└── api/
    ├── auth/                   # Login, logout, verify endpoints
    ├── applications/           # Public application submission
    ├── jobs/                   # Public job listing API
    ├── files/                  # Resume file serving
    └── admin/                  # Protected admin APIs

lib/
├── db/
│   ├── index.ts               # Database connection
│   └── schema.ts              # Drizzle schema (all tables + types)
├── auth/
│   ├── index.ts               # Auth utilities (magic link, JWT, session)
│   ├── middleware.ts          # Route protection helpers
│   └── rate-limit.ts          # Login rate limiting
├── email/
│   ├── index.ts               # Resend integration
│   ├── microsoft-graph.ts     # O365 email sending/syncing
│   └── templates.ts           # Template rendering
└── upload/
    └── index.ts               # File upload handling

components/
├── ui/                        # Reusable primitives (Button, Section, etc.)
├── features/                  # Public site components
└── admin/                     # Admin panel components
    ├── ApplicationsClient.tsx # Main applications view
    ├── KanbanBoard.tsx        # Drag-and-drop status management
    ├── EmailComposeModal.tsx  # Email composition with templates
    └── ResumeViewer.tsx       # Resume display
```

### Database Schema

Key tables in `lib/db/schema.ts`:
- `adminUsers`, `sessions`, `magicLinkTokens` - Authentication (users have JSON `permissions` field)
- `jobs` - Job postings (title, department, requirements JSON, isActive)
- `applications` - Applications (status: new/reviewing/interviewed/offered/rejected/hired)
- `applicationNotes` - Internal notes on applications
- `emailTemplates`, `sentEmails`, `receivedEmails` - Email tracking
- `analyticsEvents` - Page/job views, application events

### Authentication Flow

1. User enters email at `/admin/login`
2. If email domain matches `ADMIN_EMAIL_DOMAIN`, magic link is sent via Resend
3. Link contains token verified at `/api/auth/verify`
4. JWT session created and stored in `session` cookie
5. Middleware (`middleware.ts`) protects all `/admin/*` routes except `/admin/login`

### Route Permissions

Middleware enforces route-based permissions (defined in `ROUTE_PERMISSIONS` in `middleware.ts`):
- `/admin` - requires `view_dashboard`
- `/admin/applications` - requires `view_applications`
- `/admin/jobs` - requires `view_jobs`
- `/admin/users` - requires `manage_users`

Users without required permissions are redirected to `/admin/no-access`.

### Application Status Flow

Applications move through: `new` → `reviewing` → `interviewed` → `offered` → `hired` or `rejected`

Status changes can trigger suggested email templates (configured via `triggerStatus` in `emailTemplates` table).

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `DATABASE_PATH` - SQLite file location
- `JWT_SECRET` - Required in production (32+ chars)
- `ADMIN_EMAIL_DOMAIN` - Allowed domain for admin logins
- `RESEND_API_KEY` - For magic link emails
- `AZURE_*` - Microsoft Graph for applicant emails
- `NEXT_PUBLIC_BASE_URL` - For magic link URLs

## Common Patterns

**Client Components**: Components with interactivity use `"use client"` directive.

**Server Actions**: Used for form submissions and mutations in admin panel.

**File Uploads**: Resumes stored in `./data/uploads/` and served via `/api/files/[...path]`.

**Email Templates**: Support placeholders like `{{firstName}}`, `{{jobTitle}}`, `{{companyName}}`.

## API Structure

- **Public APIs** (`/api/applications`, `/api/jobs`): No auth required
- **Admin APIs** (`/api/admin/*`): Require valid session cookie, checked via `requireAuth()` from `lib/auth/middleware.ts`
- **File serving** (`/api/files/[...path]`): Serves uploaded resumes from `./data/uploads/`

<!-- BACKLOG.MD MCP GUIDELINES START -->

<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for all task and project management activities.

**CRITICAL GUIDANCE**

- If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
- If your client only supports tools or the above request fails, call `backlog.get_workflow_overview()` tool to load the tool-oriented overview (it lists the matching guide tools).

- **First time working here?** Read the overview resource IMMEDIATELY to learn the workflow
- **Already familiar?** You should have the overview cached ("## Backlog.md Overview (MCP)")
- **When to read it**: BEFORE creating tasks, or when you're unsure whether to track work

These guides cover:
- Decision framework for when to create tasks
- Search-first workflow to avoid duplicates
- Links to detailed guides for task creation, execution, and completion
- MCP tools reference

You MUST read the overview resource to understand the complete workflow. The information is NOT summarized here.

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->
