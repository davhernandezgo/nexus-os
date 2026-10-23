import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import { supabase } from '../../lib/supabase';
import NexusLogo from '../../components/ui/NexusLogo';

type AuthMode = 'login' | 'signup';

const LoginScreen: React.FC = () => {
  const { setSupabaseUser } = useNexusStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle Google OAuth Sign-in
  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    if (!supabase) {
      setError('La conexión con Supabase no está configurada.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        if (error.message.includes('not enabled') || error.message.includes('provider')) {
          setError('El proveedor de Google aún no está activado en tu panel de Supabase. Puedes ingresar con Email y Contraseña mientras lo activas.');
        } else {
          setError(error.message);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Error al conectar con Google.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email & Password Login or Sign Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (!supabase) {
      setError('La base de datos de Supabase no está disponible en este momento.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          setError('Por favor ingresa tu nombre completo.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          setError(error.message);
        } else if (data.session) {
          setSupabaseUser(data.user);
        } else if (data.user) {
          setSuccessMsg('¡Cuenta creada con éxito! Si tienes confirmación de correo activada, revisa tu bandeja de entrada o inicia sesión con tus datos.');
          setMode('login');
        }
      } else {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Credenciales inválidas. Verifica tu correo y contraseña.');
          } else {
            setError(error.message);
          }
        } else if (data.user) {
          setSupabaseUser(data.user);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error inesperado al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-nexus-bg text-nexus-text p-4 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Titles */}
        <div className="text-center mb-6 flex flex-col items-center">
          <NexusLogo size="lg" className="mb-3" />
          <h1 className="text-3xl font-extrabold tracking-tight text-nexus-text">NexusOS</h1>
          <p className="text-xs text-nexus-text-muted mt-1">
            LifeOS • Finanzas Personales & Pareja
          </p>
        </div>

        {/* Dynamic Card Container */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-nexus-border shadow-2xl relative space-y-5">
          {/* Header inside card */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-nexus-text">
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
            <p className="text-xs text-nexus-text-muted">
              {mode === 'login'
                ? 'Accede a tu bóveda personal y espacio compartido'
                : 'Regístrate para comenzar a gestionar tus metas y finanzas'}
            </p>
          </div>

          {/* Google OAuth Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-xs font-semibold text-nexus-text transition hover:border-nexus-border-hover active:scale-[0.99] disabled:opacity-50 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-nexus-border w-full" />
            <span className="bg-nexus-surface px-3 text-[11px] text-nexus-text-muted uppercase tracking-wider relative">
              o con correo
            </span>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 bg-nexus-surface-2 rounded-xl border border-nexus-border text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-1.5 rounded-lg font-semibold transition ${
                mode === 'login'
                  ? 'bg-nexus-surface-3 text-nexus-text shadow-sm'
                  : 'text-nexus-text-muted hover:text-nexus-text'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-1.5 rounded-lg font-semibold transition ${
                mode === 'signup'
                  ? 'bg-nexus-surface-3 text-nexus-text shadow-sm'
                  : 'text-nexus-text-muted hover:text-nexus-text'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-semibold text-nexus-text-muted uppercase tracking-wider mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-nexus-text-muted" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text placeholder-nexus-text-muted focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-nexus-text-muted uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-nexus-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text placeholder-nexus-text-muted focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-nexus-text-muted uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-nexus-text-muted" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text placeholder-nexus-text-muted focus:outline-none focus:border-indigo-500"
                />
              </div>
              {mode === 'signup' && (
                <span className="text-[10px] text-nexus-text-muted mt-1 block">
                  Mínimo 6 caracteres
                </span>
              )}
            </div>

            {/* Alerts */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white font-semibold text-xs transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Iniciar Sesión' : 'Crear Mi Cuenta'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
