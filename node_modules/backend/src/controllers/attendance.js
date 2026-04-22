import { pool } from "../config/db.js";

async function getTeacherAssignment(userId) {
  const result = await pool.query(
    `select id, subject, assigned_class_id
     from teachers
     where user_id = $1`,
    [userId],
  );

  return result.rows[0] || null;
}

export async function markAttendance(req, res, next) {
  try {
    const { student_id, class_id, date, subject, status } = req.validated.body;
    const markedBy = req.user.role === "teacher" ? req.user.id : null;
    let effectiveSubject = subject;

    if (req.user.role === "teacher") {
      const teacher = await getTeacherAssignment(req.user.id);
      if (!teacher?.subject) return res.status(403).json({ error: "Teacher subject is not configured" });
      effectiveSubject = teacher.subject;
    }

    const student = await pool.query("select id, class_id from students where id = $1", [
      student_id,
    ]);
    if (student.rowCount === 0) return res.status(400).json({ error: "student_id not found" });
    if (Number(student.rows[0].class_id) !== Number(class_id))
      return res.status(400).json({ error: "student_id not in selected class" });

    const upserted = await pool.query(
      `insert into attendance (student_id, class_id, date, subject, status, marked_by_user_id)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (student_id, date, subject)
       do update set
         status = excluded.status,
         marked_by_user_id = excluded.marked_by_user_id,
         class_id = excluded.class_id,
         subject = excluded.subject
       returning *`,
      [student_id, class_id, date, effectiveSubject, status, markedBy],
    );

    return res.status(201).json({ attendance: upserted.rows[0] });
  } catch (e) {
    return next(e);
  }
}

export async function getAttendanceByDate(req, res, next) {
  try {
    const date = req.query.date || req.validated?.params?.date;
    const classId = req.query.class_id ? Number(req.query.class_id) : null;
    const section = req.query.section ? String(req.query.section) : null;
    let subject = req.query.subject ? String(req.query.subject).trim() : null;

    if (!date) return res.status(400).json({ error: "date is required" });
    if (req.user.role === "teacher") {
      const teacher = await getTeacherAssignment(req.user.id);
      if (!teacher?.subject) return res.status(403).json({ error: "Teacher subject is not configured" });
      subject = teacher.subject;
    }

    const values = [date];
    const where = ["a.date = $1"];

    if (classId) {
      values.push(classId);
      where.push(`a.class_id = $${values.length}`);
    }
    if (section) {
      values.push(section);
      where.push(`c.section = $${values.length}`);
    }
    if (subject) {
      values.push(subject);
      where.push(`a.subject = $${values.length}`);
    }

    const result = await pool.query(
      `select
        a.id,
        a.student_id,
        u.name as student_name,
        a.class_id,
        c.class_name,
        c.section,
        a.date,
        a.subject,
        a.status,
        a.marked_by_user_id,
        coalesce(summary.total_days, 0)::int as total_days_till_date,
        coalesce(summary.present_days, 0)::int as present_days_till_date,
        case
          when coalesce(summary.total_days, 0) = 0 then 0
          else round((summary.present_days::numeric * 100) / summary.total_days, 2)
        end as percentage_till_date
      from attendance a
      join students s on s.id = a.student_id
      join users u on u.id = s.user_id
      join classes c on c.id = a.class_id
      left join lateral (
        select
          count(*)::int as total_days,
          count(*) filter (where history.status = 'present')::int as present_days
        from attendance history
        where history.student_id = a.student_id
          and history.subject = a.subject
          and history.date <= a.date
      ) summary on true
      where ${where.join(" and ")}
      order by c.class_name, c.section, u.name`,
      values,
    );
    return res.json({ attendance: result.rows });
  } catch (e) {
    return next(e);
  }
}

export async function getStudentAttendance(req, res, next) {
  try {
    const studentId = req.validated.params.id;
    let subject = req.query.subject ? String(req.query.subject).trim() : null;

    if (req.user.role === "student") {
      const own = await pool.query("select id from students where id = $1 and user_id = $2", [
        studentId,
        req.user.id,
      ]);
      if (own.rowCount === 0) return res.status(403).json({ error: "Forbidden" });
    }

    if (req.user.role === "teacher") {
      const teacher = await getTeacherAssignment(req.user.id);
      if (!teacher?.subject) return res.status(403).json({ error: "Teacher subject is not configured" });
      subject = teacher.subject;
    }

    const values = [studentId];
    const where = ["student_id = $1"];

    if (subject) {
      values.push(subject);
      where.push(`subject = $${values.length}`);
    }

    const result = await pool.query(
      `select id, student_id, date, subject, status, marked_by_user_id
       from attendance
       where ${where.join(" and ")}
       order by date desc`,
      values,
    );

    const summary = await pool.query(
      `select
        count(*)::int as total_days,
        count(*) filter (where status = 'present')::int as present_days
       from attendance
       where ${where.join(" and ")}`,
      values,
    );

    const totalDays = summary.rows[0]?.total_days ?? 0;
    const presentDays = summary.rows[0]?.present_days ?? 0;
    const percentageTillDate = totalDays === 0 ? 0 : Number(((presentDays * 100) / totalDays).toFixed(2));

    return res.json({
      attendance: result.rows,
      summary: {
        total_days: totalDays,
        present_days: presentDays,
        percentage_till_date: percentageTillDate,
      },
    });
  } catch (e) {
    return next(e);
  }
}
