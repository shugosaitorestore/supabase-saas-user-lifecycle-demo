import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="p-4">Loading auth state...</div>
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}