import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { api, clearSession, loadSession, saveSession, type Session } from './api'
import type { Role, User } from './types'

interface AuthCtx {
  session: Session | null
  user: User | null
  ready: boolean
  login: (email: string, password: string, remember: boolean) => Promise<Role>
  register: (d: { nom: string; prenom: string; email: string; password: string }) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)
export const useAuth = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return c
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!loadSession())

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
    setUser(null)
    setReady(true)
  }, [])

  // Restaure l’utilisateur courant à partir du JWT stocké (GET /api/users/me)
  useEffect(() => {
    if (!session || user) return
    api.users.me().then(setUser).catch(logout).finally(() => setReady(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login: AuthCtx['login'] = async (email, password, remember) => {
    const res = await api.auth.login(email.trim(), password)
    const s: Session = { token: res.token, role: res.role, userId: Number(res.userId) }
    saveSession(s, remember)
    try {
      const me = await api.users.me()
      setSession(s)
      setUser(me)
      setReady(true)
    } catch (e) {
      clearSession()
      throw e
    }
    return res.role
  }

  const register: AuthCtx['register'] = async (d) => {
    await api.auth.register({ ...d, email: d.email.trim() })
  }

  return <Ctx.Provider value={{ session, user, ready, login, register, logout }}>{children}</Ctx.Provider>
}
