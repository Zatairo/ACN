import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { NotificationsProvider } from '@/lib/NotificationsContext'
import UserNotRegisteredError from '@/components/UserNotRegisteredError'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Onboarding from '@/pages/Onboarding'
import Home from '@/pages/Home'
import LessonView from '@/pages/LessonView'
import SampleLesson from '@/pages/SampleLesson'
import WordSearch from '@/pages/WordSearch'
import MyLessons from '@/pages/MyLessons'
import Dashboard from '@/pages/Dashboard'
import FillInBlanks from '@/pages/FillInBlanks'
import Profile from '@/pages/Profile'
import ErrorBoundary from '@/components/lms/ErrorBoundary'
import LmsRoleRoute from '@/components/lms/LmsRoleRoute'
import LmsLayout from '@/components/lms/LmsLayout'

import EstudianteDashboard from '@/pages/lms/estudiante/Dashboard'
import EstudianteClases from '@/pages/lms/estudiante/Clases'
import EstudianteTareas from '@/pages/lms/estudiante/Tareas'
import EstudianteTareaDetalle from '@/pages/lms/estudiante/TareaDetalle'
import EstudiantePracticas from '@/pages/lms/estudiante/Practicas'
import EstudiantePracticaDetalle from '@/pages/lms/estudiante/PracticaDetalle'
import EstudiantePagos from '@/pages/lms/estudiante/Pagos'
import EstudiantePerfil from '@/pages/lms/estudiante/Perfil'

import ProfesorDashboard from '@/pages/lms/profesor/Dashboard'
import ProfesorAgenda from '@/pages/lms/profesor/Agenda'
import ProfesorEstudiantes from '@/pages/lms/profesor/Estudiantes'
import ProfesorTareas from '@/pages/lms/profesor/Tareas'
import ProfesorMateriales from '@/pages/lms/profesor/Materiales'

import AdminDashboard from '@/pages/lms/admin/Dashboard'
import AdminUsuarios from '@/pages/lms/admin/Usuarios'
import AdminCursos from '@/pages/lms/admin/Cursos'
import AdminCobros from '@/pages/lms/admin/Cobros'
import AdminFinanzas from '@/pages/lms/admin/Finanzas'
import AdminCrm from '@/pages/lms/admin/Crm'
import AdminReportes from '@/pages/lms/admin/Reportes'
import AdminAjustes from '@/pages/lms/admin/Ajustes'

import Mensajes from '@/pages/lms/chat/Mensajes'

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ── LMS · Estudiante ── */}
            <Route
              element={
                <LmsRoleRoute rol="STUDENT">
                  <Route element={
                    <ErrorBoundary>
                      <LmsLayout>
                        <Route path="/estudiante" element={<EstudianteDashboard />} />
                        <Route path="/estudiante/clases" element={<EstudianteClases />} />
                        <Route path="/estudiante/tareas" element={<EstudianteTareas />} />
                        <Route path="/estudiante/tareas/:id" element={<EstudianteTareaDetalle />} />
                        <Route path="/estudiante/practicas" element={<EstudiantePracticas />} />
                        <Route path="/estudiante/practicas/:id" element={<EstudiantePracticaDetalle />} />
                        <Route path="/estudiante/pagos" element={<EstudiantePagos />} />
                        <Route path="/estudiante/mensajes" element={<Mensajes />} />
                        <Route path="/estudiante/perfil" element={<EstudiantePerfil />} />
                      </LmsLayout>
                    </ErrorBoundary>
                  } />
                </LmsRoleRoute>
              }
            />

      {/* ── LMS · Profesora ── */}
      <Route
        element={
          <LmsRoleRoute rol="TEACHER">
            <Route element={
              <ErrorBoundary>
                <LmsLayout>
                  <Route path="/profesor" element={<ProfesorDashboard />} />
                  <Route path="/profesor/agenda" element={<ProfesorAgenda />} />
                  <Route path="/profesor/estudiantes" element={<ProfesorEstudiantes />} />
                  <Route path="/profesor/tareas" element={<ProfesorTareas />} />
                  <Route path="/profesor/materiales" element={<ProfesorMateriales />} />
                  <Route path="/profesor/mensajes" element={<Mensajes />} />
                </LmsLayout>
              </ErrorBoundary>
            } />
          </LmsRoleRoute>
        }
      />

      {/* ── LMS · Administradora ── */}
      <Route
        element={
          <LmsRoleRoute rol="ADMIN">
            <Route element={
              <ErrorBoundary>
                <LmsLayout>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                  <Route path="/admin/cursos" element={<AdminCursos />} />
                  <Route path="/admin/cobros" element={<AdminCobros />} />
                  <Route path="/admin/finanzas" element={<AdminFinanzas />} />
                  <Route path="/admin/crm" element={<AdminCrm />} />
                  <Route path="/admin/reportes" element={<AdminReportes />} />
                  <Route path="/admin/ajustes" element={<AdminAjustes />} />
                </LmsLayout>
              </ErrorBoundary>
            } />
          </LmsRoleRoute>
        }
      />

      {/* ── Zona clásica (pública/protegida por base44 local) ── */}
      <Route
        element={
          <ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />}>
            <Layout>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/" element={<Home />} />
              <Route path="/lesson/:id" element={<LessonView />} />
              <Route path="/sample-lesson" element={<SampleLesson />} />
              <Route path="/my-lessons" element={<MyLessons />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/fill-in-the-blanks" element={<FillInBlanks />} />
              <Route path="/word-search" element={<WordSearch />} />
              <Route path="/profile" element={<Profile />} />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <NotificationsProvider>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
        </NotificationsProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App