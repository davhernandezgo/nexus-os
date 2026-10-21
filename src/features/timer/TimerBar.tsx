import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Timer as StopwatchIcon, Sparkles, CheckCircle2, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNexusStore } from '../../store/nexusStore';
import AmbientSound from './AmbientSound';

export default function TimerBar() {
  const {
    timer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    tickTimer,
    setTimerMode,
    setPomodoroConfig,
  } = useNexusStore();

  const [showStopModal, setShowStopModal] = useState<boolean>(false);
  const [sessionNote, setSessionNote] = useState<string>('');
  const [showConfigPopover, setShowConfigPopover] = useState<boolean>(false);

  // Active ticking effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timer.state === 'running' || timer.state === 'break') {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.state, tickTimer]);

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (totalSeconds: number): string => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const isPomodoro = timer.mode === 'pomodoro';
  const pomodoroCfg = timer.pomodoroConfig || {
    focusMinutes: 25,
    breakMinutes: 5,
    currentCycle: 1,
    isBreak: false,
  };

  const isBreak = timer.state === 'break' || pomodoroCfg.isBreak;
  const targetDurationSec = isBreak
    ? pomodoroCfg.breakMinutes * 60
    : pomodoroCfg.focusMinutes * 60;

  // In Pomodoro, show countdown remaining; in stopwatch, show elapsed
  const displaySeconds = isPomodoro
    ? Math.max(0, targetDurationSec - timer.elapsed)
    : timer.elapsed;

  const progressPercent = isPomodoro
    ? Math.min(100, (timer.elapsed / targetDurationSec) * 100)
    : 0;

  const handlePlayPause = () => {
    if (timer.state === 'idle') {
      startTimer(timer.targetId, timer.targetType, timer.targetTitle || 'Sesión de enfoque');
    } else if (timer.state === 'running') {
      pauseTimer();
    } else if (timer.state === 'paused') {
      resumeTimer();
    }
  };

  const handleStopClick = () => {
    if (timer.elapsed > 5 || timer.state !== 'idle') {
      setShowStopModal(true);
    } else {
      stopTimer();
    }
  };

  const handleConfirmStop = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    stopTimer(sessionNote.trim());
    setSessionNote('');
    setShowStopModal(false);
  };

  const handleDiscardStop = () => {
    stopTimer();
    setSessionNote('');
    setShowStopModal(false);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-nexus-border h-16 px-4 md:px-8 flex items-center justify-between shadow-2xl backdrop-blur-xl">
        {/* Subtle Pomodoro progress bar at the very top edge */}
        {isPomodoro && (timer.state === 'running' || timer.state === 'break' || timer.state === 'paused') && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-nexus-surface-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isBreak ? 'bg-emerald-400' : 'bg-red-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* LEFT: Target Tracked + Mode selector */}
        <div className="flex items-center gap-3 min-w-0 max-w-[35%] md:max-w-[40%]">
          {/* Mode Switcher */}
          <div className="inline-flex p-0.5 rounded-lg bg-nexus-surface-2 border border-nexus-border shrink-0">
            <button
              type="button"
              onClick={() => setTimerMode('stopwatch')}
              title="Modo Cronómetro"
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                !isPomodoro
                  ? 'bg-nexus-surface-3 text-nexus-text shadow-xs'
                  : 'text-nexus-text-muted hover:text-nexus-text'
              }`}
            >
              <StopwatchIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">⏱️ Cronómetro</span>
            </button>
            <button
              type="button"
              onClick={() => setTimerMode('pomodoro')}
              title="Modo Pomodoro"
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                isPomodoro
                  ? 'bg-nexus-surface-3 text-red-400 shadow-xs'
                  : 'text-nexus-text-muted hover:text-nexus-text'
              }`}
            >
              <span>🍅</span>
              <span className="hidden sm:inline">Pomodoro</span>
            </button>
          </div>

          {/* Target Title info */}
          <div className="min-w-0 truncate hidden xs:block">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-nexus-text truncate">
              {timer.targetType === 'habit' && <span>🌱</span>}
              {timer.targetType === 'task' && <span>📋</span>}
              <span className="truncate">{timer.targetTitle || 'Sesión de concentración'}</span>
            </div>
            <div className="text-[10px] text-nexus-text-muted flex items-center gap-1.5 truncate">
              {timer.state === 'running' && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
              {timer.state === 'break' && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              )}
              {timer.state === 'paused' && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
              {timer.state === 'idle' && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-500" />
              )}
              <span className="capitalize">
                {timer.state === 'break'
                  ? 'Descanso de ciclo'
                  : isPomodoro
                  ? `Ciclo de enfoque #${pomodoroCfg.currentCycle}`
                  : timer.state === 'running'
                  ? 'En progreso'
                  : timer.state === 'paused'
                  ? 'Pausado'
                  : 'Listo para iniciar'}
              </span>
            </div>
          </div>
        </div>

        {/* CENTER: Main Timer Display & Primary Controls */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Time digits */}
          <div className="flex flex-col items-center">
            <span
              className={`font-mono text-xl md:text-2xl font-bold tracking-tight select-none ${
                isBreak
                  ? 'text-cyan-400'
                  : timer.state === 'running'
                  ? 'text-nexus-text'
                  : timer.state === 'paused'
                  ? 'text-amber-400'
                  : 'text-nexus-text-secondary'
              }`}
            >
              {formatTime(displaySeconds)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={handlePlayPause}
              title={
                timer.state === 'running'
                  ? 'Pausar sesión'
                  : timer.state === 'paused'
                  ? 'Reanudar sesión'
                  : 'Comenzar cronómetro'
              }
              className={`p-2.5 rounded-full font-medium transition-all shadow-md active:scale-95 flex items-center justify-center ${
                timer.state === 'running'
                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'
              }`}
            >
              {timer.state === 'running' ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Stop button */}
            <button
              type="button"
              disabled={timer.state === 'idle' && timer.elapsed === 0}
              onClick={handleStopClick}
              title="Finalizar y registrar sesión"
              className={`p-2.5 rounded-full transition-all active:scale-95 flex items-center justify-center ${
                timer.state !== 'idle' || timer.elapsed > 0
                  ? 'bg-nexus-surface-2 text-red-400 hover:bg-red-500/20 border border-nexus-border hover:border-red-500/40'
                  : 'bg-nexus-surface-2/40 text-nexus-text-muted/40 cursor-not-allowed border border-transparent'
              }`}
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        {/* RIGHT: Pomodoro config quick pills & Ambient Noise */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Pomodoro quick presets */}
          {isPomodoro && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowConfigPopover(!showConfigPopover)}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-nexus-surface-2 hover:bg-nexus-surface-3 text-nexus-text-secondary hover:text-nexus-text border border-nexus-border transition-colors"
              >
                <span>{pomodoroCfg.focusMinutes}m / {pomodoroCfg.breakMinutes}m</span>
                {showConfigPopover ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>

              <AnimatePresence>
                {showConfigPopover && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full mb-2 right-0 w-64 p-3 bg-nexus-surface-2 border border-nexus-border rounded-xl shadow-2xl z-50 backdrop-blur-md"
                  >
                    <div className="text-xs font-semibold text-nexus-text mb-2">
                      Configuración de Pomodoro
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-[11px] text-nexus-text-muted mb-1.5">Tiempo de Enfoque</div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[25, 50].map((mins) => (
                            <button
                              key={`focus-${mins}`}
                              type="button"
                              onClick={() => {
                                setPomodoroConfig(mins, pomodoroCfg.breakMinutes);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between border transition-all ${
                                pomodoroCfg.focusMinutes === mins
                                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                  : 'bg-nexus-surface-3 text-nexus-text-secondary hover:text-nexus-text border-nexus-border'
                              }`}
                            >
                              <span>{mins} minutos</span>
                              {pomodoroCfg.focusMinutes === mins && <Check className="w-3 h-3 text-red-400" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-nexus-text-muted mb-1.5">Tiempo de Descanso</div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[5, 10].map((mins) => (
                            <button
                              key={`break-${mins}`}
                              type="button"
                              onClick={() => {
                                setPomodoroConfig(pomodoroCfg.focusMinutes, mins);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between border transition-all ${
                                pomodoroCfg.breakMinutes === mins
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-nexus-surface-3 text-nexus-text-secondary hover:text-nexus-text border-nexus-border'
                              }`}
                            >
                              <span>{mins} minutos</span>
                              {pomodoroCfg.breakMinutes === mins && <Check className="w-3 h-3 text-emerald-400" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Ambient Sound (Brown Noise Generator) */}
          <AmbientSound />
        </div>
      </div>

      {/* Mini-modal on Stop: "Qué avanzaste en esta sesión?" */}
      <AnimatePresence>
        {showStopModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-nexus-surface border border-nexus-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-nexus-text">
                    ¡Gran sesión completada!
                  </h3>
                  <p className="text-xs text-nexus-text-muted">
                    Tiempo acumulado: {Math.max(1, Math.round(timer.elapsed / 60))} min{' '}
                    {timer.targetTitle ? `en "${timer.targetTitle}"` : ''}
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmStop} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-nexus-text-secondary mb-1.5">
                    ¿Qué avanzaste en esta sesión?
                  </label>
                  <textarea
                    rows={3}
                    autoFocus
                    value={sessionNote}
                    onChange={(e) => setSessionNote(e.target.value)}
                    placeholder="Ej: Implementé el middleware de autenticación y redacté pruebas unitarias..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border focus:border-indigo-500 focus:outline-hidden text-sm text-nexus-text placeholder-nexus-text-muted resize-none transition-colors"
                  />
                  <p className="text-[11px] text-nexus-text-muted mt-1">
                    Se guardará un bloque de timestamp en el documento y se actualizará el registro de auditoría.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-nexus-border">
                  <button
                    type="button"
                    onClick={handleDiscardStop}
                    className="px-3 py-1.5 text-xs text-nexus-text-muted hover:text-red-400 transition-colors"
                  >
                    Descartar notas
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowStopModal(false)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
                    >
                      Guardar sesión
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
