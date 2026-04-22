import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api.js'
import { useAuth } from '../auth/useAuth.js'

export function ResultsPage() {
  const { user } = useAuth()
  const isStaff = useMemo(() => user?.role === 'admin' || user?.role === 'teacher', [user?.role])

  const [error, setError] = useState('')
  const [results, setResults] = useState([])
  const [studentId, setStudentId] = useState('')
  const [form, setForm] = useState({ student_id: '', exam_id: '', subject: '', marks: '', total_marks: '' })

  async function loadForStudent(id) {
    setError('')
    try {
      const res = await api.get(`/results/${id}`)
      setResults(res.data.results || [])
    } catch (e) {
      setResults([])
      setError(e?.response?.data?.error || 'Failed to load results')
    }
  }

  useEffect(() => {
    if (isStaff) return
    ;(async () => {
      try {
        const me = await api.get('/students/me')
        await loadForStudent(me.data.student.id)
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to load results')
      }
    })()
  }, [isStaff])

  async function search(e) {
    e.preventDefault()
    if (!studentId) return
    await loadForStudent(Number(studentId))
  }

  async function addResult(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/results', {
        student_id: Number(form.student_id),
        exam_id: Number(form.exam_id),
        subject: form.subject,
        marks: Number(form.marks),
        total_marks: Number(form.total_marks),
      })
      setForm({ student_id: '', exam_id: '', subject: '', marks: '', total_marks: '' })
      if (studentId) await loadForStudent(Number(studentId))
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create result')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold text-slate-900">Results</div>
        <div className="text-sm text-slate-500">{isStaff ? 'Enter marks and view results' : 'Your report'}</div>
      </div>

      {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {isStaff ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <form onSubmit={search} className="rounded-xl border bg-slate-50 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-900">View results</div>
            <div className="flex gap-3">
              <Input label="Student ID" value={studentId} onChange={setStudentId} />
              <div className="flex items-end">
                <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  Search
                </button>
              </div>
            </div>
          </form>

          <form onSubmit={addResult} className="rounded-xl border bg-slate-50 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-900">Enter marks</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input label="Student ID" value={form.student_id} onChange={(v) => setForm((s) => ({ ...s, student_id: v }))} />
              <Input label="Exam ID" value={form.exam_id} onChange={(v) => setForm((s) => ({ ...s, exam_id: v }))} />
              <Input label="Subject" value={form.subject} onChange={(v) => setForm((s) => ({ ...s, subject: v }))} />
              <Input label="Marks" value={form.marks} onChange={(v) => setForm((s) => ({ ...s, marks: v }))} />
              <Input label="Total marks" value={form.total_marks} onChange={(v) => setForm((s) => ({ ...s, total_marks: v }))} />
            </div>
            <div className="mt-3">
              <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2">Exam</th>
              <th className="px-3 py-2">Subject</th>
              <th className="px-3 py-2">Marks</th>
              <th className="px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {results.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={4}>
                  No results yet
                </td>
              </tr>
            ) : (
              results.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">{r.exam_name || r.exam_id}</td>
                  <td className="px-3 py-2">{r.subject}</td>
                  <td className="px-3 py-2">{r.marks}</td>
                  <td className="px-3 py-2">{r.total_marks}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Input({ label, value, onChange }) {
  return (
    <label className="block flex-1">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
      />
    </label>
  )
}

