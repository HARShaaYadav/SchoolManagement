import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../utils/validate.js";
import { createClass, listClasses, setClassTeacher } from "../controllers/classes.js";

export const classesRouter = Router();

classesRouter.get("/", requireAuth, listClasses);

classesRouter.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      body: z.object({
        class_name: z.number().int().min(1).max(12),
        section: z.string().min(1).max(5),
      }),
    }),
  ),
  createClass,
);

classesRouter.put(
  "/:id/teacher",
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      params: z.object({ id: z.coerce.number().int().positive() }),
      body: z.object({
        class_teacher_id: z.number().int().positive().nullable(),
      }),
    }),
  ),
  setClassTeacher,
);

