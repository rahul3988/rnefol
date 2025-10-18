import React, { createContext, useContext, useEffect, useState } from 'react'
import authService from '../services/auth'

export type Role = 'admin' | 'manager' | 'viewer'

interface User {
  id: number
  email: string
  name: string
  role: string
  permissions: string[]
}

type AuthContextValue = {
  isAuthenticated: boolean
  user: User | null
  role: Role
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState(authService.getAuthState())

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe(setAuthState)
    
    // Check authentication on mount
    authService.checkAuth()

    return unsubscribe
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    return await authService.login({ email, password })
  }

  const logout = async (): Promise<void> => {
    await authService.logout()
  }

  const hasPermission = (permission: string): boolean => {
    return authService.hasPermission(permission)
  }

  const hasRole = (role: string): boolean => {
    return authService.hasRole(role)
  }

  const contextValue: AuthContextValue = {
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    role: (authState.user?.role as Role) || 'viewer',
    isLoading: authState.isLoading,
    error: authState.error,
    login,
    logout,
    hasPermission,
    hasRole
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}