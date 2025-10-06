import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleGoBack = () => {
    // Redirect to role-specific dashboard
    switch (user?.role) {
      case 'student':
        navigate('/dashboard');
        break;
      case 'parent':
        navigate('/parent/dashboard');
        break;
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'teacher':
        navigate('/teacher/dashboard');
        break;
      default:
        navigate('/login');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 border border-border text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            접근 권한이 없습니다
          </h1>
          <p className="text-muted-foreground">
            이 페이지에 접근할 수 있는 권한이 없습니다.
          </p>
          {user && (
            <p className="text-sm text-muted-foreground mt-2">
              현재 로그인: <span className="font-medium">{user.name}</span> ({user.role})
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoBack}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            홈으로 돌아가기
          </button>
          <button
            onClick={handleLogout}
            className="w-full border border-border py-2 px-4 rounded-lg hover:bg-muted transition-colors text-foreground font-medium"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
