import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../auth/useAuth.js'
import { setAuthToken } from '../services/api.js'
import { useClassSelection } from '../class/useClassSelection.js'

const linkBase =
  'rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900'
const linkActive = 'bg-slate-900 text-white hover:bg-slate-900 hover:text-white'

export function Layout() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()
  const { classes, loading: classLoading, selectedClassId, setSelectedClassId, selectedClass } = useClassSelection()

  useEffect(() => {
    setAuthToken(token)
  }, [token])

  return (
    <div className="min-h-full">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
              SMS
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">School Management</div>
              <div className="text-xs text-slate-500">
                Signed in as {user?.name} ({user?.role})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-xs font-semibold uppercase tracking-wide text-slate-500 md:block">
              Class & Section
            </div>
            <select
              className="max-w-[220px] rounded-md border px-3 py-2 text-sm outline-none focus:border-slate-400"
              disabled={classLoading || classes.length === 0}
              value={selectedClassId ?? ''}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
            >
              {classes.length === 0 ? <option value="">No classes</option> : null}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Class {c.class_name} - {c.section}
                </option>
              ))}
            </select>
            {selectedClass ? (
              <div className="hidden rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600 md:block">
                Showing: {selectedClass.class_name}-{selectedClass.section}
              </div>
            ) : null}
          </div>

          <button
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <nav className="rounded-xl border bg-white p-3">
          <div className="space-y-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `${linkBase} block ${isActive ? linkActive : ''}`}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/students"
              className={({ isActive }) => `${linkBase} block ${isActive ? linkActive : ''}`}
            >
              Students
            </NavLink>
            <NavLink
              to="/attendance"
              className={({ isActive }) => `${linkBase} block ${isActive ? linkActive : ''}`}
            >
              Attendance
            </NavLink>
            <NavLink
              to="/fees"
              className={({ isActive }) => `${linkBase} block ${isActive ? linkActive : ''}`}
            >
              Fees
            </NavLink>
            <NavLink
              to="/exams"
              className={({ isActive }) => `${linkBase} block ${isActive ? linkActive : ''}`}
            >
              Exams
            </NavLink>
            <NavLink
              to="/results"
              className={({ isActive }) => `${linkBase} block ${isActive ? linkActive : ''}`}
            >
              Results
            </NavLink>
          </div>
        </nav>

        <main className="rounded-xl border bg-white p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

