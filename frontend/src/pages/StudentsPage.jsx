import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api.js'
import { useAuth } from '../auth/useAuth.js'
import { useClassSelection } from '../class/useClassSelection.js'

export function StudentsPage() {
  const { user } = useAuth()
  const { selectedClassId, selectedClass } = useClassSelection()
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    user_id: '',
    parent_name: '',
    parent_contact: '',
    address: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/students', { params: selectedClassId ? { class_id: selectedClassId } : {} })
      setStudents(res.data.students || [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [selectedClassId])

  useEffect(() => {
    load()
  }, [load])

  async function addStudent(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/students', {
        ...form,
        user_id: Number(form.user_id),
        class_id: Number(selectedClassId),
      })
      setForm({ user_id: '', parent_name: '', parent_contact: '', address: '' })
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to add student')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold text-slate-900">Students</div>
        <div className="text-sm text-slate-500">Manage student records</div>
      </div>

      {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {user?.role === 'admin' ? (
        <form onSubmit={addStudent} className="rounded-xl border bg-slate-50 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-900">Add student</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input label="Student User ID (from register)" value={form.user_id} onChange={(v) => setForm((s) => ({ ...s, user_id: v }))} />
            <ReadOnly label="Selected Class" value={selectedClass ? `Class ${selectedClass.class_name} - ${selectedClass.section}` : '—'} />
            <Input label="Parent Name" value={form.parent_name} onChange={(v) => setForm((s) => ({ ...s, parent_name: v }))} />
            <Input label="Parent Contact" value={form.parent_contact} onChange={(v) => setForm((s) => ({ ...s, parent_contact: v }))} />
            <Input label="Address" value={form.address} onChange={(v) => setForm((s) => ({ ...s, address: v }))} />
          </div>
          <div className="mt-3">
            <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Add
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-xl border">
        <div className="bg-white p-3 text-sm font-semibold text-slate-900">Student list</div>
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-t bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Class</th>
                <th className="px-3 py-2">Section</th>
                <th className="px-3 py-2">Parent</th>
                <th className="px-3 py-2">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {loading ? (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={6}>
                    No students yet
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">{s.name}</td>
                    <td className="px-3 py-2 text-slate-700">{s.email}</td>
                    <td className="px-3 py-2">{s.class_name ?? s.class}</td>
                    <td className="px-3 py-2">{s.section}</td>
                    <td className="px-3 py-2">{s.parent_name}</td>
                    <td className="px-3 py-2">{s.parent_contact}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

