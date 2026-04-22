import { pool } from "../config/db.js";

export async function listClasses(_req, res, next) {
  try {
    const result = await pool.query(
      `select
        c.id,
        c.class_name,
        c.section,
        c.class_teacher_id
      from classes c
      order by c.class_name asc, c.section asc`,
    );
    return res.json({ classes: result.rows });
  } catch (e) {
    return next(e);
  }
}

export async function createClass(req, res, next) {
  try {
    const { class_name, section } = req.validated.body;

    const created = await pool.query(
      `insert into classes (class_name, section)
       values ($1, $2)
       on conflict (class_name, section) do update set section = excluded.section
       returning *`,
      [class_name, section],
    );

    return res.status(201).json({ class: created.rows[0] });
  } catch (e) {
    return next(e);
  }
}

export async function setClassTeacher(req, res, next) {
  try {
    const id = req.validated.params.id;
    const { class_teacher_id } = req.validated.body;

    if (class_teacher_id !== null) {
      const teacher = await pool.query("select id from teachers where id = $1", [class_teacher_id]);
      if (teacher.rowCount === 0) return res.status(400).json({ error: "teacher not found" });
    }

    const updated = await pool.query(
      `update classes
       set class_teacher_id = $1
       where id = $2
       returning *`,
      [class_teacher_id, id],
    );
    if (updated.rowCount === 0) return res.status(404).json({ error: "Class not found" });
    return res.json({ class: updated.rows[0] });
  } catch (e) {
    return next(e);
  }
}

