-- School Management System schema (PostgreSQL)

create table if not exists users (
  id bigserial primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('admin', 'teacher', 'student')),
  admission_id text unique,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now()
);

alter table users add column if not exists admission_id text;
alter table users add column if not exists must_change_password boolean not null default false;
create unique index if not exists idx_users_admission_id_unique
  on users(admission_id)
  where admission_id is not null;

create table if not exists classes (
  id bigserial primary key,
  class_name int not null check (class_name between 1 and 12),
  section text not null,
  class_teacher_id bigint null,
  unique (class_name, section)
);

create table if not exists students (
  id bigserial primary key,
  user_id bigint not null unique references users(id) on delete cascade,
  class_id bigint not null references classes(id),
  class text not null,
  section text not null,
  phone_number text,
  blood_group text,
  profile_photo_url text,
  parent_name text not null,
  parent_contact text not null,
  address text not null
);

alter table students add column if not exists phone_number text;
alter table students add column if not exists blood_group text;
alter table students add column if not exists profile_photo_url text;

create table if not exists teachers (
  id bigserial primary key,
  user_id bigint not null unique references users(id) on delete cascade,
  subject text not null,
  assigned_class text not null,
  assigned_class_id bigint null references classes(id)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_classes_class_teacher'
  ) then
    alter table classes
      add constraint fk_classes_class_teacher
      foreign key (class_teacher_id) references teachers(id) on delete set null;
  end if;
end
$$;

create table if not exists attendance (
  id bigserial primary key,
  student_id bigint not null references students(id) on delete cascade,
  class_id bigint not null references classes(id),
  date date not null,
  status text not null check (status in ('present', 'absent')),
  marked_by_user_id bigint null references users(id) on delete set null,
  unique (student_id, date)
);

create index if not exists idx_attendance_student_id on attendance(student_id);
create index if not exists idx_attendance_date on attendance(date);
create index if not exists idx_attendance_class_id on attendance(class_id);

create table if not exists fees (
  id bigserial primary key,
  student_id bigint not null references students(id) on delete cascade,
  class_id bigint not null references classes(id),
  amount numeric(12,2) not null,
  due_date date not null,
  status text not null check (status in ('paid', 'pending')),
  paid_on timestamptz null
);

create index if not exists idx_fees_student_id on fees(student_id);
create index if not exists idx_fees_due_date on fees(due_date);
create index if not exists idx_fees_class_id on fees(class_id);

create table if not exists exams (
  id bigserial primary key,
  name text not null,
  class_id bigint not null references classes(id),
  class text not null,
  date date not null
);

create index if not exists idx_exams_class_id on exams(class_id);

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
