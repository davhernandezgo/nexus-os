import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Mail,
  Palette,
  Check,
  Moon,
  Sun,
  Heart,
  LogOut,
  ExternalLink,
  Sparkles,
  Camera,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import { useNavigate } from 'react-router-dom';

const EMOJI_PRESETS = [
  '👨‍💻', '👩‍🎨', '🚀', '⚡', '🧘', '🎨', '💼', '🌟',
  '🦊', '🦉', '🦁', '🐼', '☕', '🎯', '💎', '🥑',
];

const ACCENT_COLORS = [
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Rosa Neón', value: '#ec4899' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Ámbar', value: '#f59e0b' },
  { name: 'Cian', value: '#06b6d4' },
  { name: 'Púrpura', value: '#8b5cf6' },
];

export const ProfileModal: React.FC = () => {
  const {
    isProfileOpen,
    setProfileOpen,
    currentUser,
    currentOwner,
    accounts,
    coupleSpace,
    theme,
    setTheme,
    updateProfile,
    logout,
  } = useNexusStore();

  const navigate = useNavigate();

  const currentAccount = accounts.find(a => a.owner === currentOwner || a.id === currentUser?.id);

  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [accentColor, setAccentColor] = useState('#6366f1');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isProfileOpen) {
      setDisplayName(currentUser?.displayName || currentAccount?.displayName || '');
      setAvatar(currentAccount?.avatar || currentUser?.avatar || '👤');
      setAccentColor(currentAccount?.accentColor || '#6366f1');
      setSavedSuccess(false);
    }
  }, [isProfileOpen, currentUser, currentAccount]);

  if (!isProfileOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    updateProfile({
      displayName: displayName.trim(),
      avatar,
      accentColor,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setProfileOpen(false);
    }, 700);
  };

  const isGoogleAvatar = currentUser?.avatar && (currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('data:'));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setProfileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl relative z-10 border border-nexus-border space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-nexus-border">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg border shadow-sm"
                style={{ borderColor: accentColor, backgroundColor: `${accentColor}15` }}
              >
                {avatar.startsWith('http') ? (
                  <img src={avatar} alt="Avatar" className="w-9 h-9 rounded-xl object-cover" />
                ) : (
                  <span>{avatar}</span>
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-nexus-text">Mi Perfil & Configuración</h2>
                <p className="text-xs text-nexus-text-muted">Personaliza tu identidad y apariencia</p>
              </div>
            </div>

            <button
              onClick={() => setProfileOpen(false)}
              className="p-1.5 rounded-xl text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Display Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-nexus-text flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nombre Visible</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Tu nombre o apodo..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text placeholder-nexus-text-muted focus:outline-none focus:border-indigo-500 transition"
                required
              />
              <span className="text-[11px] text-nexus-text-muted block">
                Este nombre aparecerá en tu Nota del Día, inversiones y tareas.
              </span>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-nexus-text flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-nexus-text-muted" />
                <span>Correo Electrónico</span>
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-nexus-surface-2/60 border border-nexus-border/60 text-xs text-nexus-text-secondary flex items-center justify-between">
                <span>{currentUser?.email || 'Sesión local'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Verificado
                </span>
              </div>
            </div>

            {/* Avatar Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-nexus-text flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-pink-400" />
                  <span>Avatar / Icono</span>
                </span>
                {isGoogleAvatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar(currentUser!.avatar!)}
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Usar foto de Google
                  </button>
                )}
              </label>

              {/* Emoji Presets Grid */}
              <div className="grid grid-cols-8 gap-1.5 p-2 rounded-2xl bg-nexus-surface-2 border border-nexus-border">
                {EMOJI_PRESETS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`h-9 rounded-xl text-lg flex items-center justify-center transition ${
                      avatar === emoji
                        ? 'bg-nexus-surface-3 ring-2 ring-indigo-500 scale-105'
                        : 'hover:bg-nexus-surface-3/50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Custom Emoji Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={avatar.startsWith('http') ? '' : avatar}
                  onChange={e => setAvatar(e.target.value || '👤')}
                  placeholder="O escribe cualquier emoji..."
                  className="w-full px-3 py-1.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text placeholder-nexus-text-muted focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Accent Color Palette */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-nexus-text flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <span>Color de Acento</span>
              </label>
              <div className="flex items-center gap-3">
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setAccentColor(c.value)}
                    title={c.name}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      accentColor === c.value ? 'scale-110 ring-2 ring-white/50' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.value }}
                  >
                    {accentColor === c.value && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Toggle (Dark / Light) */}
            <div className="space-y-2 pt-2 border-t border-nexus-border">
              <label className="text-xs font-semibold text-nexus-text flex items-center justify-between">
                <span>Tema Visual de la Aplicación</span>
                <span className="text-[11px] text-nexus-text-muted uppercase font-mono">{theme}</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
                    theme === 'dark'
                      ? 'bg-nexus-surface-3 border-indigo-500/60 text-white shadow-sm'
                      : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>Modo Oscuro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
                    theme === 'light'
                      ? 'bg-nexus-surface-3 border-amber-500/60 text-nexus-text shadow-sm'
                      : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Modo Claro</span>
                </button>
              </div>
            </div>

            {/* Couple Space Status */}
            <div className="p-3.5 rounded-2xl bg-nexus-surface-2 border border-nexus-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-nexus-text">
                    {coupleSpace?.status === 'active' ? coupleSpace.name : 'Hub de Pareja'}
                  </div>
                  <div className="text-[11px] text-nexus-text-muted">
                    {coupleSpace?.status === 'active'
                      ? `Conectado con ${coupleSpace.user1Name === displayName ? coupleSpace.user2Name : coupleSpace.user1Name}`
                      : 'Sin espacio vinculado actualmente'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/couple');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                <span>{coupleSpace?.status === 'active' ? 'Ver Hub' : 'Vincular'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-nexus-border">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white text-xs font-semibold transition shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>¡Guardado!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProfileModal;
