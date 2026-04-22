import { pool } from "../config/db.js";

export async function listExams(_req, res, next) {
  try {
    const result = await pool.query("select * from exams order by date desc, id desc");
    return res.json({ exams: result.rows });
  } catch (e) {
    return next(e);
  }
}

export async function createExam(req, res, next) {
  try {
    const { name, class: klass, date } = req.validated.body;
    const created = await pool.query(
      `insert into exams (name, class, date)
       values ($1, $2, $3)
       returning *`,
      [name, klass, date],
    );
    return res.status(201).json({ exam: created.rows[0] });
  } catch (e) {
    return next(e);
  }
}

