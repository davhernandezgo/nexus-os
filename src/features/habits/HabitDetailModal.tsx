import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Check, Flame, Shield, Snowflake, Clock, Play,
  Calendar, Award, Target, Settings, Trash2, Sparkles,
  ChevronRight, Lock, Users, AlertCircle, TrendingUp,
  Plus, Minus, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, addDays, isSameDay, isFuture, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNexusStore } from '../../store/nexusStore';
import { getCurrentStreak } from '../../types/nexus';
import type { Habit, Visibility, HabitGoalType } from '../../types/nexus';
import EmojiPicker from '../../components/ui/EmojiPicker';

interface HabitDetailModalProps {
  habitId: string | null;
  onClose: () => void;
}

const COLOR_PALETTE = [
  { name: 'Rojo', hex: '#ef4444' },
  { name: 'Naranja', hex: '#f97316' },
  { name: 'Ámbar', hex: '#f59e0b' },
  { name: 'Amarillo', hex: '#eab308' },
  { name: 'Lima', hex: '#84cc16' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Esmeralda', hex: '#10b981' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Cian', hex: '#06b6d4' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Índigo', hex: '#6366f1' },
  { name: 'Violeta', hex: '#8b5cf6' },
  { name: 'Fucsia', hex: '#d946ef' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Rose', hex: '#f43f5e' },
];


export default function HabitDetailModal({ habitId, onClose }: HabitDetailModalProps) {
  const {
    habits,
    toggleHabitDay,
    adjustHabitValue,
    addStreakFreeze,
    updateHabit,
    deleteHabit,
    startTimer,
  } = useNexusStore();

  const habit = habits.find((h) => h.id === habitId);

  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [hoveredCell, setHoveredCell] = useState<{
    dateStr: string;
    minutes: number;
    valueLogged: number;
    completed: boolean;
    isFreeze: boolean;
    x: number;
    y: number;
  } | null>(null);

  // Settings form local state
  const [editName, setEditName] = useState(habit?.name || '');
  const [editIcon, setEditIcon] = useState(habit?.icon || '💪');
  const [editColor, setEditColor] = useState(habit?.color || '#6366f1');
  const [editVisibility, setEditVisibility] = useState<Visibility>(habit?.visibility || 'private');
  const [editFrequency, setEditFrequency] = useState<number>(habit?.frequencyPerWeek || 5);
  const [editGoalType, setEditGoalType] = useState<HabitGoalType>(habit?.goalType || 'boolean');
  const [editTargetValue, setEditTargetValue] = useState<number>(habit?.targetValue || 8);
  const [editUnit, setEditUnit] = useState<string>(habit?.unit || 'vasos');
  const [editTargetMinutes, setEditTargetMinutes] = useState<string>(habit?.targetMinutes ? String(habit.targetMinutes) : '');
  const [editReminderTime, setEditReminderTime] = useState<string>(habit?.reminderTime || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Lock body scroll and handle ESC key
  useEffect(() => {
    if (!habitId) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [habitId, onClose]);

  // Sync state if habit changes
  useEffect(() => {
    if (habit) {
      setEditName(habit.name);
      setEditIcon(habit.icon);
      setEditColor(habit.color);
      setEditVisibility(habit.visibility);
      setEditFrequency(habit.frequencyPerWeek);
      setEditGoalType(habit.goalType || 'boolean');
      setEditTargetValue(habit.targetValue || 8);
      setEditUnit(habit.unit || 'vasos');
      setEditTargetMinutes(habit.targetMinutes ? String(habit.targetMinutes) : '');
      setEditReminderTime(habit.reminderTime || '');
    }
  }, [habit]);

  if (!habit) return null;

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const currentStreak = getCurrentStreak(habit);
  const isNumeric = habit.goalType === 'numeric';

  // 1. Calculate Best Streak across full history
  const bestStreak = useMemo(() => {
    const activeDates = new Set<string>();
    habit.completions.forEach((c) => {
      if (c.completed) activeDates.add(c.date);
    });
    habit.streakFreezes.forEach((f) => activeDates.add(f));

    if (activeDates.size === 0) return 0;

    const sortedDates = Array.from(activeDates).sort();
    let max = 0;
    let curr = 0;
    let prev: Date | null = null;

    for (const dStr of sortedDates) {
      const d = parseISO(dStr);
      if (!prev) {
        curr = 1;
      } else {
        const diffDays = Math.round((d.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          curr++;
        } else if (diffDays === 0) {
          // duplicate
        } else {
          curr = 1;
        }
      }
      if (curr > max) max = curr;
      prev = d;
    }
    return Math.max(max, currentStreak);
  }, [habit, currentStreak]);

  // 2. Calculate Total Minutes & Numeric values logged
  const totalMinutes = useMemo(() => {
    return habit.completions.reduce((acc, c) => acc + (c.minutesLogged || 0), 0);
  }, [habit.completions]);

  const totalNumericLogged = useMemo(() => {
    return habit.completions.reduce((acc, c) => acc + (c.valueLogged || (c.completed ? (habit.targetValue || 1) : 0)), 0);
  }, [habit.completions, habit.targetValue]);

  const completionRate = useMemo(() => {
    const daysSample = 90;
    const completedDays = habit.completions.filter((c) => {
      if (!c.completed) return false;
      const cDate = parseISO(c.date);
      const diff = Math.round((today.getTime() - cDate.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= daysSample;
    }).length;

    const expected = Math.round((daysSample / 7) * habit.frequencyPerWeek);
    if (expected <= 0) return 100;
    const rate = Math.round((completedDays / expected) * 100);
    return Math.min(100, Math.max(0, rate));
  }, [habit, today]);

  // 3. Weekly Matrix Days (Lun - Dom of current week)
  const currentWeekDays = useMemo(() => {
    const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const monday = subDays(today, dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(monday, i);
      const dStr = format(d, 'yyyy-MM-dd');
      const comp = habit.completions.find((c) => c.date === dStr);
      const isFreeze = habit.streakFreezes.includes(dStr);
      const targetVal = habit.targetValue || 1;
      const curVal = comp?.valueLogged ?? (comp?.completed ? targetVal : 0);
      const completed = !!comp?.completed || (isNumeric && curVal >= targetVal);

      days.push({
        date: d,
        dateStr: dStr,
        dayName: format(d, 'EEE', { locale: es }),
        dayNum: format(d, 'd'),
        isToday: isSameDay(d, today),
        isFutureDate: isFuture(d) && !isSameDay(d, today),
        completed,
        valueLogged: curVal,
        minutesLogged: comp?.minutesLogged || 0,
        isFreeze,
      });
    }
    return days;
  }, [habit, today, isNumeric]);

  // 4. Heatmap Data (52 weeks × 7 days)
  const { heatmapWeeks, monthLabels } = useMemo(() => {
    const dayOfWeek = (today.getDay() + 6) % 7;
    const currentWeekMonday = subDays(today, dayOfWeek);
    const startGridMonday = subDays(currentWeekMonday, 51 * 7);

    const compMap = new Map<string, { completed: boolean; minutes: number; valueLogged: number }>();
    habit.completions.forEach((c) => {
      compMap.set(c.date, {
        completed: c.completed,
        minutes: c.minutesLogged || 0,
        valueLogged: c.valueLogged || (c.completed ? (habit.targetValue || 1) : 0),
      });
    });
    const freezeSet = new Set(habit.streakFreezes);

    const weeks = [];
    const months: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < 52; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const cellDate = addDays(startGridMonday, w * 7 + d);
        const cellDateStr = format(cellDate, 'yyyy-MM-dd');
        const cData = compMap.get(cellDateStr);
        const isFreeze = freezeSet.has(cellDateStr);

        if (d === 0) {
          const m = cellDate.getMonth();
          if (m !== lastMonth) {
            months.push({
              label: format(cellDate, 'MMM', { locale: es }),
              colIndex: w,
            });
            lastMonth = m;
          }
        }

        weekDays.push({
          date: cellDate,
          dateStr: cellDateStr,
          completed: !!cData?.completed,
          minutes: cData?.minutes || 0,
          valueLogged: cData?.valueLogged || 0,
          isFreeze,
          isFuture: isFuture(cellDate) && !isSameDay(cellDate, today),
        });
      }
      weeks.push(weekDays);
    }

    return { heatmapWeeks: weeks, monthLabels: months };
  }, [habit, today]);

  // Streak Shield logic
  const isTodayFrozen = habit.streakFreezes.includes(todayStr);

  const handleToggleFreezeToday = () => {
    if (isTodayFrozen) {
      updateHabit(habit.id, {
        streakFreezes: habit.streakFreezes.filter((f) => f !== todayStr),
      });
    } else {
      addStreakFreeze(habit.id, todayStr);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    updateHabit(habit.id, {
      name: editName.trim(),
      icon: editIcon,
      color: editColor,
      visibility: editVisibility,
      frequencyPerWeek: Number(editFrequency) || 5,
      goalType: editGoalType,
      targetValue: editGoalType === 'numeric' ? Number(editTargetValue) || 1 : undefined,
      unit: editGoalType === 'numeric' ? editUnit.trim() : undefined,
      targetMinutes: editGoalType === 'time' && editTargetMinutes ? Math.max(1, parseInt(editTargetMinutes, 10)) : undefined,
      reminderTime: editReminderTime ? editReminderTime : undefined,
    });
    setActiveTab('overview');
  };

  const handleDeleteHabit = () => {
    deleteHabit(habit.id);
    onClose();
  };

  const getCellIntensityStyle = (cell: { completed: boolean; minutes: number; valueLogged: number; isFreeze: boolean }) => {
    if (cell.isFreeze) {
      return { backgroundColor: '#38bdf8', opacity: 0.9 };
    }
    if (!cell.completed) {
      return { backgroundColor: 'var(--color-nexus-surface-2)', opacity: 0.7 };
    }

    if (isNumeric) {
      const target = habit.targetValue || 1;
      const ratio = cell.valueLogged > 0 ? cell.valueLogged / target : 1;
      const alpha = ratio >= 1 ? 1.0 : Math.max(0.4, ratio);
      return { backgroundColor: habit.color, opacity: alpha };
    }

    const target = habit.targetMinutes || 30;
    const ratio = cell.minutes > 0 ? cell.minutes / target : 0.5;

    let alpha = 0.4;
    if (ratio >= 1.0) alpha = 1.0;
    else if (ratio >= 0.75) alpha = 0.75;
    else if (ratio >= 0.5) alpha = 0.55;
    else alpha = 0.4;

    return {
      backgroundColor: habit.color,
      opacity: alpha,
    };
  };

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-nexus-surface border border-nexus-border w-full max-w-3xl rounded-2xl p-5 sm:p-7 shadow-2xl relative my-6 max-h-[92vh] flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-nexus-border shrink-0">
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0"
                style={{ backgroundColor: `${habit.color}25`, border: `1.5px solid ${habit.color}50` }}
              >
                {habit.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-nexus-text">{habit.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-nexus-surface-2 border border-nexus-border text-nexus-text-secondary flex items-center gap-1 font-medium">
                    {habit.visibility === 'couple' ? '💑 Pareja' : '🔒 Personal'}
                  </span>
                  {isNumeric && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-medium">
                      🎯 {habit.targetValue} {habit.unit}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-nexus-text-muted mt-0.5">
                  <span>📅 {habit.frequencyPerWeek} días/semana</span>
                  {habit.goalType === 'time' && habit.targetMinutes && <span>⏱️ Meta: {habit.targetMinutes}m</span>}
                  {habit.reminderTime && <span>🔔 {habit.reminderTime}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'overview' ? 'settings' : 'overview')}
                className={`p-2 rounded-xl transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2'
                }`}
                title="Configuración del hábito"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto flex-1 pr-1 py-4 space-y-6">
            {activeTab === 'overview' ? (
              <>
                {/* 1. KEY STATS CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-nexus-surface-2 border border-nexus-border flex flex-col justify-between">
                    <div className="flex items-center justify-between text-nexus-text-muted mb-1">
                      <span className="text-[11px] font-medium">Racha Actual</span>
                      <Flame className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-mono text-nexus-text">
                        {currentStreak}
                      </span>
                      <span className="text-xs text-nexus-text-muted">días 🔥</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-nexus-surface-2 border border-nexus-border flex flex-col justify-between">
                    <div className="flex items-center justify-between text-nexus-text-muted mb-1">
                      <span className="text-[11px] font-medium">Mejor Racha</span>
                      <Award className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-mono text-nexus-text">
                        {bestStreak}
                      </span>
                      <span className="text-xs text-nexus-text-muted">días 🏆</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-nexus-surface-2 border border-nexus-border flex flex-col justify-between">
                    <div className="flex items-center justify-between text-nexus-text-muted mb-1">
                      <span className="text-[11px] font-medium">Cumplimiento</span>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-mono text-nexus-text">
                        {completionRate}%
                      </span>
                      <span className="text-xs text-nexus-text-muted">objetivo</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-nexus-surface-2 border border-nexus-border flex flex-col justify-between">
                    <div className="flex items-center justify-between text-nexus-text-muted mb-1">
                      <span className="text-[11px] font-medium">
                        {isNumeric ? 'Total Acumulado' : 'Tiempo Total'}
                      </span>
                      {isNumeric ? <Target className="w-4 h-4 text-cyan-400" /> : <Clock className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <div className="flex items-baseline gap-1">
                      {isNumeric ? (
                        <>
                          <span className="text-2xl font-bold font-mono text-nexus-text">
                            {totalNumericLogged}
                          </span>
                          <span className="text-xs text-nexus-text-muted">{habit.unit || 'uds'}</span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold font-mono text-nexus-text">
                          {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. WEEKLY MATRIX (LUN - DOM) */}
                <div className="p-4 rounded-xl bg-nexus-surface-2 border border-nexus-border">
                  <div className="flex items-center justify-between mb-3.5">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-nexus-text flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        Matriz Semanal (Lun — Dom)
                      </h3>
                      <p className="text-[11px] text-nexus-text-muted">
                        {isNumeric 
                          ? 'Ajusta el contador con + / - o toca para completar el día' 
                          : 'Toca cualquier día para registrar o desmarcar cumplimiento'}
                      </p>
                    </div>

                    {!isNumeric && (
                      <button
                        type="button"
                        onClick={() => {
                          startTimer(habit.id, 'habit', habit.name);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all shadow-xs"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Iniciar Enfoque</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {currentWeekDays.map((d) => (
                      <div
                        key={d.dateStr}
                        className={`flex flex-col items-center p-2 sm:p-2.5 rounded-xl transition-all border ${
                          d.isToday
                            ? 'bg-nexus-surface-3/80 border-indigo-500/50 ring-1 ring-indigo-500/30'
                            : 'bg-nexus-surface/50 border-nexus-border hover:border-nexus-border-hover'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-semibold text-nexus-text-muted">
                          {d.dayName}
                        </span>
                        <span className="text-xs font-bold font-mono text-nexus-text mb-1.5">
                          {d.dayNum}
                        </span>

                        {/* Interactive Clickable Circle */}
                        <button
                          type="button"
                          disabled={d.isFutureDate}
                          onClick={() => {
                            if (isNumeric) {
                              const target = habit.targetValue || 1;
                              const delta = d.completed ? -target : target;
                              adjustHabitValue(habit.id, d.dateStr, delta);
                            } else {
                              toggleHabitDay(habit.id, d.dateStr, habit.targetMinutes || 30);
                            }
                          }}
                          title={`${d.dayName} ${d.dayNum}: ${d.completed ? 'Completado' : 'Pendiente'}`}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            d.isFutureDate
                              ? 'opacity-25 cursor-not-allowed border border-nexus-border bg-nexus-surface-2'
                              : d.completed
                              ? 'shadow-md active:scale-90 text-white'
                              : d.isFreeze
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                              : 'border-2 border-dashed border-nexus-border hover:border-nexus-text-secondary active:scale-95'
                          }`}
                          style={
                            d.completed
                              ? { backgroundColor: habit.color, borderColor: habit.color }
                              : undefined
                          }
                        >
                          {d.completed ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : d.isFreeze ? (
                            <Snowflake className="w-4 h-4" />
                          ) : isNumeric && d.valueLogged > 0 ? (
                            <span className="text-xs font-bold font-mono text-cyan-300">
                              {d.valueLogged}
                            </span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-nexus-surface-3" />
                          )}
                        </button>

                        {/* Metric label or Counter below */}
                        {isNumeric && !d.isFutureDate ? (
                          <div className="flex items-center gap-1 mt-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                adjustHabitValue(habit.id, d.dateStr, -1);
                              }}
                              className="w-4 h-4 rounded-md bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border flex items-center justify-center text-nexus-text-muted hover:text-nexus-text text-[9px]"
                              title="Restar 1"
                            >
                              -
                            </button>
                            <span className="text-[10px] font-mono font-bold text-nexus-text">
                              {d.valueLogged}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                adjustHabitValue(habit.id, d.dateStr, 1);
                              }}
                              className="w-4 h-4 rounded-md bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border flex items-center justify-center text-nexus-text-muted hover:text-nexus-text text-[9px]"
                              title="Sumar 1"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <div className="h-4 flex items-center mt-1.5">
                            {d.completed && d.minutesLogged > 0 ? (
                              <span className="text-[10px] font-mono font-medium text-nexus-text-secondary">
                                {d.minutesLogged}m
                              </span>
                            ) : d.isFreeze ? (
                              <span className="text-[10px] font-medium text-cyan-400">Descanso</span>
                            ) : d.isToday ? (
                              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Hoy</span>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. STREAK SHIELD 🧊 (Streak Freeze) */}
                <div className="p-4 rounded-xl bg-nexus-surface-2 border border-nexus-border relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg">
                        🧊
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-nexus-text">Escudo de Racha (Streak Shield)</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-medium">
                            {habit.streakFreezes.length} utilizados
                          </span>
                        </div>
                        <p className="text-xs text-nexus-text-muted">
                          Protege tu racha sin romperla en días de descanso, enfermedad o viajes.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleFreezeToday}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                        isTodayFrozen
                          ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-xs'
                          : 'bg-nexus-surface-3 hover:bg-cyan-500/20 text-cyan-300 border border-nexus-border hover:border-cyan-500/40'
                      }`}
                    >
                      <Snowflake className="w-4 h-4" />
                      <span>
                        {isTodayFrozen
                          ? 'Hoy protegido ❄️ (Quitar)'
                          : 'Día de descanso justificado'}
                      </span>
                    </button>
                  </div>

                  {/* List of active freezes */}
                  {habit.streakFreezes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-nexus-border/60">
                      <div className="text-[11px] font-semibold text-nexus-text-secondary mb-1.5">
                        Días con escudo activo:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {habit.streakFreezes.map((fDate) => (
                          <span
                            key={fDate}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-cyan-950/40 text-cyan-300 border border-cyan-800/50"
                          >
                            <Snowflake className="w-3 h-3 text-cyan-400" />
                            <span>{format(parseISO(fDate), "d 'de' MMMM", { locale: es })}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. HEATMAP (GitHub-style 52 cols × 7 rows) */}
                <div className="p-4 rounded-xl bg-nexus-surface-2 border border-nexus-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-nexus-text flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        Historial Anual de Constancia (52 Semanas)
                      </h3>
                      <p className="text-[11px] text-nexus-text-muted">
                        {isNumeric 
                          ? `Intensidad según meta diaria (${habit.targetValue} ${habit.unit})` 
                          : 'Intensidad basada en minutos dedicados cada día'}
                      </p>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-1.5 text-[10px] text-nexus-text-muted">
                      <span>Menos</span>
                      <span className="w-2.5 h-2.5 rounded-xs bg-nexus-surface-3 border border-nexus-border" />
                      <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: habit.color, opacity: 0.35 }} />
                      <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: habit.color, opacity: 0.65 }} />
                      <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: habit.color, opacity: 1.0 }} />
                      <span>Más</span>
                    </div>
                  </div>

                  {/* Heatmap Grid Container */}
                  <div className="overflow-x-auto pb-2 relative">
                    <div className="min-w-[680px]">
                      {/* Month Headers */}
                      <div className="flex mb-1.5 pl-5 text-[10px] font-mono text-nexus-text-muted h-3.5">
                        {monthLabels.map((m, idx) => (
                          <div
                            key={`m-${idx}`}
                            className="truncate"
                            style={{
                              marginLeft: idx === 0 ? `${m.colIndex * 12.5}px` : undefined,
                              width: idx < monthLabels.length - 1
                                ? `${(monthLabels[idx + 1].colIndex - m.colIndex) * 12.5}px`
                                : 'auto',
                            }}
                          >
                            {m.label}
                          </div>
                        ))}
                      </div>

                      {/* Day Labels + 52-column Grid */}
                      <div className="flex gap-1.5">
                        <div className="flex flex-col justify-between py-0.5 text-[9px] font-bold text-nexus-text-muted select-none w-3">
                          <span>L</span>
                          <span>M</span>
                          <span>X</span>
                          <span>J</span>
                          <span>V</span>
                          <span>S</span>
                          <span>D</span>
                        </div>

                        {/* 52 Columns Grid */}
                        <div className="flex gap-1">
                          {heatmapWeeks.map((week, colIdx) => (
                            <div key={`col-${colIdx}`} className="flex flex-col gap-1">
                              {week.map((cell) => {
                                const cellStyle = getCellIntensityStyle(cell);
                                return (
                                  <button
                                    key={cell.dateStr}
                                    type="button"
                                    disabled={cell.isFuture}
                                    onClick={() => {
                                      if (!cell.isFuture) {
                                        if (isNumeric) {
                                          adjustHabitValue(habit.id, cell.dateStr, habit.targetValue || 1);
                                        } else {
                                          toggleHabitDay(habit.id, cell.dateStr, habit.targetMinutes || 30);
                                        }
                                      }
                                    }}
                                    onMouseEnter={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setHoveredCell({
                                        dateStr: cell.dateStr,
                                        minutes: cell.minutes,
                                        valueLogged: cell.valueLogged,
                                        completed: cell.completed,
                                        isFreeze: cell.isFreeze,
                                        x: rect.left + rect.width / 2,
                                        y: rect.top,
                                      });
                                    }}
                                    onMouseLeave={() => setHoveredCell(null)}
                                    className={`w-2.5 h-2.5 rounded-xs transition-transform hover:scale-130 ${
                                      cell.isFuture ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'
                                    }`}
                                    style={cellStyle}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Heatmap Cell Tooltip */}
                  {hoveredCell && (
                    <div
                      className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 px-2.5 py-1.5 rounded-lg bg-nexus-surface-3 border border-nexus-border text-xs text-nexus-text shadow-xl backdrop-blur-md"
                      style={{ left: hoveredCell.x, top: hoveredCell.y - 6 }}
                    >
                      <div className="font-semibold">
                        {format(parseISO(hoveredCell.dateStr), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                      </div>
                      <div className="text-[11px] text-nexus-text-secondary">
                        {hoveredCell.isFreeze
                          ? 'Día de descanso justificado ❄️'
                          : hoveredCell.completed
                          ? isNumeric
                            ? `Meta lograda (${hoveredCell.valueLogged || habit.targetValue} ${habit.unit})`
                            : `Completado (${hoveredCell.minutes || 0} min)`
                          : isNumeric && hoveredCell.valueLogged > 0
                          ? `Progreso: ${hoveredCell.valueLogged} / ${habit.targetValue} ${habit.unit}`
                          : 'Sin actividad registrada'}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* 5. SETTINGS FORM */
              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-nexus-text mb-1.5">
                    Nombre del Hábito
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border focus:border-indigo-500 focus:outline-hidden text-sm text-nexus-text transition-colors"
                  />
                </div>

                {/* Goal Type Selector */}
                <div>
                  <label className="block text-xs font-semibold text-nexus-text mb-1.5">
                    Tipo de Meta del Hábito
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditGoalType('numeric')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        editGoalType === 'numeric'
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/30'
                          : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-secondary hover:text-nexus-text'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                        <Hash className="w-4 h-4 text-cyan-400" />
                        <span>Contador / Cantidad</span>
                      </div>
                      <div className="text-[10px] text-nexus-text-muted">
                        Vasos de agua, páginas, flexiones, pasos.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditGoalType('time')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        editGoalType === 'time'
                          ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30'
                          : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-secondary hover:text-nexus-text'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        <span>Tiempo / Enfoque</span>
                      </div>
                      <div className="text-[10px] text-nexus-text-muted">
                        Cronómetro Pomodoro en minutos diarios.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditGoalType('boolean')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        editGoalType === 'boolean'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                          : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-secondary hover:text-nexus-text'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Sí / No (Booleano)</span>
                      </div>
                      <div className="text-[10px] text-nexus-text-muted">
                        Check simple de cumplimiento diario.
                      </div>
                    </button>
                  </div>
                </div>

                {/* Dynamic Goal Target Inputs */}
                {editGoalType === 'numeric' && (
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40">
                    <div>
                      <label className="block text-xs font-semibold text-cyan-200 mb-1">
                        Cantidad Objetivo por Día
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100000"
                        value={editTargetValue}
                        onChange={(e) => setEditTargetValue(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-1.5 rounded-xl bg-nexus-surface-2 border border-nexus-border focus:border-cyan-500 focus:outline-hidden text-sm text-nexus-text font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-cyan-200 mb-1">
                        Unidad de Medida
                      </label>
                      <input
                        type="text"
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
                        placeholder="vasos, páginas, reps, pasos..."
                        className="w-full px-3 py-1.5 rounded-xl bg-nexus-surface-2 border border-nexus-border focus:border-cyan-500 focus:outline-hidden text-sm text-nexus-text"
                      />
                    </div>
                  </div>
                )}

                {editGoalType === 'time' && (
                  <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-800/40">
                    <label className="block text-xs font-semibold text-indigo-200 mb-1">
                      Meta Diaria en Minutos
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="480"
                      value={editTargetMinutes}
                      onChange={(e) => setEditTargetMinutes(e.target.value)}
                      placeholder="30"
                      className="w-full px-3 py-1.5 rounded-xl bg-nexus-surface-2 border border-nexus-border focus:border-indigo-500 focus:outline-hidden text-sm text-nexus-text"
                    />
                  </div>
                )}

                <EmojiPicker
                  selectedEmoji={editIcon}
                  onSelectEmoji={setEditIcon}
                  title="Ícono del Hábito"
                />

                {/* Edit Color Palette */}
                <div>
                  <label className="block text-xs font-semibold text-nexus-text mb-2">
                    Color de Acento
                  </label>
                  <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setEditColor(c.hex)}
                        title={c.name}
                        className="relative w-6 h-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                        style={{ backgroundColor: c.hex }}
                      >
                        {editColor === c.hex && (
                          <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-xs font-semibold text-nexus-text mb-1.5">
                    Visibilidad
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditVisibility('private')}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        editVisibility === 'private'
                          ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300'
                          : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-secondary hover:text-nexus-text'
                      }`}
                    >
                      <Lock className="w-4 h-4 text-indigo-400" />
                      <div>
                        <div className="text-xs font-semibold">🔒 Personal</div>
                        <div className="text-[10px] text-nexus-text-muted">Solo visible para ti</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditVisibility('couple')}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        editVisibility === 'couple'
                          ? 'bg-pink-500/15 border-pink-500/50 text-pink-300'
                          : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-secondary hover:text-nexus-text'
                      }`}
                    >
                      <Users className="w-4 h-4 text-pink-400" />
                      <div>
                        <div className="text-xs font-semibold">💑 Pareja</div>
                        <div className="text-[10px] text-nexus-text-muted">Compartido en el hogar</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-xs font-semibold text-nexus-text mb-1.5">
                    Frecuencia ({editFrequency}/7 días a la semana)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={editFrequency}
                    onChange={(e) => setEditFrequency(Number(e.target.value))}
                    className="w-full h-2 bg-nexus-surface-2 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Reminder Time */}
                <div>
                  <label className="block text-xs font-semibold text-nexus-text mb-1.5">
                    Hora de Recordatorio
                  </label>
                  <input
                    type="time"
                    value={editReminderTime}
                    onChange={(e) => setEditReminderTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border focus:border-indigo-500 focus:outline-hidden text-sm text-nexus-text"
                  />
                </div>

                {/* Danger Zone: Delete */}
                <div className="pt-4 border-t border-nexus-border">
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar este hábito permanentemente</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between">
                      <div className="text-xs text-red-300 font-medium">
                        ¿Confirmas que deseas eliminar "{habit.name}"?
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-2.5 py-1 text-xs text-nexus-text-secondary hover:text-nexus-text"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteHabit}
                          className="px-3 py-1 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-nexus-border">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors"
                  >
                    Volver a estadísticas
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
