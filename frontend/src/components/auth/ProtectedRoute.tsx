import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('student' | 'teacher' | 'parent' | 'admin')[];
  redirectTo?: string;
}

/**
 * Role-based route protection component
 *
 * @param children - Component to render if authorized
 * @param allowedRoles - Array of roles allowed to access this route (default: all authenticated users)
 * @param redirectTo - Custom redirect path for unauthorized access (default: role-based)
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Use custom redirect or role-based default
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    // Role-based default redirects
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
        return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
