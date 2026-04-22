import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../utils/validate.js";
import { createSyllabus, listSyllabus } from "../controllers/syllabus.js";

export const syllabusRouter = Router();

syllabusRouter.get("/", requireAuth, requireRole(["admin", "teacher", "student"]), listSyllabus);

syllabusRouter.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      body: z.object({
        class_id: z.number().int().positive(),
        subject: z.string().trim().min(1),
        title: z.string().trim().min(1),
        description: z.string().trim().min(1),
      }),
    }),
  ),
  createSyllabus,
);
