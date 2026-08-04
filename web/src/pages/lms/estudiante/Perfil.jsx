import { useState, useEffect, useCallback } from 'react';
import { UserCircle2, Save, Loader2, KeyRound } from 'lucide-react';
import { profilesApi } from '@/api/lmsClient';
import { LmsPage, Spinner } from '@/components/lms/common';
import { useI18n } from '@/lib/i18n/index.jsx';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { NIVELES_MCER } from '@/lib/lms-formatters';

// ─────────────────────────────────────────────────────────────
// F2.B7 — Perfil RAG del estudiante: nivel MCER, propósito,
// industria, intereses y datos que alimentan el motor de
// lecciones personalizadas (4 pilares).
// ─────────────────────────────────────────────────────────────

export default function EstudiantePerfil() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const perfil = user?.studentProfile ?? (await profilesApi.get(user.id));
      setForm({
        nivelMCER: perfil?.nivelMCER ?? 'A1',
        proposito: perfil?.proposito ?? '',
        industria: perfil?.industria ?? '',
        profesion: perfil?.profesion ?? '',
        intereses: perfil?.intereses ?? '',
        contextoProfesional: perfil?.contextoProfesional ?? '',
        objetivo: perfil?.objetivo ?? '',
        horariosPreferidos: perfil?.horariosPreferidos ?? '',
      });
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    }
  }, [user, t, toast]);

  useEffect(() => {
    if (user?.id) cargar();
  }, [user, cargar]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async () => {
    setGuardando(true);
    try {
      await profilesApi.put(user.id, form);
      toast({ title: t('lms.perfil.saved'), description: t('lms.perfil.savedDesc') });
    } catch (err) {
      toast({ title: t('lms.error'), description: err.message, variant: 'destructive' });
    } finally {
      setGuardando(false);
    }
  };

  if (!form) return <Spinner />;

  const campos = [
    ['proposito', t('lms.perfil.proposito'), t('lms.perfil.propositoPh')],
    ['industria', t('lms.perfil.industria'), t('lms.perfil.industriaPh')],
    ['profesion', t('lms.perfil.profesion'), t('lms.perfil.profesionPh')],
    ['intereses', t('lms.perfil.intereses'), t('lms.perfil.interesesPh')],
    ['contextoProfesional', t('lms.perfil.contexto'), t('lms.perfil.contextoPh')],
    ['objetivo', t('lms.perfil.objetivo'), t('lms.perfil.objetivoPh')],
    ['horariosPreferidos', t('lms.perfil.horarios'), t('lms.perfil.horariosPh')],
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <LmsPage
        title={t('lms.perfil.title')}
        subtitle={t('lms.perfil.subtitle')}
        actions={
          <Button onClick={guardar} disabled={guardando}>
            {guardando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {t('lms.perfil.save')}
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 text-[#3C3B6E]">
          <UserCircle2 className="w-5 h-5" />
          <h3 className="font-semibold">{t('lms.perfil.basicInfo')}</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('lms.perfil.name')}</Label>
            <Input value={user?.nombre ?? ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>{t('lms.perfil.email')}</Label>
            <Input value={user?.email ?? ''} disabled />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 text-[#3C3B6E]">
          <KeyRound className="w-5 h-5" />
          <h3 className="font-semibold">{t('lms.perfil.nivel')}</h3>
        </div>
        <div className="space-y-2 max-w-xs">
          <Label>{t('lms.perfil.nivelMCER')}</Label>
          <Select value={form.nivelMCER} onValueChange={set('nivelMCER')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {NIVELES_MCER.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-400">{t('lms.perfil.nivelHint')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2 text-[#3C3B6E]">
          <UserCircle2 className="w-5 h-5" />
          <h3 className="font-semibold">{t('lms.perfil.ragInfo')}</h3>
        </div>
        {campos.map(([key, label, ph]) => (
          <div key={key} className="space-y-2">
            <Label>{label}</Label>
            <Textarea rows={2} value={form[key]} onChange={(e) => set(key)(e.target.value)} placeholder={ph} />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {t('lms.perfil.save')}
        </Button>
      </div>
    </div>
  );
}
