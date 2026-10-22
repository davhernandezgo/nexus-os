import React, { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  Menu,
  Bell,
  Clock,
  Play,
  Pause,
  Square,
  LogOut,
  Lock,
  Heart,
  Zap,
  CheckCheck,
  X,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { ContextMode } from '../../types/nexus';

const VIEW_TITLES: Record<string, string> = {
  '/inbox': '📥 Inbox',
  '/kanban': '📋 Tablero Kanban',
  '/eisenhower': '🎯 Matriz Eisenhower',
  '/calendar': '📅 Calendario',
  '/habits': '✅ Hábitos',
  '/couple': '💑 Hub Pareja',
  '/graph': '🔗 Grafo',
  '/daily-note': '📝 Nota del Día',
};

const Header: React.FC = () => {
  const location = useLocation();

  const {
    sidebarOpen,
    setSidebarOpen,
    contextMode,
    switchContext,
    timer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    notifications,
    markNotificationRead,
    clearNotifications,
    getUnreadCount,
    logout,
    currentOwner,
    accounts,
    projects,
  } = useNexusStore();

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const currentAccount = accounts.find(a => a.owner === currentOwner);
  const accentColor = currentAccount?.accentColor || '#6366f1';
  const unreadCount = getUnreadCount();

  // Determine current view title
  let currentTitle = VIEW_TITLES[location.pathname];
  if (!currentTitle && location.pathname.startsWith('/project/')) {
    const projId = location.pathname.split('/project/')[1];
    const proj = projects.find(p => p.id === projId);
    currentTitle = proj ? `${proj.emoji} ${proj.name}` : '📁 Proyecto';
  }
  if (!currentTitle) currentTitle = '📥 Inbox';

  // Format timer elapsed seconds into MM:SS or HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const contextOptions: { mode: ContextMode; label: string; icon: string }[] = [
    { mode: 'private', label: 'Mi Bóveda', icon: '🔒' },
    { mode: 'couple', label: 'Hub Pareja', icon: '💑' },
    { mode: 'unified', label: 'Unificado', icon: '⚡' },
  ];

  return (
    <header className="h-14 glass-panel border-b border-nexus-border sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 shrink-0">
      {/* Left Area: Mobile Hamburger & View Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg border border-nexus-border text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors md:hidden"
          title="Menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-sm sm:text-base font-bold text-nexus-text tracking-tight truncate max-w-[160px] sm:max-w-[220px]">
          {currentTitle}
        </h1>
      </div>

      {/* Center: Context Switcher with 3 pills */}
      <div className="flex items-center gap-1 p-1 bg-nexus-surface-2 rounded-2xl border border-nexus-border shadow-inner">
        {contextOptions.map(opt => {
          const isActive = contextMode === opt.mode;

          return (
            <button
              key={opt.mode}
              onClick={() => switchContext(opt.mode)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-nexus-surface-3 text-nexus-text shadow-sm'
                  : 'text-nexus-text-muted hover:text-nexus-text'
              }`}
              style={
                isActive
                  ? {
                      borderColor: accentColor,
                      color: '#ffffff',
                    }
                  : {}
              }
            >
              <span className="text-xs">{opt.icon}</span>
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Area: Timer Mini-Display, Notifications, Avatar, Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Timer Mini-Display */}
        {timer.state !== 'idle' && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-nexus-surface-2 border border-nexus-border shadow-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                timer.state === 'running'
                  ? 'bg-emerald-400 animate-ping'
                  : 'bg-amber-400'
              }`}
            />
            <span className="font-mono text-xs font-bold text-nexus-text">
              {formatTime(timer.elapsed)}
            </span>
            {timer.targetTitle && (
              <span className="text-[11px] text-nexus-text-muted truncate max-w-[90px] hidden md:inline">
                {timer.targetTitle}
              </span>
            )}
            <div className="flex items-center gap-1 ml-1 border-l border-nexus-border pl-1">
              {timer.state === 'running' ? (
                <button
                  onClick={pauseTimer}
                  className="p-1 text-nexus-text-muted hover:text-amber-400 transition-colors"
                  title="Pausar"
                >
                  <Pause className="w-3 h-3 fill-current" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="p-1 text-nexus-text-muted hover:text-emerald-400 transition-colors"
                  title="Reanudar"
                >
                  <Play className="w-3 h-3 fill-current" />
                </button>
              )}
              <button
                onClick={() => stopTimer()}
                className="p-1 text-nexus-text-muted hover:text-red-400 transition-colors"
                title="Detener y guardar tiempo"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            </div>
          </div>
        )}

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-surface-2 border border-transparent hover:border-nexus-border transition-colors relative"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popup */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-nexus-surface-2 border border-nexus-border rounded-2xl shadow-2xl p-4 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-nexus-border">
                <span className="text-xs font-bold text-nexus-text">Notificaciones</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      notifications.forEach(n => markNotificationRead(n.id));
                    }}
                    className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Marcar todas
                  </button>
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="text-nexus-text-muted hover:text-nexus-text"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-nexus-text-muted">
                    No tienes notificaciones
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                        n.read
                          ? 'bg-nexus-surface-3/40 border-nexus-border/40 text-nexus-text-muted'
                          : 'bg-nexus-surface-3 border-nexus-border text-nexus-text font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-nexus-text truncate">{n.title}</span>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 ml-1" />}
                      </div>
                      <p className="text-[11px] text-nexus-text-secondary mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar + Name */}
        <div className="flex items-center gap-2 pl-2 border-l border-nexus-border">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-nexus-surface-2 border text-xs font-semibold text-nexus-text"
            style={{ borderColor: accentColor }}
          >
            <span className="text-sm flex items-center justify-center">
              {currentAccount?.avatar && (currentAccount.avatar.startsWith('http') || currentAccount.avatar.startsWith('data:')) ? (
                <img src={currentAccount.avatar} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                currentAccount?.avatar || '👤'
              )}
            </span>
            <span className="hidden sm:inline capitalize">{currentAccount?.displayName}</span>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            className="p-1.5 rounded-xl text-nexus-text-muted hover:text-red-400 hover:bg-nexus-surface-2 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
