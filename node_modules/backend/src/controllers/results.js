import { pool } from "../config/db.js";

export async function createResult(req, res, next) {
  try {
    const { student_id, exam_id, subject, marks, total_marks } = req.validated.body;

    const studentExists = await pool.query("select id from students where id = $1", [student_id]);
    if (studentExists.rowCount === 0) return res.status(400).json({ error: "student_id not found" });

    const examExists = await pool.query("select id from exams where id = $1", [exam_id]);
    if (examExists.rowCount === 0) return res.status(400).json({ error: "exam_id not found" });

    const created = await pool.query(
      `insert into results (student_id, exam_id, subject, marks, total_marks)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [student_id, exam_id, subject, marks, total_marks],
    );
    return res.status(201).json({ result: created.rows[0] });
  } catch (e) {
    return next(e);
  }
}

export async function getResultsForStudent(req, res, next) {
  try {
    const studentId = req.validated.params.studentId;

    if (req.user.role === "student") {
      const own = await pool.query("select id from students where id = $1 and user_id = $2", [
        studentId,
        req.user.id,
      ]);
      if (own.rowCount === 0) return res.status(403).json({ error: "Forbidden" });
    }

    const result = await pool.query(
      `select
        r.*,
        e.name as exam_name,
        e.class as exam_class,
        e.date as exam_date
      from results r
      join exams e on e.id = r.exam_id
      where r.student_id = $1
      order by e.date desc, r.id desc`,
      [studentId],
    );
    return res.json({ results: result.rows });
  } catch (e) {
    return next(e);
  }
}

