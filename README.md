# Structura Workspace

*A Multi-Tenant Project Management App*

Structura is a project I built to really understand how multi-tenant SaaS apps work behind the scenes. Instead of just cloning a basic Trello board, I wanted something closer to how real systems handle **organizations, permissions, and data isolation**.

So this ended up being a lightweight project management tool where multiple teams (organizations) can manage their own boards, tasks, and members — all within the same app, but completely isolated from each other.

---

## Why I built this

I wanted to go beyond CRUD apps and actually build something that touches:

* Multi-tenant architecture
* Role-based access control
* Real-world data modeling
* Secure data isolation (RLS)

Basically, something I can confidently talk about in interviews as a **“real SaaS system”**, not just a demo app.

---

## Tech Stack

**Frontend**

* React 18 + TypeScript
* Vite
* CSS
* Lucide Icons

**Backend**

* Supabase (PostgreSQL + Auth + RLS)
* Hono (running on Supabase Edge Functions)

**Other**

* react-dnd (for drag-and-drop Kanban)
* Groq AI (experimenting with AI features)

---

## What it can do

* Create multiple organizations (multi-tenant setup)
* Invite users and assign roles
* Manage Kanban boards (To Do / In Progress / Done)
* Drag and drop tasks between columns
* Track activity logs per organization
* View simple analytics (completion rate, priorities)
* Secure data per organization using RLS

---

## Roles & Permissions

I implemented a simple but practical permission system:

| Action         | Owner | Project Manager | Member | Client |
| -------------- | :---: | :-------------: | :----: | :----: |
| Delete board   |   ✅   |        ✅        |    ❌   |    ❌   |
| Manage members |   ✅   |        ✅        |    ❌   |    ❌   |
| Create board   |   ✅   |        ✅        |    ✅   |    ❌   |
| Manage tasks   |   ✅   |        ✅        |    ✅   |    ❌   |
| View data      |   ✅   |        ✅        |    ✅   |    ✅   |

Clients are read-only — useful for stakeholders who just want visibility.

---

## How it’s structured

I tried to keep things clean and scalable (learned this the hard way 😅):

```
src/
  app/                # UI components (dashboard, kanban, etc.)
  context/            # Auth + workspace state
  services/           # All Supabase queries (important!)
  lib/                # Supabase client
  types/              # Shared types
  styles/             # Global styles
```

Key idea:

> UI doesn’t talk directly to the database — services handle that.

---

## Architecture Notes

A few things I focused on while building this:

* **Multi-tenancy**

  * Every table is scoped by `organization_id`
  * Enforced via Supabase RLS

* **Clean data flow**

  * Centralized workspace state (org + boards)
  * Components consume data instead of fetching everywhere

* **Onboarding flow**

  * Signup → Create organization → Assign owner role

* **Invite system**

  * Token-based invites
  * Users join organizations via invite links

---

## Running it locally

### Requirements

* Node.js 18+
* Supabase account
* Supabase CLI

---

### Setup

```bash
git clone https://github.com/nico-otchengco/Structura-Workspace
cd Structura-Workspace
npm install
```

Create a `.env` file:

```
VITE_SB_URL=your-url
VITE_SB_ANON_KEY=your-anon-key
VITE_SB_SERVICE_ROLE_KEY=your-service-role-key
VITE_SB_PROJECT_ID=your-project-id
```

Run the app:

```bash
npm run dev
```

---

## ⚡ Backend (Edge Functions)

```bash
supabase login
supabase link --project-ref your-project-ref
```

Set secrets:

```bash
supabase secrets set SUPABASE_URL=your-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
```

Deploy:

```bash
supabase functions deploy server --no-verify-jwt
```

---

## 📡 API Overview

Some of the main endpoints:

| Method | Endpoint            | Description     |
| ------ | ------------------- | --------------- |
| POST   | `/auth/signup`      | Create user     |
| GET    | `/organizations`    | Get user orgs   |
| POST   | `/organizations`    | Create org      |
| GET    | `/boards/:id/tasks` | Get board tasks |
| POST   | `/tasks`            | Create task     |
| PUT    | `/tasks/:id`        | Update task     |
---

## 📌 What I’d improve next

If I continue this project:

* Real-time updates (Supabase subscriptions)
* Better role granularity (admin vs manager)
* Notifications system
* File attachments for tasks
* Better analytics dashboard

---

## 👨‍💻 About me

Built by **Gian Nico Otchengco** as part of my journey into backend/full-stack engineering.

* GitHub: https://github.com/nico-otchengco
* LinkedIn: https://www.linkedin.com/in/gian-nico-otchengco-78a982383/

---

## 📄 License

MIT — feel free to explore or build on top of it.
