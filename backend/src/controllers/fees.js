import { pool } from "../config/db.js";

export async function listFees(req, res, next) {
  try {
    if (req.user.role === "student") {
      const result = await pool.query(
        `select f.*
         from fees f
         join students s on s.id = f.student_id
         where s.user_id = $1
         order by f.due_date desc, f.id desc`,
        [req.user.id],
      );
      return res.json({ fees: result.rows });
    }

    const result = await pool.query(
      `select
        f.*,
        u.name as student_name,
        s.class,
        s.section
      from fees f
      join students s on s.id = f.student_id
      join users u on u.id = s.user_id
      order by f.due_date desc, f.id desc`,
    );
    return res.json({ fees: result.rows });
  } catch (e) {
    return next(e);
  }
}

export async function addFee(req, res, next) {
  try {
    const { student_id, amount, due_date } = req.validated.body;

    const studentExists = await pool.query("select id from students where id = $1", [student_id]);
    if (studentExists.rowCount === 0) return res.status(400).json({ error: "student_id not found" });

    const created = await pool.query(
      `insert into fees (student_id, amount, due_date, status)
       values ($1, $2, $3, 'pending')
       returning *`,
      [student_id, amount, due_date],
    );
    return res.status(201).json({ fee: created.rows[0] });
  } catch (e) {
    return next(e);
  }
}

export async function payFee(req, res, next) {
  try {
    const id = req.validated.params.id;
    const updated = await pool.query(
      `update fees
       set status = 'paid', paid_on = now()
       where id = $1
       returning *`,
      [id],
    );
    if (updated.rowCount === 0) return res.status(404).json({ error: "Fee not found" });
    return res.json({ fee: updated.rows[0] });
  } catch (e) {
    return next(e);
  }
}

