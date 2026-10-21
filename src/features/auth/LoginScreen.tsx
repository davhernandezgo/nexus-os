import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowLeft, Delete, KeyRound, Sparkles } from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { Owner } from '../../types/nexus';

const LoginScreen: React.FC = () => {
  const { accounts, login } = useNexusStore();
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [pin, setPin] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedAccount = accounts.find(a => a.owner === selectedOwner);

  // Keyboard listener for physical keyboard typing
  useEffect(() => {
    if (!selectedOwner) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        if (pin.length < 4) {
          handleDigitPress(e.key);
        }
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleBackToProfiles();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOwner, pin]);

  const handleDigitPress = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMessage(null);

    if (newPin.length === 4) {
      verifyPin(newPin);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const verifyPin = (pinToTest: string) => {
    if (!selectedOwner) return;

    const success = login(selectedOwner, pinToTest);
    if (!success) {
      setIsShaking(true);
      setErrorMessage('PIN incorrecto. Intenta de nuevo.');
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 500);
    }
  };

  const handleBackToProfiles = () => {
    setSelectedOwner(null);
    setPin('');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-nexus-bg text-nexus-text p-4 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Titles */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-nexus-surface-2 border border-nexus-border shadow-xl mb-3">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-nexus-text">NexusOS</h1>
          <p className="text-sm text-nexus-text-muted mt-1">Personal & Couple LifeOS</p>
        </div>

        {/* Dynamic Card Container */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-nexus-border shadow-2xl relative">
          <AnimatePresence mode="wait">
            {!selectedOwner ? (
              /* Step 1: Select Profile */
              <motion.div
                key="select-profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-base font-semibold text-nexus-text">¿Quién está ingresando?</h2>
                  <p className="text-xs text-nexus-text-muted mt-1">
                    Selecciona tu perfil para acceder a tu bóveda
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {accounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => setSelectedOwner(acc.owner)}
                      className="group relative flex flex-col items-center justify-center p-6 rounded-2xl bg-nexus-surface-2 border border-nexus-border hover:border-nexus-border-hover transition-all hover:scale-105 hover:shadow-xl focus:outline-none"
                    >
                      <div className="text-5xl mb-3 transition-transform group-hover:scale-110">
                        {acc.avatar}
                      </div>
                      <span className="font-bold text-base text-nexus-text group-hover:text-indigo-400 transition-colors">
                        {acc.displayName}
                      </span>
                      <span className="text-[11px] text-nexus-text-muted mt-0.5 capitalize">
                        {acc.owner === 'david' ? 'Dev & Infra' : 'Diseño & Bienestar'}
                      </span>
                      <div
                        className="w-2 h-2 rounded-full mt-3"
                        style={{ backgroundColor: acc.accentColor }}
                      />
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* Step 2: Enter PIN */
              <motion.div
                key="enter-pin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Back button & Account title */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleBackToProfiles}
                    className="p-1.5 rounded-lg border border-nexus-border text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-3 transition-colors"
                    title="Cambiar perfil"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedAccount?.avatar}</span>
                    <span className="font-bold text-sm text-nexus-text">
                      {selectedAccount?.displayName}
                    </span>
                  </div>

                  <div className="w-7" />
                </div>

                {/* PIN visualization */}
                <div className="text-center">
                  <p className="text-xs text-nexus-text-muted mb-4">Ingresa tu PIN de 4 dígitos</p>

                  <motion.div
                    animate={isShaking ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="flex justify-center items-center gap-4 mb-2"
                  >
                    {[0, 1, 2, 3].map(index => {
                      const filled = index < pin.length;
                      return (
                        <div
                          key={index}
                          className={`w-4 h-4 rounded-full border-2 transition-all ${
                            filled
                              ? 'scale-110 shadow-md'
                              : 'border-nexus-border bg-nexus-surface-3'
                          }`}
                          style={{
                            borderColor: filled
                              ? selectedAccount?.accentColor || '#6366f1'
                              : undefined,
                            backgroundColor: filled
                              ? selectedAccount?.accentColor || '#6366f1'
                              : undefined,
                          }}
                        />
                      );
                    })}
                  </motion.div>

                  {/* Error display */}
                  <div className="h-5">
                    {errorMessage && (
                      <span className="text-xs text-red-400 font-medium animate-fade-in">
                        {errorMessage}
                      </span>
                    )}
                  </div>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                    <button
                      key={digit}
                      onClick={() => handleDigitPress(digit)}
                      className="h-14 rounded-2xl bg-nexus-surface-2 border border-nexus-border hover:bg-nexus-surface-3 text-lg font-bold text-nexus-text hover:border-nexus-border-hover active:scale-95 transition-all shadow-sm flex items-center justify-center"
                    >
                      {digit}
                    </button>
                  ))}
                  <div className="h-14" />
                  <button
                    onClick={() => handleDigitPress('0')}
                    className="h-14 rounded-2xl bg-nexus-surface-2 border border-nexus-border hover:bg-nexus-surface-3 text-lg font-bold text-nexus-text hover:border-nexus-border-hover active:scale-95 transition-all shadow-sm flex items-center justify-center"
                  >
                    0
                  </button>
                  <button
                    onClick={handleBackspace}
                    className="h-14 rounded-2xl bg-nexus-surface-2 border border-nexus-border hover:bg-nexus-surface-3 text-nexus-text-muted hover:text-red-400 hover:border-nexus-border-hover active:scale-95 transition-all shadow-sm flex items-center justify-center"
                    title="Borrar"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>

                {/* Subtitle hint */}
                <div className="text-center pt-2">
                  <span className="text-[11px] text-nexus-text-muted opacity-60">
                    Pista demo: David (1234) • Cami (5678)
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
