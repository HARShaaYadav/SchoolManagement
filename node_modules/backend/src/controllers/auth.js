import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { pool } from "../config/db.js";

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");

  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: "7d" },
  );
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.validated.body;

    const existing = await pool.query("select id from users where email = $1", [email]);
    if (existing.rowCount > 0) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await pool.query(
      "insert into users (name, email, password_hash, role) values ($1, $2, $3, $4) returning id, name, email, role, created_at",
      [name, email, passwordHash, role],
    );

    const user = created.rows[0];
    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (e) {
    return next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.validated.body;

    const result = await pool.query(
      "select id, name, email, role, password_hash, created_at from users where email = $1",
      [email],
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

