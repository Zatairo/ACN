import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Loader2, Users, Pencil, ShieldAlert } from 'lucide-react';
import { usersApi } from '@/api/lmsClient';
import { LmsPage, EstadoBadge, Spinner, EmptyState, NivelBadge } from '@/components/lms/common';
import { formatFecha, ROL, USER_ESTADO, etiqueta } from '@/lib/lms-formatters';
import { useI18n } from '@/lib/i18n/index.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// F2.D2 — Gestión de usuarios: crear estudiante/profesor/admin,
// editar datos y estado, suspender cuentas (borrado lógico).
// ─────────────────────────────────────────────────────────────

const FORM_VACIO = { email: '', password: '', nombre: '', telefonoWhatsApp: '', rol: 'STUDENT', estado: 'ACTIVE' };

export default function AdminUsuarios() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [users, setUsers] = useState(null);
  const [filtroRol, setFiltroRol] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [dialogo, setDialogo] = useState(null); // 'crear' | usuario existente
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsers(await usersApi.list({ rol: filtroRol === 'TODOS' ? undefined : filtroRol, search: busqueda || undefined }));
    } catch {
      setUsers([]);
    }
  }, [filtroRol, busqueda]);

  useEffect(() => {
    load();
  }, [load]);

  if (!users) return <Spinner />;

  const abrirCrear = () => {
    setForm(FORM_VACIO);
    setDialogo('crear');
  };

  const abrirEditar = (u) => {
    setForm({ email: u.email, password: '', nombre: u.nombre, telefonoWhatsApp: u.telefonoWhatsApp ?? '', rol: u.rol, estado: u.estado });
    setDialogo(u);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      if (dialogo === 'crear') {
        await usersApi.create(form);
        toast({ title: t('lms.admin.users.created') });
      } else {
        await usersApi.update(dialogo.id, {
          email: form.email,
          nombre: form.nombre,
          telefonoWhatsApp: form.telefonoWhatsApp || null,
          rol: form.rol,
          estado: form.estado,
          ...(form.password ? { password: form.password } : {}),
        });
        toast({ title: t('lms.admin.users.updated') });
      }
      setDialogo(null);
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setGuardando(false);
    }
  };

  const suspender = async (u) => {
    try {
      await usersApi.remove(u.id);
      toast({ title: t('lms.admin.users.suspended') });
      load();
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <LmsPage
        title={t('lms.admin.users.title')}
        subtitle={t('lms.admin.users.subtitle')}
        actions={
          <Button onClick={abrirCrear}>
            <UserPlus className="w-4 h-4 mr-2" /> {t('lms.admin.users.new')}
          </Button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filtroRol} onValueChange={setFiltroRol}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">{t('lms.todos')}</SelectItem>
            {Object.keys(ROL).map((r) => (
              <SelectItem key={r} value={r}>{etiqueta(ROL, r, lang)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="max-w-xs"
          placeholder={t('lms.admin.users.search')}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {users.length === 0 ? (
        <EmptyState icon={Users} title={t('lms.admin.users.empty')} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="px-4 py-3">{t('lms.admin.users.name')}</th>
                <th className="px-4 py-3">{t('lms.admin.users.email')}</th>
                <th className="px-4 py-3">{t('lms.admin.users.rol')}</th>
                <th className="px-4 py-3">{t('lms.admin.users.nivel')}</th>
                <th className="px-4 py-3">{t('lms.admin.users.estado')}</th>
                <th className="px-4 py-3">{t('lms.admin.users.since')}</th>
                <th className="px-4 py-3 text-right">{t('lms.admin.users.acciones')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.nombre}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                      u.rol === 'ADMIN' && 'bg-[#B22234]/10 text-[#B22234]',
                      u.rol === 'TEACHER' && 'bg-[#3C3B6E]/10 text-[#3C3B6E]',
                      u.rol === 'STUDENT' && 'bg-green-50 text-green-700',
                    )}>
                      {etiqueta(ROL, u.rol, lang)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{u.studentProfile?.nivelMCER ? <NivelBadge nivel={u.studentProfile.nivelMCER} /> : '—'}</td>
                  <td className="px-4 py-3"><EstadoBadge estado={u.estado} label={etiqueta(USER_ESTADO, u.estado, lang)} /></td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatFecha(u.createdAt, lang)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => abrirEditar(u)} title={t('lms.editar')}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {u.rol !== 'ADMIN' && (
                        <Button size="sm" variant="outline" onClick={() => suspender(u)} title={t('lms.admin.users.suspend')}>
                          <ShieldAlert className="w-3.5 h-3.5 text-[#B22234]" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Diálogo crear/editar */}
      <Dialog open={!!dialogo} onOpenChange={(o) => !o && setDialogo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogo === 'crear' ? t('lms.admin.users.new') : t('lms.admin.users.edit')}</DialogTitle>
            <DialogDescription>{t('lms.admin.users.dialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{t('lms.admin.users.name')}</Label>
              <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('lms.admin.users.email')}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('lms.admin.users.password')} {dialogo !== 'crear' && `(${t('lms.admin.users.optional')})`}</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('lms.admin.users.whatsapp')}</Label>
              <Input value={form.telefonoWhatsApp} onChange={(e) => setForm((f) => ({ ...f, telefonoWhatsApp: e.target.value }))} placeholder="+57 300 000 0000" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('lms.admin.users.rol')}</Label>
                <Select value={form.rol} onValueChange={(v) => setForm((f) => ({ ...f, rol: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(ROL).map((r) => (
                      <SelectItem key={r} value={r}>{etiqueta(ROL, r, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('lms.admin.users.estado')}</Label>
                <Select value={form.estado} onValueChange={(v) => setForm((f) => ({ ...f, estado: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(USER_ESTADO).map((e) => (
                      <SelectItem key={e} value={e}>{etiqueta(USER_ESTADO, e, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogo(null)}>{t('lms.cancelar')}</Button>
              <Button onClick={guardar} disabled={guardando || !form.nombre.trim() || !form.email.trim() || (dialogo === 'crear' && form.password.length < 8)}>
                {guardando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('lms.guardar')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
