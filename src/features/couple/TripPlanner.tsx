import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane,
  Plus,
  Calendar,
  MapPin,
  DollarSign,
  CheckSquare,
  Square,
  Trash2,
  X,
  FileText,
  Clock,
  Sparkles,
  Luggage,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { TripPlan, Task } from '../../types/nexus';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, differenceInCalendarDays, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import EmojiPicker from '../../components/ui/EmojiPicker';

export const formatCOP = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function TripPlanner() {
  const {
    tripPlans,
    tasks,
    addTripPlan,
    updateTripPlan,
    deleteTripPlan,
    addTask,
    toggleTaskStatus,
    setSelectedTaskId,
    currentOwner,
    accounts,
  } = useNexusStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEmoji, setNewEmoji] = useState('🏖️');
  const [newDestination, setNewDestination] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Quick add task to a trip
  const [addingTaskTripId, setAddingTaskTripId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDestination.trim() || !newStartDate || !newEndDate) return;

    const parsedBudget = parseFloat(newBudget.replace(/[^0-9]/g, '')) || 0;

    const trip: TripPlan = {
      id: `trip-${uuidv4().slice(0, 8)}`,
      title: newTitle.trim(),
      emoji: newEmoji,
      destination: newDestination.trim(),
      startDate: newStartDate,
      endDate: newEndDate,
      budget: parsedBudget,
      currency: 'COP',
      notes: newNotes.trim(),
      checklistIds: [],
    };

    addTripPlan(trip);
    setNewTitle('');
    setNewDestination('');
    setNewStartDate('');
    setNewEndDate('');
    setNewBudget('');
    setNewNotes('');
    setShowAddModal(false);
  };

  const handleAddChecklistTask = (trip: TripPlan) => {
    if (!newTaskTitle.trim()) return;

    const taskId = `task-trip-${uuidv4().slice(0, 8)}`;
    const task: Task = {
      id: taskId,
      title: newTaskTitle.trim(),
      description: `Tarea de viaje: ${trip.title}`,
      status: 'todo',
      priority: 'P2',
      owner: currentOwner || 'david',
      visibility: 'couple',
      subtaskIds: [],
      tags: ['viaje'],
      category: 'Viaje',
      createdAt: new Date().toISOString(),
      dueDate: trip.startDate,
      actualMinutes: 0,
      pageContent: [],
      wikiLinks: [],
    };

    addTask(task);
    updateTripPlan(trip.id, {
      checklistIds: [...trip.checklistIds, taskId],
    });

    setNewTaskTitle('');
    setAddingTaskTripId(null);
  };

  const getTripCountdown = (startDateStr: string, endDateStr: string) => {
    try {
      const start = parseISO(startDateStr);
      const end = parseISO(endDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const daysDiff = differenceInCalendarDays(start, today);

      if (daysDiff === 0) {
        return { text: '¡El viaje es hoy! 🎉', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      }
      if (daysDiff > 0) {
        return {
          text: `Faltan ${daysDiff} día${daysDiff > 1 ? 's' : ''}`,
          color: 'text-nexus-accent-cyan bg-cyan-500/10 border-cyan-500/20',
        };
      }
      // Ongoing or past
      if (isBefore(start, today) && (isAfter(end, today) || differenceInCalendarDays(end, today) === 0)) {
        return { text: '¡En viaje ahora mismo! 🌴', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' };
      }
      return { text: 'Viaje realizado ✨', color: 'text-nexus-text-muted bg-nexus-surface-3 border-nexus-border' };
    } catch {
      return { text: 'Fecha pendiente', color: 'text-nexus-text-muted bg-nexus-surface-3 border-nexus-border' };
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Bar ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-nexus-text-muted">
            <Luggage className="w-4 h-4 text-nexus-accent-cyan" />
            <span>Escapadas & Aventuras</span>
          </div>
          <h2 className="text-2xl font-bold text-nexus-text mt-1">Planificador de Viajes en Pareja</h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-90 text-white font-medium text-sm transition shadow-lg shadow-cyan-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Viaje</span>
        </button>
      </div>

      {/* ─── Trip Cards Grid ───────────────────────────────────── */}
      {tripPlans.length === 0 ? (
        <div className="rounded-2xl border border-nexus-border bg-nexus-surface p-12 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto text-3xl">
            ✈️
          </div>
          <h3 className="text-lg font-bold text-nexus-text">No hay viajes planeados aún</h3>
          <p className="text-sm text-nexus-text-muted max-w-md mx-auto">
            ¡Agrega su próximo destino juntos! Podrán coordinar presupuesto, fechas y checklists de equipaje.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text hover:bg-nexus-surface-3 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Crear primer viaje</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tripPlans.map(trip => {
            const countdown = getTripCountdown(trip.startDate, trip.endDate);

            // Format date range nicely
            let formattedDateRange = 'Fechas no definidas';
            try {
              const startFmt = format(parseISO(trip.startDate), "d 'de' MMM", { locale: es });
              const endFmt = format(parseISO(trip.endDate), "d 'de' MMM yyyy", { locale: es });
              formattedDateRange = `${startFmt} — ${endFmt}`;
            } catch {
              // fallback
            }

            // Linked tasks
            const linkedTasks = tasks.filter(t => trip.checklistIds.includes(t.id));
            const completedCount = linkedTasks.filter(t => t.status === 'done').length;
            const progressPercent =
              linkedTasks.length > 0 ? Math.round((completedCount / linkedTasks.length) * 100) : 0;

            return (
              <motion.div
                key={trip.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-nexus-border bg-nexus-surface overflow-hidden shadow-xl flex flex-col justify-between"
              >
                {/* Header Banner */}
                <div className="p-6 space-y-4 border-b border-nexus-border/60 bg-gradient-to-b from-nexus-surface-2/60 to-transparent">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl p-2 rounded-2xl bg-nexus-surface-2 border border-nexus-border shadow-inner">
                        {trip.emoji || '✈️'}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-nexus-text leading-tight">{trip.title}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-nexus-accent-cyan font-medium mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{trip.destination}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTripPlan(trip.id)}
                      className="p-2 rounded-lg text-nexus-text-muted hover:text-red-400 hover:bg-red-500/10 transition"
                      title="Eliminar viaje"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badges row: Countdown + Dates + Budget */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span
                      className={`text-xs px-3 py-1 rounded-full border font-semibold flex items-center gap-1.5 ${countdown.color}`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {countdown.text}
                    </span>

                    <span className="text-xs px-3 py-1 rounded-full bg-nexus-surface-2 border border-nexus-border text-nexus-text-secondary font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-nexus-text-muted" />
                      {formattedDateRange}
                    </span>

                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-semibold flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {formatCOP(trip.budget)}
                    </span>
                  </div>

                  {/* Notes preview */}
                  {trip.notes && (
                    <div className="p-3.5 rounded-xl bg-nexus-surface-2/80 border border-nexus-border/60 text-xs text-nexus-text-secondary leading-relaxed">
                      <div className="flex items-center gap-1.5 text-nexus-text-muted font-semibold mb-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Notas & Itinerario</span>
                      </div>
                      <p className="whitespace-pre-line">{trip.notes}</p>
                    </div>
                  )}
                </div>

                {/* Checklist Section */}
                <div className="p-6 space-y-3 bg-nexus-surface/40 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-nexus-text">
                        <CheckSquare className="w-4 h-4 text-nexus-accent-indigo" />
                        <span>Checklist & Pendientes</span>
                        <span className="text-nexus-text-muted font-normal">
                          ({completedCount}/{linkedTasks.length})
                        </span>
                      </div>
                      <span className="text-xs font-mono text-nexus-accent-indigo font-bold">
                        {progressPercent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-nexus-surface-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                      />
                    </div>

                    {/* Tasks list */}
                    <div className="space-y-1.5 pt-1">
                      {linkedTasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between gap-3 p-2 rounded-lg bg-nexus-surface-2/50 border border-nexus-border/40 hover:bg-nexus-surface-2 transition group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              onClick={() => toggleTaskStatus(task.id)}
                              className="text-nexus-text-muted hover:text-nexus-accent-indigo transition flex-shrink-0"
                            >
                              {task.status === 'done' ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                            <span
                              onClick={() => setSelectedTaskId(task.id)}
                              className={`text-xs cursor-pointer truncate transition ${
                                task.status === 'done'
                                  ? 'line-through text-nexus-text-muted'
                                  : 'text-nexus-text hover:text-nexus-accent-indigo'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-nexus-surface-3 text-nexus-text-muted">
                              {accounts.find(a => a.owner === task.owner)?.avatar || (task.owner === 'david' ? '👨‍💻' : task.owner === 'cami' ? '👩‍🎨' : '👤')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add checklist item */}
                  <div className="pt-2">
                    {addingTaskTripId === trip.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={newTaskTitle}
                          onChange={e => setNewTaskTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddChecklistTask(trip);
                            if (e.key === 'Escape') setAddingTaskTripId(null);
                          }}
                          placeholder="Nueva tarea de viaje... (Enter para guardar)"
                          className="flex-1 px-3 py-1.5 rounded-lg bg-nexus-surface-2 border border-nexus-border text-nexus-text text-xs focus:outline-none focus:border-nexus-accent-cyan"
                        />
                        <button
                          onClick={() => handleAddChecklistTask(trip)}
                          className="px-3 py-1.5 rounded-lg bg-nexus-accent-cyan text-slate-900 font-semibold text-xs transition"
                        >
                          Agregar
                        </button>
                        <button
                          onClick={() => setAddingTaskTripId(null)}
                          className="p-1.5 rounded-lg text-nexus-text-muted hover:text-nexus-text"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingTaskTripId(trip.id);
                          setNewTaskTitle('');
                        }}
                        className="flex items-center gap-1.5 text-xs text-nexus-text-muted hover:text-cyan-400 transition font-medium py-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar tarea a la checklist</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Add Trip Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-nexus-border bg-nexus-surface p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-nexus-border pb-3">
                <div className="flex items-center gap-2">
                  <Plane className="w-5 h-5 text-nexus-accent-cyan" />
                  <h3 className="text-lg font-bold text-nexus-text">Planear Nuevo Viaje</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTrip} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    Título del Viaje
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ej. Cartagena en Diciembre 🏖️"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text placeholder-nexus-text-muted text-sm focus:outline-none focus:border-nexus-accent-cyan"
                  />
                </div>

                {/* Rich Searchable & Categorized Emoji Picker */}
                <EmojiPicker
                  selectedEmoji={newEmoji}
                  onSelectEmoji={setNewEmoji}
                  title="Ícono del Viaje"
                />

                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    Destino
                  </label>
                  <input
                    type="text"
                    required
                    value={newDestination}
                    onChange={e => setNewDestination(e.target.value)}
                    placeholder="Ej. Cartagena de Indias, Colombia"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text placeholder-nexus-text-muted text-sm focus:outline-none focus:border-nexus-accent-cyan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                      Fecha Salida
                    </label>
                    <input
                      type="date"
                      required
                      value={newStartDate}
                      onChange={e => setNewStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                      Fecha Regreso
                    </label>
                    <input
                      type="date"
                      required
                      value={newEndDate}
                      onChange={e => setNewEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    Presupuesto Estimado (COP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={newBudget}
                    onChange={e => setNewBudget(e.target.value)}
                    placeholder="Ej. 5000000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text placeholder-nexus-text-muted text-sm font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    Notas / Itinerario / Reservas
                  </label>
                  <textarea
                    rows={3}
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    placeholder="Hoteles, vuelos, tours o recomendaciones..."
                    className="w-full px-3.5 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text placeholder-nexus-text-muted text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-nexus-border">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-90 text-white font-medium text-sm transition shadow-lg shadow-cyan-500/20"
                  >
                    Guardar Plan de Viaje
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
