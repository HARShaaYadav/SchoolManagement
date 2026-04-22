import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { useClassSelection } from '../class/useClassSelection.js'
import { Pill } from './ui.jsx'

const links = {
  admin: [
    ['/', 'Dashboard'],
    ['/teachers', 'Teachers'],
    ['/students', 'Students'],
    ['/attendance', 'Attendance'],
    ['/fees', 'Fees'],
    ['/exams', 'Exams'],
    ['/results', 'Results'],
    ['/student-profile', 'Student Profile'],
  ],
  teacher: [
    ['/', 'Dashboard'],
    ['/students', 'Students'],
    ['/attendance', 'Attendance'],
    ['/fees', 'Fees'],
    ['/exams', 'Exams'],
    ['/results', 'Results'],
    ['/student-profile', 'Student Profile'],
  ],
  student: [
    ['/student-profile', 'Student Profile'],
    ['/attendance', 'Attendance'],
  ],
}

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { classes, loading: classLoading, selectedClassId, setSelectedClassId, selectedClass } = useClassSelection()
  const isManager = user?.role === 'admin' || user?.role === 'teacher'
  const roleLinks = links[user?.role] || []

  return (
    <div className="min-h-full px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="hero-panel">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-[1.4rem] bg-gradient-to-br from-teal-700 to-teal-950 text-lg font-bold text-white shadow-lg shadow-teal-900/20">
                SM
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-slate-900">School Management System</div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span>Signed in as {user?.name}</span>
                  <Pill>{user?.role}</Pill>
                  {selectedClass && isManager ? (
                    <Pill tone="amber">
                      Class {selectedClass.class_name} • Section {selectedClass.section}
                    </Pill>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {isManager ? (
                <label className="field-shell min-w-[250px]">
                  <span className="field-label">Active Class</span>
                  <select
                    className="field-input"
                    disabled={classLoading || classes.length === 0}
                    value={selectedClassId ?? ''}
                    onChange={(event) => setSelectedClassId(Number(event.target.value))}
                  >
                    {classes.length === 0 ? <option value="">No classes</option> : null}
                    {classes.map((klass) => (
                      <option key={klass.id} value={klass.id}>
                        Class {klass.class_name} - {klass.section}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <button
                className="app-button-secondary"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="app-panel h-fit">
            <div className="panel-head mb-4">
              <div>
                <h2 className="panel-title">Workspace</h2>
                <p className="panel-subtitle">Jump between modules with role-based access.</p>
              </div>
            </div>
            <div className="space-y-2">
              {roleLinks.map(([path, label]) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  className={({ isActive }) =>
                    [
                      'block rounded-2xl px-4 py-3 text-sm font-semibold transition',
                      isActive
                        ? 'bg-gradient-to-r from-teal-700 to-teal-900 text-white shadow-lg shadow-teal-900/20'
                        : 'text-slate-700 hover:bg-white/80 hover:text-slate-950',
                    ].join(' ')
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </aside>

          <main className="flex min-w-0 flex-col gap-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
