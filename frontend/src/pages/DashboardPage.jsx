import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api.js'
import { useAuth } from '../auth/useAuth.js'

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function DashboardPage() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState({ totalStudents: null, presentToday: null, absentToday: null, feesPending: null })

  const date = useMemo(() => todayISO(), [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const next = { totalStudents: null, presentToday: null, absentToday: null, feesPending: null }

      if (user?.role === 'admin' || user?.role === 'teacher') {
        try {
          const students = await api.get('/students')
          next.totalStudents = students.data.students.length
        } catch (e) {
          void e
        }

        try {
          const attendance = await api.get(`/attendance/${date}`)
          const rows = attendance.data.attendance || []
          next.presentToday = rows.filter((r) => r.status === 'present').length
          next.absentToday = rows.filter((r) => r.status === 'absent').length
        } catch (e) {
          void e
        }

        try {
          const fees = await api.get('/fees')
          const rows = fees.data.fees || []
          next.feesPending = rows.filter((f) => f.status === 'pending').length
        } catch (e) {
          void e
        }
      } else if (user?.role === 'student') {
        try {
          const fees = await api.get('/fees')
          const rows = fees.data.fees || []
          next.feesPending = rows.filter((f) => f.status === 'pending').length
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
  }, [date, user?.role])

  return (
    <div>
      <div className="mb-4">
        <div className="text-lg font-semibold text-slate-900">Dashboard</div>
        <div className="text-sm text-slate-500">Key metrics for day-to-day operations</div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Total Students" value={metrics.totalStudents} hidden={user?.role === 'student'} />
        <Card title="Present Today" value={metrics.presentToday} hidden={user?.role === 'student'} />
        <Card title="Absent Today" value={metrics.absentToday} hidden={user?.role === 'student'} />
        <Card title="Fees Pending" value={metrics.feesPending} />
      </div>

      <div className="mt-6 rounded-xl border bg-slate-50 p-4">
        <div className="text-sm font-semibold text-slate-900">Quick start</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {user?.role === 'admin' ? (
            <>
              <li>Create users (register) then add student records in Students</li>
              <li>Create exams in Exams, then enter marks in Results</li>
              <li>Add fees in Fees and mark payment when received</li>
            </>
          ) : user?.role === 'teacher' ? (
            <>
              <li>Mark attendance quickly in Attendance</li>
              <li>Enter results (marks) in Results</li>
            </>
          ) : (
            <>
              <li>Check your fees status in Fees</li>
              <li>View your results in Results</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}

function Card({ title, value, hidden }) {
  if (hidden) return null
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value ?? '—'}</div>
    </div>
  )
}

