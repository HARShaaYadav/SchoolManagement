import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'
import { useAuth } from '../auth/useAuth.js'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const { setAuth, token, user } = useAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')

    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation must match')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      setAuth(res.data.token || token, res.data.user || user)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="text-lg font-semibold text-slate-900">Change password</div>
          <div className="text-sm text-slate-500">
            Teachers must update their password before accessing the dashboard.
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Current Password"
            type="password"
            value={form.currentPassword}
            onChange={(value) => setForm((current) => ({ ...current, currentPassword: value }))}
          />
          <Field
            label="New Password"
            type="password"
            value={form.newPassword}
            onChange={(value) => setForm((current) => ({ ...current, newPassword: value }))}
          />
          <Field
            label="Confirm New Password"
            type="password"
            value={form.confirmPassword}
            onChange={(value) => setForm((current) => ({ ...current, confirmPassword: value }))}
          />

          {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <button
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-slate-400"
      />
    </label>
  )
}
