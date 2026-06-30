import { Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export default function ProtectedRoute({ roles }) {
  const user = useAppStore((s) => s.user);
  const token = useAppStore((s) => s.token);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
} 