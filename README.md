# SmartQ Campus — Smart Queue Management System
> **MCA Project — MERN Stack Web Application**  
> *College Offices & Student Services Queue Handling Platform*

SmartQ Campus is a modern, real-time web-based queue management application designed specifically for college administrative offices (Fee Counters, Examination Cell, Certificate & Transcript Section, Admissions & Student Welfare).

---

## ✨ Features & Architecture

### 1. Role-Based Access Control (RBAC)
- **🎓 Student**:
  - Browse open college service counters with live queue loads and wait estimates.
  - Book digital tokens instantly with optional request notes.
  - Live token tracker showing exact queue position (*"2 students ahead of you"*), estimated wait time, counter location, and real-time progress.
  - Cancel eligible tokens (*waiting* or *called*) directly from dashboard.
  - Full history of past completed, cancelled, and skipped tokens.
- **💼 Staff Officer**:
  - Dedicated Counter Desk with interactive service switcher.
  - **1-Click Call Next**: Automatically calls the next eligible student based on FIFO sequence and priority.
  - **Lifecycle Actions**: Call next ➔ Start Service (with live elapsed timer) ➔ Complete & Record Duration (creates `ServiceRecord` analytics).
  - Ability to Skip unresponsive students or Recall students if they arrive late.
- **👑 Administrator**:
  - Executive Overview with KPI cards: Total Tokens Today, In Queue, In Service, Completed, and Skipped.
  - Service Counter Management: Add new counters, edit average handling times, update locations, and toggle Active/Deactivated status.
  - Department Performance Analytics: Compares estimated vs actual observed durations.
  - User & Staff Access Control: Manage user accounts and adjust roles (*Student*, *Staff*, *Admin*).
- **📺 Public Display Kiosk (`/display`)**:
  - Full-screen high-contrast board for lobby LCD monitors and TVs.
  - Large **NOW SERVING** counter boards with animated alerts and flashing banners.
  - Next in Line ticker across all counters.
  - Live clock and date in `Asia/Kolkata` timezone.
  - Web Audio airport-style chime audio alert when a token is called.

### 2. High-Integrity Queue Algorithm & Rules
- **Daily Sequence Boundaries**: Isolated per day using the college timezone (`Asia/Kolkata`).
- **Atomic Sequence Generator**: `QueueCounter` uses MongoDB atomic `$inc` with compound unique index on `{ service, dateKey }` to guarantee no duplicate numbers even under concurrent requests.
- **Padded Token Formatting**: Generates clean department codes (e.g., `FEE001`, `EXAM003`, `ADM012`).
- **Strict State Transitions**: Enforces valid lifecycles (`waiting` ➔ `called` ➔ `serving` ➔ `completed`) and rejects invalid state mutations with `409 Conflict`.
- **Dynamic Waiting Estimation**: `estimated minutes = eligible people ahead × average service time`.

### 3. Real-Time Socket.IO Architecture
- Authenticated WebSocket connections via JWT.
- Targeted room subscriptions (`service:<serviceId>` and `campus:display`).
- Broadcasts `queue:updated` and `token:called` events in near real-time, notifying clients to synchronize state immediately.

---

## 🚀 Quick Start Guide (How to Run)

### Prerequisites
- **Node.js** (v18 or higher recommended; tested on v24)
- **npm** (v9 or higher)
- *(Optional)* **MongoDB**: If you have a local MongoDB instance running on port 27017 or a MongoDB Atlas URI, it will connect automatically. If not, **an embedded In-Memory MongoDB automatically launches with zero setup required!**

---

### Step 1: Install Dependencies
From the root project directory:
```bash
npm run install-all
```
*(Or install manually: `npm install`, then `cd server && npm install`, then `cd ../client && npm install`)*

---

### Step 2: Start the Full-Stack Application
To start both the Backend API server (Port 5000) and the React Client (Port 5173) with a single command:
```bash
npm run dev
```

- **Frontend App (Student & Staff)**: [http://localhost:5173/login](http://localhost:5173/login)
- **Separate Admin Portal**: [http://localhost:5173/admin-login](http://localhost:5173/admin-login)
- **Public Lobby Kiosk Display**: [http://localhost:5173/display](http://localhost:5173/display)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 👥 Authentication & Portal Access

### 1. Main Student & Staff Portal (`/login`)
Designed exclusively for students and counter staff with 1-click quick demo fill buttons:
- **🎓 Student**: `student@college.edu` / `student123`
- **💼 Staff Officer**: `staff@college.edu` / `staff123`

### 2. Separate Administrator Console (`/admin-login`)
A dedicated, restricted entrance for campus administrators and superintendents:
- **👑 Administrator**: `admin@college.edu` / `admin123` (Accesses `/admin`)

*(You can also register a brand new student account at any time on the `/register` page!)*

---

## 🧪 Running Automated Acceptance Tests
This project includes an automated acceptance test suite verifying requirements **TC-01 through TC-11** from the specification:
```bash
npm test
```
The test suite validates:
1. Student registration and role spoofing prevention (`TC-01`)
2. Authentication failure on bad credentials (`TC-02`)
3. Role authorization denial on protected admin routes (`TC-03`)
4. Unique token booking with wait estimates (`TC-04`)
5. FIFO token calling by authorized staff (`TC-06`)
6. Lifecycle conflict rejection (`409 Conflict`) when completing a un-served token (`TC-07`)
7. Proper duration calculation and status transition on service completion (`TC-08`)
8. Ownership enforcement: denying access when attempting to cancel another student's token (`TC-10`)
9. Rejection when attempting to book a deactivated service counter (`TC-11`)

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register student account |
| `POST` | `/api/auth/login` | Public | Authenticate user & get JWT |
| `GET` | `/api/auth/me` | Signed In | Get current profile |
| `GET` | `/api/auth/users` | Admin | List all registered users |
| `PUT` | `/api/auth/users/:id`| Admin | Update user role or active status |

### College Services (`/api/services`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/services` | Signed In | List active services (or all for Admin) |
| `GET` | `/api/services/:id` | Signed In | Get service details |
| `POST` | `/api/services` | Admin | Create new service counter |
| `PUT` | `/api/services/:id` | Admin | Update service (time, location, active) |

### Queue Operations (`/api/queue`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/queue/book` | Student | Book a digital token |
| `GET` | `/api/queue/my-tokens` | Student | List own active and past tokens |
| `GET` | `/api/queue/:serviceId/status` | Authorized | Live queue snapshot & waiting list |
| `POST` | `/api/queue/services/:serviceId/call-next` | Staff/Admin | Call next eligible token (FIFO) |
| `POST` | `/api/queue/:tokenId/start` | Staff/Admin | Start service for called token |
| `POST` | `/api/queue/:tokenId/complete` | Staff/Admin | Complete service & record duration |
| `POST` | `/api/queue/:tokenId/skip` | Staff/Admin | Skip an absent token |
| `POST` | `/api/queue/:tokenId/recall` | Staff/Admin | Recall skipped token to counter |
| `POST` | `/api/queue/:tokenId/cancel` | Owner/Staff | Cancel token according to queue policy |
| `GET` | `/api/queue/admin/analytics` | Admin | Summary metrics & departmental stats |
