import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api.js'
import { useAuth } from '../auth/useAuth.js'
import { useClassSelection } from '../class/useClassSelection.js'
import { PageIntro, Panel, Pill, StatCard } from '../components/ui.jsx'

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function DashboardPage() {
  const { user } = useAuth()
  const { selectedClassId, selectedClass } = useClassSelection()
  const [metrics, setMetrics] = useState({ totalStudents: null, presentToday: null, absentToday: null, feesPending: null })
  const date = useMemo(() => todayISO(), [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const next = { totalStudents: null, presentToday: null, absentToday: null, feesPending: null }

      if (user?.role === 'admin' || user?.role === 'teacher') {
        try {
          const students = await api.get('/students', { params: selectedClassId ? { class_id: selectedClassId } : {} })
          next.totalStudents = students.data.students.length
        } catch (e) {
          void e
        }

        try {
          const attendance = await api.get('/attendance', { params: { date, ...(selectedClassId ? { class_id: selectedClassId } : {}) } })
          const rows = attendance.data.attendance || []
          next.presentToday = rows.filter((row) => row.status === 'present').length
          next.absentToday = rows.filter((row) => row.status === 'absent').length
        } catch (e) {
          void e
        }

        try {
          const fees = await api.get('/fees', { params: selectedClassId ? { class_id: selectedClassId } : {} })
          const rows = fees.data.fees || []
          next.feesPending = rows.filter((fee) => fee.status === 'pending').length
        } catch (e) {
          void e
        }
      } else if (user?.role === 'student') {
        try {
          const fees = await api.get('/fees')
          const rows = fees.data.fees || []
          next.feesPending = rows.filter((fee) => fee.status === 'pending').length
        } catch (e) {
          void e
        }
      }

      if (!cancelled) setMetrics(next)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [date, selectedClassId, user?.role])

  const title = user?.role === 'student' ? 'Your school snapshot' : 'Operations dashboard'
  const description =
    user?.role === 'student'
      ? 'Track your essentials in one place, from fee status to profile access.'
      : 'Monitor attendance, fee collection, and classroom readiness with a cleaner command center.'

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Overview"
        title={title}
        description={description}
        action={
          selectedClass && user?.role !== 'student' ? (
            <Pill tone="amber">
              Class {selectedClass.class_name} • Section {selectedClass.section}
            </Pill>
          ) : null
        }
      />

      <div className="dashboard-grid">
        {user?.role !== 'student' ? (
          <>
            <StatCard label="Total Students" value={metrics.totalStudents} helper="Registered in the active class view" />
            <StatCard label="Present Today" value={metrics.presentToday} tone="emerald" helper={`Live for ${date}`} />
            <StatCard label="Absent Today" value={metrics.absentToday} tone="rose" helper="Needs follow-up" />
          </>
        ) : null}
        <StatCard
          label="Fees Pending"
          value={metrics.feesPending}
          tone="amber"
          helper={user?.role === 'student' ? 'Outstanding payments on your account' : 'Pending collections across the active view'}
        />
      </div>

      <div className="content-grid">
        <Panel title="Action Plan" subtitle="A quick, role-aware checklist to keep work moving.">
          <div className="grid gap-3">
            {(user?.role === 'admin'
              ? [
                  'Create teacher accounts with temporary passwords and first-login resets.',
                  'Enroll students, add profile photos, and organize them by class.',
                  'Publish exams and monitor fee collections from one place.',
                  'Add syllabus entries so each class has a clear subject-wise plan.',
                ]
              : user?.role === 'teacher'
                ? [
                    'Update attendance for the selected class and review absences instantly.',
                    'Refresh student profiles when contact details or health data change.',
                    'Enter exam results and keep academic records current.',
                  ]
                : [
                    'Open your Student Profile card for the latest class and contact details.',
                    'Review fee status and follow up on any pending dues.',
                  'Use results and attendance views to keep track of progress.',
                  ]).map((item) => (
              <div key={item} className="dashboard-action-card">
                {item}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Today at a glance" subtitle="Fast context without digging through modules.">
          <div className="grid gap-4 md:grid-cols-2">
            <MiniInfo title="Active Date" value={date} />
            <MiniInfo
              title="Current Scope"
              value={
                user?.role === 'student'
                  ? 'Personal account'
                  : selectedClass
                    ? `Class ${selectedClass.class_name} - ${selectedClass.section}`
                    : 'All classes'
              }
            />
            <MiniInfo title="Role" value={user?.role || '-'} />
            <MiniInfo title="Next Best Action" value={user?.role === 'student' ? 'Review profile' : 'Open your working module'} />
          </div>
        </Panel>
      </div>
    </div>
  )
}

function MiniInfo({ title, value }) {
  return (
    <div className="mini-info">
      <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{title}</div>
      <div className="mt-2 text-base font-semibold text-slate-900">{value}</div>
    </div>
  )
}
