import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api.js'
import { useAuth } from '../auth/useAuth.js'
import { useClassSelection } from '../class/useClassSelection.js'
import { DataTable, Field, Message, PageIntro, Panel, Pill, ReadOnlyField } from '../components/ui.jsx'

export function SyllabusPage() {
  const { user } = useAuth()
  const { selectedClassId, selectedClass } = useClassSelection()
  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role])
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ subject: '', title: '', description: '' })

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await api.get('/syllabus', { params: selectedClassId ? { class_id: selectedClassId } : {} })
      setRows(res.data.syllabus || [])
    } catch (e) {
      setRows([])
      setError(e?.response?.data?.error || 'Failed to load syllabus')
    }
  }, [selectedClassId])

  useEffect(() => {
    load()
  }, [load])

  async function createSyllabusEntry(event) {
    event.preventDefault()
    setError('')
    try {
      await api.post('/syllabus', {
        class_id: Number(selectedClassId),
        subject: form.subject,
        title: form.title,
        description: form.description,
      })
      setForm({ subject: '', title: '', description: '' })
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save syllabus')
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Syllabus"
        title={isAdmin ? 'Publish syllabus class by class' : 'Review the class syllabus'}
        description={
          isAdmin
            ? 'Add subject-wise syllabus notes for the active class so everyone can follow the same academic plan.'
            : 'Browse the current syllabus for the selected class without jumping between different modules.'
        }
        action={selectedClass ? <Pill tone="amber">Class {selectedClass.class_name} â€¢ {selectedClass.section}</Pill> : null}
      />

      {error ? <Message>{error}</Message> : null}

      {isAdmin ? (
        <Panel title="Add syllabus" subtitle="Create a subject-wise syllabus entry for the active class.">
          <form onSubmit={createSyllabusEntry} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Subject"
              value={form.subject}
              onChange={(value) => setForm((current) => ({ ...current, subject: value }))}
              placeholder="e.g. Mathematics"
            />
            <ReadOnlyField label="Class & Section" value={selectedClass ? `Class ${selectedClass.class_name} - ${selectedClass.section}` : 'Select a class'} />
            <Field
              label="Topic / Title"
              value={form.title}
              onChange={(value) => setForm((current) => ({ ...current, title: value }))}
              placeholder="e.g. Algebra Fundamentals"
              className="md:col-span-2"
            />
            <label className="field-shell md:col-span-2">
              <span className="field-label">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Add the syllabus details for this subject and class"
                className="field-input min-h-[140px] resize-y"
              />
            </label>
            <div className="md:col-span-2">
              <button className="app-button">Save syllabus</button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel title="Syllabus records" subtitle="Subject-wise syllabus entries for the current class view.">
        <DataTable
          columns={['Subject', 'Title', 'Class', 'Section', 'Description']}
          rows={rows}
          empty="No syllabus added yet"
          renderRow={(row) => (
            <tr key={row.id}>
              <td className="font-semibold text-slate-900">{row.subject}</td>
              <td>{row.title}</td>
              <td>{row.class_name ?? row.class}</td>
              <td>{row.section}</td>
              <td className="max-w-[460px] whitespace-pre-wrap">{row.description}</td>
            </tr>
          )}
        />
      </Panel>
    </div>
  )
}
