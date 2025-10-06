import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedRedirect from './components/auth/RoleBasedRedirect';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import TestStart from './pages/test/TestStart';
import TestInProgress from './pages/test/TestInProgress';
import TestResult from './pages/test/TestResult';
import AdminQuestionManagement from './pages/admin/QuestionManagement';
import AdminDashboard from './pages/admin/AdminDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';
import Unauthorized from './pages/Unauthorized';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Student Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test/start/:templateCode"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <TestStart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test/session/:sessionId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <TestInProgress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test/result/:sessionId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <TestResult />
              </ProtectedRoute>
            }
          />

          {/* Parent Routes */}
          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminQuestionManagement />
              </ProtectedRoute>
            }
          />

          {/* Teacher Routes - TODO: Implement teacher dashboard */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <div className="min-h-screen bg-background flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">선생님 대시보드</h1>
                    <p className="text-muted-foreground">준비 중입니다...</p>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Default Routes */}
          <Route path="/" element={<RoleBasedRedirect />} />
          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
