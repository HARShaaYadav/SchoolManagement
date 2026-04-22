import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api.js'
import { useAuth } from '../auth/useAuth.js'

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function AttendancePage() {
  const { user } = useAuth()
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [myRows, setMyRows] = useState([])
  const [date, setDate] = useState(() => todayISO())
  const [mark, setMark] = useState({ student_id: '', status: 'present' })

  const isStaff = useMemo(() => user?.role === 'admin' || user?.role === 'teacher', [user?.role])

  const loadForDate = useCallback(async () => {
    setError('')
    try {
      const res = await api.get(`/attendance/${date}`)
      setRows(res.data.attendance || [])
    } catch (e) {
      setRows([])
      setError(e?.response?.data?.error || 'Failed to load attendance')
    }
  }, [date])

  const loadMyAttendance = useCallback(async () => {
    setError('')
    try {
      const me = await api.get('/students/me')
      const studentId = me.data.student.id
      const res = await api.get(`/attendance/student/${studentId}`)
      setMyRows(res.data.attendance || [])
    } catch (e) {
      setMyRows([])
      setError(e?.response?.data?.error || 'Failed to load attendance')
    }
  }, [])

  useEffect(() => {
    if (isStaff) loadForDate()
    else loadMyAttendance()
  }, [isStaff, loadForDate, loadMyAttendance])

  async function markAttendance(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/attendance/mark', {
        student_id: Number(mark.student_id),
        date,
        status: mark.status,
      })
      setMark((s) => ({ ...s, student_id: '' }))
      await loadForDate()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to mark attendance')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold text-slate-900">Attendance</div>
        <div className="text-sm text-slate-500">
          {isStaff ? 'Mark and review attendance by date' : 'Your attendance history'}
        </div>
      </div>

      {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {isStaff ? (
        <>
          <div className="flex flex-col gap-3 rounded-xl border bg-slate-50 p-4 md:flex-row md:items-end md:justify-between">
            <label className="block">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Date</div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </label>

            <form onSubmit={markAttendance} className="flex flex-1 flex-col gap-3 md:flex-row md:items-end">
              <label className="block flex-1">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Student ID</div>
                <input
                  value={mark.student_id}
                  onChange={(e) => setMark((s) => ({ ...s, student_id: e.target.value }))}
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Status</div>
                <select
                  value={mark.status}
                  onChange={(e) => setMark((s) => ({ ...s, status: e.target.value }))}
                  className="rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                </select>
              </label>
              <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Mark
              </button>
            </form>
          </div>

          <Table
            columns={['Student', 'Class', 'Section', 'Status']}
            rows={rows.map((r) => [r.student_name, r.class, r.section, r.status])}
            empty="No attendance marked for this date"
          />
        </>
      ) : (
        <Table
          columns={['Date', 'Status']}
          rows={myRows.map((r) => [String(r.date).slice(0, 10), r.status])}
          empty="No attendance records yet"
        />
      )}
    </div>
  )
}

function Table({ columns, rows, empty }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y bg-white">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-3 text-slate-500">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {r.map((cell, idx) => (
                  <td key={idx} className="px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

