import bcrypt from "bcrypt";

import { pool } from "../config/db.js";
import { buildStudentEmail } from "./auth.js";

async function queryStudentProfile(admissionId) {
  return pool.query(
    `select
      s.id,
      u.id as user_id,
      u.admission_id,
      u.name as full_name,
      coalesce(c.class_name::text, s.class) as class,
      u.role,
      s.phone_number,
      s.blood_group,
      s.profile_photo_url,
      s.parent_name,
      s.parent_contact,
      s.address,
      c.section
    from students s
    join users u on u.id = s.user_id
    left join classes c on c.id = s.class_id
    where u.admission_id = $1`,
    [admissionId],
  );
}

export async function getMyStudent(req, res, next) {
  try {
    const result = await pool.query(
      `select
        s.*,
        u.name,
        u.email,
        u.admission_id,
        c.class_name,
        c.section as class_section
      from students s
      join users u on u.id = s.user_id
      join classes c on c.id = s.class_id
      where s.user_id = $1`,
      [req.user.id],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Student record not found" });
    return res.json({ student: result.rows[0] });
  } catch (e) {
    return next(e);
  }
}

export async function listStudents(req, res, next) {
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
        s.id,
        s.user_id,
        u.admission_id,
        u.name,
        u.email,
        s.class_id,
        c.class_name,
        c.section,
        s.phone_number,
        s.blood_group,
        s.profile_photo_url,
        s.parent_name,
        s.parent_contact,
        s.address
      from students s
      join users u on u.id = s.user_id
      join classes c on c.id = s.class_id
      ${where.length ? `where ${where.join(" and ")}` : ""}
      order by c.class_name, c.section, u.name`,
      values,
    );
    return res.json({ students: result.rows });
  } catch (e) {
    return next(e);
  }
}

export async function createStudent(req, res, next) {
  const client = await pool.connect();
  try {
    const {
      admission_id,
      full_name,
      password,
      class_id,
      phone_number,
      blood_group,
      profile_photo_url,
      parent_name,
      parent_contact,
      address,
    } = req.validated.body;

    await client.query("begin");

    const existing = await client.query("select id from users where admission_id = $1", [admission_id]);
    if (existing.rowCount > 0) {
      await client.query("rollback");
      return res.status(409).json({ error: "Admission ID already in use" });
    }

    const klass = await client.query("select class_name, section from classes where id = $1", [
      class_id,
    ]);
    if (klass.rowCount === 0) {
      await client.query("rollback");
      return res.status(400).json({ error: "class_id not found" });
    }
    const className = String(klass.rows[0].class_name);
    const section = String(klass.rows[0].section);

    const passwordHash = await bcrypt.hash(password, 10);
    const createdUser = await client.query(
      `insert into users (name, email, password_hash, role, admission_id)
       values ($1, $2, $3, 'student', $4)
       returning id, name, email, role, admission_id, must_change_password, created_at`,
      [full_name, buildStudentEmail(admission_id), passwordHash, admission_id],
    );

    const created = await client.query(
      `insert into students (
        user_id,
        class_id,
        class,
        section,
        phone_number,
        blood_group,
        profile_photo_url,
        parent_name,
        parent_contact,
        address
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      returning *`,
      [
        createdUser.rows[0].id,
        class_id,
        className,
        section,
        phone_number || null,
        blood_group || null,
        profile_photo_url || null,
        parent_name,
        parent_contact,
        address,
      ],
    );
    await client.query("commit");
    return res.status(201).json({ student: { ...created.rows[0], user: createdUser.rows[0] } });
  } catch (e) {
    await client.query("rollback");
    return next(e);
  } finally {
    client.release();
  }
}

export async function updateStudent(req, res, next) {
  const client = await pool.connect();
  try {
    const id = req.validated.params.id;
    const fields = req.validated.body;
    await client.query("begin");

    if (fields.class_id) {
      const klass = await client.query("select class_name, section from classes where id = $1", [
        fields.class_id,
      ]);
      if (klass.rowCount === 0) {
        await client.query("rollback");
        return res.status(400).json({ error: "class_id not found" });
      }
      fields.class = String(klass.rows[0].class_name);
      fields.section = String(klass.rows[0].section);
    }

    const studentLookup = await client.query(
      `select s.id, s.user_id, u.admission_id
       from students s
       join users u on u.id = s.user_id
       where s.id = $1`,
      [id],
    );
    if (studentLookup.rowCount === 0) {
      await client.query("rollback");
      return res.status(404).json({ error: "Student not found" });
    }

    const student = studentLookup.rows[0];
    const studentFields = { ...fields };
    const userUpdates = {};

    if (studentFields.full_name) {
      userUpdates.name = studentFields.full_name;
      delete studentFields.full_name;
    }

    if (studentFields.admission_id) {
      const existing = await client.query(
        "select id from users where admission_id = $1 and id <> $2",
        [studentFields.admission_id, student.user_id],
      );
      if (existing.rowCount > 0) {
        await client.query("rollback");
        return res.status(409).json({ error: "Admission ID already in use" });
      }

      userUpdates.admission_id = studentFields.admission_id;
      userUpdates.email = buildStudentEmail(studentFields.admission_id);
      delete studentFields.admission_id;
    }

    if (studentFields.password) {
      userUpdates.password_hash = await bcrypt.hash(studentFields.password, 10);
      delete studentFields.password;
    }

    const userKeys = Object.keys(userUpdates);
    if (userKeys.length > 0) {
      const userSetSql = userKeys.map((key, index) => `"${key}" = $${index + 1}`).join(", ");
      const userValues = userKeys.map((key) => userUpdates[key]);
      await client.query(
        `update users
         set ${userSetSql}
         where id = $${userKeys.length + 1}`,
        [...userValues, student.user_id],
      );
    }

    const studentKeys = Object.keys(studentFields);
    let updated;

    if (studentKeys.length > 0) {
      const setSql = studentKeys.map((key, index) => `"${key}" = $${index + 1}`).join(", ");
      const values = studentKeys.map((key) => studentFields[key]);
      updated = await client.query(
        `update students
         set ${setSql}
         where id = $${studentKeys.length + 1}
         returning *`,
        [...values, id],
      );
    } else {
      updated = await client.query("select * from students where id = $1", [id]);
    }

    await client.query("commit");
    return res.json({ student: updated.rows[0] });
  } catch (e) {
    await client.query("rollback");
    return next(e);
  } finally {
    client.release();
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

export async function getStudentProfile(req, res, next) {
  try {
    const admissionId = req.validated.params.admissionId;

    if (req.user.role === "student" && req.user.admissionId !== admissionId) {
      return res.status(403).json({ error: "Students can only access their own profile" });
    }

    const result = await queryStudentProfile(admissionId);
    if (result.rowCount === 0) return res.status(404).json({ error: "Invalid admission ID" });

    return res.json({
      student: {
        admissionId: result.rows[0].admission_id,
        fullName: result.rows[0].full_name,
        class: result.rows[0].class,
        role: "student",
        phoneNumber: result.rows[0].phone_number,
        bloodGroup: result.rows[0].blood_group,
        profilePhoto: result.rows[0].profile_photo_url,
        parentName: result.rows[0].parent_name,
        parentContact: result.rows[0].parent_contact,
        address: result.rows[0].address,
        section: result.rows[0].section,
      },
    });
  } catch (e) {
    return next(e);
  }
}
