import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Role, useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ allow }: { allow?: Role[] }) {
  const { isAuthenticated, role, isLoading } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allow && !allow.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}


