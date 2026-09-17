# BuildTrack — Complete Feature Documentation

**Project:** BuildTrack  
**Stack:** Next.js 15 (Port 3333) · FastAPI Python (Port 8000) · Supabase Auth · SQLite (data.db)  
**Generated:** September 2026  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [User Roles & Accounts](#3-user-roles--accounts)
4. [Authentication System](#4-authentication-system)
5. [Parent Dashboard](#5-parent-dashboard)
6. [Student Dashboard](#6-student-dashboard)
7. [Builder Dashboard](#7-builder-dashboard)
8. [Project Request Flow](#8-project-request-flow)
9. [Global Marketplace](#9-global-marketplace)
10. [Workspace](#10-workspace)
11. [Builders Directory](#11-builders-directory)
12. [Notifications](#12-notifications)
13. [Reviews & Ratings](#13-reviews--ratings)
14. [Payments & Earnings](#14-payments--earnings)
15. [Navigation & UI Design](#15-navigation--ui-design)
16. [Backend API Endpoints](#16-backend-api-endpoints)
17. [Database Schema](#17-database-schema)
18. [Key User Flows](#18-key-user-flows)

---

## 1. Project Overview

BuildTrack is a project tracking and management platform that connects three types of users:

- **Parents** — Oversee their children's project requests, approve/reject builder proposals, verify work completion, and manage payments
- **Students (Children)** — Submit project requests to specific builders or the global marketplace, track progress, and view their active projects
- **Builders** — Receive and respond to project requests, update progress, manage earnings, and maintain service offerings

The platform was built to solve a specific problem: parents want visibility and control over academic/hobby projects their children request from verified builders, with a secure approval and payment flow.

---

## 2. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| Frontend | Next.js 15.2.4 | App Router, React Server/Client Components |
| Language | TypeScript | Full type safety across components |
| Styling | Vanilla CSS + Tailwind | Cream/beige design system (`#F5F0E8` background) |
| Auth | Supabase Auth | Email/password with role in `user_metadata` |
| Backend | FastAPI (Python) | REST API on port 8000 |
| Database | SQLite (`data.db`) | Via SQLAlchemy ORM |
| API Proxy | Next.js Route Handler | `/api/backend/[...path]` proxies all calls to FastAPI |
| Real-time | Socket.IO | Notification broadcasting |
| Dev Port | 3333 (frontend) | 8000 (backend) |

---

## 3. User Roles & Accounts

### Three distinct roles

| Role | Description | Dashboard |
|---|---|---|
| **Parent** | Guardian who oversees children's projects and approves payments | `/parent/dashboard` |
| **Student** | Child/student who submits project requests | `/student/dashboard` |
| **Builder** | Verified professional who accepts and fulfills projects | `/builder/dashboard` |

### Role detection flow
1. On login, the system checks `user_metadata.role` in Supabase first
2. If not found, calls backend `/auth/role?email=...` which checks the DB tables (parents → student → builder)
3. Automatically redirects to the correct dashboard

### Parent–Child linking
- Parents can link their child's account from the Parent Dashboard
- Child must first sign up as a "student" role
- Parent enters the child's name + email to link them to the family
- Once linked, the child's projects appear on the parent's dashboard
- A child without a linked parent **cannot submit requests** (enforced by the backend)

---

## 4. Authentication System

### Sign Up (`/auth/signup`)
- Role picker: **Parent / Student / Builder** (3 buttons, click to select)
- Fields: Full Name, Email, Password (min 6 characters)
- On submit:
  - Creates Supabase auth account with `role` stored in `user_metadata`
  - **Parent**: calls `/parents/register` → creates Family + Parent DB record
  - **Student**: calls `/students/register` → creates Child DB record
  - **Builder**: redirects to `/auth/builder` onboarding page
- Error display for invalid credentials or existing accounts

### Sign In (`/auth/login`)
- Simple email + password form
- Role-based redirect after login:
  - `parent` → `/parent/dashboard`
  - `student` → `/student/dashboard`
  - `builder` → `/builder/dashboard`
  - `admin` → `/admin/dashboard`
- Fallback backend role check if Supabase metadata missing

### Builder Onboarding (`/auth/builder`)
- Builder-specific profile setup after signup
- Fields: Name, Bio/Blurb, Categories (specialty areas), Service Type, Service Price
- Calls `/builders/register` to create verified builder record in DB
- Redirects to builder dashboard on completion

### Auth Context (`lib/auth-context.tsx`)
- Wraps the entire app via `<AuthProvider>` in `layout.tsx`
- Exposes: `user`, `role`, `loading`, `supabase`, `signOut()`
- Auto-detects role on session load and session change

### Role Guard (`components/role-guard.tsx`)
- Used on every protected page
- Redirects to correct dashboard if wrong role tries to access a page
- Shows loading state while auth resolves

---

## 5. Parent Dashboard

**URL:** `/parent/dashboard`  
**Navigation tabs:** Dashboard · Builders · Payments · Notifications · Reviews · Settings

### 5.1 Project Cards Grid
- **2-column card grid** showing all children's active and pending projects
- Each card displays:
  - Project title + **"for [child name]"** label
  - Colored status badge (blue for pending, green for completed, etc.)
  - Progress bar (0–100%)
  - **Timeline stepper** with 4 stages: Submitted → Approved → In Build → Delivery
    - Checkmark circles for completed stages
    - Current stage highlighted in blue
    - Future stages greyed out
  - **"Open Workspace"** button linking to the workspace

### 5.2 Status Badges
| Status | Color |
|---|---|
| Pending Parent Approval | Blue |
| Pending Builder Acceptance | Blue |
| Pending Final Parent Approval | Blue |
| In Progress / In Build | Blue |
| Pending Parent Completion Review | Emerald green |
| Completed / Delivered | Dark green |
| Declined | Grey |

### 5.3 Pending Approvals Section
- Shown separately when a project needs parent action
- **Pending Parent Approval** (child submitted, parent must approve to send to builder):
  - "Approve & Send to Builder" button
  - **"Delete Request" button** (red trash icon) — cancels and deletes the request
- **Pending Final Parent Approval** (builder sent a quote):
  - Shows the builder's quoted price
  - "Confirm & Pay Quote" button
  - "Delete Request" button (still available if builder hasn't started)
- **Pending Parent Completion Review** (builder marked 100% done):
  - "Review & Release Payout" button → links to workspace

### 5.4 Delete Request Feature
- Parents can delete/cancel a request **only while it is still pending**
- Available for statuses: `Pending Parent Approval`, `Pending Builder Acceptance`, `Pending Final Parent Approval`
- Calls `POST /workspaces/{id}/cancel` which deletes the record from the DB
- Confirmation dialog shown before deletion
- Once a builder has started work (`In Progress`), deletion is blocked

### 5.5 Add Child / Link Child
- "Add Child" button in the top right of the dashboard
- Expands a form with: Child Name + Child Email fields
- Calls `POST /parents/children/link` with parent email + child email
- Child must already have a student account for linking to work
- After linking, child's future projects appear on parent dashboard

### 5.6 Recent Notifications
- Bottom section of the dashboard
- Shows last 5 notifications relevant to the parent's family
- Each notification has a message + timestamp

---

## 6. Student Dashboard

**URL:** `/student/dashboard`  
**Navigation tabs:** Dashboard · Builders · Request · Notifications · Settings

### 6.1 Two-Column Layout
**Left panel — "Start a new request":**
- Description text: "Describe your project, budget, and timeline. Verified builders will respond with offers."
- Large blue **"Create request"** button → links to `/student/requests/new`

**Right panel — "Your active requests (N)":**
- List of all the student's project requests
- Each entry shows:
  - Project title
  - Builder name (or "No builder assigned yet" for global requests)
  - Budget amount
  - Status (colored text)
  - Progress percentage
  - **"Open"** button → links to the workspace

### 6.2 Request Statuses Shown
- `Approved` — Blue
- `Pending Builder Acceptance` — Orange
- `Completed` / `Delivered` — Green
- `In Progress` — Blue

---

## 7. Builder Dashboard

**URL:** `/builder/dashboard`  
**Navigation tabs:** Dashboard · Uploads · Notifications · Reviews · Settings

### 7.1 Assigned Projects Card
- Lists all active and completed projects assigned to this builder
- Each project row shows:
  - Project title
  - Student name (`Student: mallu`)
  - Progress percentage (`Progress: 22%`)
  - Status label (Approved, Completed, etc.)
  - **"Open Workspace"** button
- Below the list: "Share images and videos to keep parents and students up to date" + **"Go to Uploads"** button

### 7.2 Builder Profile Overview Card
- Shows average star rating (⭐ X / 5.0)
- Active students count
- Recent notifications summary

### 7.3 New Requests to Review
- Appears when a parent approves a request targeted at this builder
- Shows: Project title, Student name, Budget
- Two action buttons:
  - **"Reject"** — declines the request, marks it as Declined
  - **"Review & Accept"** — expands a quote form

### 7.4 Quote Submission
- When builder clicks "Review & Accept":
  - A panel expands showing a "Final Price ($)" input
  - Pre-filled with the student's budget
  - Builder can adjust the price up or down
  - **"Submit Quote"** button → sends quote to parent for final approval
  - Quote goes to `Pending Final Parent Approval` status
  - Parent receives a notification about the quote

### 7.5 Analytics & Earnings Section
- Appears below the project list
- Three stat cards:
  - **Total Earnings** — sum of `final_price` from all completed projects
  - **Average Rating** — calculated from all reviews
  - **Projects Completed** — count of Completed/Delivered projects
- **Recent Reviews** — last 5 reviews with reviewer name, star rating, comment

### 7.6 Manage My Services
- Collapsible section (toggle with "Manage My Services (N)" link)
- **Your Offered Services** — list of services with: name, category, price, Delete button
- **Add New Service** form — Service Name, Price, Category fields

---

## 8. Project Request Flow

The complete lifecycle of a project request:

```
Student submits request
        ↓
[Pending Parent Approval]  ← Parent can DELETE here
        ↓
Parent clicks "Approve & Send to Builder"
        ↓
[Pending Builder Acceptance]  ← Parent can DELETE here
        ↓
Builder clicks "Review & Accept" → sets Final Price
        ↓
[Pending Final Parent Approval]  ← Parent can DELETE here
        ↓
Parent clicks "Confirm & Pay Quote"
        ↓
[In Progress]  ← Builder updates progress in workspace
        ↓
Builder sets progress to 100%
        ↓
[Pending Parent Completion Review]
        ↓
Parent visits workspace → clicks "Verify Completion"
        ↓
[Completed] ✓
```

### Request Form (`/student/requests/new`)
- **Title** — project name
- **Description** — what the project involves
- **Budget** — student's budget in dollars
- **Builder Selection** (dropdown — this was a key feature request):
  - Shows list of all verified builders by name
  - Option: **"Global Marketplace (Any Builder)"** — sends to open pool
  - If a builder is pre-selected (coming from `/builders` page), it auto-fills
- Validation: child must be linked to a parent before submitting
- On success: "Request submitted. Your parent will review it shortly."

---

## 9. Global Marketplace

**The Problem It Solves:**  
Previously, if a student sent a request without specifying a builder, it showed as "unknown" and no builder could see it. This was a key issue reported by the user.

**The Solution:**
- Student can select **"Global Marketplace (Any Builder)"** in the builder dropdown
- Request is saved with `builder_id = null` and `service_id = null`
- Status becomes: `Pending Parent Approval` → `Pending Builder Acceptance`
- On the Builder Dashboard, a **"Global Marketplace Requests"** section appears
- Any verified builder can see all global open requests
- Builder can click **"Claim & Quote"** to claim the request
  - Enters their final price
  - Submits → claims the request and notifies the parent
  - Request is now exclusively assigned to that builder

**Visual Design:**
- Global Marketplace section has a blue tinted card (`blue-50/30` background, `blue-200` border)
- Header: "🌐 Global Marketplace Requests (N)" with "Open to all verified builders" label

---

## 10. Workspace

**URL:** `/workspace/[id]`  
**Accessible by:** Parent, Student, Builder (all roles)

### 10.1 What's Shown
- Project title, description
- Child name + Builder name
- Current status badge
- Progress bar (0–100%)
- Budget / Final Price

### 10.2 Builder Actions (shown only when role = builder)
- Progress slider/input to update completion percentage
- "Update Progress" button → calls `POST /workspaces/{id}/progress`
- When progress hits 100%, status auto-changes to `Pending Parent Completion Review`

### 10.3 Parent Actions (shown only when role = parent)
- **Completion Review Banner** — shown when status is `Pending Parent Completion Review`
- "Verify Completion & Release Payout" button
- Calls `POST /workspaces/{id}/verify-completion`
- Marks project as `Completed`, triggers payment release notification to builder

### 10.4 File Uploads
- Builder can upload project images/videos to the workspace
- Visible to parent and student as progress proof

---

## 11. Builders Directory

**URL:** `/builders`  
**Accessible by:** All roles (parent, student, builder, public)

### 11.1 Layout
- **Left sidebar** — Filter panel
- **Right main area** — Builder cards grid (1–3 columns)

### 11.2 Filter Panel
- **"FILTER"** label (uppercase, small caps)
- **Search** — text input, filters by builder name in real-time
- **Rating** dropdown — Any rating / 4.0+ / 4.5+ / 4.8+ stars
- **Category** dropdown — Any / Models / Electronics / Craft
- **"N builders shown"** count below filters

### 11.3 Builder Cards
Each card has two zones:

**Work Zone (top):**
- Portfolio thumbnail image
- Builder name (bold)
- Category tags/badges (outline style)

**Credential Strip (bottom, beige background `#E8E2D4`):**
- ✅ **Verified** stamp (green with checkmark icon)
- ⭐ Star rating (interactive `StarRating` component) + numeric rating
- **N projects shipped** (large number)
- **Compare** checkbox — select up to multiple builders
- **Reviews** button (blue outline) → opens reviews dialog
- **View portfolio** button → opens portfolio image gallery dialog

### 11.4 Compare Feature
- "Compare (0)" button in top-right, enabled when 2+ builders selected
- Opens a slide-out Sheet panel on the right
- Side-by-side comparison: Rating, Completed count, Categories, Bio

### 11.5 Service Listing on Cards
- If a builder has services listed, each service shows:
  - Service name + price
  - "Request this service →" link → pre-fills the request form with that builder + service

### 11.6 Reviews Dialog
- Clicking "Reviews" on a builder card opens a modal
- Shows all reviews for that builder with: reviewer name, star rating, comment, date

---

## 12. Notifications

**URL:** `/notifications`

### What triggers notifications
| Event | Who gets notified |
|---|---|
| Child submits a request | Parent |
| Parent approves request | Builder |
| Builder submits a quote | Parent |
| Parent confirms quote | Builder |
| Builder marks 100% progress | Parent |
| Parent verifies completion | Builder |
| Builder claims a global request | Parent |

### Notification storage
- Stored in `notifications` table with `user_email` field
- `GET /notifications?email=...` returns all notifications for a user
- `POST /notifications/{id}/read` marks as read

---

## 13. Reviews & Ratings

### Leaving a Review
- Parent can leave a review after a project is `Completed`
- Fields: Star rating (1–5), Comment text

### Reviews API
- `GET /reviews?builder_id=N` — fetch reviews for a specific builder
- `POST /reviews` — submit a new review
- `builder.rating_avg` is updated on the Builder model

### Reviews Display
- Shown in builder cards on the `/builders` page (in the reviews dialog)
- Shown in the Builder Dashboard under "Recent Reviews"

---

## 14. Payments & Earnings

### Parent Payments (`/parent/payments`)
- Lists all payments made by the parent
- Shows: Amount, Status, Transaction ID, Date

### Builder Earnings (shown on Builder Dashboard)
- `Total Earnings` — sum of `final_price` across all completed projects
- Per-project earnings implied through the project records

### Payment Flow
1. Parent confirms builder's quote → project starts
2. On completion + parent verification → payment is "released" to builder
3. Payment record created in `payments` table

---

## 15. Navigation & UI Design

### Design System
| Token | Value | Usage |
|---|---|---|
| Background | `#F5F0E8` | Cream/beige — page background |
| Card | `#FFFFFF` | White cards |
| Ledger | `#E8E2D4` | Credential strips, sidebar |
| Primary Blue | `#2563EB` | Buttons, active nav, links |
| Ink | `#1C1917` | Primary text |
| Chalk | `#5A5348` | Secondary/muted text |
| Border | `#D6CEBD` | Card/input borders |
| Verified Green | `#166534` | "Completed" badges |

### Navigation Bar (App Shell)
- **BuildTrack** logo on left (blue, bold)
- Tab-style navigation — active tab has white pill background with border
- Role-specific nav links:

| Role | Nav Links |
|---|---|
| Parent | Dashboard · Builders · Payments · Notifications · Reviews · Settings |
| Student | Dashboard · Builders · Request · Notifications · Settings |
| Builder | Dashboard · Uploads · Notifications · Reviews · Settings |

- Sign Out button on right

### Timeline Component
- Horizontal stepper with 4 stages: Submitted → Approved → In Build → Delivery
- Circular nodes: checkmark (✓) for done, blue dot for current, empty for future
- Connecting lines between nodes (blue for done, grey for future)

### Key UI Patterns
- **Cream background** (`#F5F0E8`) on all page backgrounds
- **White cards** with subtle `#D6CEBD` border and `shadow-sm`
- Status badges as small rounded pills with color-coded backgrounds
- Consistent spacing using gap-based grid layouts
- Hover effects on interactive elements

---

## 16. Backend API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| GET | `/auth/role?email=` | Detect user role from DB |

### Registration
| Method | Endpoint | Description |
|---|---|---|
| POST | `/parents/register` | Create parent + family record |
| POST | `/students/register` | Create student/child record |
| POST | `/builders/register` | Create builder record + default service |

### Dashboards
| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboards/parent?email=` | Parent's children, projects, pending approvals, notifications |
| GET | `/dashboards/student?email=` | Student's project list |
| GET | `/dashboards/builder?email=` | Builder's projects, pending requests, global pool, services |
| GET | `/builders/{id}/analytics` | Earnings, rating, review count, recent reviews |

### Project Requests / Workspaces
| Method | Endpoint | Description |
|---|---|---|
| POST | `/workspaces` | Student submits new project request |
| GET | `/workspaces/{id}` | Get workspace details |
| POST | `/workspaces/{id}/approve` | Parent approves → sends to builder |
| POST | `/workspaces/{id}/builder-accept` | Builder accepts with final price |
| POST | `/workspaces/{id}/parent-confirm` | Parent confirms builder's quote |
| POST | `/workspaces/{id}/progress` | Builder updates progress % |
| POST | `/workspaces/{id}/cancel` | Parent cancels/deletes pending request |
| POST | `/workspaces/{id}/reject` | Builder rejects a request |
| POST | `/workspaces/{id}/verify-completion` | Parent verifies completion |

### Builders
| Method | Endpoint | Description |
|---|---|---|
| GET | `/builders` | List all verified builders with services |
| POST | `/builders/services?email=` | Builder adds a service |
| DELETE | `/builders/services/{id}` | Builder deletes a service |

### Parents & Children
| Method | Endpoint | Description |
|---|---|---|
| GET | `/parents/children?email=` | List parent's children |
| POST | `/parents/children/link` | Link child to parent family |

### Payments & Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/payments/parent?email=` | Parent's payment history |
| GET | `/notifications?email=` | User's notifications |
| POST | `/notifications/{id}/read` | Mark notification as read |
| GET | `/reviews?builder_id=` | Get reviews for a builder |
| POST | `/reviews` | Submit a review |

### Infrastructure
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Backend health check |
| GET | `/api/backend/[...path]` | Next.js proxy → all calls forwarded to FastAPI |

---

## 17. Database Schema

### Tables

**families** — groups parents and children together  
`id, name, created_at`

**parents** — parent accounts  
`id, family_id, name, email, created_at`

**children** — student/child accounts  
`id, family_id, name, email, grade, created_at`

**builders** — verified builder profiles  
`id, name, email, city, expertise, verification_status, rating_avg, blurb, categories (JSON), portfolio (JSON), created_at`

**services** — services offered by builders  
`id, builder_id, title, type, description, price, category, delivery_modes, created_at`

**project_requests** — the core table tracking all projects  
`id, child_id, service_id, builder_id, title, description, budget, final_price, status, progress, created_at`

**payments** — payment records  
`id, parent_id, subscription_id, project_order_id, amount, status, transaction_id, created_at`

**notifications** — system notifications  
`id, family_id, user_id, user_email, type, message, data (JSON), read, created_at`

**reviews** — builder reviews from parents  
`id, parent_id, builder_id, rating, title, body, comment, images (JSON), verified, status, response, created_at`

---

## 18. Key User Flows

### Flow 1: New Student Signs Up and Sends a Request

1. Student goes to `/auth/signup`, selects "Student", fills name/email/password
2. Account created in Supabase + DB record created
3. Parent links student from their dashboard ("Add Child" → enters student's email)
4. Student logs in → goes to `/student/dashboard`
5. Clicks "Create request" → fills title, description, budget, selects a builder (or Global)
6. Submits → parent receives a notification

### Flow 2: Parent Approves and Builder Accepts

1. Parent logs in → sees pending approval card on dashboard
2. Reviews the request → clicks "Approve & Send to Builder"
3. Status changes to "Pending Builder Acceptance"
4. Builder logs in → sees request in "New Requests to Review"
5. Builder clicks "Review & Accept" → enters final price → clicks "Submit Quote"
6. Status changes to "Pending Final Parent Approval"
7. Parent receives notification of the quote

### Flow 3: Project Completion

1. Parent confirms the quote → status becomes "In Progress"
2. Builder opens the workspace → updates progress % as work progresses
3. Builder sets progress to 100% → status becomes "Pending Parent Completion Review"
4. Parent receives notification → visits workspace
5. Parent clicks "Verify Completion & Release Payout"
6. Status becomes "Completed", builder receives payment notification
7. Parent can now leave a review for the builder

### Flow 4: Global Marketplace

1. Student selects "Global Marketplace (Any Builder)" in request form
2. Parent approves the request
3. All verified builders see the request in their "🌐 Global Marketplace Requests" section
4. First builder to click "Claim & Quote" claims the request exclusively
5. Flow continues as normal (quote → parent confirm → In Progress → Completed)

### Flow 5: Parent Deletes a Pending Request

1. Parent sees a pending request card on their dashboard
2. If the builder hasn't started work yet, a red 🗑️ trash button is visible
3. Parent clicks it → confirmation dialog appears
4. Parent confirms → request is permanently deleted from DB
5. Builder (if assigned) is not notified (request simply disappears)

---

## File Structure

```
build-track-app-design (1)/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout with AuthProvider + Toaster
│   ├── globals.css                 # Global CSS with design tokens
│   ├── api/backend/[...path]/      # Next.js → FastAPI proxy
│   ├── auth/
│   │   ├── login/page.tsx          # Login page (all roles)
│   │   ├── signup/page.tsx         # Signup with role selection
│   │   ├── builder/page.tsx        # Builder onboarding profile form
│   │   ├── parent/page.tsx         # Parent-specific auth
│   │   └── student/page.tsx        # Student-specific auth
│   ├── parent/
│   │   ├── dashboard/page.tsx      # Parent dashboard (main)
│   │   ├── approvals/page.tsx      # Pending approvals list
│   │   └── payments/page.tsx       # Payment history
│   ├── student/
│   │   ├── dashboard/page.tsx      # Student dashboard
│   │   └── requests/new/page.tsx   # New request form
│   ├── builder/
│   │   ├── dashboard/page.tsx      # Builder dashboard (main)
│   │   ├── uploads/page.tsx        # File upload management
│   │   └── earnings/page.tsx       # Earnings overview
│   ├── builders/                   # Public builders directory
│   ├── workspace/[id]/page.tsx     # Per-project workspace
│   ├── notifications/page.tsx      # Notification center
│   ├── reviews/page.tsx            # Reviews page
│   └── settings/page.tsx           # User settings
├── components/
│   ├── app-shell.tsx               # Navigation + layout wrapper
│   ├── role-guard.tsx              # Role-based redirect guard
│   ├── timeline.tsx                # Horizontal stepper component
│   ├── star-rating.tsx             # Interactive star rating
│   ├── skeleton-card.tsx           # Loading skeleton UI
│   ├── empty-state.tsx             # Empty state placeholder
│   └── ui/                         # shadcn/ui component library
├── lib/
│   ├── auth-context.tsx            # Supabase auth + role context
│   └── api-client.ts               # apiFetch() wrapper for /api/backend/*
└── backend/
    ├── app/
    │   ├── main.py                  # FastAPI app + router registration
    │   ├── models.py                # SQLAlchemy ORM models
    │   ├── new_routes.py            # All real API route implementations
    │   ├── routes.py                # Legacy base routes
    │   ├── db.py                    # SQLite database connection
    │   ├── schemas.py               # Pydantic request schemas
    │   └── socket.py               # Socket.IO for real-time notifications
    ├── data.db                      # SQLite database file
    ├── migrate.py                   # DB migration script
    └── seed_existing.py             # Seed script for existing accounts
```

---

*Document generated from BuildTrack project — September 2026*
