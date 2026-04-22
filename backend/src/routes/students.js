import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../utils/validate.js";
import {
  createStudent,
  deleteStudent,
  getMyStudent,
  listStudents,
  updateStudent,
} from "../controllers/students.js";

export const studentsRouter = Router();

studentsRouter.get("/me", requireAuth, requireRole("student"), getMyStudent);

studentsRouter.get("/", requireAuth, requireRole(["admin", "teacher"]), listStudents);

studentsRouter.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      body: z.object({
        user_id: z.number().int().positive(),
        class: z.string().min(1),
        section: z.string().min(1),
        parent_name: z.string().min(1),
        parent_contact: z.string().min(1),
        address: z.string().min(1),
      }),
    }),
  ),
  createStudent,
);

studentsRouter.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      params: z.object({ id: z.coerce.number().int().positive() }),
      body: z
        .object({
          class: z.string().min(1).optional(),
          section: z.string().min(1).optional(),
          parent_name: z.string().min(1).optional(),
          parent_contact: z.string().min(1).optional(),
          address: z.string().min(1).optional(),
        })
        .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" }),
    }),
  ),
  updateStudent,
);

studentsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validate(z.object({ params: z.object({ id: z.coerce.number().int().positive() }) })),
  deleteStudent,
);

