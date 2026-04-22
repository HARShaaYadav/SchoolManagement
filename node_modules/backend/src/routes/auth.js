import { Router } from "express";
import { z } from "zod";

import { validate } from "../utils/validate.js";
import { login, register } from "../controllers/auth.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validate(
    z.object({
      body: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["admin", "teacher", "student"]),
      }),
    }),
  ),
  register,
);

authRouter.post(
  "/login",
  validate(
    z.object({
      body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    }),
  ),
  login,
);

