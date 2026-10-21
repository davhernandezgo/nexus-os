// ═══════════════════════════════════════════════════════════════════
// NexusOS — Central Zustand Store (Offline-First, Privacy-Scoped)
// ═══════════════════════════════════════════════════════════════════
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Owner, Visibility, ContextMode, Account, Task, Project, Habit,
  TimerSession, TimeLog, Expense, TripPlan, SharedNote, DailyNote,
  NexusNotification, PageBlock, HabitCompletion, Tag, TaskTemplate,
} from '../types/nexus';
import { seedData } from '../services/seedData';

// ─── Store Shape ────────────────────────────────────────────────
export interface NexusStore {
  // Auth / Context
  currentOwner: Owner | null;
  contextMode: ContextMode;
  accounts: Account[];
  isAuthenticated: boolean;
  isInitialized: boolean;

  // Data collections
  tasks: Task[];
  projects: Project[];
  habits: Habit[];
  tags: Tag[];
  timeLogs: TimeLog[];
  expenses: Expense[];
  tripPlans: TripPlan[];
  sharedNotes: SharedNote[];
  dailyNotes: DailyNote[];
  notifications: NexusNotification[];
  customTemplates: TaskTemplate[];

  // Timer (global singleton)
  timer: TimerSession;

  // UI state
  selectedTaskId: string | null;
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  activeView: string;

  // ── Auth Actions ──
  login: (owner: Owner, pin: string) => boolean;
  logout: () => void;
  switchContext: (mode: ContextMode) => void;

  // ── Privacy Filter (THE critical function) ──
  getVisibleTasks: () => Task[];
  getVisibleProjects: () => Project[];
  getVisibleHabits: () => Habit[];
  getVisibleExpenses: () => Expense[];
  getVisibleTags: () => Tag[];
  addTag: (tag: Tag) => void;

  // ── Task CRUD ──
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  addSubtask: (parentId: string, subtask: Task) => void;
  getSubtasks: (parentId: string) => Task[];
  getTaskById: (id: string) => Task | undefined;

  // ── Project CRUD ──
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // ── Habit CRUD ──
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitDay: (habitId: string, date: string, minutes?: number, value?: number) => void;
  adjustHabitValue: (habitId: string, date: string, delta: number) => void;
  addStreakFreeze: (habitId: string, date: string) => void;

  // ── Timer Actions ──
  startTimer: (targetId?: string, targetType?: 'task' | 'habit', title?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: (note?: string) => void;
  tickTimer: () => void;
  setTimerMode: (mode: 'stopwatch' | 'pomodoro') => void;
  setPomodoroConfig: (focus: number, breakMin: number) => void;

  // ── Couple Hub ──
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getBalance: () => { david: number; cami: number; net: number };
  addTripPlan: (trip: TripPlan) => void;
  updateTripPlan: (id: string, updates: Partial<TripPlan>) => void;
  deleteTripPlan: (id: string) => void;
  addSharedNote: (note: SharedNote) => void;
  updateSharedNote: (id: string, updates: Partial<SharedNote>) => void;
  deleteSharedNote: (id: string) => void;

  // ── Daily Notes ──
  getDailyNote: (date: string) => DailyNote | undefined;
  upsertDailyNote: (note: DailyNote) => void;

  // ── Templates ──
  addCustomTemplate: (template: TaskTemplate) => void;
  updateCustomTemplate: (id: string, updates: Partial<TaskTemplate>) => void;
  deleteCustomTemplate: (id: string) => void;

  // ── Notifications ──
  addNotification: (n: NexusNotification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;

  // ── UI ──
  setSelectedTaskId: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveView: (view: string) => void;

  // ── Init ──
  initializeWithSeed: () => void;
}

// ─── Default Timer ──────────────────────────────────────────────
const defaultTimer: TimerSession = {
  id: 'global-timer',
  mode: 'stopwatch',
  state: 'idle',
  elapsed: 0,
};

// ─── Store Implementation ───────────────────────────────────────
const initialSeed = seedData();

export const useNexusStore = create<NexusStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ──
      currentOwner: 'david' as Owner,
      contextMode: 'private' as ContextMode,
      accounts: [
        {
          id: 'acc-david',
          owner: 'david' as Owner,
          displayName: 'David',
          avatar: '👨‍💻',
          pin: '1234',
          accentColor: '#6366f1', // indigo
        },
        {
          id: 'acc-cami',
          owner: 'cami' as Owner,
          displayName: 'Cami',
          avatar: '👩‍🎨',
          pin: '5678',
          accentColor: '#ec4899', // pink
        },
      ],
      isAuthenticated: true,
      isInitialized: true,

      tasks: initialSeed.tasks,
      projects: initialSeed.projects,
      habits: initialSeed.habits,
      tags: initialSeed.tags,
      timeLogs: [],
      expenses: initialSeed.expenses,
      tripPlans: initialSeed.tripPlans,
      sharedNotes: initialSeed.sharedNotes,
      dailyNotes: initialSeed.dailyNotes,
      notifications: initialSeed.notifications,
      customTemplates: [],

      timer: { ...defaultTimer },

      selectedTaskId: null,
      sidebarOpen: true,
      commandPaletteOpen: false,
      activeView: 'inbox',

      // ═══════════ AUTH ═══════════
      login: (owner, pin) => {
        const account = get().accounts.find(a => a.owner === owner);
        if (account && account.pin === pin) {
          set({ currentOwner: owner, isAuthenticated: true, contextMode: 'private' });
          if (!get().isInitialized) {
            get().initializeWithSeed();
          }
          return true;
        }
        return false;
      },
      logout: () => set({ currentOwner: null, isAuthenticated: false, contextMode: 'private' }),
      switchContext: (mode) => set({ contextMode: mode }),

      // ═══════════ PRIVACY FILTER ═══════════
      getVisibleTasks: () => {
        const { tasks, currentOwner, contextMode } = get();
        if (!currentOwner) return [];
        switch (contextMode) {
          case 'private':
            return tasks.filter(t => t.owner === currentOwner && t.visibility === 'private');
          case 'couple':
            return tasks.filter(t => t.visibility === 'couple');
          case 'unified':
            return tasks.filter(t =>
              t.visibility === 'couple' || (t.owner === currentOwner && t.visibility === 'private')
            );
          default:
            return [];
        }
      },
      getVisibleProjects: () => {
        const { projects, currentOwner, contextMode } = get();
        if (!currentOwner) return [];
        switch (contextMode) {
          case 'private':
            return projects.filter(p => p.owner === currentOwner && p.visibility === 'private');
          case 'couple':
            return projects.filter(p => p.visibility === 'couple');
          case 'unified':
            return projects.filter(p =>
              p.visibility === 'couple' || (p.owner === currentOwner && p.visibility === 'private')
            );
          default:
            return [];
        }
      },
      getVisibleHabits: () => {
        const { habits, currentOwner, contextMode } = get();
        if (!currentOwner) return [];
        switch (contextMode) {
          case 'private':
            return habits.filter(h => h.owner === currentOwner && h.visibility === 'private');
          case 'couple':
            return habits.filter(h => h.visibility === 'couple');
          case 'unified':
            return habits.filter(h =>
              h.visibility === 'couple' || (h.owner === currentOwner && h.visibility === 'private')
            );
          default:
            return [];
        }
      },
      getVisibleExpenses: () => {
        const { expenses, currentOwner } = get();
        if (!currentOwner) return [];
        return expenses; // All expenses are couple-visible
      },
      getVisibleTags: () => {
        const { tags, currentOwner, contextMode } = get();
        if (!currentOwner) return [];
        switch (contextMode) {
          case 'private':
            return tags.filter(t => t.owner === currentOwner && t.visibility === 'private');
          case 'couple':
            return tags.filter(t => t.visibility === 'couple');
          case 'unified':
            return tags.filter(t =>
              t.visibility === 'couple' || (t.owner === currentOwner && t.visibility === 'private')
            );
          default:
            return [];
        }
      },
      addTag: (tag) => set(s => ({ tags: [...s.tags, tag] })),

      // ═══════════ TASKS ═══════════
      addTask: (task) =>
        set(s => ({
          tasks: [task, ...s.tasks],
          projects: task.projectId
            ? s.projects.map(p =>
                p.id === task.projectId && !(p.taskIds || []).includes(task.id)
                  ? { ...p, taskIds: [task.id, ...(p.taskIds || [])] }
                  : p
              )
            : s.projects,
        })),
      updateTask: (id, updates) =>
        set(s => ({
          tasks: s.tasks.map(t => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTask: (id) =>
        set(s => ({
          tasks: s.tasks.filter(t => t.id !== id && t.parentTaskId !== id),
          projects: s.projects.map(p => ({
            ...p,
            taskIds: (p.taskIds || []).filter(taskId => taskId !== id),
          })),
        })),
      toggleTaskStatus: (id) =>
        set(s => ({
          tasks: s.tasks.map(t => {
            if (t.id !== id) return t;
            const newStatus = t.status === 'done' ? 'todo' : 'done';
            return {
              ...t,
              status: newStatus,
              completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
            };
          }),
        })),
      addSubtask: (parentId, subtask) =>
        set(s => ({
          tasks: [
            ...s.tasks.map(t =>
              t.id === parentId ? { ...t, subtaskIds: [...t.subtaskIds, subtask.id] } : t
            ),
            { ...subtask, parentTaskId: parentId },
          ],
        })),
      getSubtasks: (parentId) => get().tasks.filter(t => t.parentTaskId === parentId),
      getTaskById: (id) => get().tasks.find(t => t.id === id),

      // ═══════════ PROJECTS ═══════════
      addProject: (project) => set(s => ({ projects: [...s.projects, project] })),
      updateProject: (id, updates) =>
        set(s => ({
          projects: s.projects.map(p => (p.id === id ? { ...p, ...updates } : p)),
        })),
      deleteProject: (id) => set(s => ({ projects: s.projects.filter(p => p.id !== id) })),

      // ═══════════ HABITS ═══════════
      addHabit: (habit) => set(s => ({ habits: [...s.habits, habit] })),
      updateHabit: (id, updates) =>
        set(s => ({
          habits: s.habits.map(h => (h.id === id ? { ...h, ...updates } : h)),
        })),
      deleteHabit: (id) => set(s => ({ habits: s.habits.filter(h => h.id !== id) })),
      toggleHabitDay: (habitId, date, minutes = 0, value) =>
        set(s => ({
          habits: s.habits.map(h => {
            if (h.id !== habitId) return h;
            const existing = h.completions.find(c => c.date === date);
            const target = h.targetValue || 1;
            if (existing) {
              const nextCompleted = !existing.completed;
              return {
                ...h,
                completions: h.completions.map(c =>
                  c.date === date
                    ? {
                        ...c,
                        completed: nextCompleted,
                        minutesLogged: minutes || c.minutesLogged,
                        valueLogged: nextCompleted ? (value ?? target) : 0,
                      }
                    : c
                ),
              };
            }
            return {
              ...h,
              completions: [
                ...h.completions,
                {
                  date,
                  completed: true,
                  minutesLogged: minutes,
                  valueLogged: value ?? target,
                },
              ],
            };
          }),
        })),
      adjustHabitValue: (habitId, date, delta) =>
        set(s => ({
          habits: s.habits.map(h => {
            if (h.id !== habitId) return h;
            const target = h.targetValue || 8;
            const existing = h.completions.find(c => c.date === date);
            const currentVal = existing?.valueLogged ?? (existing?.completed ? target : 0);
            const nextVal = Math.max(0, currentVal + delta);
            const nextCompleted = nextVal >= target;

            if (existing) {
              return {
                ...h,
                completions: h.completions.map(c =>
                  c.date === date
                    ? {
                        ...c,
                        completed: nextCompleted,
                        valueLogged: nextVal,
                      }
                    : c
                ),
              };
            }
            return {
              ...h,
              completions: [
                ...h.completions,
                {
                  date,
                  completed: nextCompleted,
                  minutesLogged: 0,
                  valueLogged: nextVal,
                },
              ],
            };
          }),
        })),
      addStreakFreeze: (habitId, date) =>
        set(s => ({
          habits: s.habits.map(h =>
            h.id === habitId
              ? { ...h, streakFreezes: [...h.streakFreezes, date] }
              : h
          ),
        })),

      // ═══════════ TIMER ═══════════
      startTimer: (targetId, targetType, title) =>
        set({
          timer: {
            ...get().timer,
            state: 'running',
            targetId,
            targetType,
            targetTitle: title,
            startedAt: new Date().toISOString(),
            elapsed: 0,
            pomodoroConfig: get().timer.mode === 'pomodoro'
              ? (get().timer.pomodoroConfig || {
                  focusMinutes: 25,
                  breakMinutes: 5,
                  currentCycle: 1,
                  isBreak: false,
                })
              : undefined,
          },
        }),
      pauseTimer: () => set({ timer: { ...get().timer, state: 'paused' } }),
      resumeTimer: () => set({ timer: { ...get().timer, state: 'running' } }),
      stopTimer: (note) => {
        const t = get().timer;
        const durationMinutes = Math.max(1, Math.round(t.elapsed / 60));

        if (t.targetId && t.targetType === 'task') {
          // Add time to task and insert timestamp page block
          const task = get().tasks.find(tk => tk.id === t.targetId);
          if (task) {
            const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const timestampBlock: PageBlock = {
              id: `block-${Date.now()}`,
              type: 'timestamp',
              content: `⏱️ ${timeLabel} — Sesión de enfoque (${durationMinutes} min)${note ? `: ${note}` : ''}`,
            };
            get().updateTask(task.id, {
              actualMinutes: (task.actualMinutes || 0) + durationMinutes,
              pageContent: [...(task.pageContent || []), timestampBlock],
            });
          }
          // Log session
          if (t.startedAt) {
            const timeLog: TimeLog = {
              id: `tl-${Date.now()}`,
              taskId: t.targetId,
              owner: get().currentOwner || 'david',
              startedAt: t.startedAt,
              endedAt: new Date().toISOString(),
              durationMinutes,
              note: note || '',
            };
            set(s => ({ timeLogs: [...s.timeLogs, timeLog] }));
          }
        } else if (t.targetId && t.targetType === 'habit') {
          // Add logged minutes to today's habit completion
          const today = new Date().toISOString().split('T')[0];
          const habit = get().habits.find(h => h.id === t.targetId);
          if (habit) {
            const existing = habit.completions.find(c => c.date === today);
            if (existing) {
              get().updateHabit(habit.id, {
                completions: habit.completions.map(c =>
                  c.date === today
                    ? { ...c, completed: true, minutesLogged: (c.minutesLogged || 0) + durationMinutes }
                    : c
                ),
              });
            } else {
              get().updateHabit(habit.id, {
                completions: [
                  ...habit.completions,
                  { date: today, completed: true, minutesLogged: durationMinutes },
                ],
              });
            }
          }
        }
        set({ timer: { ...defaultTimer, mode: t.mode, pomodoroConfig: t.pomodoroConfig } });
      },
      tickTimer: () => {
        const t = get().timer;
        if (t.state !== 'running' && t.state !== 'break') return;
        const newElapsed = t.elapsed + 1;

        // Pomodoro cycle check
        if (t.mode === 'pomodoro' && t.pomodoroConfig) {
          const cfg = t.pomodoroConfig;
          const targetSecs = cfg.isBreak
            ? cfg.breakMinutes * 60
            : cfg.focusMinutes * 60;

          if (newElapsed >= targetSecs) {
            if (cfg.isBreak) {
              // Break done → start new focus
              set({
                timer: {
                  ...t,
                  elapsed: 0,
                  state: 'running',
                  pomodoroConfig: {
                    ...cfg,
                    isBreak: false,
                    currentCycle: cfg.currentCycle + 1,
                  },
                },
              });
            } else {
              // Focus done → start break
              set({
                timer: {
                  ...t,
                  elapsed: 0,
                  state: 'break',
                  pomodoroConfig: { ...cfg, isBreak: true },
                },
              });
            }
            return;
          }
        }
        set({ timer: { ...t, elapsed: newElapsed } });
      },
      setTimerMode: (mode) =>
        set({
          timer: {
            ...defaultTimer,
            mode,
            pomodoroConfig:
              mode === 'pomodoro'
                ? { focusMinutes: 25, breakMinutes: 5, currentCycle: 1, isBreak: false }
                : undefined,
          },
        }),
      setPomodoroConfig: (focus, breakMin) =>
        set({
          timer: {
            ...get().timer,
            pomodoroConfig: {
              focusMinutes: focus,
              breakMinutes: breakMin,
              currentCycle: get().timer.pomodoroConfig?.currentCycle || 1,
              isBreak: false,
            },
          },
        }),

      // ═══════════ COUPLE HUB ═══════════
      addExpense: (expense) => set(s => ({ expenses: [...s.expenses, expense] })),
      updateExpense: (id, updates) =>
        set(s => ({
          expenses: s.expenses.map(e => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteExpense: (id) => set(s => ({ expenses: s.expenses.filter(e => e.id !== id) })),
      getBalance: () => {
        const expenses = get().expenses;
        let davidPaid = 0;
        let camiPaid = 0;
        expenses.forEach(e => {
          if (e.paidBy === 'david') davidPaid += e.amount;
          else camiPaid += e.amount;
        });
        const total = davidPaid + camiPaid;
        const fairShare = total / 2;
        return {
          david: davidPaid,
          cami: camiPaid,
          net: davidPaid - fairShare, // positive = Cami owes David
        };
      },
      addTripPlan: (trip) => set(s => ({ tripPlans: [...s.tripPlans, trip] })),
      updateTripPlan: (id, updates) =>
        set(s => ({
          tripPlans: s.tripPlans.map(t => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTripPlan: (id) => set(s => ({ tripPlans: s.tripPlans.filter(t => t.id !== id) })),
      addSharedNote: (note) => set(s => ({ sharedNotes: [...s.sharedNotes, note] })),
      updateSharedNote: (id, updates) =>
        set(s => ({
          sharedNotes: s.sharedNotes.map(n => (n.id === id ? { ...n, ...updates } : n)),
        })),
      deleteSharedNote: (id) => set(s => ({ sharedNotes: s.sharedNotes.filter(n => n.id !== id) })),

      // ═══════════ DAILY NOTES ═══════════
      getDailyNote: (date) => {
        const { dailyNotes, currentOwner } = get();
        return dailyNotes.find(n => n.date === date && n.owner === currentOwner);
      },
      upsertDailyNote: (note) =>
        set(s => {
          const exists = s.dailyNotes.find(n => n.id === note.id);
          if (exists) {
            return { dailyNotes: s.dailyNotes.map(n => (n.id === note.id ? note : n)) };
          }
          return { dailyNotes: [...s.dailyNotes, note] };
        }),

      // ═══════════ TEMPLATES ═══════════
      addCustomTemplate: (template) =>
        set(s => ({ customTemplates: [template, ...s.customTemplates] })),
      updateCustomTemplate: (id, updates) =>
        set(s => ({
          customTemplates: s.customTemplates.map(t => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteCustomTemplate: (id) =>
        set(s => ({ customTemplates: s.customTemplates.filter(t => t.id !== id) })),

      // ═══════════ NOTIFICATIONS ═══════════
      addNotification: (n) => set(s => ({ notifications: [n, ...s.notifications] })),
      markNotificationRead: (id) =>
        set(s => ({
          notifications: s.notifications.map(n => (n.id === id ? { ...n, read: true } : n)),
        })),
      clearNotifications: () => set({ notifications: [] }),
      getUnreadCount: () => get().notifications.filter(n => !n.read).length,

      // ═══════════ UI ═══════════
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setActiveView: (view) => set({ activeView: view }),

      // ═══════════ SEED ═══════════
      initializeWithSeed: () => {
        const data = seedData();
        set({
          ...data,
          isInitialized: true,
        });
      },
    }),
    {
      name: 'nexus-os-store',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // Discard mock/preloaded demo data from earlier versions
          return {
            ...persistedState,
            tasks: [],
            projects: [],
            habits: [],
            expenses: [],
            tripPlans: [],
            sharedNotes: [],
            dailyNotes: [],
            notifications: [],
          };
        }
        return persistedState;
      },
      partialize: (state) => {
        // Exclude transient UI state from persistence for instantaneous modal opening/closing
        const {
          commandPaletteOpen,
          selectedTaskId,
          sidebarOpen,
          timer,
          ...rest
        } = state;
        return rest;
      },
    }
  )
);
