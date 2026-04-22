import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api.js'
import { useAuth } from '../auth/useAuth.js'

export function FeesPage() {
  const { user } = useAuth()
  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role])
  const [fees, setFees] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ student_id: '', amount: '', due_date: '' })

  async function load() {
    setError('')
    try {
      const res = await api.get('/fees')
      setFees(res.data.fees || [])
    } catch (e) {
      setFees([])
      setError(e?.response?.data?.error || 'Failed to load fees')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function addFee(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/fees', {
        student_id: Number(form.student_id),
        amount: Number(form.amount),
        due_date: form.due_date,
      })
      setForm({ student_id: '', amount: '', due_date: '' })
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to add fee')
    }
  }

  async function pay(id) {
    setError('')
    try {
      await api.put(`/fees/pay/${id}`)
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to mark paid')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold text-slate-900">Fees</div>
        <div className="text-sm text-slate-500">{isAdmin ? 'Create and track fee payments' : 'Your fee status'}</div>
      </div>

      {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {isAdmin ? (
        <form onSubmit={addFee} className="rounded-xl border bg-slate-50 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-900">Add fee</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input label="Student ID" value={form.student_id} onChange={(v) => setForm((s) => ({ ...s, student_id: v }))} />
            <Input label="Amount" value={form.amount} onChange={(v) => setForm((s) => ({ ...s, amount: v }))} />
            <label className="block">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Due date</div>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((s) => ({ ...s, due_date: e.target.value }))}
                className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </label>
          </div>
          <div className="mt-3">
            <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">Add</button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              {isAdmin ? <th className="px-3 py-2">Student</th> : null}
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Due</th>
              <th className="px-3 py-2">Status</th>
              {isAdmin ? <th className="px-3 py-2">Action</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {fees.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={isAdmin ? 5 : 3}>
                  No fees yet
                </td>
              </tr>
            ) : (
              fees.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  {isAdmin ? <td className="px-3 py-2 font-medium text-slate-900">{f.student_name || f.student_id}</td> : null}
                  <td className="px-3 py-2">{Number(f.amount).toFixed(2)}</td>
                  <td className="px-3 py-2">{String(f.due_date).slice(0, 10)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        f.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  {isAdmin ? (
                    <td className="px-3 py-2">
                      {f.status === 'pending' ? (
                        <button
                          className="rounded-md border px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={() => pay(f.id)}
                        >
                          Mark paid
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                  ) : null}
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

