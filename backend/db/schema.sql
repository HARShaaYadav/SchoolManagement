-- School Management System schema (PostgreSQL)

create table if not exists users (
  id bigserial primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('admin', 'teacher', 'student')),
  created_at timestamptz not null default now()
);

create table if not exists students (
  id bigserial primary key,
  user_id bigint not null unique references users(id) on delete cascade,
  class text not null,
  section text not null,
  parent_name text not null,
  parent_contact text not null,
  address text not null
);

create table if not exists teachers (
  id bigserial primary key,
  user_id bigint not null unique references users(id) on delete cascade,
  subject text not null,
  assigned_class text not null
);

create table if not exists attendance (
  id bigserial primary key,
  student_id bigint not null references students(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present', 'absent')),
  marked_by_user_id bigint null references users(id) on delete set null,
  unique (student_id, date)
);

create index if not exists idx_attendance_student_id on attendance(student_id);
create index if not exists idx_attendance_date on attendance(date);

create table if not exists fees (
  id bigserial primary key,
  student_id bigint not null references students(id) on delete cascade,
  amount numeric(12,2) not null,
  due_date date not null,
  status text not null check (status in ('paid', 'pending')),
  paid_on timestamptz null
);

create index if not exists idx_fees_student_id on fees(student_id);
create index if not exists idx_fees_due_date on fees(due_date);

create table if not exists exams (
  id bigserial primary key,
  name text not null,
  class text not null,
  date date not null
);

create table if not exists results (
  id bigserial primary key,
  student_id bigint not null references students(id) on delete cascade,
  exam_id bigint not null references exams(id) on delete cascade,
  subject text not null,
  marks numeric(8,2) not null,
  total_marks numeric(8,2) not null
);

create index if not exists idx_results_student_id on results(student_id);
create index if not exists idx_results_exam_id on results(exam_id);

