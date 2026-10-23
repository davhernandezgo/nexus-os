import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  CheckSquare,
  CheckCircle2,
  DollarSign,
  Plane,
  Plus,
  Calendar,
  Lock,
  ArrowRight,
  Flame,
  Square,
  Sparkles,
  X,
  TrendingUp,
  Copy,
  Check,
  Settings,
  Share2,
  Sliders,
  UserPlus,
  Users,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { Task, Habit, Priority, Owner } from '../../types/nexus';
import ExpenseTracker from './ExpenseTracker';
import TripPlanner from './TripPlanner';
import SharedBoard from './SharedBoard';
import InvestmentsView from '../investments/InvestmentsView';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type CoupleTab = 'expenses' | 'investments' | 'tasks' | 'habits' | 'trips' | 'board';

const TABS: { id: CoupleTab; label: string; icon: string }[] = [
  { id: 'expenses', label: 'Gastos & Presupuesto', icon: '💰' },
  { id: 'investments', label: 'Inversiones USD', icon: '📈' },
  { id: 'tasks', label: 'Tareas', icon: '📋' },
  { id: 'habits', label: 'Hábitos', icon: '✅' },
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
    coupleSpace,
    createCoupleSpace,
    joinCoupleSpace,
    updateCoupleSpace,
    unlinkCoupleSpace,
    accounts,
  } = useNexusStore();

  const [activeTab, setActiveTab] = useState<CoupleTab>('expenses');

  // Space invitation state
  const [inputJoinCode, setInputJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Settings state
  const [spaceName, setSpaceName] = useState(coupleSpace?.name || 'David & Cami');
  const [defaultDavidPct, setDefaultDavidPct] = useState<number>(
    coupleSpace?.defaultSplitRatio?.david ?? 50
  );

  // Task tab state
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'done'>('pending');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('P2');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<Owner>(currentOwner || 'david');

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

  // Sync settings when space changes
  useEffect(() => {
    if (coupleSpace) {
      setSpaceName(coupleSpace.name);
      setDefaultDavidPct(coupleSpace.defaultSplitRatio?.david ?? 50);
    }
  }, [coupleSpace]);

  const handleCopyCode = () => {
    if (!coupleSpace?.code) return;
    navigator.clipboard.writeText(coupleSpace.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoinSpace = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    if (!inputJoinCode.trim()) return;

    const ok = joinCoupleSpace(inputJoinCode.trim());
    if (ok) {
      setInputJoinCode('');
    } else {
      setJoinError('Código inválido. Verifica el código e intenta de nuevo.');
    }
  };

  const handleCreateSpace = () => {
    createCoupleSpace('Espacio de Pareja', { david: 50, cami: 50 });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCoupleSpace({
      name: spaceName.trim() || 'Nuestro Espacio',
      defaultSplitRatio: { david: defaultDavidPct, cami: 100 - defaultDavidPct },
    });
    setShowSettingsModal(false);
  };

  // If couple space is pending or null, show Invitation / Pairing Flow
  const isSpaceActive = coupleSpace && coupleSpace.status === 'active';

  if (!isSpaceActive) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full rounded-3xl border border-nexus-border bg-nexus-surface p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
        >
          {/* Subtle glow background */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-2 relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-3xl shadow-lg shadow-pink-500/20 mx-auto">
              💑
            </div>
            <h2 className="text-2xl font-bold text-nexus-text">Vincular Hub de Pareja</h2>
            <p className="text-xs text-nexus-text-muted max-w-md mx-auto leading-relaxed">
              NexusOS escala a múltiples usuarios manteniendo privacidad individual. Al conectar con tu pareja mediante un código de invitación, se activan las finanzas compartidas, presupuestos, inversiones y planes de viaje.
            </p>
          </div>

          {/* Invitation Section */}
          {coupleSpace?.status === 'pending' ? (
            <div className="space-y-4 p-5 rounded-2xl bg-nexus-surface-2 border border-nexus-border relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" /> Invitación Generada
                </span>
                <span className="text-[11px] text-nexus-text-muted">Esperando a tu pareja...</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-nexus-surface-3 border border-nexus-border">
                <div className="text-center sm:text-left">
                  <span className="text-[10px] text-nexus-text-muted uppercase tracking-wider block">
                    Código de Invitación Único
                  </span>
                  <span className="text-2xl font-black font-mono tracking-widest text-nexus-text">
                    {coupleSpace.code}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30 hover:bg-pink-500/30 text-xs font-semibold transition"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? '¡Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-nexus-text-muted">
                Comparte este código con tu pareja para que lo ingrese en su dispositivo desde su propia cuenta y vincular sus espacios.
              </p>

              <div className="flex items-center justify-end pt-1">
                <button
                  onClick={unlinkCoupleSpace}
                  className="px-3 py-1.5 text-xs text-nexus-text-muted hover:text-red-400 transition"
                >
                  Cancelar Invitación
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Create Invite Code */}
                <div className="p-5 rounded-2xl bg-nexus-surface-2 border border-nexus-border flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-nexus-text">Crear Nuevo Espacio</h4>
                    <p className="text-[11px] text-nexus-text-muted leading-relaxed">
                      Genera un código de invitación para compartirlo con tu pareja.
                    </p>
                  </div>

                  <button
                    onClick={handleCreateSpace}
                    className="w-full py-2.5 px-3 rounded-xl bg-nexus-accent-pink hover:bg-nexus-accent-pink/90 text-white font-semibold text-xs transition shadow-md shadow-pink-500/20"
                  >
                    Generar Código
                  </button>
                </div>

                {/* Option 2: Join with existing code */}
                <div className="p-5 rounded-2xl bg-nexus-surface-2 border border-nexus-border flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-nexus-text">Unirse a Espacio</h4>
                    <p className="text-[11px] text-nexus-text-muted leading-relaxed">
                      Si tu pareja ya generó un código, ingrésalo aquí.
                    </p>
                  </div>

                  <form onSubmit={handleJoinSpace} className="space-y-2">
                    <input
                      type="text"
                      value={inputJoinCode}
                      onChange={e => setInputJoinCode(e.target.value.toUpperCase())}
                      placeholder="COUPLE-XXXX"
                      className="w-full px-3 py-2 rounded-xl bg-nexus-surface-3 border border-nexus-border text-xs text-nexus-text font-mono uppercase focus:outline-none focus:border-nexus-accent-indigo"
                    />
                    {joinError && <p className="text-[10px] text-red-400">{joinError}</p>}
                    <button
                      type="submit"
                      disabled={!inputJoinCode.trim()}
                      className="w-full py-2 px-3 rounded-xl bg-nexus-accent-indigo hover:bg-nexus-accent-indigo/90 text-white font-semibold text-xs transition disabled:opacity-40"
                    >
                      Unirse
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Active couple data
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
      {/* ─── Header & Partner Status Bar ────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-nexus-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-2xl shadow-lg shadow-pink-500/20">
            💑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-nexus-text">
                Hub de Pareja — {coupleSpace?.name || 'David & Cami'}
              </h1>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-1 rounded-lg text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
                title="Configuración de Pareja & Acuerdos de Split"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-nexus-text-muted mt-0.5">
              Espacio activo • Split por defecto:{' '}
              <span className="text-pink-400 font-semibold font-mono">
                {coupleSpace?.defaultSplitRatio?.david || 50}% David / {coupleSpace?.defaultSplitRatio?.cami || 50}% Cami
              </span>
            </p>
          </div>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-nexus-surface border border-nexus-border text-xs flex items-center gap-2">
            <span className="text-pink-400 font-bold">Balance</span>
            <span className="text-nexus-text-secondary">
              {balance.net === 0
                ? 'Al día 🎉'
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

        {activeTab === 'investments' && (
          <motion.div
            key="investments"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <InvestmentsView />
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
                          <span>{accounts.find(a => a.owner === task.owner)?.avatar || (task.owner === 'david' ? '👨‍💻' : '👩‍🎨')}</span>
                          <span>{accounts.find(a => a.owner === task.owner)?.displayName || (task.owner === 'david' ? (coupleSpace?.user1Name || 'David') : (coupleSpace?.user2Name || 'Cami'))}</span>
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

      {/* ─── Couple Space Settings Modal ───────────────────────── */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-nexus-border bg-nexus-surface p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-nexus-border pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-nexus-accent-pink" />
                  <h3 className="text-base font-bold text-nexus-text">Ajustes de Pareja</h3>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 rounded-lg text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    Nombre del Espacio
                  </label>
                  <input
                    type="text"
                    required
                    value={spaceName}
                    onChange={e => setSpaceName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-nexus-accent-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    Acuerdo de Split por Defecto (%)
                  </label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-indigo-400">David: {defaultDavidPct}%</span>
                      <span className="text-pink-400">Cami: {100 - defaultDavidPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={defaultDavidPct}
                      onChange={e => setDefaultDavidPct(Number(e.target.value))}
                      className="w-full accent-nexus-accent-pink"
                    />
                    <div className="flex gap-1.5 justify-center">
                      {[50, 60, 70].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDefaultDavidPct(pct)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition ${
                            defaultDavidPct === pct
                              ? 'bg-nexus-accent-pink/20 text-pink-300 border-pink-500'
                              : 'bg-nexus-surface-2 text-nexus-text-muted border-nexus-border'
                          }`}
                        >
                          {pct}/{100 - pct}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-nexus-border flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Desvincular este espacio de pareja? Los datos individuales se mantendrán.')) {
                        unlinkCoupleSpace();
                        setShowSettingsModal(false);
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-300 font-medium"
                  >
                    Desvincular Espacio
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-nexus-text-muted hover:text-nexus-text"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-nexus-accent-pink hover:bg-nexus-accent-pink/90 text-white font-semibold text-xs transition"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
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
                <h3 className="text-base font-bold text-nexus-text">Nueva Tarea Compartida</h3>
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="p-1 rounded-lg text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    Título de la Tarea *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="Ej. Comprar repisa para la cocina..."
                    className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-nexus-accent-indigo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                      Prioridad
                    </label>
                    <select
                      value={newTaskPriority}
                      onChange={e => setNewTaskPriority(e.target.value as Priority)}
                      className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-nexus-accent-indigo"
                    >
                      <option value="P1">P1 - Crítico</option>
                      <option value="P2">P2 - Alto</option>
                      <option value="P3">P3 - Medio</option>
                      <option value="P4">P4 - Bajo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                      Asignado A
                    </label>
                    <select
                      value={newTaskAssignee}
                      onChange={e => setNewTaskAssignee(e.target.value as Owner)}
                      className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-nexus-accent-indigo"
                    >
                      <option value="david">👨‍💻 David</option>
                      <option value="cami">👩‍🎨 Cami</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-nexus-accent-indigo"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-nexus-border">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-nexus-accent-indigo hover:bg-nexus-accent-indigo/90 text-white font-semibold text-xs transition shadow-lg shadow-indigo-500/20"
                  >
                    Crear Tarea
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Add Habit Modal ────────────────────────────────────── */}
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
                <h3 className="text-base font-bold text-nexus-text">Nuevo Hábito Compartido</h3>
                <button
                  onClick={() => setShowAddHabitModal(false)}
                  className="p-1 rounded-lg text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateHabit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    Nombre del Hábito *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newHabitName}
                    onChange={e => setNewHabitName(e.target.value)}
                    placeholder="Ej. Caminar 30 mins juntos, Noche de lectura..."
                    className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-nexus-accent-pink"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                      Emoji
                    </label>
                    <input
                      type="text"
                      value={newHabitIcon}
                      onChange={e => setNewHabitIcon(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-sm text-nexus-text text-center focus:outline-none focus:border-nexus-accent-pink"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                      Meta Días/Semana
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={newHabitFrequency}
                      onChange={e => setNewHabitFrequency(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text text-center focus:outline-none focus:border-nexus-accent-pink"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-nexus-border">
                  <button
                    type="button"
                    onClick={() => setShowAddHabitModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-nexus-accent-pink hover:bg-nexus-accent-pink/90 text-white font-semibold text-xs transition shadow-lg shadow-pink-500/20"
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
