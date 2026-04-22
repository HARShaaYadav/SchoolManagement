import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../auth/useAuth.js'
import { setAuthToken } from '../services/api.js'

const linkBase =
  'rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900'
const linkActive = 'bg-slate-900 text-white hover:bg-slate-900 hover:text-white'

export function Layout() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    setAuthToken(token)
  }, [token])

  return (
    <div className="min-h-full">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
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

