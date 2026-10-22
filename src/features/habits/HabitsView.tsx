import React, { useState, useMemo } from 'react';
import {
  Plus, Flame, Play, Check, Clock, Shield, Lock, Users,
  Sparkles, Filter, Calendar, Award, CheckCircle2, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNexusStore } from '../../store/nexusStore';
import { getCurrentStreak } from '../../types/nexus';
import type { Habit, ContextMode, Owner } from '../../types/nexus';
import HabitCreateModal from './HabitCreateModal';
import HabitDetailModal from './HabitDetailModal';

export default function HabitsView() {
  const {
    getVisibleHabits,
    currentOwner,
    contextMode,
    switchContext,
    toggleHabitDay,
    adjustHabitValue,
    startTimer,
    accounts,
  } = useNexusStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const visibleHabits = getVisibleHabits();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Filtered habits by optional search
  const filteredHabits = useMemo(() => {
    if (!searchQuery.trim()) return visibleHabits;
    return visibleHabits.filter((h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [visibleHabits, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let completedCount = 0;
    let totalMinutesToday = 0;
    let maxStreak = 0;

    visibleHabits.forEach((h) => {
      const comp = h.completions.find((c) => c.date === todayStr);
      const isNumeric = h.goalType === 'numeric';
      const targetVal = h.targetValue || 1;
      const curVal = comp?.valueLogged ?? (comp?.completed ? targetVal : 0);
      const isDone = !!comp?.completed || (isNumeric && curVal >= targetVal);
      if (isDone) {
        completedCount++;
        totalMinutesToday += comp?.minutesLogged || 0;
      }
      const streak = getCurrentStreak(h);
      if (streak > maxStreak) maxStreak = streak;
    });

    const completionPercent = visibleHabits.length > 0
      ? Math.round((completedCount / visibleHabits.length) * 100)
      : 0;

    return {
      completedCount,
      totalCount: visibleHabits.length,
      completionPercent,
      totalMinutesToday,
      maxStreak,
    };
  }, [visibleHabits, todayStr]);

  return (
    <div className="flex-1 flex flex-col h-full bg-nexus-bg text-nexus-text overflow-y-auto pb-24">
      {/* ── TOP HEADER & CONTEXT CONTROLS ── */}
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-nexus-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-nexus-text">
                Hábitos & Constancia
              </h1>
              <span className="text-xl">🔥</span>
            </div>
            <p className="text-xs sm:text-sm text-nexus-text-secondary">
              Construye rutinas de alto impacto y sincroniza metas personales o en pareja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Context Mode Selector (Privado / Pareja / Unificado) */}
            <div className="inline-flex p-1 rounded-xl bg-nexus-surface border border-nexus-border text-xs">
              {(['private', 'couple', 'unified'] as ContextMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => switchContext(mode)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all capitalize ${
                    contextMode === mode
                      ? 'bg-nexus-surface-3 text-nexus-text shadow-xs'
                      : 'text-nexus-text-muted hover:text-nexus-text'
                  }`}
                >
                  {mode === 'private' && '🔒 Privado'}
                  {mode === 'couple' && '💑 Pareja'}
                  {mode === 'unified' && '✨ Todo'}
                </button>
              ))}
            </div>

            {/* Quick Add Habit Button */}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Hábito</span>
            </button>
          </div>
        </div>

        {/* ── METRICS SUMMARY BAR ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6">
          <div className="p-4 rounded-2xl bg-nexus-surface border border-nexus-border flex items-center justify-between shadow-xs">
            <div>
              <div className="text-xs text-nexus-text-muted font-medium mb-1">Completados Hoy</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-nexus-text">
                  {metrics.completedCount}
                </span>
                <span className="text-xs text-nexus-text-muted">/ {metrics.totalCount} hábitos</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-nexus-surface border border-nexus-border flex items-center justify-between shadow-xs">
            <div>
              <div className="text-xs text-nexus-text-muted font-medium mb-1">Racha Destacada</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {metrics.maxStreak}
                </span>
                <span className="text-xs text-nexus-text-muted">días consecutivos</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5 fill-current" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-nexus-surface border border-nexus-border flex items-center justify-between shadow-xs">
            <div>
              <div className="text-xs text-nexus-text-muted font-medium mb-1">Progreso Diario</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-indigo-400">
                  {metrics.completionPercent}%
                </span>
                <span className="text-xs text-nexus-text-muted">de la meta</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-nexus-surface border border-nexus-border flex items-center justify-between shadow-xs">
            <div>
              <div className="text-xs text-nexus-text-muted font-medium mb-1">Enfoque Hoy</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-cyan-400">
                  {metrics.totalMinutesToday}
                </span>
                <span className="text-xs text-nexus-text-muted">min registrados</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ── HABIT CARDS GRID ── */}
        {filteredHabits.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-nexus-surface border border-nexus-border flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl mb-4">
              🌱
            </div>
            <h3 className="text-base font-semibold text-nexus-text mb-1">
              No hay hábitos en este modo de visualización
            </h3>
            <p className="text-xs text-nexus-text-muted max-w-sm mb-5">
              Crea un nuevo hábito o cambia de vista (Privado / Pareja) para ver tus hábitos activos.
            </p>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
            >
              + Crear primer hábito
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHabits.map((habit) => {
              const currentStreak = getCurrentStreak(habit);
              const todayComp = habit.completions.find((c) => c.date === todayStr);
              const isNumeric = habit.goalType === 'numeric';
              const targetVal = habit.targetValue || (habit.targetMinutes ? habit.targetMinutes : 1);
              const currentVal = todayComp?.valueLogged ?? (todayComp?.completed ? targetVal : 0);
              const unit = habit.unit || (isNumeric ? 'veces' : 'min');
              const isCompletedToday = !!todayComp?.completed || (isNumeric && currentVal >= targetVal);
              const isFreezeToday = habit.streakFreezes.includes(todayStr);
              const minutesLogged = todayComp?.minutesLogged || 0;
              const progressPercent = isNumeric
                ? Math.min(100, Math.round((currentVal / targetVal) * 100))
                : isCompletedToday ? 100 : 0;

              return (
                <motion.div
                  key={habit.id}
                  layoutId={`habit-card-${habit.id}`}
                  onClick={() => setSelectedHabitId(habit.id)}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  className="group relative rounded-2xl bg-nexus-surface border border-nexus-border hover:border-nexus-border-hover p-4 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
                >
                  {/* Color Accent Bar on Left */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2"
                    style={{ backgroundColor: habit.color }}
                  />

                  {/* Card Header: Icon + Name + Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5 pl-1.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: `${habit.color}20`,
                            border: `1px solid ${habit.color}40`,
                          }}
                        >
                          {habit.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-nexus-text truncate group-hover:text-indigo-300 transition-colors">
                            {habit.name}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-nexus-text-muted mt-0.5">
                            <span>🎯 {habit.frequencyPerWeek}/7 días</span>
                            {isNumeric ? (
                              <span className="text-cyan-400 font-medium">• Meta: {targetVal} {unit}/día</span>
                            ) : habit.targetMinutes ? (
                              <span>• {habit.targetMinutes}m/día</span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Visibility & Owner Badge */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border ${
                            habit.visibility === 'couple'
                              ? 'bg-pink-500/10 text-pink-300 border-pink-500/30'
                              : 'bg-nexus-surface-2 text-nexus-text-muted border-nexus-border'
                          }`}
                        >
                          {habit.visibility === 'couple' ? (
                            <>
                              <Users className="w-3 h-3 text-pink-400" />
                              <span className="hidden sm:inline">Pareja</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-indigo-400" />
                              <span className="hidden sm:inline">Personal</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Streak & Status Row */}
                    <div className="space-y-2 pl-1.5 my-3 py-2 px-3 rounded-xl bg-nexus-surface-2/80 border border-nexus-border/60">
                      <div className="flex items-center justify-between text-xs">
                        {/* Current Streak */}
                        <div className="flex items-center gap-1.5">
                          <Flame
                            className={`w-4 h-4 ${
                              currentStreak > 0 ? 'text-amber-400 fill-amber-400' : 'text-nexus-text-muted'
                            }`}
                          />
                          <span className="font-bold font-mono text-nexus-text">
                            {currentStreak} {currentStreak === 1 ? 'día' : 'días'}
                          </span>
                          {isFreezeToday && (
                            <span
                              title="Día protegido con escudo de racha"
                              className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded-md bg-cyan-500/20 text-cyan-300 font-medium"
                            >
                              ❄️ Protegido
                            </span>
                          )}
                        </div>

                        {/* Numeric vs Minutes Logged */}
                        {isNumeric ? (
                          <div className="flex items-center gap-1 font-mono text-xs font-bold">
                            <span className={isCompletedToday ? 'text-emerald-400' : 'text-cyan-300'}>
                              {currentVal} / {targetVal} {unit}
                            </span>
                            <span className="text-[10px] text-nexus-text-muted">({progressPercent}%)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-nexus-text-secondary font-mono">
                            <Clock className="w-3.5 h-3.5 text-nexus-text-muted" />
                            <span>
                              {minutesLogged} {habit.targetMinutes ? `/ ${habit.targetMinutes}` : ''} min
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar for Numeric Habits */}
                      {isNumeric && (
                        <div className="w-full h-1.5 rounded-full bg-nexus-surface-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCompletedToday
                                ? 'bg-emerald-400'
                                : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Interactive Controls */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-nexus-border pl-1.5 mt-1">
                    {isNumeric ? (
                      /* Numeric Habit Controls: [-] [Count] [+] and [Full Check] */
                      <>
                        <div className="flex items-center gap-1 bg-nexus-surface-2 p-1 rounded-xl border border-nexus-border">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              adjustHabitValue(habit.id, todayStr, -1);
                            }}
                            disabled={currentVal <= 0}
                            className="w-7 h-7 rounded-lg bg-nexus-surface-3 hover:bg-nexus-surface text-nexus-text disabled:opacity-30 flex items-center justify-center font-bold text-xs transition active:scale-90"
                            title={`Restar 1 ${unit}`}
                          >
                            -
                          </button>
                          <span className="text-xs font-bold font-mono px-2 text-center text-nexus-text min-w-8">
                            {currentVal}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              adjustHabitValue(habit.id, todayStr, +1);
                            }}
                            className="w-7 h-7 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 flex items-center justify-center font-bold text-xs transition active:scale-90 shadow-sm"
                            title={`Sumar 1 ${unit}`}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHabitDay(habit.id, todayStr, 0, targetVal);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 border ${
                            isCompletedToday
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-nexus-surface-2 text-nexus-text-secondary hover:text-nexus-text border-nexus-border'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 ${isCompletedToday ? 'text-emerald-400 stroke-[3]' : ''}`} />
                          <span>{isCompletedToday ? '¡Meta Lista!' : `Completar (${targetVal})`}</span>
                        </button>
                      </>
                    ) : (
                      /* Time & Boolean Habit Controls */
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHabitDay(habit.id, todayStr, habit.targetMinutes || 30);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                            isCompletedToday
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                              : 'bg-nexus-surface-2 text-nexus-text-secondary hover:text-nexus-text border border-nexus-border hover:border-nexus-border-hover'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                              isCompletedToday
                                ? 'bg-emerald-500 text-white'
                                : 'border border-nexus-text-muted'
                            }`}
                          >
                            {isCompletedToday && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{isCompletedToday ? 'Completado hoy' : 'Marcar hoy'}</span>
                        </button>

                        {/* Launch Timer for Habit */}
                        <button
                          type="button"
                          title={`Iniciar temporizador de enfoque para ${habit.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            startTimer(habit.id, 'habit', habit.name);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-300 hover:text-white bg-indigo-600/15 hover:bg-indigo-600 border border-indigo-500/30 transition-all active:scale-95 shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span className="hidden sm:inline">Enfocar</span>
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {/* 1. Habit Create Modal */}
      <HabitCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* 2. Habit Detail Modal */}
      <HabitDetailModal
        habitId={selectedHabitId}
        onClose={() => setSelectedHabitId(null)}
      />
    </div>
  );
}
