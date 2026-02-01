import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { AssetsLibrary } from './pages/AssetsLibrary';
import { ContentFactory } from './pages/ContentFactory';
import { Settings } from './pages/Settings';
import PersonasPage from './pages/PersonasPage';
import WorkbenchPage from './pages/WorkbenchPage';
import CrawlerStatusPage from './pages/CrawlerStatusPage';
import AdminTemplatesPage from './pages/admin/AdminTemplatesPage';
import TaskTemplatesPage from './pages/TaskTemplatesPage';
import TeamManagementPage from './pages/TeamManagementPage';
import MatrixAccountPage from './pages/MatrixAccountPage';
import EmployeeHandbook from './pages/EmployeeHandbook';
import AssessmentForm from './pages/AssessmentForm';
import { KnowledgeBase } from './pages/KnowledgeBase';
import LeaveApplicationPage from './pages/LeaveApplicationPage';
import LeaveReviewPage from './pages/LeaveReviewPage';
import LeaveStatusPage from './pages/LeaveStatusPage';
import { ErrorBoundary } from './components/ErrorBoundary';

import { RoleProvider } from './contexts/RoleContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

const PrivateRoute = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route element={<PrivateRoute />}>
              <Route path="/assessment-form" element={<AssessmentForm />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="workbench" element={<WorkbenchPage />} />
                <Route path="assets" element={<AssetsLibrary />} />
                <Route path="crawler" element={<CrawlerStatusPage />} />
                <Route path="admin/templates" element={<AdminTemplatesPage />} />
                <Route path="templates" element={<TaskTemplatesPage />} />
                <Route path="team" element={<TeamManagementPage />} />
                <Route path="matrix-accounts" element={<MatrixAccountPage />} />
                <Route path="handbook" element={<EmployeeHandbook />} />
                <Route path="knowledge" element={<KnowledgeBase />} />
                <Route path="leaves/apply" element={<LeaveApplicationPage />} />
                <Route path="leaves/review" element={<LeaveReviewPage />} />
                <Route path="leaves/board" element={<LeaveStatusPage />} />
                <Route path="content-factory" element={
                  <ErrorBoundary>
                    <ContentFactory />
                  </ErrorBoundary>
                } />
                <Route path="personas" element={<PersonasPage />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </RoleProvider>
    </AuthProvider>
  );
}

export default App;
