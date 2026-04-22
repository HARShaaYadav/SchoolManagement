import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api.js'
import { useAuth } from '../auth/useAuth.js'
import { useClassSelection } from '../class/useClassSelection.js'

export function ExamsPage() {
  const { user } = useAuth()
  const { selectedClassId, selectedClass } = useClassSelection()
  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role])
  const [exams, setExams] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', date: '' })

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await api.get('/exams', { params: selectedClassId ? { class_id: selectedClassId } : {} })
      setExams(res.data.exams || [])
    } catch (e) {
      setExams([])
      setError(e?.response?.data?.error || 'Failed to load exams')
    }
  }, [selectedClassId])

  useEffect(() => {
    load()
  }, [load])

  async function createExam(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/exams', { ...form, class_id: Number(selectedClassId) })
      setForm({ name: '', date: '' })
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create exam')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold text-slate-900">Exams</div>
        <div className="text-sm text-slate-500">{isAdmin ? 'Create exams' : 'View upcoming exams'}</div>
      </div>

      {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {isAdmin ? (
        <form onSubmit={createExam} className="rounded-xl border bg-slate-50 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-900">Create exam</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input label="Exam name" value={form.name} onChange={(v) => setForm((s) => ({ ...s, name: v }))} />
            <ReadOnly
              label="Class & Section (selected)"
              value={selectedClass ? `Class ${selectedClass.class_name} - ${selectedClass.section}` : '—'}
            />
            <label className="block">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Date</div>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
                className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </label>
          </div>
          <div className="mt-3">
            <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Create
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Class</th>
              <th className="px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {exams.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={3}>
                  No exams yet
                </td>
              </tr>
            ) : (
              exams.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">{e.name}</td>
                  <td className="px-3 py-2">{e.class_name ?? e.class}</td>
                  <td className="px-3 py-2">{String(e.date).slice(0, 10)}</td>
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
    <label className="block">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
      />
    </label>
  )
}

function ReadOnly({ label, value }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</div>
      <div className="w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-700">{value}</div>
    </label>
  )
}

