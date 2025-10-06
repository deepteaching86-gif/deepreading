import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/**
 * Redirect authenticated users to their role-specific dashboard
 * Used on login page and root route
 */
export default function RoleBasedRedirect() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based dashboard routing
  switch (user.role) {
    case 'student':
      return <Navigate to="/dashboard" replace />;
    case 'parent':
      return <Navigate to="/parent/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'teacher':
      return <Navigate to="/teacher/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}
