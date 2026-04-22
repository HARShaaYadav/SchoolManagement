import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { pool } from "../config/db.js";

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function buildStudentEmail(admissionId) {
  return `${String(admissionId).trim().toLowerCase()}@student.local`;
}

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");

  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      admissionId: user.admission_id ?? null,
      mustChangePassword: Boolean(user.must_change_password),
    },
    secret,
    { expiresIn: "7d" },
  );
}

function signAdminVerificationToken(admin) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");

  return jwt.sign(
    {
      purpose: "admin-register-verification",
      verifiedByUserId: admin.id,
      verifiedByEmail: admin.email,
      role: admin.role,
    },
    secret,
    { expiresIn: "15m" },
  );
}

function verifyAdminVerificationToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  const payload = jwt.verify(token, secret);
  if (payload.purpose !== "admin-register-verification" || payload.role !== "admin") {
    throw new Error("Invalid admin verification token");
  }
  return payload;
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role, adminVerificationToken } = req.validated.body;
    const adminCount = await pool.query("select count(*)::int as count from users where role = 'admin'");
    const isBootstrap = adminCount.rows[0]?.count === 0;

    if (!isBootstrap) {
      if (role === "admin") {
        if (req.user?.role === "admin") {
          void req.user;
        } else if (adminVerificationToken) {
          try {
            verifyAdminVerificationToken(adminVerificationToken);
          } catch {
            return res.status(401).json({ error: "Existing admin verification is required" });
          }
        } else {
          return res.status(401).json({ error: "Existing admin verification is required" });
        }
      } else {
        if (!req.user) return res.status(401).json({ error: "Admin authentication is required" });
        if (req.user.role !== "admin") return res.status(403).json({ error: "Only admins can create accounts" });
      }
    } else if (role !== "admin") {
      return res.status(400).json({ error: "The first account must be an admin" });
    }

    if (role === "student") {
      return res
        .status(400)
        .json({ error: "Student accounts must be created from the student management flow" });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await pool.query("select id from users where lower(email) = $1", [normalizedEmail]);
    if (existing.rowCount > 0) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await pool.query(
      `insert into users (name, email, password_hash, role, must_change_password)
       values ($1, $2, $3, $4, $5)
       returning id, name, email, role, admission_id, must_change_password, created_at`,
      [name, normalizedEmail, passwordHash, role, role === "teacher"],
    );

    const user = created.rows[0];
    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (e) {
    return next(e);
  }
}

export async function verifyAdmin(req, res, next) {
  try {
    const { email, password } = req.validated.body;

    const result = await pool.query(
      `select id, name, email, role, password_hash
       from users
       where lower(email) = $1 and role = 'admin'`,
      [normalizeEmail(email)],
    );

    if (result.rowCount === 0) return res.status(401).json({ error: "Invalid admin credentials" });

    const admin = result.rows[0];
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid admin credentials" });

    const verificationToken = signAdminVerificationToken(admin);
    return res.json({
      verificationToken,
      verifiedAdmin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (e) {
    return next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { role, email, admissionId, password } = req.validated.body;

    const result =
      role === "student"
        ? await pool.query(
            `select
              id,
              name,
              email,
              role,
              admission_id,
              must_change_password,
              password_hash,
              created_at
            from users
            where admission_id = $1 and role = 'student'`,
            [admissionId],
          )
        : await pool.query(
            `select
              id,
              name,
              email,
              role,
              admission_id,
              must_change_password,
              password_hash,
              created_at
            from users
            where lower(email) = $1 and role = $2`,
            [normalizeEmail(email), role],
          );
    if (result.rowCount === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);
    const { password_hash: _ph, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (e) {
    return next(e);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.validated.body;

    const result = await pool.query(
      `select
        id,
        name,
        email,
        role,
        admission_id,
        must_change_password,
        password_hash,
        created_at
      from users
      where id = $1`,
      [req.user.id],
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "User not found" });

    const user = result.rows[0];
    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

    const nextHash = await bcrypt.hash(newPassword, 10);
    const updated = await pool.query(
      `update users
       set password_hash = $1,
           must_change_password = false
       where id = $2
       returning id, name, email, role, admission_id, must_change_password, created_at`,
      [nextHash, req.user.id],
    );

    const safeUser = updated.rows[0];
    const token = signToken(safeUser);
    return res.json({ token, user: safeUser });
  } catch (e) {
    return next(e);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { role, email, admissionId, newPassword } = req.validated.body;

    const result =
      role === "student"
        ? await pool.query(
            `select id, role
             from users
             where admission_id = $1 and role = 'student'`,
            [admissionId],
          )
        : await pool.query(
            `select id, role
             from users
             where lower(email) = $1 and role = $2`,
            [normalizeEmail(email), role],
          );

    if (result.rowCount === 0) return res.status(404).json({ error: "Account not found" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `update users
       set password_hash = $1,
           must_change_password = false
       where id = $2`,
      [passwordHash, result.rows[0].id],
    );

    return res.json({ ok: true, message: "Password updated successfully" });
  } catch (e) {
    return next(e);
  }
}

export async function listTeachers(_req, res, next) {
  try {
    const result = await pool.query(
      `select id, name, email, role, must_change_password, created_at
       from users
       where role = 'teacher'
       order by name asc`,
    );
    return res.json({ teachers: result.rows });
  } catch (e) {
    return next(e);
  }
}

export async function resetTeacherPassword(req, res, next) {
  try {
    const { id } = req.validated.params;
    const { password } = req.validated.body;

    const passwordHash = await bcrypt.hash(password, 10);
    const updated = await pool.query(
      `update users
       set password_hash = $1,
           must_change_password = true
       where id = $2 and role = 'teacher'
       returning id, name, email, role, must_change_password, created_at`,
      [passwordHash, id],
    );

    if (updated.rowCount === 0) return res.status(404).json({ error: "Teacher not found" });
    return res.json({ teacher: updated.rows[0] });
  } catch (e) {
    return next(e);
  }
}

export { buildStudentEmail };
