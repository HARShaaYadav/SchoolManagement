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
  requireRole(["admin", "teacher"]),
  validate(
    z.object({
      body: z.object({
        admission_id: z.string().min(1),
        full_name: z.string().min(1),
        password: z.string().min(6),
        class_id: z.number().int().positive(),
        phone_number: z.string().min(1).optional(),
        blood_group: z.string().min(1).optional(),
        profile_photo_url: z.string().url().optional().or(z.literal("")),
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
  requireRole(["admin", "teacher"]),
  validate(
    z.object({
      params: z.object({ id: z.coerce.number().int().positive() }),
      body: z
        .object({
          admission_id: z.string().min(1).optional(),
          full_name: z.string().min(1).optional(),
          password: z.string().min(6).optional(),
          class_id: z.number().int().positive().optional(),
          phone_number: z.string().min(1).optional(),
          blood_group: z.string().min(1).optional(),
          profile_photo_url: z.string().url().optional().or(z.literal("")),
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
