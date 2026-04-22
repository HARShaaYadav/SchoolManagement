import { pool } from "../config/db.js";

export async function getMyStudent(req, res, next) {
  try {
    const result = await pool.query(
      `select
        s.*,
        u.name,
        u.email
      from students s
      join users u on u.id = s.user_id
      where s.user_id = $1`,
      [req.user.id],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Student record not found" });
    return res.json({ student: result.rows[0] });
  } catch (e) {
    return next(e);
  }
}

export async function listStudents(_req, res, next) {
  try {
    const result = await pool.query(
      `select
        s.id,
        s.user_id,
        u.name,
        u.email,
        s.class,
        s.section,
        s.parent_name,
        s.parent_contact,
        s.address
      from students s
      join users u on u.id = s.user_id
      order by s.id desc`,
    );
    return res.json({ students: result.rows });
  } catch (e) {
    return next(e);
  }
}

export async function createStudent(req, res, next) {
  try {
    const { user_id, class: klass, section, parent_name, parent_contact, address } =
      req.validated.body;

    const user = await pool.query("select id, role from users where id = $1", [user_id]);
    if (user.rowCount === 0) return res.status(400).json({ error: "user_id not found" });
    if (user.rows[0].role !== "student")
      return res.status(400).json({ error: "user_id must have role=student" });

    const existing = await pool.query("select id from students where user_id = $1", [user_id]);
    if (existing.rowCount > 0) return res.status(409).json({ error: "Student already exists" });

    const created = await pool.query(
      `insert into students (user_id, class, section, parent_name, parent_contact, address)
       values ($1, $2, $3, $4, $5, $6)
       returning *`,
      [user_id, klass, section, parent_name, parent_contact, address],
    );
    return res.status(201).json({ student: created.rows[0] });
  } catch (e) {
    return next(e);
  }
}

export async function updateStudent(req, res, next) {
  try {
    const id = req.validated.params.id;
    const fields = req.validated.body;

    const keys = Object.keys(fields);
    const setSql = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
    const values = keys.map((k) => fields[k]);

    const updated = await pool.query(
      `update students set ${setSql}
       where id = $${keys.length + 1}
       returning *`,
      [...values, id],
    );

    if (updated.rowCount === 0) return res.status(404).json({ error: "Student not found" });
    return res.json({ student: updated.rows[0] });
  } catch (e) {
    return next(e);
  }
}

export async function deleteStudent(req, res, next) {
  try {
    const id = req.validated.params.id;
    const deleted = await pool.query("delete from students where id = $1 returning id", [id]);
    if (deleted.rowCount === 0) return res.status(404).json({ error: "Student not found" });
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
}

