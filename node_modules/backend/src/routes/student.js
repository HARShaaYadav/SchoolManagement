import { Router } from "express";
import { z } from "zod";

import { getStudentProfile } from "../controllers/students.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../utils/validate.js";

export const studentRouter = Router();

studentRouter.get(
  "/profile/:admissionId",
  requireAuth,
  requireRole(["admin", "teacher", "student"]),
  validate(
    z.object({
      params: z.object({
        admissionId: z.string().min(1),
      }),
    }),
  ),
  getStudentProfile,
);
