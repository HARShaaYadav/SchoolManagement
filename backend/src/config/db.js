import { readFile } from "node:fs/promises";
import bcrypt from "bcrypt";
import pg from "pg";

const { Pool } = pg;

const databaseUrl =
  process.env.DATABASE_URL ||
  `postgres://${process.env.PGUSER || "postgres"}:${process.env.PGPASSWORD || "postgres"}@${process.env.PGHOST || "localhost"}:${process.env.PGPORT || "5432"}/${process.env.PGDATABASE || "school_management"}`;

export const pool = new Pool({
  connectionString: databaseUrl,
});

let schemaInitialized = false;

async function ensureDefaultAdmin() {
  const adminCount = await pool.query(
    "select count(*)::int as count from users where role = 'admin'",
  );

  if ((adminCount.rows[0]?.count ?? 0) > 0) return;

  const name = process.env.DEFAULT_ADMIN_NAME || "System Admin";
  const email = (process.env.DEFAULT_ADMIN_EMAIL || "admin@school.com").trim().toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123";

  const existingEmail = await pool.query("select id from users where lower(email) = $1", [email]);
  if (existingEmail.rowCount > 0) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    `insert into users (name, email, password_hash, role, must_change_password)
     values ($1, $2, $3, 'admin', false)`,
    [name, email, passwordHash],
  );
}

export async function ensureSchema() {
  if (schemaInitialized) return;

  const schemaPath = new URL("../../db/schema.sql", import.meta.url);
  const schemaSql = await readFile(schemaPath, "utf8");

  await pool.query(schemaSql);
  await ensureDefaultAdmin();

  schemaInitialized = true;
}
