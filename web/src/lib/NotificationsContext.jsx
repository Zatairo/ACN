import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { notificationsApi } from '@/api/lmsClient';
import { useAuth } from '@/lib/AuthContext';

// ─────────────────────────────────────────────────────────────
// NotificationsContext (F2.A3) — estado global de notificaciones
// no leídas y próximas clases. Polling ligero cada 60 s mientras
// hay sesión activa; el layout lo consume para el badge del
// sidebar y los recordatorios de clase.
// ─────────────────────────────────────────────────────────────

const NotificationsContext = createContext(null);
const POLL_MS = 60_000;

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState({ mensajesNoLeidos: [], proximasClases: [], totalNoLeidos: 0 });
  const [lastRefresh, setLastRefresh] = useState(null);
  const timerRef = useRef(null);

  const refetch = useCallback(async () => {
    try {
      const d = await notificationsApi.get();
      setData(d);
      setLastRefresh(new Date());
    } catch {
      /* silencioso: el polling reintenta */
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    refetch();
    timerRef.current = setInterval(refetch, POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthenticated, refetch]);

  const marcarLeidas = useCallback(async () => {
    try {
      await notificationsApi.readAll();
      setData((prev) => ({ ...prev, mensajesNoLeidos: [], totalNoLeidos: 0 }));
      setLastRefresh(new Date());
    } catch {
      /* noop */
    }
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ ...data, refetch, marcarLeidas, lastRefresh }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
};
