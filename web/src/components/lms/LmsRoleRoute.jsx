import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

// ─────────────────────────────────────────────────────────────
// LmsRoleRoute — guarda de ruta por rol (F2.A1)
// - Sin sesión → redirige a /login
// - Rol sin permiso → redirige a su propio dashboard
// - ADMIN pasa las guardas de TEACHER (la directora es docente)
// ─────────────────────────────────────────────────────────────

const DASHBOARD_BY_ROLE = { STUDENT: '/estudiante', TEACHER: '/profesor', ADMIN: '/admin' };

export default function LmsRoleRoute({ rol }) {
  const { user, isAuthenticated, isLoadingAuth, authChecked } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#3C3B6E] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const allowed =
    user.rol === rol || (user.rol === 'ADMIN' && rol === 'TEACHER');

  if (!allowed) {
    return <Navigate to={DASHBOARD_BY_ROLE[user.rol] || '/login'} replace />;
  }

  return <Outlet />;
}
