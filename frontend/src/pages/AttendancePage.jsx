import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api.js'
import { useAuth } from '../auth/useAuth.js'
import { useClassSelection } from '../class/useClassSelection.js'
import { DataTable, Field, Message, PageIntro, Panel, Pill, SelectField, StatCard } from '../components/ui.jsx'

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function AttendancePage() {
  const { user } = useAuth()
  const { selectedClassId, selectedClass } = useClassSelection()
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [myRows, setMyRows] = useState([])
  const [students, setStudents] = useState([])
  const [date, setDate] = useState(() => todayISO())
  const [mark, setMark] = useState({ student_id: '', subject: '', status: 'present' })
  const [mySummary, setMySummary] = useState({ total_days: 0, present_days: 0, percentage_till_date: 0 })
  const [selectedStudentSummary, setSelectedStudentSummary] = useState({ total_days: 0, present_days: 0, percentage_till_date: 0 })
  const [studentSubject, setStudentSubject] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const isStaff = useMemo(() => user?.role === 'admin' || user?.role === 'teacher', [user?.role])
  const teacherSubject = user?.role === 'teacher' ? user?.subject || '' : ''

  useEffect(() => {
    if (teacherSubject) {
      setMark((current) => (current.subject === teacherSubject ? current : { ...current, subject: teacherSubject }))
      setStudentSubject((current) => (current === teacherSubject ? current : teacherSubject))
    }
  }, [teacherSubject])

  const loadForDate = useCallback(async () => {
    setError('')
    try {
      const res = await api.get('/attendance', {
        params: {
          date,
          ...(selectedClassId ? { class_id: selectedClassId } : {}),
          ...(mark.subject ? { subject: mark.subject.trim() } : {}),
        },
      })
      setRows(res.data.attendance || [])
    } catch (e) {
      setRows([])
      setError(e?.response?.data?.error || 'Failed to load attendance')
    }
  }, [date, mark.subject, selectedClassId])

  const loadStudents = useCallback(async () => {
    try {
      if (!selectedClassId) return setStudents([])
      const res = await api.get('/students', { params: { class_id: selectedClassId } })
      setStudents(res.data.students || [])
    } catch (e) {
      void e
      setStudents([])
    }
  }, [selectedClassId])

  const loadMyAttendance = useCallback(async () => {
    setError('')
    try {
      const me = await api.get('/students/me')
      const studentId = me.data.student.id
      const res = await api.get(`/attendance/student/${studentId}`, {
        params: { ...(studentSubject ? { subject: studentSubject.trim() } : {}) },
      })
      setMyRows(res.data.attendance || [])
      setMySummary(res.data.summary || { total_days: 0, present_days: 0, percentage_till_date: 0 })
    } catch (e) {
      setMyRows([])
      setError(e?.response?.data?.error || 'Failed to load attendance')
    }
  }, [studentSubject])

  const loadSelectedStudentSummary = useCallback(async () => {
    if (!isStaff || !mark.student_id) {
      setSelectedStudentSummary({ total_days: 0, present_days: 0, percentage_till_date: 0 })
      return
    }

    try {
      const res = await api.get(`/attendance/student/${mark.student_id}`, {
        params: { ...(mark.subject ? { subject: mark.subject.trim() } : {}) },
      })
      setSelectedStudentSummary(res.data.summary || { total_days: 0, present_days: 0, percentage_till_date: 0 })
    } catch (e) {
      void e
      setSelectedStudentSummary({ total_days: 0, present_days: 0, percentage_till_date: 0 })
    }
  }, [isStaff, mark.student_id, mark.subject])

  useEffect(() => {
    if (isStaff) {
      loadStudents()
      loadForDate()
    } else {
      loadMyAttendance()
    }
  }, [isStaff, loadForDate, loadMyAttendance, loadStudents])

  useEffect(() => {
    loadSelectedStudentSummary()
  }, [loadSelectedStudentSummary])

  async function markAttendance(event) {
    event.preventDefault()
    setError('')
    try {
      await api.post('/attendance/mark', {
        student_id: Number(mark.student_id),
        class_id: Number(selectedClassId),
        date,
        subject: (teacherSubject || mark.subject).trim(),
        status: mark.status,
      })
      setMark((current) => ({ ...current, student_id: '' }))
      await loadForDate()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to mark attendance')
    }
  }

  const attendanceByDay = useMemo(() => {
    const map = new Map()
    myRows.forEach((row) => {
      const key = String(row.date).slice(0, 10)
      map.set(key, row.status)
    })
    return map
  }, [myRows])

  const monthLabel = useMemo(
    () => calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    [calendarMonth],
  )

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const first = new Date(year, month, 1)
    const startWeekday = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []

    for (let i = 0; i < startWeekday; i += 1) cells.push(null)

    for (let day = 1; day <= daysInMonth; day += 1) {
      const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      cells.push({ day, date: isoDate, status: attendanceByDay.get(isoDate) || null })
    }

    return cells
  }, [attendanceByDay, calendarMonth])

  function shiftCalendarMonth(direction) {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1))
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Attendance"
        title={isStaff ? 'Mark the day with less friction' : 'Review your attendance history'}
        description={
          isStaff
            ? 'Track presence and absences by class with a faster, cleaner daily workflow.'
            : 'See your attendance timeline in a simplified history view.'
        }
        action={selectedClass && isStaff ? <Pill tone="amber">Class {selectedClass.class_name} • {selectedClass.section}</Pill> : null}
      />

      {error ? <Message>{error}</Message> : null}

      {isStaff ? (
        <Panel title="Subject attendance register" subtitle="Choose the date, subject, and student, then mark attendance for that subject.">
          <div className="grid gap-4 lg:grid-cols-[220px_260px_minmax(0,1fr)]">
            <label className="field-shell">
              <span className="field-label">Date</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="field-input" />
            </label>
            <Field
              label={user?.role === 'teacher' ? 'Assigned subject' : 'Subject'}
              value={mark.subject}
              onChange={(value) => setMark((current) => ({ ...current, subject: value }))}
              placeholder="e.g. Mathematics"
              className={teacherSubject ? 'pointer-events-none opacity-80' : ''}
            />

            <form onSubmit={markAttendance} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_160px]">
              <SelectField label="Student" value={mark.student_id} onChange={(value) => setMark((current) => ({ ...current, student_id: value }))}>
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.admission_id})
                  </option>
                ))}
              </SelectField>
              <SelectField label="Status" value={mark.status} onChange={(value) => setMark((current) => ({ ...current, status: value }))}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </SelectField>
              <div className="flex items-end">
                <button className="app-button w-full">Mark</button>
              </div>
            </form>
          </div>

          {mark.student_id ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <StatCard label="Attendance %" value={`${selectedStudentSummary.percentage_till_date ?? 0}%`} tone="emerald" helper="Till date for this subject" />
              <StatCard label="Present days" value={selectedStudentSummary.present_days ?? 0} />
              <StatCard label="Total marked days" value={selectedStudentSummary.total_days ?? 0} />
            </div>
          ) : null}
        </Panel>
      ) : null}

      {!isStaff ? (
        <Panel title="Attendance percentage" subtitle="Your present percentage till date for the selected subject filter.">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Attendance %" value={`${mySummary.percentage_till_date ?? 0}%`} tone="emerald" helper="Till date" />
            <StatCard label="Present days" value={mySummary.present_days ?? 0} />
            <StatCard label="Total marked days" value={mySummary.total_days ?? 0} />
          </div>
        </Panel>
      ) : null}

      {!isStaff ? (
        <Panel
          title="My attendance calendar"
          subtitle="Green means present, red means absent."
          action={
            <div className="flex items-center gap-2">
              <button type="button" className="app-button px-3 py-2 text-xs" onClick={() => shiftCalendarMonth(-1)}>
                Prev
              </button>
              <span className="text-sm font-semibold text-slate-700">{monthLabel}</span>
              <button type="button" className="app-button px-3 py-2 text-xs" onClick={() => shiftCalendarMonth(1)}>
                Next
              </button>
            </div>
          }
        >
          <div className="mb-4 grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
            <Field
              label="Filter by subject"
              value={studentSubject}
              onChange={setStudentSubject}
              placeholder="Leave blank for all subjects"
              className={teacherSubject ? 'pointer-events-none opacity-80' : ''}
            />
            <div className="flex items-end gap-4 pb-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-green-500" /> Present</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500" /> Absent</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day}>{day}</div>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarCells.map((cell, index) => (
              <div key={`${cell?.date ?? `blank-${index}`}`} className={`min-h-[64px] rounded-lg border p-2 text-sm ${!cell ? 'border-transparent bg-transparent' : cell.status === 'present' ? 'border-green-300 bg-green-50 text-green-900' : cell.status === 'absent' ? 'border-red-300 bg-red-50 text-red-900' : 'border-slate-200 bg-white text-slate-700'}`}>
                {cell ? cell.day : ''}
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel title={isStaff ? 'Attendance log' : 'My attendance details'} subtitle={isStaff ? 'Review attendance for the selected class, date, and subject.' : 'Detailed attendance entries for your selected subject filter.'}>
        <DataTable
          columns={isStaff ? ['Student', 'Class', 'Section', 'Subject', 'Status', 'Attendance %'] : ['Date', 'Subject', 'Status']}
          rows={isStaff ? rows : myRows}
          empty={isStaff ? 'No attendance marked for this class and date' : 'No attendance records yet'}
          renderRow={(row, index) => (
            <tr key={row.id ?? `${row.date}-${index}`}>
              {isStaff ? (
                <>
                  <td className="font-semibold text-slate-900">{row.student_name}</td>
                  <td>{row.class_name ?? row.class}</td>
                  <td>{row.section}</td>
                  <td>{row.subject}</td>
                  <td>{row.status === 'present' ? <Pill tone="emerald">Present</Pill> : <Pill tone="rose">Absent</Pill>}</td>
                  <td>{row.percentage_till_date ?? 0}%</td>
                </>
              ) : (
                <>
                  <td className="font-semibold text-slate-900">{String(row.date).slice(0, 10)}</td>
                  <td>{row.subject}</td>
                  <td>{row.status === 'present' ? <Pill tone="emerald">Present</Pill> : <Pill tone="rose">Absent</Pill>}</td>
                </>
              )}
            </tr>
          )}
        />
      </Panel>
    </div>
  )
}
