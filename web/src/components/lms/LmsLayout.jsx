import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, CalendarDays, ClipboardList, Gamepad2, CreditCard,
  MessagesSquare, UserRound, Users, Library, FolderOpen, BarChart3,
  ShieldCheck, Settings, LogOut, Bell, GraduationCap, BookOpenCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useNotifications } from '@/lib/NotificationsContext';
import { useI18n } from '@/lib/i18n/index.jsx';
import LangSelector from '@/components/LangSelector.jsx';
import Isotype from '@/components/brand/Isotype';
import { relativeFecha } from '@/lib/lms-formatters';

// ─────────────────────────────────────────────────────────────
// LmsLayout — zona privada del LMS (F2.A1): sidebar por rol
// (estudiante / profesor / admin), badge de notificaciones no
// leídas, recordatorio de próxima clase y selector de idioma.
// ─────────────────────────────────────────────────────────────

const MENU = {
  STUDENT: [
    { to: '/estudiante', label: 'lms.menu.dashboard', icon: LayoutDashboard, end: true },
    { to: '/estudiante/clases', label: 'lms.menu.clases', icon: CalendarDays },
    { to: '/estudiante/tareas', label: 'lms.menu.tareas', icon: ClipboardList },
    { to: '/estudiante/practicas', label: 'lms.menu.practicas', icon: Gamepad2 },
    { to: '/estudiante/pagos', label: 'lms.menu.pagos', icon: CreditCard },
    { to: '/estudiante/mensajes', label: 'lms.menu.mensajes', icon: MessagesSquare },
    { to: '/estudiante/perfil', label: 'lms.menu.perfil', icon: UserRound },
  ],
  TEACHER: [
    { to: '/profesor', label: 'lms.menu.dashboard', icon: LayoutDashboard, end: true },
    { to: '/profesor/agenda', label: 'lms.menu.agenda', icon: CalendarDays },
    { to: '/profesor/estudiantes', label: 'lms.menu.estudiantes', icon: Users },
    { to: '/profesor/tareas', label: 'lms.menu.tareas', icon: ClipboardList },
    { to: '/profesor/materiales', label: 'lms.menu.materiales', icon: FolderOpen },
    { to: '/profesor/mensajes', label: 'lms.menu.mensajes', icon: MessagesSquare },
  ],
  ADMIN: [
    { to: '/admin', label: 'lms.menu.dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/usuarios', label: 'lms.menu.usuarios', icon: Users },
    { to: '/admin/cursos', label: 'lms.menu.cursos', icon: Library },
    { to: '/admin/cobros', label: 'lms.menu.cobros', icon: CreditCard },
    { to: '/admin/finanzas', label: 'lms.menu.finanzas', icon: BarChart3 },
    { to: '/admin/crm', label: 'lms.menu.crm', icon: BookOpenCheck },
    { to: '/admin/reportes', label: 'lms.menu.reportes', icon: ShieldCheck },
    { to: '/admin/ajustes', label: 'lms.menu.ajustes', icon: Settings },
  ],
};

const DASHBOARD_BY_ROLE = { STUDENT: '/estudiante', TEACHER: '/profesor', ADMIN: '/admin' };

function SidebarItem({ item, active, badge }) {
  return (
    <Link
      to={item.to}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
      )}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {badge > 0 && (
        <span className="min-w-[1.25rem] h-5 px-1 rounded-full bg-[#B22234] text-white text-[11px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

export default function LmsLayout() {
  const { user, logout } = useAuth();
  const { mensajesNoLeidos, proximasClases, totalNoLeidos, marcarLeidas } = useNotifications();
  const { t, lang } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [panelAbierto, setPanelAbierto] = useState(false);

  useEffect(() => {
    setPanelAbierto(false);
  }, [location.pathname]);

  if (!user) return null;
  const rol = user.rol;
  const items = MENU[rol] ?? [];
  const next = proximasClases[0];

  const isActive = (item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to));

  const sidebar = (
    <div className="flex flex-col h-full bg-[#2e2d5a] text-white">
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/10">
        <Isotype />
        <div className="flex flex-col leading-none">
          <span className="font-bold text-sm tracking-tight text-white">ACN Institute</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">LMS · {rol.toLowerCase()}</span>
        </div>
      </div>

      {/* Recordatorio de próxima clase */}
      {next && (
        <div className="mx-3 mt-3 p-3 rounded-xl bg-white/10 border border-white/10">
          <p className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold mb-1">
            {t('lms.notif.nextClass')}
          </p>
          <p className="text-xs text-white font-medium leading-snug">
            {relativeFecha(next.fechaHora, lang)}
          </p>
          {next.tema && <p className="text-[11px] text-slate-300 mt-0.5 truncate">{next.tema}</p>}
        </div>
      )}

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <SidebarItem key={item.to} item={item} active={isActive(item)} badge={item.to.includes('mensajes') ? totalNoLeidos : 0} />
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-2">
        <div className="px-3">
          <p className="text-sm font-medium text-white truncate">{user.nombre}</p>
          <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
        </div>
        <div className="flex items-center justify-between px-1">
          <LangSelector variant="light" />
          <button
            onClick={() => logout(true)}
            className="p-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            title={t('nav.logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:block w-64 fixed inset-y-0 left-0 z-30">{sidebar}</aside>

      {/* Drawer móvil */}
      {panelAbierto && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPanelAbierto(false)} />
          <div className="absolute inset-y-0 left-0 w-72">{sidebar}</div>
        </div>
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-3">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                onClick={() => setPanelAbierto(true)}
                aria-label="Abrir menú"
              >
                <MenuBars />
              </button>
              <GraduationCap className="w-5 h-5 text-[#3C3B6E]" />
              <h1 className="font-semibold text-slate-800 text-sm sm:text-base truncate">
                {t('lms.title')}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Notificaciones */}
              <button
                onClick={async () => {
                  if (totalNoLeidos > 0) await marcarLeidas();
                  navigate(rol === 'STUDENT' ? '/estudiante/mensajes' : rol === 'TEACHER' ? '/profesor/mensajes' : '/admin/cobros');
                }}
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                title={t('lms.notif.title')}
              >
                <Bell className="w-5 h-5" />
                {totalNoLeidos > 0 && (
                  <span className="absolute top-1 right-1 min-w-[1.1rem] h-[1.1rem] px-0.5 rounded-full bg-[#B22234] text-white text-[10px] font-bold flex items-center justify-center">
                    {totalNoLeidos > 9 ? '9+' : totalNoLeidos}
                  </span>
                )}
              </button>
              {mensajesNoLeidos.length > 0 && (
                <span className="hidden md:block text-[11px] text-slate-500">
                  {mensajesNoLeidos[0].remitente}: {mensajesNoLeidos[0].contenido.slice(0, 28)}…
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>

        <footer className="px-6 py-3 text-center text-[11px] text-slate-400 border-t border-slate-100">
          ACN Institute · LMS interno · Fase 2 (demo local)
        </footer>
      </div>
    </div>
  );
}

function MenuBars() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
