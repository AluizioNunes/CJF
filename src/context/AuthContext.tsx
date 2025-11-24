import React, { createContext, useContext, useMemo, useState } from 'react'
import { getToken, login as apiLogin, logout as apiLogout } from '../services/api'

type User = { username: string; roles: string[] }
type AuthContextType = {
  token: string | null
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<User | null>(token ? { username: 'admin', roles: ['admin'] } : null)

  const login = async (username: string, password: string) => {
    await apiLogin({ username, password })
    setTokenState(getToken())
    setUser({ username, roles: ['admin'] })
  }

  const logout = () => {
    apiLogout()
    setTokenState(null)
    setUser(null)
  }

  const value = useMemo<AuthContextType>(() => ({
    token,
    user,
    login,
    logout,
    hasPermission: (role: string) => !!user && user.roles.includes(role),
  }), [token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}