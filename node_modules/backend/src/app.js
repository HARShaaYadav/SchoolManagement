import express from "express";
import cors from "cors";

import { authRouter } from "./routes/auth.js";
import { classesRouter } from "./routes/classes.js";
import { studentRouter } from "./routes/student.js";
import { studentsRouter } from "./routes/students.js";
import { attendanceRouter } from "./routes/attendance.js";
import { feesRouter } from "./routes/fees.js";
import { examsRouter } from "./routes/exams.js";
import { resultsRouter } from "./routes/results.js";
import { errorHandler, notFound } from "./middleware/error.js";

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/", (_req, res) =>
  res.json({
    ok: true,
    message: "School Management API is running",
    endpoints: {
      health: "/api/health",
      authLogin: "/api/auth/login",
      authRegister: "/api/auth/register",
    },
  }),
);
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/classes", classesRouter);
app.use("/api/student", studentRouter);
app.use("/api/students", studentsRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/fees", feesRouter);
app.use("/api/exams", examsRouter);
app.use("/api/results", resultsRouter);

app.use(notFound);
app.use(errorHandler);
