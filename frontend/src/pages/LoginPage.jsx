import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'
import { useAuth } from '../auth/useAuth.js'

export function LoginPage() {
  const { setAuth, token } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) navigate('/', { replace: true })
  }, [navigate, token])

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password, role: form.role }

      const res = await api.post(endpoint, payload)
      setAuth(res.data.token, res.data.user)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="text-lg font-semibold text-slate-900">
            {mode === 'login' ? 'Login' : 'Create account'}
          </div>
          <div className="text-sm text-slate-500">School Management System</div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' ? (
            <>
              <Field
                label="Name"
                value={form.name}
                onChange={(v) => setForm((s) => ({ ...s, name: v }))}
              />
              <div>
                <div className="mb-1 text-sm font-medium text-slate-700">Role</div>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-slate-400"
                  value={form.role}
                  onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
                >
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>
            </>
          ) : null}

          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm((s) => ({ ...s, email: v }))}
          />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) => setForm((s) => ({ ...s, password: v }))}
          />

          {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <button
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-600">
          {mode === 'login' ? (
            <>
              No account?{' '}
              <button className="font-semibold text-slate-900" onClick={() => setMode('register')}>
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className="font-semibold text-slate-900" onClick={() => setMode('login')}>
                Login
              </button>
            </>
          )}
        </div>
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
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-slate-400"
      />
    </label>
  )
}

