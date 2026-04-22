import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api.js'
import { DataTable, Field, Message, PageIntro, Panel, Pill } from '../components/ui.jsx'

const emptyTeacherForm = {
  name: '',
  email: '',
  password: '',
  subject: '',
}

export function TeachersPage() {
  const [teachers, setTeachers] = useState([])
  const [form, setForm] = useState(emptyTeacherForm)
  const [resetPassword, setResetPassword] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadTeachers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const res = await api.get('/auth/teachers')
      setTeachers(res.data.teachers || [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTeachers()
  }, [loadTeachers])

  async function createTeacher(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      await api.post('/auth/register', {
        ...form,
        role: 'teacher',
      })
      setForm(emptyTeacherForm)
      await loadTeachers()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create teacher account')
    } finally {
      setSaving(false)
    }
  }

  async function resetTeacherAccountPassword(teacherId) {
    const password = resetPassword[teacherId]?.trim()
    if (!password) {
      setError('Enter a new password before resetting a teacher account')
      return
    }

    setSaving(true)
    setError('')

    try {
      await api.post(`/auth/teachers/${teacherId}/reset-password`, { password })
      setResetPassword((current) => ({ ...current, [teacherId]: '' }))
      await loadTeachers()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to reset teacher password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Teacher Access"
        title="Create and manage teacher accounts"
        description="Admins can provision secure teacher logins, issue temporary passwords, and force a clean password reset on next sign-in."
      />

      {error ? <Message>{error}</Message> : null}

      <Panel title="Create teacher account" subtitle="New teacher accounts automatically require a password change on first login.">
        <form onSubmit={createTeacher} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Full Name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Teacher name" />
          <Field label="Email" type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} placeholder="teacher@school.edu" />
          <Field label="Subject" value={form.subject} onChange={(value) => setForm((current) => ({ ...current, subject: value }))} placeholder="e.g. Mathematics" />
          <Field label="Temporary Password" type="password" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} placeholder="Create a temporary password" />
          <div className="md:col-span-2 xl:col-span-4">
            <button disabled={saving} className="app-button">
              {saving ? 'Saving...' : 'Create teacher'}
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Teacher accounts" subtitle="Track onboarding status and trigger secure password resets when needed.">
        <DataTable
          columns={['Name', 'Email', 'Subject', 'Status', 'Reset Password']}
          rows={teachers}
          empty={loading ? 'Loading teacher accounts...' : 'No teacher accounts yet'}
          renderRow={(teacher) => (
            <tr key={teacher.id}>
              <td className="font-semibold text-slate-900">{teacher.name}</td>
              <td>{teacher.email}</td>
              <td>{teacher.subject || 'Not assigned'}</td>
              <td>
                {teacher.must_change_password ? <Pill tone="amber">Password change required</Pill> : <Pill tone="emerald">Active</Pill>}
              </td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="password"
                    value={resetPassword[teacher.id] || ''}
                    onChange={(event) =>
                      setResetPassword((current) => ({
                        ...current,
                        [teacher.id]: event.target.value,
                      }))
                    }
                    placeholder="New temporary password"
                    className="field-input max-w-[240px]"
                  />
                  <button type="button" className="app-button px-4 py-3 text-xs" onClick={() => resetTeacherAccountPassword(teacher.id)}>
                    Reset
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      </Panel>
    </div>
  )
}
