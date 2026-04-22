import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'
import { useAuth } from '../auth/useAuth.js'
import { Field, Message, Pill } from '../components/ui.jsx'

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
]

export function LoginPage() {
  const { setAuth, token } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('admin')
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    admissionId: '',
    password: '',
    newPassword: '',
    verifierEmail: '',
    verifierPassword: '',
  })
  const [adminVerificationToken, setAdminVerificationToken] = useState('')
  const [verifiedAdmin, setVerifiedAdmin] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifyingAdmin, setVerifyingAdmin] = useState(false)

  const activeRole = useMemo(() => roles.find((option) => option.value === role) || roles[0], [role])

  useEffect(() => {
    if (token) navigate('/', { replace: true })
  }, [navigate, token])

  async function verifyExistingAdmin() {
    setError('')
    setSuccess('')
    setVerifyingAdmin(true)

    try {
      const res = await api.post('/auth/verify-admin', {
        email: form.verifierEmail.trim(),
        password: form.verifierPassword,
      })
      setAdminVerificationToken(res.data.verificationToken)
      setVerifiedAdmin(res.data.verifiedAdmin)
      setSuccess(`Verified by ${res.data.verifiedAdmin.email}`)
    } catch (err) {
      setAdminVerificationToken('')
      setVerifiedAdmin(null)
      setError(err?.response?.data?.error || 'Admin verification failed')
    } finally {
      setVerifyingAdmin(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const res = await api.post('/auth/register', {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: 'admin',
          adminVerificationToken,
        })
        setAuth(res.data.token, res.data.user)
        navigate('/', { replace: true })
        return
      }

      if (mode === 'forgot') {
        const payload =
          role === 'student'
            ? { role, admissionId: form.admissionId.trim(), newPassword: form.newPassword }
            : { role, email: form.email.trim(), newPassword: form.newPassword }

        await api.post('/auth/forgot-password', payload)
        setSuccess('Password updated. You can login now.')
        setMode('login')
        setForm((current) => ({ ...current, password: '', newPassword: '' }))
        return
      }

      const payload =
        role === 'student'
          ? { role, admissionId: form.admissionId.trim(), password: form.password }
          : { role, email: form.email.trim(), password: form.password }

      const res = await api.post('/auth/login', payload)
      setAuth(res.data.token, res.data.user)
      navigate(res.data.user?.role === 'student' ? '/student-profile' : '/', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const showAdminRegister = role === 'admin'

  return (
    <div className="auth-shell min-h-full px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl place-items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="auth-showcase flex flex-col justify-between">
            <div>
              <div className="hero-eyebrow">School Management System</div>
              <h1 className="hero-title">
                {mode === 'register' ? 'Control Center Access' : mode === 'forgot' ? 'Recover Your Account' : 'A school portal that feels current'}
              </h1>
              <p className="hero-copy">
                {mode === 'register'
                  ? 'Set up a new administrator after verification from an existing admin.'
                  : mode === 'forgot'
                    ? 'Reset access quickly with your role and login details.'
                    : 'Attendance, classes, fees, results, and profiles in one streamlined workspace.'}
              </p>
            </div>

            <div className="auth-metric-grid">
              <div className="auth-metric-card">
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Fast Access</div>
                <div className="mt-2 text-lg font-bold text-slate-900">Admin, Teacher, Student</div>
              </div>
              <div className="auth-metric-card">
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Modules</div>
                <div className="mt-2 text-lg font-bold text-slate-900">Attendance, Fees, Results</div>
              </div>
              <div className="auth-metric-card">
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Scope</div>
                <div className="mt-2 text-lg font-bold text-slate-900">Class-wise workflow</div>
              </div>
              <div className="auth-metric-card">
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Design</div>
                <div className="mt-2 text-lg font-bold text-slate-900">Cleaner and easier to scan</div>
              </div>
            </div>
          </section>

          <section className="auth-card flex flex-col justify-center">
            <div className="hero-eyebrow">School Management System</div>
            <div className="mb-6">
              <div className="hero-eyebrow">
                {mode === 'register' ? 'Register' : mode === 'forgot' ? 'Forgot Password' : 'Login'}
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                {mode === 'register' ? 'Create admin account' : mode === 'forgot' ? 'Recover access' : 'Welcome back'}
              </h2>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="field-label">Are You</label>
                <div className="auth-segment">
                  {roles.map((option) => {
                    const isActive = option.value === role
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={[
                          'auth-segment-button',
                          isActive ? 'auth-segment-button-active' : 'auth-segment-button-idle',
                        ].join(' ')}
                        onClick={() => {
                          setRole(option.value)
                          setError('')
                          setSuccess('')
                          if (option.value !== 'admin' && mode === 'register') setMode('login')
                        }}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Pill>{activeRole.label}</Pill>
                <Pill tone="amber">{mode === 'register' ? 'Verification Flow' : mode === 'forgot' ? 'Password Recovery' : 'Secure Sign In'}</Pill>
              </div>

              {mode === 'register' ? (
                <>
                  <div className="rounded-[1.3rem] border border-slate-200/70 bg-white/60 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-900">Verify Existing Admin</div>
                      {verifiedAdmin ? <Pill>Verified</Pill> : <Pill tone="amber">Required</Pill>}
                    </div>
                    <div className="grid gap-3">
                      <Field
                        label="Existing Admin Email"
                        type="email"
                        value={form.verifierEmail}
                        onChange={(value) => {
                          setForm((current) => ({ ...current, verifierEmail: value }))
                          setAdminVerificationToken('')
                          setVerifiedAdmin(null)
                        }}
                        placeholder="Enter existing admin email"
                      />
                      <Field
                        label="Existing Admin Password"
                        type="password"
                        value={form.verifierPassword}
                        onChange={(value) => {
                          setForm((current) => ({ ...current, verifierPassword: value }))
                          setAdminVerificationToken('')
                          setVerifiedAdmin(null)
                        }}
                        placeholder="Enter existing admin password"
                      />
                      <button
                        type="button"
                        disabled={verifyingAdmin}
                        className="app-button-secondary"
                        onClick={verifyExistingAdmin}
                      >
                        {verifyingAdmin ? 'Verifying...' : 'Verify Admin'}
                      </button>
                    </div>
                  </div>

                  <Field
                    label="Full Name"
                    value={form.name}
                    onChange={(value) => setForm((current) => ({ ...current, name: value }))}
                    placeholder="Enter new admin full name"
                  />
                  <Field
                    label="Email ID"
                    type="email"
                    value={form.email}
                    onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                    placeholder="Enter new admin email address"
                  />
                  <Field
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={(value) => setForm((current) => ({ ...current, password: value }))}
                    placeholder="Create new admin password"
                  />
                </>
              ) : (
                <>
                  {role === 'student' ? (
                    <Field
                      label="Admission ID"
                      value={form.admissionId}
                      onChange={(value) => setForm((current) => ({ ...current, admissionId: value }))}
                      placeholder="Enter your admission ID"
                    />
                  ) : (
                    <Field
                      label="Email ID"
                      type="email"
                      value={form.email}
                      onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                      placeholder="Enter your email address"
                    />
                  )}

                  {mode === 'forgot' ? (
                    <Field
                      label="New Password"
                      type="password"
                      value={form.newPassword}
                      onChange={(value) => setForm((current) => ({ ...current, newPassword: value }))}
                      placeholder="Enter your new password"
                    />
                  ) : (
                    <Field
                      label="Password"
                      type="password"
                      value={form.password}
                      onChange={(value) => setForm((current) => ({ ...current, password: value }))}
                      placeholder="Enter your password"
                    />
                  )}
                </>
              )}

              {error ? <Message>{error}</Message> : null}
              {success ? <Message tone="info">{success}</Message> : null}

              <button
                disabled={loading || (mode === 'register' && !adminVerificationToken)}
                className="app-button w-full"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'register'
                    ? 'Register as Admin'
                    : mode === 'forgot'
                      ? 'Reset Password'
                      : `Continue as ${activeRole.label}`}
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              {mode !== 'login' ? (
                <button
                  type="button"
                  className="font-semibold text-teal-800"
                  onClick={() => {
                    setMode('login')
                    setError('')
                    setSuccess('')
                  }}
                >
                  Back to Login
                </button>
              ) : null}

              {mode === 'login' ? (
                <button
                  type="button"
                  className="font-semibold text-teal-800"
                  onClick={() => {
                    setMode('forgot')
                    setError('')
                    setSuccess('')
                  }}
                >
                  Forgot Password?
                </button>
              ) : null}

              {mode === 'login' && showAdminRegister ? (
                <button
                  type="button"
                  className="font-semibold text-teal-800"
                  onClick={() => {
                    setMode('register')
                    setError('')
                    setSuccess('')
                  }}
                >
                  Register as Admin
                </button>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
