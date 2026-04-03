import { Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"

function ProtectedRoute({ allowedRoles = [] }) {
  const { user } = useSelector((state) => state.auth)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const userRoles = Array.isArray(user.roles) ? user.roles : []
  const hasRole =
    allowedRoles.length === 0 ||
    allowedRoles.some((role) => userRoles.includes(role))

  if (!hasRole) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
