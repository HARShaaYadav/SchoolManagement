import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../utils/validate.js";
import { createResult, getResultsForStudent } from "../controllers/results.js";

export const resultsRouter = Router();

resultsRouter.post(
  "/",
  requireAuth,
  requireRole(["teacher", "admin"]),
  validate(
    z.object({
      body: z.object({
        student_id: z.number().int().positive(),
        exam_id: z.number().int().positive(),
        subject: z.string().min(1),
        marks: z.number().min(0),
        total_marks: z.number().positive(),
      }),
    }),
  ),
  createResult,
);

resultsRouter.get(
  "/:studentId",
  requireAuth,
  requireRole(["admin", "teacher", "student"]),
  validate(z.object({ params: z.object({ studentId: z.coerce.number().int().positive() }) })),
  getResultsForStudent,
);

