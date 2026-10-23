import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Play,
  Pause,
  Square,
  LogOut,
  Moon,
  Sun,
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
  '/investments': '📈 Inversiones ($ USD)',
  '/graph': '🔗 Grafo',
  '/daily-note': '📝 Nota del Día',
};

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    toggleSidebarCollapse,
    contextMode,
    switchContext,
    coupleSpace,
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
    currentUser,
    accounts,
    projects,
    theme,
    toggleTheme,
    setProfileOpen,
  } = useNexusStore();

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const currentAccount = accounts.find(a => a.owner === currentOwner || a.id === currentUser?.id);
  const accentColor = currentAccount?.accentColor || '#6366f1';
  const displayName = currentUser?.displayName || currentAccount?.displayName || 'Usuario';
  const displayAvatar = currentAccount?.avatar || currentUser?.avatar || '👤';
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
    <header className="h-14 glass-panel border-b border-nexus-border sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 shrink-0 select-none">
      {/* Left Area: Mobile/Desktop Toggle & View Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              setSidebarOpen(!sidebarOpen);
            } else {
              toggleSidebarCollapse();
            }
          }}
          className="p-1.5 rounded-xl border border-nexus-border text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors cursor-pointer"
          title={sidebarCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-sm sm:text-base font-bold text-nexus-text tracking-tight truncate max-w-[160px] sm:max-w-[240px]">
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
              onClick={() => {
                if (opt.mode === 'couple') {
                  if (coupleSpace?.status !== 'active') {
                    navigate('/couple');
                  }
                  switchContext('couple');
                } else {
                  switchContext(opt.mode);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

      {/* Right Area: Timer Mini-Display, Notifications, Theme, Avatar, Logout */}
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
            <div className="flex items-center gap-1 border-l border-nexus-border pl-1.5 ml-1">
              {timer.state === 'running' ? (
                <button
                  onClick={pauseTimer}
                  className="p-1 hover:text-amber-400 transition cursor-pointer"
                  title="Pausar"
                >
                  <Pause className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="p-1 hover:text-emerald-400 transition cursor-pointer"
                  title="Reanudar"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => stopTimer()}
                className="p-1 hover:text-red-400 transition cursor-pointer"
                title="Detener"
              >
                <Square className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Theme Toggle (Dark / Light) */}
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 rounded-xl text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 border border-transparent hover:border-nexus-border transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-1.5 sm:p-2 rounded-xl text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 border border-transparent hover:border-nexus-border transition-colors relative cursor-pointer"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-nexus-surface" />
            )}
          </button>

          {/* Notifications Flyout */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl shadow-2xl p-4 z-50 border border-nexus-border animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-nexus-border mb-3">
                <span className="font-bold text-xs text-nexus-text">Notificaciones</span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-[11px] text-nexus-text-muted hover:text-nexus-text transition cursor-pointer"
                  >
                    Limpiar todo
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
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

        {/* User Profile Chip (Clickable to open ProfileModal) */}
        <div className="flex items-center gap-2 pl-2 border-l border-nexus-border">
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-3 border text-xs font-semibold text-nexus-text transition-all group cursor-pointer shadow-xs"
            style={{ borderColor: accentColor }}
            title="Editar mi perfil y apariencia"
          >
            <span className="text-sm flex items-center justify-center">
              {displayAvatar && (displayAvatar.startsWith('http') || displayAvatar.startsWith('data:')) ? (
                <img src={displayAvatar} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <span>{displayAvatar}</span>
              )}
            </span>
            <span className="hidden sm:inline capitalize max-w-[140px] truncate">{displayName}</span>
            <span className="text-[10px] text-nexus-text-muted group-hover:text-indigo-400 transition ml-0.5">⚙️</span>
          </button>

          {/* Logout button */}
          <button
            onClick={logout}
            className="p-1.5 rounded-xl text-nexus-text-muted hover:text-red-400 hover:bg-nexus-surface-2 transition-colors cursor-pointer"
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
