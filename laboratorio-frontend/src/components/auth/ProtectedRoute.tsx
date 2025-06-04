import { Navigate } from 'react-router-dom'

interface Props {
  children: JSX.Element
}

const ProtectedRoute = ({ children }: Props) => {
  const isAuthenticated = localStorage.getItem('auth') === 'true'
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default ProtectedRoute
