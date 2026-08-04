import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// Componentes UI comunes del LMS (F2): encabezado de página,
// tarjeta de estadística, badge de estado, estado vacío, etc.
// ─────────────────────────────────────────────────────────────

export function LmsPage({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#3C3B6E]">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, color = 'text-[#3C3B6E]', hint }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1 truncate">{value}</p>
        {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
      </div>
      {Icon && (
        <div className={cn('shrink-0 w-10 h-10 rounded-lg flex items-center justify-center', 'bg-slate-50', color)}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

const BADGE_STYLES = {
  // Estados de tarea
  ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
  SUBMITTED: 'bg-amber-50 text-amber-700 border-amber-200',
  GRADED: 'bg-green-50 text-green-700 border-green-200',
  EXPIRED: 'bg-slate-100 text-slate-500 border-slate-200',
  // Sesiones
  SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
  RESCHEDULED: 'bg-violet-50 text-violet-700 border-violet-200',
  NO_SHOW: 'bg-red-50 text-red-600 border-red-200',
  // Pagos
  PENDIENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  APROBADO: 'bg-green-50 text-green-700 border-green-200',
  RECHAZADO: 'bg-red-50 text-red-600 border-red-200',
  REEMBOLSADO: 'bg-slate-100 text-slate-600 border-slate-200',
  VENCIDO: 'bg-red-50 text-red-600 border-red-200',
  // Usuarios
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  INACTIVE: 'bg-slate-100 text-slate-500 border-slate-200',
  SUSPENDED: 'bg-red-50 text-red-600 border-red-200',
  // Leads
  NUEVO: 'bg-blue-50 text-blue-700 border-blue-200',
  CONTACTADO: 'bg-amber-50 text-amber-700 border-amber-200',
  DIAGNOSTICO: 'bg-violet-50 text-violet-700 border-violet-200',
  OFERTA: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  CERRADO: 'bg-green-50 text-green-700 border-green-200',
  PERDIDO: 'bg-slate-100 text-slate-500 border-slate-200',
  // Matrículas
  PAUSED: 'bg-amber-50 text-amber-700 border-amber-200',
  FINISHED: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function EstadoBadge({ estado, label }) {
  return (
    <Badge variant="outline" className={cn('font-medium', BADGE_STYLES[estado] ?? 'bg-slate-50 text-slate-600 border-slate-200')}>
      {label ?? estado}
    </Badge>
  );
}

export function NivelBadge({ nivel }) {
  const colors = {
    A1: 'bg-green-50 text-green-700 border-green-200',
    A2: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    B1: 'bg-amber-50 text-amber-700 border-amber-200',
    B2: 'bg-orange-50 text-orange-700 border-orange-200',
    C1: 'bg-[#3C3B6E]/10 text-[#3C3B6E] border-[#3C3B6E]/20',
  };
  return <Badge variant="outline" className={cn('font-semibold', colors[nivel] ?? 'bg-slate-50')}>{nivel ?? '—'}</Badge>;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-14 bg-white rounded-xl border border-dashed border-slate-200">
      {Icon && <Icon className="w-10 h-10 text-slate-300 mx-auto mb-3" />}
      <p className="text-slate-600 font-medium">{title}</p>
      {description && <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ className }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className={cn('w-8 h-8 border-4 border-slate-200 border-t-[#3C3B6E] rounded-full animate-spin', className)} />
    </div>
  );
}

export function Nota({ nota }) {
  if (nota === null || nota === undefined) return <span className="text-slate-400">—</span>;
  const color = nota >= 80 ? 'text-green-600' : nota >= 60 ? 'text-amber-600' : 'text-red-600';
  return <span className={cn('font-bold', color)}>{nota}/100</span>;
}

export function ProgressBar({ value, max = 100, color = 'bg-[#3C3B6E]' }) {
  const pct = Math.min(100, Math.max(0, Math.round(((value ?? 0) / max) * 100)));
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
