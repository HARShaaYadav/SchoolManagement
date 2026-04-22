import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../services/api.js'
import { useAuth } from '../auth/useAuth.js'
import { useClassSelection } from '../class/useClassSelection.js'
import { DataTable, Field, Message, PageIntro, Panel, SelectField } from '../components/ui.jsx'

const emptyForm = {
  admission_id: '',
  full_name: '',
  password: '',
  class_id: '',
  phone_number: '',
  blood_group: '',
  profile_photo_url: '',
  parent_name: '',
  parent_contact: '',
  address: '',
}

export function StudentsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { classes, selectedClassId, selectedClass } = useClassSelection()
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const classOptions = useMemo(() => {
    const seen = new Set()
    return classes.filter((klass) => {
      if (seen.has(klass.class_name)) return false
      seen.add(klass.class_name)
      return true
    })
  }, [classes])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const res = await api.get('/students', {
        params: selectedClassId ? { class_id: selectedClassId } : {},
      })
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

  useEffect(() => {
    if (!editingId && selectedClassId) {
      setForm((current) => ({
        ...current,
        class_id: String(selectedClassId),
      }))
    }
  }, [editingId, selectedClassId])

  useEffect(() => {
    const admissionId = searchParams.get('edit')
    if (!admissionId || students.length === 0) return

    const student = students.find((entry) => entry.admission_id === admissionId)
    if (!student) return

    setEditingId(student.id)
    setForm({
      admission_id: student.admission_id ?? '',
      full_name: student.name ?? '',
      password: '',
      class_id: String(student.class_id ?? ''),
      phone_number: student.phone_number ?? '',
      blood_group: student.blood_group ?? '',
      profile_photo_url: student.profile_photo_url ?? '',
      parent_name: student.parent_name ?? '',
      parent_contact: student.parent_contact ?? '',
      address: student.address ?? '',
    })
  }, [searchParams, students])

  async function saveStudent(event) {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload = {
        ...form,
        class_id: Number(form.class_id),
      }

      if (!payload.phone_number.trim()) delete payload.phone_number
      if (!payload.blood_group.trim()) delete payload.blood_group
      if (!payload.profile_photo_url.trim()) delete payload.profile_photo_url

      if (editingId) {
        if (!payload.password) delete payload.password
        await api.put(`/students/${editingId}`, payload)
      } else {
        await api.post('/students', payload)
      }

      setEditingId(null)
      setForm(emptyForm)
      setSearchParams({})
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save student')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Student Records"
        title={editingId ? 'Refine student details quickly' : 'Build polished student profiles'}
        description="Create admission-based student accounts, attach profile details, and move into profile views without juggling multiple screens."
        action={
          selectedClass ? (
            <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-slate-800">
              Working in Class {selectedClass.class_name} • Section {selectedClass.section}
            </div>
          ) : null
        }
      />

      {error ? <Message>{error}</Message> : null}

      {user?.role === 'admin' || user?.role === 'teacher' ? (
        <Panel
          title={editingId ? 'Edit student' : 'Create student'}
          subtitle="Students receive admission-based credentials and a read-only profile experience."
          action={
            editingId ? (
              <button
                type="button"
                className="app-button-secondary"
                onClick={() => {
                  setEditingId(null)
                  setForm({ ...emptyForm, class_id: selectedClassId ? String(selectedClassId) : '' })
                  setSearchParams({})
                }}
              >
                Cancel editing
              </button>
            ) : null
          }
        >
          <form onSubmit={saveStudent} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Admission ID" value={form.admission_id} onChange={(value) => setForm((current) => ({ ...current, admission_id: value }))} placeholder="ADM-2026-014" />
            <Field label="Full Name" value={form.full_name} onChange={(value) => setForm((current) => ({ ...current, full_name: value }))} placeholder="Student full name" />
            <Field
              label={editingId ? 'New Password' : 'Password'}
              type="password"
              value={form.password}
              onChange={(value) => setForm((current) => ({ ...current, password: value }))}
              placeholder={editingId ? 'Leave blank to keep current password' : 'Temporary password'}
            />
            <SelectField
              label="Class"
              value={form.class_id}
              onChange={(value) => setForm((current) => ({ ...current, class_id: value }))}
            >
              <option value="">Select class</option>
              {classOptions.map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.class_name}
                </option>
              ))}
            </SelectField>
            <Field label="Phone Number" value={form.phone_number} onChange={(value) => setForm((current) => ({ ...current, phone_number: value }))} placeholder="+91..." />
            <Field label="Blood Group" value={form.blood_group} onChange={(value) => setForm((current) => ({ ...current, blood_group: value }))} placeholder="B+" />
            <Field label="Profile Photo URL" value={form.profile_photo_url} onChange={(value) => setForm((current) => ({ ...current, profile_photo_url: value }))} placeholder="https://..." className="md:col-span-2" />
            <Field label="Parent Name" value={form.parent_name} onChange={(value) => setForm((current) => ({ ...current, parent_name: value }))} placeholder="Parent or guardian" />
            <Field label="Parent Contact" value={form.parent_contact} onChange={(value) => setForm((current) => ({ ...current, parent_contact: value }))} placeholder="Emergency contact" />
            <Field label="Address" value={form.address} onChange={(value) => setForm((current) => ({ ...current, address: value }))} placeholder="Home address" className="xl:col-span-2" />

            <div className="md:col-span-2 xl:col-span-3">
              <button disabled={saving || !form.class_id} className="app-button">
                {saving ? 'Saving...' : editingId ? 'Update student' : 'Create student'}
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel title="Student Directory" subtitle="Browse profiles, contact details, and quick actions for the active class.">
        <DataTable
          columns={['Admission ID', 'Name', 'Class', 'Phone', 'Blood Group', 'Parent', 'Actions']}
          rows={students}
          empty={loading ? 'Loading student records...' : 'No students found for this class yet'}
          renderRow={(student) => (
            <tr key={student.id}>
              <td className="font-semibold text-slate-900">{student.admission_id}</td>
              <td>
                <div className="font-semibold text-slate-900">{student.name}</div>
                <div className="text-xs text-slate-500">{student.parent_contact || 'No contact added'}</div>
              </td>
              <td>{student.class_name ?? student.class} • {student.section}</td>
              <td>{student.phone_number || '-'}</td>
              <td>{student.blood_group || '-'}</td>
              <td>{student.parent_name}</td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/student-profile/${student.admission_id}`} className="app-button-secondary px-3 py-2 text-xs">
                    View Profile
                  </Link>
                  <button
                    type="button"
                    className="app-button px-3 py-2 text-xs"
                    onClick={() => {
                            setEditingId(student.id)
                            setForm({
                              admission_id: student.admission_id ?? '',
                              full_name: student.name ?? '',
                              password: '',
                              class_id: String(student.class_id ?? ''),
                              phone_number: student.phone_number ?? '',
                              blood_group: student.blood_group ?? '',
                              profile_photo_url: student.profile_photo_url ?? '',
                        parent_name: student.parent_name ?? '',
                        parent_contact: student.parent_contact ?? '',
                        address: student.address ?? '',
                      })
                      setSearchParams({ edit: student.admission_id })
                    }}
                  >
                    Edit
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
