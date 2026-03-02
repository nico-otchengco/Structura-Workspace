# Multi-Tenant Project Management App

A project management app I built to practice full-stack development with React, Supabase, and Hono. It supports multiple organizations, Kanban boards, team collaboration, and role-based access — basically a lightweight Trello-style tool with multi-tenant support.

## What's it built with?

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4
- **Backend:** Hono running on Supabase Edge Functions (Deno)
- **Auth & Storage:** Supabase
- **Drag & Drop:** react-dnd
- **UI:** Radix UI primitives + Lucide icons

## What can it do?

- Create and manage multiple organizations
- Invite team members and assign them roles
- Create Kanban boards with To Do / In Progress / Done columns
- Drag and drop tasks between columns
- Edit and delete tasks
- View board analytics (completion rate, priority breakdown)
- Track activity logs per organization

## Roles & Permissions

There are four roles. Here's what each one can do:

| Action | Owner | Project Manager | Member | Client |
|--------|:-----:|:---------------:|:------:|:------:|
| Delete board | ✅ | ✅ | ❌ | ❌ |
| Add/remove members | ✅ | ✅ | ❌ | ❌ |
| Create board | ✅ | ✅ | ✅ | ❌ |
| Create/edit tasks | ✅ | ✅ | ✅ | ❌ |
| View everything | ✅ | ✅ | ✅ | ✅ |

Clients are read-only — great for stakeholders who just need visibility without being able to change anything.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ui/              # Buttons, inputs, cards, etc.
│   │   │   ├── kanban/          # Board, task cards, columns
│   │   │   └── ...
│   │   ├── pages/               # Page-level components
│   │   └── context/             # Auth context
│   ├── lib/
│   │   ├── api.ts               # All API calls live here
│   │   └── supabase.ts          # Supabase client setup
│   ├── types/
│   │   └── type.ts              # Shared types used across the app
│   └── styles/                  # Global CSS
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.ts         # The Hono API server
│           └── kvStore.ts       # KV storage helpers
└── ...
```

## Running it locally

### What you'll need

- Node.js 18+
- A Supabase account and project
- Supabase CLI (for deploying the edge function)

### Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/multi-tenant-project-mgmt.git
   cd multi-tenant-project-mgmt
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root of the project and add your Supabase credentials:
   ```
   VITE_SB_URL=https://your-project.supabase.co
   VITE_SB_ANON_KEY=your-anon-key
   VITE_SB_SERVICE_ROLE_KEY=your-service-role-key
   VITE_SB_PROJECT_ID=your-project-id
   ```

4. **Start the dev server:**
   ```bash
   npm run dev
   ```

That's it for the frontend. The backend runs as a Supabase Edge Function, so you'll need to deploy that separately (see below).

## Deploying the backend

The API runs as a Supabase Edge Function. Here's how to get it deployed:

1. **Login and link your project:**
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

2. **Set your secrets** (these are the server-side env vars):
   ```bash
   supabase secrets set SUPABASE_URL=https://your-project.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   supabase secrets set SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Deploy:**
   ```bash
   supabase functions deploy server --no-verify-jwt
   ```

## API Overview

Here's a quick look at the available endpoints:

| Method | Endpoint | What it does |
|--------|----------|--------------|
| POST | `/auth/signup` | Sign up a new user |
| GET | `/organizations` | Get all organizations for the logged-in user |
| POST | `/organizations` | Create a new organization |
| GET | `/organizations/:id` | Get a specific organization |
| GET | `/organizations/:id/members` | List all members |
| POST | `/organizations/:id/members` | Invite a member |
| DELETE | `/organizations/:id/members/:userId` | Remove a member |
| GET | `/organizations/:id/boards` | List all boards |
| GET | `/organizations/:id/activities` | View activity log |
| POST | `/boards` | Create a board |
| GET | `/boards/:id` | Get a board |
| DELETE | `/boards/:id` | Delete a board |
| GET | `/boards/:id/tasks` | Get all tasks on a board |
| GET | `/boards/:id/analytics` | Get board analytics |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |
| GET | `/profile` | Get the current user's profile |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SB_URL` | Your Supabase project URL |
| `VITE_SB_ANON_KEY` | Public anon key (safe to use in the browser) |
| `VITE_SB_SERVICE_ROLE_KEY` | Service role key — keep this secret! |
| `VITE_SB_PROJECT_ID` | Your Supabase project ID |

> ⚠️ Don't commit your `.env` file. It's already in `.gitignore` but just double-check before pushing!

## License

MIT — feel free to use this however you like.
