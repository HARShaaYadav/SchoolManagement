import { pool } from "../config/db.js";

export async function markAttendance(req, res, next) {
  try {
    const { student_id, date, status } = req.validated.body;
    const markedBy = req.user.role === "teacher" ? req.user.id : null;

    const studentExists = await pool.query("select id from students where id = $1", [student_id]);
    if (studentExists.rowCount === 0) return res.status(400).json({ error: "student_id not found" });

    const upserted = await pool.query(
      `insert into attendance (student_id, date, status, marked_by_user_id)
       values ($1, $2, $3, $4)
       on conflict (student_id, date)
       do update set status = excluded.status, marked_by_user_id = excluded.marked_by_user_id
       returning *`,
      [student_id, date, status, markedBy],
    );

    return res.status(201).json({ attendance: upserted.rows[0] });
  } catch (e) {
    return next(e);
  }
}

export async function getAttendanceByDate(req, res, next) {
  try {
    const { date } = req.validated.params;
    const result = await pool.query(
      `select
        a.id,
        a.student_id,
        u.name as student_name,
        s.class,
        s.section,
        a.date,
        a.status,
        a.marked_by_user_id
      from attendance a
      join students s on s.id = a.student_id
      join users u on u.id = s.user_id
      where a.date = $1
      order by s.class, s.section, u.name`,
      [date],
    );
    return res.json({ attendance: result.rows });
  } catch (e) {
    return next(e);
  }
}

export async function getStudentAttendance(req, res, next) {
  try {
    const studentId = req.validated.params.id;

    if (req.user.role === "student") {
      const own = await pool.query("select id from students where id = $1 and user_id = $2", [
        studentId,
        req.user.id,
      ]);
      if (own.rowCount === 0) return res.status(403).json({ error: "Forbidden" });
    }

    const result = await pool.query(
      `select id, student_id, date, status, marked_by_user_id
       from attendance
       where student_id = $1
       order by date desc`,
      [studentId],
    );
    return res.json({ attendance: result.rows });
  } catch (e) {
    return next(e);
  }
}

