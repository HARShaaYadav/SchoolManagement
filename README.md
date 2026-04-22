## School Management System (FSD-based)

### What’s included
- **Backend**: Node.js + Express + PostgreSQL + JWT (RBAC: admin/teacher/student)
- **Frontend**: React (Vite) + Tailwind + Axios

### Setup (local)
#### 1) Database
- Create a PostgreSQL DB (example: `school_management`)
- Run the schema:

```sql
-- in psql, run:
\i backend/db/schema.sql
```

#### 2) Backend env
- Copy `backend/.env.example` to `backend/.env`
- Set `DATABASE_URL` and `JWT_SECRET`

#### 3) Install & run
From the repo root:

```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000/api/health`

### FSD endpoints implemented
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET/POST/PUT/DELETE /api/students` (+ `GET /api/students/me`)
- `POST /api/attendance/mark`
- `GET /api/attendance/:date`
- `GET /api/attendance/student/:id`
- `GET/POST /api/fees`
- `PUT /api/fees/pay/:id`
- `GET/POST /api/exams`
- `POST /api/results`
- `GET /api/results/:studentId`

