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
import TestSurvey from './pages/test/TestSurvey';
import TestInProgress from './pages/test/TestInProgress';
import TestResultEnhanced from './pages/test/TestResultEnhanced';
import AdminQuestionManagement from './pages/admin/QuestionManagement';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGradingManagement from './pages/admin/GradingManagement';
import AdminBulkUpload from './pages/admin/BulkUpload';
import AdminStudentReports from './pages/admin/StudentReports';
import AdminUserManagement from './pages/admin/UserManagement';
import ParentDashboard from './pages/parent/ParentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import DetailedReportEnhanced from './pages/DetailedReportEnhanced';
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
            path="/test/survey/:sessionId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <TestSurvey />
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
              <ProtectedRoute allowedRoles={['student', 'admin', 'parent', 'teacher']}>
                <TestResultEnhanced />
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
          <Route
            path="/admin/grading"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminGradingManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bulk-upload"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminBulkUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminStudentReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUserManagement />
              </ProtectedRoute>
            }
          />

          {/* Report Routes */}
          <Route
            path="/report/:resultId"
            element={
              <ProtectedRoute allowedRoles={['student', 'parent', 'teacher', 'admin']}>
                <DetailedReportEnhanced />
              </ProtectedRoute>
            }
          />

          {/* Teacher Routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
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
