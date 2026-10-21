import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Lock, Users, Sparkles, Hash, Clock, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useNexusStore } from '../../store/nexusStore';
import type { Visibility, Habit, HabitGoalType } from '../../types/nexus';
import EmojiPicker from '../../components/ui/EmojiPicker';

interface HabitCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PALETTE = [
  { name: 'Cian', hex: '#06b6d4' },
  { name: 'Esmeralda', hex: '#10b981' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Índigo', hex: '#6366f1' },
  { name: 'Violeta', hex: '#8b5cf6' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Ámbar', hex: '#f59e0b' },
  { name: 'Naranja', hex: '#f97316' },
  { name: 'Rojo', hex: '#ef4444' },
  { name: 'Azul', hex: '#3b82f6' },
];

const PRESETS = [
  { name: 'Beber 8 vasos de agua', icon: '💧', color: '#06b6d4', goalType: 'numeric' as HabitGoalType, targetValue: 8, unit: 'vasos' },
  { name: '10,000 pasos diarios', icon: '🚶‍♂️', color: '#10b981', goalType: 'numeric' as HabitGoalType, targetValue: 10000, unit: 'pasos' },
  { name: 'Leer 20 páginas', icon: '📖', color: '#8b5cf6', goalType: 'numeric' as HabitGoalType, targetValue: 20, unit: 'páginas' },
  { name: '50 Flexiones', icon: '💪', color: '#ef4444', goalType: 'numeric' as HabitGoalType, targetValue: 50, unit: 'flexiones' },
  { name: 'Meditación diaria', icon: '🧘', color: '#ec4899', goalType: 'time' as HabitGoalType, targetMinutes: '15' },
  { name: 'Tomar vitaminas', icon: '💊', color: '#f59e0b', goalType: 'boolean' as HabitGoalType },
];

export default function HabitCreateModal({ isOpen, onClose }: HabitCreateModalProps) {
  const { addHabit, currentOwner } = useNexusStore();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💧');
  const [color, setColor] = useState('#06b6d4');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [frequencyPerWeek, setFrequencyPerWeek] = useState<number>(7);

  // Goal type: 'numeric' | 'time' | 'boolean'
  const [goalType, setGoalType] = useState<HabitGoalType>('numeric');
  const [targetValue, setTargetValue] = useState<number>(8);
  const [unit, setUnit] = useState<string>('vasos');
  const [targetMinutes, setTargetMinutes] = useState<string>('30');

  const [reminderTime, setReminderTime] = useState<string>('08:00');

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    setIcon(preset.icon);
    setColor(preset.color);
    setGoalType(preset.goalType);
    if (preset.targetValue) setTargetValue(preset.targetValue);
    if (preset.unit) setUnit(preset.unit);
    if (preset.targetMinutes) setTargetMinutes(preset.targetMinutes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newHabit: Habit = {
      id: `habit-${uuidv4().slice(0, 8)}`,
      name: name.trim(),
      icon,
      color,
      owner: currentOwner || 'david',
      visibility,
      frequencyPerWeek: Number(frequencyPerWeek) || 7,
      goalType,
      targetValue: goalType === 'numeric' ? Number(targetValue) || 1 : undefined,
      unit: goalType === 'numeric' ? unit.trim() || 'veces' : undefined,
      targetMinutes: goalType === 'time' && targetMinutes ? Math.max(1, parseInt(targetMinutes, 10)) : undefined,
      reminderTime: reminderTime ? reminderTime : undefined,
      completions: [],
      streakFreezes: [],
      createdAt: new Date().toISOString(),
    };

    addHabit(newHabit);
    onClose();
    // Reset state
    setName('');
    setIcon('💧');
    setColor('#06b6d4');
    setGoalType('numeric');
    setTargetValue(8);
    setUnit('vasos');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 360 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0B0F19] border border-nexus-border w-full max-w-lg rounded-3xl p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-nexus-border mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
              style={{ backgroundColor: `${color}25`, border: `1px solid ${color}50` }}
            >
              {icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-nexus-text">Crear Nuevo Hábito</h2>
              <p className="text-xs text-nexus-text-muted">
                Vasos de agua, páginas, flexiones, tiempo o checklist
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="mb-5 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-text-muted flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Plantillas Rápidas:</span>
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="px-2.5 py-1 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-[11px] font-medium text-nexus-text-secondary hover:text-nexus-text whitespace-nowrap transition cursor-pointer"
              >
                {p.icon} {p.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Input */}
          <div>
            <label className="block text-xs font-bold text-nexus-text uppercase tracking-wider mb-1.5">
              Nombre del Hábito <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Beber 8 vasos de agua, 10k pasos, Leer 20 páginas..."
              className="w-full px-4 py-2.5 rounded-2xl bg-nexus-surface-2 border border-nexus-border text-sm text-nexus-text placeholder-nexus-text-muted focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Goal Type Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-nexus-text uppercase tracking-wider">
              ¿Cómo deseas medirlo?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setGoalType('numeric')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${
                  goalType === 'numeric'
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/30'
                    : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                <Hash className="w-4 h-4 text-cyan-400" />
                <span>Cantidad / Conteo</span>
              </button>

              <button
                type="button"
                onClick={() => setGoalType('time')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${
                  goalType === 'time'
                    ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30'
                    : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Tiempo (Minutos)</span>
              </button>

              <button
                type="button"
                onClick={() => setGoalType('boolean')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${
                  goalType === 'boolean'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Simple Sí / No</span>
              </button>
            </div>

            {/* Numeric Inputs */}
            {goalType === 'numeric' && (
              <div className="p-3.5 rounded-2xl bg-nexus-surface-2 border border-nexus-border grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="text-[11px] font-semibold text-nexus-text-muted block mb-1">
                    Meta Diaria (Número)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetValue}
                    onChange={e => setTargetValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 rounded-xl bg-nexus-surface-3 border border-nexus-border text-xs text-nexus-text font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-nexus-text-muted block mb-1">
                    Unidad de Medida
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="vasos, pasos, páginas, km..."
                    className="w-full px-3 py-2 rounded-xl bg-nexus-surface-3 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* Time Inputs */}
            {goalType === 'time' && (
              <div className="p-3.5 rounded-2xl bg-nexus-surface-2 border border-nexus-border mt-2">
                <label className="text-[11px] font-semibold text-nexus-text-muted block mb-1.5">
                  Minutos de Enfoque Diarios
                </label>
                <div className="flex items-center gap-2">
                  {['15', '30', '45', '60', '90'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTargetMinutes(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        targetMinutes === m
                          ? 'bg-indigo-600 text-white'
                          : 'bg-nexus-surface-3 text-nexus-text-muted hover:text-nexus-text'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    value={targetMinutes}
                    onChange={e => setTargetMinutes(e.target.value)}
                    className="w-20 px-2.5 py-1.5 rounded-lg bg-nexus-surface-3 border border-nexus-border text-xs text-nexus-text font-mono font-bold text-center"
                    placeholder="min"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Visibility / Access (Private vs Couple) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-nexus-text uppercase tracking-wider">
              Espacio & Privacidad
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-semibold transition cursor-pointer ${
                  visibility === 'private'
                    ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30'
                    : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>🔒 Solo Personal</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('couple')}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-semibold transition cursor-pointer ${
                  visibility === 'couple'
                    ? 'bg-pink-500/15 border-pink-500 text-pink-300 ring-1 ring-pink-500/30'
                    : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                <Users className="w-4 h-4 text-pink-400" />
                <span>💑 Hábito de Pareja</span>
              </button>
            </div>
          </div>

          {/* Frequency & Reminder */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-nexus-text uppercase tracking-wider mb-1">
                Frecuencia Semanal
              </label>
              <select
                value={frequencyPerWeek}
                onChange={e => setFrequencyPerWeek(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-indigo-500"
              >
                <option value={7}>Todos los días (7/7)</option>
                <option value={6}>6 días por semana</option>
                <option value={5}>Días laborales (5/7)</option>
                <option value={4}>4 días por semana</option>
                <option value={3}>3 días por semana</option>
                <option value={2}>Fines de semana (2/7)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-nexus-text uppercase tracking-wider mb-1">
                Hora de Recordatorio
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <EmojiPicker
            selectedEmoji={icon}
            onSelectEmoji={setIcon}
            title="Ícono del Hábito"
          />

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-bold text-nexus-text uppercase tracking-wider mb-1.5">
              Color de Acento
            </label>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition cursor-pointer ${
                    color === c.hex ? 'ring-2 ring-white scale-110 shadow-md' : 'hover:scale-105 opacity-80'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {color === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-nexus-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-md shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
            >
              Crear Hábito
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}
