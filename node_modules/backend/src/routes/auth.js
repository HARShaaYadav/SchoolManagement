import { Router } from "express";
import { z } from "zod";

import { validate } from "../utils/validate.js";
import {
  changePassword,
  forgotPassword,
  listTeachers,
  login,
  register,
  resetTeacherPassword,
  verifyAdmin,
} from "../controllers/auth.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  optionalAuth,
  validate(
    z.object({
      body: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["admin", "teacher"]),
        adminVerificationToken: z.string().min(1).optional(),
      }),
    }),
  ),
  register,
);

authRouter.post(
  "/verify-admin",
  validate(
    z.object({
      body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    }),
  ),
  verifyAdmin,
);

authRouter.post(
  "/login",
  validate(
    z.object({
      body: z
        .object({
          role: z.enum(["admin", "teacher", "student"]),
          email: z.string().email().optional(),
          admissionId: z.string().min(1).optional(),
          password: z.string().min(1),
        })
        .superRefine((body, ctx) => {
          if (body.role === "student" && !body.admissionId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["admissionId"],
              message: "Admission ID is required for student login",
            });
          }

          if (body.role !== "student" && !body.email) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["email"],
              message: "Email is required for admin and teacher login",
            });
          }
        }),
    }),
  ),
  login,
);

authRouter.post(
  "/change-password",
  requireAuth,
  validate(
    z.object({
      body: z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      }),
    }),
  ),
  changePassword,
);

authRouter.post(
  "/forgot-password",
  validate(
    z.object({
      body: z
        .object({
          role: z.enum(["admin", "teacher", "student"]),
          email: z.string().email().optional(),
          admissionId: z.string().min(1).optional(),
          newPassword: z.string().min(6),
        })
        .superRefine((body, ctx) => {
          if (body.role === "student" && !body.admissionId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["admissionId"],
              message: "Admission ID is required for students",
            });
          }

          if (body.role !== "student" && !body.email) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["email"],
              message: "Email is required for admin and teacher accounts",
            });
          }
        }),
    }),
  ),
  forgotPassword,
);

authRouter.get("/teachers", requireAuth, requireRole("admin"), listTeachers);

authRouter.post(
  "/teachers/:id/reset-password",
  requireAuth,
  requireRole("admin"),
  validate(
    z.object({
      params: z.object({ id: z.coerce.number().int().positive() }),
      body: z.object({
        password: z.string().min(6),
      }),
    }),
  ),
  resetTeacherPassword,
);
