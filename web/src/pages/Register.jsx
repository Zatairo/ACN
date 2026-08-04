import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";
import { useI18n } from "@/lib/i18n/index.jsx";
import { authApi, setToken } from "@/api/lmsClient";

// ─────────────────────────────────────────────────────────────
// Register — registro real del LMS (F2.A2): crea la cuenta en el
// backend Express (POST /api/auth/register), guarda el JWT y
// redirige al dashboard del estudiante.
// ─────────────────────────────────────────────────────────────

export default function Register() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.passwordMin'));
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await authApi.register({
        nombre: nombre.trim(),
        email: email.trim(),
        password,
      });
      setToken(token);
      toast({
        title: t('auth.welcomeBack'),
        description: `${user.nombre} — ${user.email}`,
      });
      navigate(user.rol === 'STUDENT' ? '/estudiante' : '/login', { replace: true });
    } catch (err) {
      setError(err.message || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title={t('auth.createAccount')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <>
          {t('auth.alreadyHaveAccount')}{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('auth.logIn')}
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">{t('auth.name')}</Label>
          <div className="relative">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="nombre"
              type="text"
              autoComplete="name"
              autoFocus
              placeholder={t('auth.namePlaceholder')}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">{t('auth.passwordHint')}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t('auth.confirmPassword')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('auth.creatingAccount')}
            </>
          ) : (
            t('auth.createAccountBtn')
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
