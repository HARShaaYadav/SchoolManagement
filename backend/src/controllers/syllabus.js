import { pool } from "../config/db.js";

export async function listSyllabus(req, res, next) {
  try {
    const classId = req.query.class_id ? Number(req.query.class_id) : null;
    const section = req.query.section ? String(req.query.section) : null;

    const where = [];
    const values = [];

    if (classId) {
      values.push(classId);
      where.push(`s.class_id = $${values.length}`);
    }

    if (section) {
      values.push(section);
      where.push(`c.section = $${values.length}`);
    }

    const result = await pool.query(
      `select
        s.*,
        c.class_name,
        c.section
      from syllabus s
      join classes c on c.id = s.class_id
      ${where.length ? `where ${where.join(" and ")}` : ""}
      order by lower(s.subject), s.created_at desc, s.id desc`,
      values,
    );

    return res.json({ syllabus: result.rows });
  } catch (e) {
    return next(e);
  }
}

export async function createSyllabus(req, res, next) {
  try {
    const { class_id, subject, title, description } = req.validated.body;

    const klass = await pool.query("select class_name from classes where id = $1", [class_id]);
    if (klass.rowCount === 0) return res.status(400).json({ error: "class_id not found" });

    const className = String(klass.rows[0].class_name);
    const created = await pool.query(
      `insert into syllabus (class_id, class, subject, title, description)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [class_id, className, subject.trim(), title.trim(), description.trim()],
    );

    return res.status(201).json({ syllabus: created.rows[0] });
  } catch (e) {
    return next(e);
  }
}
