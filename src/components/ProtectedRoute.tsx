import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Props = React.PropsWithChildren<{ role?: string }>

export default function ProtectedRoute({ children, role }: Props) {
  const { token, hasPermission } = useAuth()
  const location = useLocation()
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />
  if (role && !hasPermission(role)) return <Navigate to="/" replace />
  return <>{children}</>
}