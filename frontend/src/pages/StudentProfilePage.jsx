import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api.js'
import { useAuth } from '../auth/useAuth.js'
import { Message, PageIntro, Panel, Pill } from '../components/ui.jsx'

const defaultImage = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#0f766e" />
        <stop offset="100%" stop-color="#134e4a" />
      </linearGradient>
    </defs>
    <rect width="320" height="320" rx="40" fill="url(#g)" />
    <circle cx="160" cy="126" r="54" fill="#fdf7ea" />
    <path d="M72 270c17-42 50-67 88-67s71 25 88 67" fill="#fdf7ea" />
  </svg>
`)}`;

export function StudentProfilePage() {
  const { admissionId: routeAdmissionId } = useParams()
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const targetAdmissionId = useMemo(() => {
    if (user?.role === 'student') return user?.admission_id || user?.admissionId || ''
    return routeAdmissionId || ''
  }, [routeAdmissionId, user?.admissionId, user?.admission_id, user?.role])

  useEffect(() => {
    if (!targetAdmissionId) {
      setStudent(null)
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      setError('')

      try {
        const res = await api.get(`/student/profile/${targetAdmissionId}`)
        if (!cancelled) setStudent(res.data.student)
      } catch (err) {
        if (!cancelled) {
          setStudent(null)
          setError(err?.response?.data?.error || 'Unable to load profile')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [targetAdmissionId])

  if (!targetAdmissionId && user?.role !== 'student') {
    return (
      <Panel title="Student Profile" subtitle="Open a student from the directory to view the full profile card.">
        <Link to="/students" className="app-button">
          Open Students
        </Link>
      </Panel>
    )
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Profile View"
        title="A clean, read-only profile experience"
        description="Students can safely view their own record, while admins and teachers can jump in to update it when needed."
        action={
          user?.role === 'admin' || user?.role === 'teacher' ? (
            <Link to={student ? `/students?edit=${student.admissionId}` : '/students'} className="app-button">
              Edit Profile
            </Link>
          ) : null
        }
      />

      {loading ? <Message tone="info">Loading student profile...</Message> : null}
      {error ? <Message>{error}</Message> : null}

      {!loading && !error && student ? (
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <section className="hero-panel text-slate-900">
            <img
              src={student.profilePhoto || defaultImage}
              alt={student.fullName}
              className="mx-auto h-48 w-48 rounded-[2rem] border border-white/60 object-cover shadow-lg"
              onError={(event) => {
                event.currentTarget.src = defaultImage
              }}
            />
            <div className="mt-6 text-center">
              <h2 className="text-3xl font-bold">{student.fullName}</h2>
              <div className="mt-2 text-sm text-slate-600">Admission ID: {student.admissionId}</div>
              <div className="mt-4 flex justify-center">
                <Pill>Student</Pill>
              </div>
            </div>
          </section>

          <Panel title="Student Details" subtitle="Structured fields designed for quick scanning on desktop and mobile.">
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField label="Admission ID" value={student.admissionId} />
              <ProfileField label="Full Name" value={student.fullName} />
              <ProfileField label="Class" value={student.class} />
              <ProfileField label="Role" value="Student" />
              <ProfileField label="Phone Number" value={student.phoneNumber || '-'} />
              <ProfileField label="Blood Group" value={student.bloodGroup || '-'} />
            </div>
          </Panel>
        </div>
      ) : null}
    </div>
  )
}

function ProfileField({ label, value }) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200/70 bg-white/70 px-4 py-4">
      <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-3 text-base font-semibold text-slate-900">{value}</div>
    </div>
  )
}
