import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
  AlertOctagon,
  Sparkles,
  ExternalLink,
  X,
  Volume2,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { NexusNotification, NotificationLevel } from '../../types/nexus';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotificationCenter() {
  const {
    notifications,
    markNotificationRead,
    clearNotifications,
    addNotification,
    setSelectedTaskId,
    setActiveView,
    currentOwner,
  } = useNexusStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Notifications relevant for current user or couple
  const userNotifications = notifications.filter(
    n => !currentOwner || n.owner === currentOwner
  );

  const unreadCount = userNotifications.filter(n => !n.read).length;

  const sortedNotifications = [...userNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleMarkAllRead = () => {
    userNotifications.forEach(n => {
      if (!n.read) markNotificationRead(n.id);
    });
  };

  const handleNotificationClick = (n: NexusNotification) => {
    if (!n.read) {
      markNotificationRead(n.id);
    }
    if (n.taskId) {
      setSelectedTaskId(n.taskId);
      setIsOpen(false);
    } else if (n.habitId) {
      setActiveView('habits');
      setIsOpen(false);
    }
  };

  const handleTestNotification = async () => {
    const testNotif: NexusNotification = {
      id: `notif-${uuidv4().slice(0, 8)}`,
      title: '🔔 Notificación de prueba NexusOS',
      body: 'El sistema de alertas y recordatorios está activo y sincronizado.',
      level: 'info',
      owner: currentOwner || 'david',
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Add in-app notification
    addNotification(testNotif);

    // Browser Notification API Test
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          new Notification('NexusOS — Recordatorio', {
            body: '¡Todo en orden! Tus tareas y hábitos están al día.',
            icon: '/favicon.svg',
          });
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            new Notification('NexusOS — Permiso Concedido', {
              body: 'Recibirás recordatorios importantes de tus tareas P1 y hábitos.',
              icon: '/favicon.svg',
            });
          }
        }
      } catch (err) {
        console.warn('Browser Notification API error:', err);
      }
    }
  };

  const getLevelConfig = (level: NotificationLevel) => {
    switch (level) {
      case 'overdue':
        return {
          icon: AlertOctagon,
          color: 'text-red-400 bg-red-500/10 border-red-500/30',
          pulsing: true,
        };
      case 'urgent':
        return {
          icon: AlertCircle,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
          pulsing: false,
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          pulsing: false,
        };
      case 'info':
      default:
        return {
          icon: Info,
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
          pulsing: false,
        };
    }
  };

  const formatRelativeTime = (isoDate: string) => {
    try {
      return formatDistanceToNow(parseISO(isoDate), { addSuffix: true, locale: es });
    } catch {
      return 'recientemente';
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* ─── Bell Trigger Button ──────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-nexus-surface border border-nexus-border text-nexus-text hover:text-nexus-text hover:bg-nexus-surface-2 transition shadow-sm active:scale-95"
        title="Notificaciones"
        aria-label="Abrir centro de notificaciones"
      >
        <Bell className="w-4 h-4 text-nexus-text-secondary" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-nexus-accent-pink px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-nexus-bg">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nexus-accent-pink opacity-75" />
            <span className="relative">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </span>
        )}
      </button>

      {/* ─── Dropdown Panel ────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-nexus-border bg-nexus-surface shadow-2xl z-50 overflow-hidden flex flex-col max-h-[82vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-nexus-border/80 flex items-center justify-between gap-3 bg-nexus-surface-2/40">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-nexus-accent-indigo" />
                <h3 className="text-sm font-bold text-nexus-text">Notificaciones</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-nexus-accent-indigo/15 text-nexus-accent-indigo border border-nexus-accent-indigo/30 font-bold font-mono">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1.5 rounded-lg text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-3 transition"
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={clearNotifications}
                  className="p-1.5 rounded-lg text-nexus-text-muted hover:text-red-400 hover:bg-nexus-surface-3 transition"
                  title="Limpiar todas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-3 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="divide-y divide-nexus-border/40 overflow-y-auto flex-1">
              {sortedNotifications.length === 0 ? (
                <div className="py-12 px-4 text-center text-nexus-text-muted space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-nexus-surface-2 border border-nexus-border text-nexus-text-muted flex items-center justify-center mx-auto text-lg">
                    ✨
                  </div>
                  <p className="text-xs font-semibold text-nexus-text">Sin notificaciones</p>
                  <p className="text-[11px] text-nexus-text-muted max-w-xs mx-auto">
                    Estás al día con todos tus recordatorios, tareas P1 y hábitos de pareja.
                  </p>
                </div>
              ) : (
                sortedNotifications.map(n => {
                  const cfg = getLevelConfig(n.level);
                  const Icon = cfg.icon;

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 flex items-start gap-3 transition cursor-pointer group ${
                        n.read
                          ? 'bg-transparent hover:bg-nexus-surface-2/40 opacity-75'
                          : 'bg-nexus-surface-2/70 hover:bg-nexus-surface-2'
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`p-2 rounded-xl border flex-shrink-0 mt-0.5 ${cfg.color} ${
                          cfg.pulsing ? 'animate-pulse' : ''
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={`text-xs font-bold truncate ${
                              n.read ? 'text-nexus-text-secondary' : 'text-nexus-text'
                            }`}
                          >
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-nexus-accent-indigo flex-shrink-0" />
                          )}
                        </div>

                        <p className="text-[11px] text-nexus-text-muted leading-relaxed mt-0.5 line-clamp-2">
                          {n.body}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-nexus-text-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatRelativeTime(n.createdAt)}</span>
                          </span>

                          {(n.taskId || n.habitId) && (
                            <span className="flex items-center gap-0.5 text-nexus-accent-indigo font-medium group-hover:underline">
                              <span>Ver</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with Test Button */}
            <div className="p-3 border-t border-nexus-border bg-nexus-surface-2/40 flex items-center justify-between">
              <span className="text-[11px] text-nexus-text-muted">
                Recordatorios inteligentes NexusOS
              </span>
              <button
                type="button"
                onClick={handleTestNotification}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-nexus-surface-3 hover:bg-nexus-border border border-nexus-border text-nexus-text font-medium text-xs transition"
              >
                <Volume2 className="w-3.5 h-3.5 text-nexus-accent-indigo" />
                <span>Probar Notificación</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
