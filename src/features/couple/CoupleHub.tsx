import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  CheckSquare,
  CheckCircle2,
  DollarSign,
  Plane,
  StickyNote,
  Plus,
  Calendar,
  Lock,
  ArrowRight,
  Flame,
  AlertCircle,
  Tag,
  Square,
  Sparkles,
  X,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { Task, Habit, Priority } from '../../types/nexus';
import ExpenseTracker from './ExpenseTracker';
import TripPlanner from './TripPlanner';
import SharedBoard from './SharedBoard';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type CoupleTab = 'tasks' | 'habits' | 'expenses' | 'trips' | 'board';

const TABS: { id: CoupleTab; label: string; icon: string }[] = [
  { id: 'tasks', label: 'Tareas', icon: '📋' },
  { id: 'habits', label: 'Hábitos', icon: '✅' },
  { id: 'expenses', label: 'Gastos', icon: '💰' },
  { id: 'trips', label: 'Viajes', icon: '✈️' },
  { id: 'board', label: 'Pizarra', icon: '📌' },
];

export default function CoupleHub() {
  const {
    contextMode,
    switchContext,
    getVisibleTasks,
    getVisibleHabits,
    addTask,
    addHabit,
    toggleTaskStatus,
    toggleHabitDay,
    setSelectedTaskId,
    getBalance,
    currentOwner,
  } = useNexusStore();

  const [activeTab, setActiveTab] = useState<CoupleTab>('expenses');

  // Task tab state
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'done'>('pending');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('P2');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<'david' | 'cami'>(currentOwner || 'david');

  // Habit tab state
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('💑');
  const [newHabitFrequency, setNewHabitFrequency] = useState(5);
  const [newHabitColor, setNewHabitColor] = useState('#ec4899');

  // Check if couple context is allowed
  const isCoupleContext = contextMode === 'couple' || contextMode === 'unified';

  useEffect(() => {
    if (!isCoupleContext) {
      switchContext('couple');
    }
  }, [isCoupleContext, switchContext]);

  if (!isCoupleContext) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full rounded-2xl border border-nexus-border bg-nexus-surface p-8 text-center shadow-2xl space-y-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mx-auto text-3xl">
            💑
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-nexus-text">Hub de Pareja — David & Cami</h2>
            <p className="text-sm text-nexus-text-muted leading-relaxed">
              Actualmente estás en <span className="text-nexus-text font-semibold">Modo Privado</span>.
              Para acceder a tareas compartidas, finanzas 50/50, viajes y notas de pareja, cambia a modo Pareja.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => switchContext('couple')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 text-white font-semibold text-sm transition shadow-lg shadow-pink-500/25 active:scale-95"
            >
              <span>Cambiar a Modo Pareja</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Filter tasks and habits for couple
  const coupleTasks = getVisibleTasks().filter(t => t.visibility === 'couple');
  const coupleHabits = getVisibleHabits().filter(h => h.visibility === 'couple');
  const balance = getBalance();
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = coupleTasks.filter(t => {
    if (taskFilter === 'pending') return t.status !== 'done';
    if (taskFilter === 'done') return t.status === 'done';
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const task: Task = {
      id: `task-cp-${uuidv4().slice(0, 8)}`,
      title: newTaskTitle.trim(),
      description: '',
      status: 'todo',
      priority: newTaskPriority,
      owner: newTaskAssignee,
      visibility: 'couple',
      subtaskIds: [],
      tags: ['hogar'],
      category: 'Hogar',
      createdAt: new Date().toISOString(),
      dueDate: newTaskDueDate || undefined,
      actualMinutes: 0,
      pageContent: [],
      wikiLinks: [],
    };

    addTask(task);
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setShowAddTaskModal(false);
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const habit: Habit = {
      id: `habit-cp-${uuidv4().slice(0, 8)}`,
      name: newHabitName.trim(),
      icon: newHabitIcon,
      color: newHabitColor,
      owner: currentOwner || 'david',
      visibility: 'couple',
      frequencyPerWeek: newHabitFrequency,
      completions: [],
      streakFreezes: [],
      createdAt: new Date().toISOString(),
    };

    addHabit(habit);
    setNewHabitName('');
    setShowAddHabitModal(false);
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-nexus-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-2xl shadow-lg shadow-pink-500/20">
            💑
          </div>
          <div>
            <h1 className="text-2xl font-bold text-nexus-text">Hub de Pareja — David & Cami</h1>
            <p className="text-xs text-nexus-text-muted mt-0.5">
              Espacio sincronizado para proyectos conjuntos, finanzas, viajes y metas del hogar
            </p>
          </div>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-nexus-surface border border-nexus-border text-xs flex items-center gap-2">
            <span className="text-pink-400 font-bold">50/50</span>
            <span className="text-nexus-text-secondary">
              {balance.net === 0
                ? 'En paz'
                : balance.net > 0
                ? `Cami debe $${Math.abs(balance.net).toLocaleString('es-CO')}`
                : `David debe $${Math.abs(balance.net).toLocaleString('es-CO')}`}
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-nexus-surface border border-nexus-border text-xs flex items-center gap-2">
            <span className="text-indigo-400 font-bold">{coupleTasks.filter(t => t.status !== 'done').length}</span>
            <span className="text-nexus-text-secondary">tareas pendientes</span>
          </div>
        </div>
      </div>

      {/* ─── Tab Bar Navigation ─────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-nexus-surface border border-nexus-border overflow-x-auto">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-nexus-surface-3 text-nexus-text shadow-sm border border-nexus-border'
                  : 'text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'tasks' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-nexus-surface text-nexus-text-muted">
                  {coupleTasks.filter(t => t.status !== 'done').length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Tab Content ───────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'expenses' && (
          <motion.div
            key="expenses"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <ExpenseTracker />
          </motion.div>
        )}

        {activeTab === 'trips' && (
          <motion.div
            key="trips"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <TripPlanner />
          </motion.div>
        )}

        {activeTab === 'board' && (
          <motion.div
            key="board"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <SharedBoard />
          </motion.div>
        )}

        {activeTab === 'tasks' && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Task Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTaskFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    taskFilter === 'pending'
                      ? 'bg-nexus-surface-3 text-nexus-text border border-nexus-border'
                      : 'text-nexus-text-muted hover:text-nexus-text'
                  }`}
                >
                  Pendientes ({coupleTasks.filter(t => t.status !== 'done').length})
                </button>
                <button
                  onClick={() => setTaskFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    taskFilter === 'all'
                      ? 'bg-nexus-surface-3 text-nexus-text border border-nexus-border'
                      : 'text-nexus-text-muted hover:text-nexus-text'
                  }`}
                >
                  Todas ({coupleTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter('done')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    taskFilter === 'done'
                      ? 'bg-nexus-surface-3 text-nexus-text border border-nexus-border'
                      : 'text-nexus-text-muted hover:text-nexus-text'
                  }`}
                >
                  Completadas ({coupleTasks.filter(t => t.status === 'done').length})
                </button>
              </div>

              <button
                onClick={() => setShowAddTaskModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-nexus-accent-indigo hover:bg-nexus-accent-indigo/90 text-white font-medium text-xs transition shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Tarea de Pareja</span>
              </button>
            </div>

            {/* Task List */}
            {filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-nexus-border bg-nexus-surface p-12 text-center text-nexus-text-muted">
                <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No hay tareas que coincidan con el filtro</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-nexus-border bg-nexus-surface divide-y divide-nexus-border/40 overflow-hidden shadow-xl">
                {filteredTasks.map(task => {
                  const isDone = task.status === 'done';
                  return (
                    <div
                      key={task.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-nexus-surface-2/40 transition group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          className="text-nexus-text-muted hover:text-emerald-400 transition flex-shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <p
                            onClick={() => setSelectedTaskId(task.id)}
                            className={`text-sm font-semibold cursor-pointer truncate transition ${
                              isDone ? 'line-through text-nexus-text-muted' : 'text-nexus-text hover:text-indigo-400'
                            }`}
                          >
                            {task.title}
                          </p>

                          <div className="flex items-center gap-2 text-xs text-nexus-text-muted mt-1">
                            <span
                              className={`font-semibold ${
                                task.priority === 'P1'
                                  ? 'text-red-400'
                                  : task.priority === 'P2'
                                  ? 'text-amber-400'
                                  : 'text-blue-400'
                              }`}
                            >
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{format(parseISO(task.dueDate), "d 'de' MMM", { locale: es })}</span>
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded bg-nexus-surface-2 text-[10px]">
                              {task.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-nexus-surface-2 border border-nexus-border font-medium flex items-center gap-1.5">
                          <span>{task.owner === 'david' ? '👨‍💻' : '👩‍🎨'}</span>
                          <span>{task.owner === 'david' ? 'David' : 'Cami'}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'habits' && (
          <motion.div
            key="habits"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-nexus-text">Hábitos en Pareja</h3>
                <p className="text-xs text-nexus-text-muted">Rutinas y metas compartidas para cultivar juntos</p>
              </div>

              <button
                onClick={() => setShowAddHabitModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-nexus-accent-pink hover:bg-nexus-accent-pink/90 text-white font-medium text-xs transition shadow-lg shadow-pink-500/20 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Hábito Compartido</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {coupleHabits.map(habit => {
                const todayDone = habit.completions.some(c => c.date === todayStr && c.completed);
                const totalCompleted = habit.completions.filter(c => c.completed).length;

                return (
                  <div
                    key={habit.id}
                    className="rounded-2xl border border-nexus-border bg-nexus-surface p-5 shadow-xl flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2.5 rounded-2xl bg-nexus-surface-2 border border-nexus-border">
                          {habit.icon}
                        </span>
                        <div>
                          <h4 className="font-bold text-nexus-text text-sm">{habit.name}</h4>
                          <p className="text-xs text-nexus-text-muted mt-0.5">
                            {habit.frequencyPerWeek} días por semana
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Flame className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{totalCompleted}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-nexus-border/60 flex items-center justify-between">
                      <span className="text-xs text-nexus-text-muted">Hoy:</span>
                      <button
                        onClick={() => toggleHabitDay(habit.id, todayStr)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                          todayDone
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-nexus-surface-2 text-nexus-text-muted border border-nexus-border hover:text-nexus-text hover:bg-nexus-surface-3'
                        }`}
                      >
                        {todayDone ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>¡Completado!</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-4 h-4" />
                            <span>Marcar hoy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Add Task Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {showAddTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-nexus-border bg-nexus-surface p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-nexus-border pb-3">
                <h3 className="font-bold text-base text-nexus-text">Nueva Tarea de Pareja</h3>
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="p-1 text-nexus-text-muted hover:text-nexus-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted mb-1">Título</label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="Ej. Revisar cotización cortinas..."
                    className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-nexus-text-muted mb-1">Prioridad</label>
                    <select
                      value={newTaskPriority}
                      onChange={e => setNewTaskPriority(e.target.value as Priority)}
                      className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="P1">P1 (Urgente)</option>
                      <option value="P2">P2 (Alta)</option>
                      <option value="P3">P3 (Media)</option>
                      <option value="P4">P4 (Baja)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-nexus-text-muted mb-1">Fecha límite</label>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={e => setNewTaskDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted mb-1">Responsable principal</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewTaskAssignee('david')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                        newTaskAssignee === 'david'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500'
                          : 'bg-nexus-surface-2 text-nexus-text-muted border-nexus-border'
                      }`}
                    >
                      👨‍💻 David
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTaskAssignee('cami')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                        newTaskAssignee === 'cami'
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500'
                          : 'bg-nexus-surface-2 text-nexus-text-muted border-nexus-border'
                      }`}
                    >
                      👩‍🎨 Cami
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-nexus-border">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(false)}
                    className="px-4 py-2 text-xs font-medium text-nexus-text-muted hover:text-nexus-text"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-nexus-accent-indigo text-white text-xs font-semibold shadow-md"
                  >
                    Crear Tarea
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Add Habit Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {showAddHabitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-nexus-border bg-nexus-surface p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-nexus-border pb-3">
                <h3 className="font-bold text-base text-nexus-text">Nuevo Hábito de Pareja</h3>
                <button
                  onClick={() => setShowAddHabitModal(false)}
                  className="p-1 text-nexus-text-muted hover:text-nexus-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateHabit} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-nexus-text-muted mb-1">Ícono</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={newHabitIcon}
                      onChange={e => setNewHabitIcon(e.target.value)}
                      className="w-14 text-center text-xl p-2 rounded-xl bg-nexus-surface-2 border border-nexus-border"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-nexus-text-muted mb-1">Nombre</label>
                    <input
                      type="text"
                      required
                      value={newHabitName}
                      onChange={e => setNewHabitName(e.target.value)}
                      placeholder="Ej. Caminar 30 mins juntos"
                      className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text text-sm focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted mb-1">
                    Frecuencia objetivo ({newHabitFrequency} días / semana)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={newHabitFrequency}
                    onChange={e => setNewHabitFrequency(parseInt(e.target.value))}
                    className="w-full accent-pink-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-nexus-border">
                  <button
                    type="button"
                    onClick={() => setShowAddHabitModal(false)}
                    className="px-4 py-2 text-xs font-medium text-nexus-text-muted hover:text-nexus-text"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-nexus-accent-pink text-white text-xs font-semibold shadow-md"
                  >
                    Crear Hábito
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
