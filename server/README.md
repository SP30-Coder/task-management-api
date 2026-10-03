# Task Management REST API

Node.js + Express.js + MongoDB + JWT Authentication

## Features
- User registration / login with hashed passwords (bcryptjs) + JWT auth
- Get logged-in user profile
- Full task CRUD (owner-scoped: users only see their own tasks)
- Task fields: title, description, status (`Pending` / `In Progress` / `Completed`), priority (`Low` / `Medium` / `High`), dueDate, createdAt/updatedAt
- Search by title/description, filter by status & priority, pagination, sorting
- Request validation (express-validator), central error handling, no sensitive data exposure

## Prerequisites
- Node.js 18+
- MongoDB running locally (default `mongodb://127.0.0.1:27017/taskmanagement`) or Atlas URI

## Setup

```bash
cd server
npm install
cp .env.example .env   # then edit MONGO_URI / JWT_SECRET if needed
npm run dev            # dev with nodemon
# or
npm start
```

Server runs on `http://localhost:5000` (see `PORT` in `.env`).

## API Reference

### Auth

| Method | Endpoint | Auth | Body |
|--------|----------|------|------|
| POST | `/api/auth/register` | No | `{ "name": "John", "email": "john@test.com", "password": "secret123" }` |
| POST | `/api/auth/login` | No | `{ "email": "john@test.com", "password": "secret123" }` |
| GET | `/api/auth/profile` | Yes (Bearer token) | — |

Auth header: `Authorization: Bearer <token>`

### Tasks (all require Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks` | List tasks (search/filter/pagination) |
| GET | `/api/tasks/:id` | Get single task (owner only) |
| PUT | `/api/tasks/:id` | Update task (owner only) |
| DELETE | `/api/tasks/:id` | Delete task (owner only) |

**Create / Update body:**
```json
{
  "title": "Finish report",
  "description": "Q3 summary",
  "status": "Pending",
  "priority": "High",
  "dueDate": "2026-10-15"
}
```

**List query params:**
- `search` — matches title/description (case-insensitive), e.g. `?search=report`
- `status` — `Pending` | `In Progress` | `Completed`
- `priority` — `Low` | `Medium` | `High`
- `page` (default 1), `limit` (default 10, max 100)
- `sortBy` — `createdAt` | `updatedAt` | `dueDate` | `title` | `status` | `priority` (default `createdAt`)
- `sortOrder` — `asc` | `desc` (default `desc`)

**Example:** `GET /api/tasks?status=Completed&page=1&limit=10`
**Example:** `GET /api/tasks?search=report&priority=High&status=Pending&page=1&limit=5`

**List response:**
```json
{
  "success": true,
  "data": { "tasks": [...] },
  "pagination": { "total": 25, "totalPages": 3, "currentPage": 1, "limit": 10, "hasNextPage": true, "hasPrevPage": false }
}
```

### Quick test with curl (PowerShell)

```powershell
# Register
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/register `
  -ContentType 'application/json' `
  -Body '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login -> copy token
$login = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/login `
  -ContentType 'application/json' `
  -Body '{"email":"test@example.com","password":"password123"}'
$token = $login.data.token
$headers = @{ Authorization = "Bearer $token" }

# Create task
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/tasks `
  -Headers $headers -ContentType 'application/json' `
  -Body '{"title":"My first task","description":"Do it well","priority":"High"}'

# List with filter
Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks?status=Pending&page=1&limit=10' -Headers $headers
```

## Project Structure

```
server/
├── src/
│   ├── config/db.js
│   ├── models/User.js
│   ├── models/Task.js
│   ├── middleware/auth.js
│   ├── middleware/validate.js
│   ├── middleware/errorHandler.js
│   ├── validators/auth.validator.js
│   ├── validators/task.validator.js
│   ├── controllers/auth.controller.js
│   ├── controllers/task.controller.js
│   ├── routes/auth.routes.js
│   ├── routes/task.routes.js
│   ├── app.js
│   └── server.js
├── .env
├── .env.example
└── package.json
```

## Security & Validation
- Passwords hashed with bcrypt (never returned in responses)
- All `/api/tasks` + `/api/auth/profile` require JWT
- Tasks are always scoped to `req.user._id` — users can't access others' tasks
- express-validator on register/login/create/update; invalid status/priority rejected
- helmet, cors, central error handler, 404 handler
