import { useMemo, useState } from 'react'
import { AuthContext } from './context.js'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sms_token') || '')
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('sms_user')
    return raw ? JSON.parse(raw) : null
  })

  const value = useMemo(
    () => ({
      token,
      user,
      setAuth(nextToken, nextUser) {
        setToken(nextToken)
        setUser(nextUser)
        if (nextToken) localStorage.setItem('sms_token', nextToken)
        else localStorage.removeItem('sms_token')
        if (nextUser) localStorage.setItem('sms_user', JSON.stringify(nextUser))
        else localStorage.removeItem('sms_user')
      },
      logout() {
        setToken('')
        setUser(null)
        localStorage.removeItem('sms_token')
        localStorage.removeItem('sms_user')
      },
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

