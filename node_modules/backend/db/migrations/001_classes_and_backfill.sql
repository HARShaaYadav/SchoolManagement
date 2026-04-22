-- Migration: introduce classes + class_id segregation (backward compatible)
-- Safe to run on an existing DB.

begin;

-- 1) Create classes table (if missing)
create table if not exists classes (
  id bigserial primary key,
  class_name int not null check (class_name between 1 and 12),
  section text not null,
  class_teacher_id bigint null,
  unique (class_name, section)
);

-- 2) Ensure default class exists: Class 1, Section A
insert into classes (class_name, section)
values (1, 'A')
on conflict (class_name, section) do nothing;

-- Capture default class id
with d as (select id from classes where class_name = 1 and section = 'A' limit 1)
select id from d;

-- 3) Students: add class_id, backfill, keep old columns intact
alter table students add column if not exists class_id bigint;

update students
set class_id = (select id from classes where class_name = 1 and section = 'A')
where class_id is null;

-- Keep existing behavior: if old text columns are empty for any reason, backfill them too
update students
set class = '1'
where class is null or btrim(class) = '';

update students
set section = 'A'
where section is null or btrim(section) = '';

alter table students
  alter column class_id set not null;

alter table students
  add constraint if not exists fk_students_class_id
  foreign key (class_id) references classes(id);

create index if not exists idx_students_class_id on students(class_id);

-- 4) Teachers: add assigned_class_id (optional)
alter table teachers add column if not exists assigned_class_id bigint;
alter table teachers
  add constraint if not exists fk_teachers_assigned_class_id
  foreign key (assigned_class_id) references classes(id);
create index if not exists idx_teachers_assigned_class_id on teachers(assigned_class_id);

-- Add FK from classes -> teachers (optional mapping)
alter table classes
  add constraint if not exists fk_classes_class_teacher
  foreign key (class_teacher_id) references teachers(id) on delete set null;

-- 5) Attendance: add class_id, backfill from student, enforce not null
alter table attendance add column if not exists class_id bigint;

update attendance a
set class_id = s.class_id
from students s
where a.student_id = s.id and a.class_id is null;

-- Any remaining nulls go to default class
update attendance
set class_id = (select id from classes where class_name = 1 and section = 'A')
where class_id is null;

alter table attendance alter column class_id set not null;
alter table attendance
  add constraint if not exists fk_attendance_class_id
  foreign key (class_id) references classes(id);

create index if not exists idx_attendance_class_id on attendance(class_id);

-- 6) Fees: add class_id, backfill from student, enforce not null
alter table fees add column if not exists class_id bigint;

update fees f
set class_id = s.class_id
from students s
where f.student_id = s.id and f.class_id is null;

update fees
set class_id = (select id from classes where class_name = 1 and section = 'A')
where class_id is null;

alter table fees alter column class_id set not null;
alter table fees
  add constraint if not exists fk_fees_class_id
  foreign key (class_id) references classes(id);

create index if not exists idx_fees_class_id on fees(class_id);

-- 7) Exams: add class_id, backfill default, enforce not null
alter table exams add column if not exists class_id bigint;

update exams
set class_id = (select id from classes where class_name = 1 and section = 'A')
where class_id is null;

-- Preserve old text field for compatibility
update exams
set class = '1'
where class is null or btrim(class) = '';

alter table exams alter column class_id set not null;
alter table exams
  add constraint if not exists fk_exams_class_id
  foreign key (class_id) references classes(id);

create index if not exists idx_exams_class_id on exams(class_id);

commit;

