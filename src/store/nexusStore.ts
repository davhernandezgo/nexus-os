// ═══════════════════════════════════════════════════════════════════
// NexusOS — Central Zustand Store (Offline-First, Privacy-Scoped)
// ═══════════════════════════════════════════════════════════════════
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Owner, Visibility, ContextMode, Account, Task, Project, Habit,
  TimerSession, TimeLog, Expense, TripPlan, SharedNote, DailyNote,
  NexusNotification, PageBlock, HabitCompletion, Tag, TaskTemplate,
  CoupleSpace, CategoryBudget, Investment, ExpenseSplitType, UserProfile,
} from '../types/nexus';
import { seedData } from '../services/seedData';
import { supabase } from '../lib/supabase';

// ─── Store Shape ────────────────────────────────────────────────
export interface NexusStore {
  // Auth / Context
  currentUser: UserProfile | null;
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
  coupleSpace: CoupleSpace | null;
  categoryBudgets: CategoryBudget[];
  investments: Investment[];

  // Timer (global singleton)
  timer: TimerSession;

  // UI state
  selectedTaskId: string | null;
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  activeView: string;

  // ── Auth Actions ──
  login: (owner: Owner, pin: string) => boolean;
  setSupabaseUser: (user: any) => void;
  logout: () => void;
  switchContext: (mode: ContextMode) => void;

  // ── Privacy Filter (THE critical function) ──
  getVisibleTasks: () => Task[];
  getVisibleProjects: () => Project[];
  getVisibleHabits: () => Habit[];
  getVisibleExpenses: () => Expense[];
  getVisibleInvestments: () => Investment[];
  getVisibleCategoryBudgets: () => CategoryBudget[];
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

  // ── Couple Hub & Partnership ──
  createCoupleSpace: (name?: string, defaultRatio?: { david: number; cami: number }) => CoupleSpace;
  joinCoupleSpace: (code: string) => boolean;
  updateCoupleSpace: (updates: Partial<CoupleSpace>) => void;
  unlinkCoupleSpace: () => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getBalance: () => { david: number; cami: number; net: number };
  addCategoryBudget: (budget: CategoryBudget) => void;
  updateCategoryBudget: (id: string, updates: Partial<CategoryBudget>) => void;
  deleteCategoryBudget: (id: string) => void;
  addTripPlan: (trip: TripPlan) => void;
  updateTripPlan: (id: string, updates: Partial<TripPlan>) => void;
  deleteTripPlan: (id: string) => void;
  addSharedNote: (note: SharedNote) => void;
  updateSharedNote: (id: string, updates: Partial<SharedNote>) => void;
  deleteSharedNote: (id: string) => void;

  // ── Investments ($ USD) ──
  addInvestment: (inv: Investment) => void;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;

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
export const useNexusStore = create<NexusStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ──
      currentUser: null,
      currentOwner: null,
      contextMode: 'private' as ContextMode,
      accounts: [],
      isAuthenticated: false,
      isInitialized: false,

      tasks: [],
      projects: [],
      habits: [],
      tags: [],
      timeLogs: [],
      expenses: [],
      tripPlans: [],
      sharedNotes: [],
      dailyNotes: [],
      notifications: [],
      customTemplates: [],
      coupleSpace: null,
      categoryBudgets: [],
      investments: [],

      timer: { ...defaultTimer },

      selectedTaskId: null,
      sidebarOpen: true,
      commandPaletteOpen: false,
      activeView: 'inbox',

      // ═══════════ AUTH ═══════════
      login: () => false,
      setSupabaseUser: (user) => {
        if (!user) {
          set({ currentUser: null, currentOwner: null, isAuthenticated: false });
          return;
        }
        const email = user.email || '';
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.display_name ||
          email.split('@')[0] ||
          'Usuario';
        const avatar = user.user_metadata?.avatar_url || '👤';
        const isCami = email.toLowerCase().includes('cami');
        const isDavid = email.toLowerCase().includes('david');
        const ownerKey: Owner = isCami ? 'cami' : isDavid ? 'david' : user.id;

        const accounts = get().accounts || [];
        const existingAcc = accounts.find(a => a.id === user.id || a.owner === ownerKey);
        const userAccount: Account = {
          id: user.id,
          owner: ownerKey,
          displayName: fullName,
          avatar,
          pin: '0000',
          accentColor: isCami ? '#ec4899' : '#6366f1',
        };

        const currentTags = get().tags || [];
        const tags = currentTags.length === 0 ? [
          { id: `tag-work-${Date.now()}`, name: 'Trabajo', color: '#6366f1', owner: ownerKey, visibility: 'private' as const },
          { id: `tag-personal-${Date.now()}`, name: 'Personal', color: '#10b981', owner: ownerKey, visibility: 'private' as const },
          { id: `tag-hogar-${Date.now()}`, name: 'Hogar', color: '#ec4899', owner: ownerKey, visibility: 'couple' as const },
          { id: `tag-finanzas-${Date.now()}`, name: 'Finanzas', color: '#22c55e', owner: ownerKey, visibility: 'couple' as const },
        ] : currentTags;

        set({
          currentUser: {
            id: user.id,
            email,
            displayName: fullName,
            avatar,
          },
          currentOwner: ownerKey,
          isAuthenticated: true,
          contextMode: 'private',
          tags,
          accounts: existingAcc
            ? accounts.map(a => (a.owner === ownerKey || a.id === user.id ? { ...a, displayName: fullName, avatar } : a))
            : [userAccount, ...accounts.filter(a => a.owner !== ownerKey)],
        });
      },
      logout: () => {
        if (supabase) {
          supabase.auth.signOut().catch(() => {});
        }
        set({ currentOwner: null, currentUser: null, isAuthenticated: false, contextMode: 'private' });
      },
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
        const { expenses, currentOwner, contextMode } = get();
        if (!currentOwner) return [];
        switch (contextMode) {
          case 'private':
            return expenses.filter(e => (e.owner === currentOwner || e.paidBy === currentOwner) && e.visibility === 'private');
          case 'couple':
            return expenses.filter(e => e.visibility === 'couple');
          case 'unified':
            return expenses.filter(e =>
              e.visibility === 'couple' || ((e.owner === currentOwner || e.paidBy === currentOwner) && e.visibility === 'private')
            );
          default:
            return [];
        }
      },
      getVisibleInvestments: () => {
        const { investments, currentOwner, contextMode } = get();
        if (!currentOwner) return [];
        switch (contextMode) {
          case 'private':
            return investments.filter(i => i.owner === currentOwner && i.visibility === 'private');
          case 'couple':
            return investments.filter(i => i.visibility === 'couple');
          case 'unified':
            return investments.filter(i =>
              i.visibility === 'couple' || (i.owner === currentOwner && i.visibility === 'private')
            );
          default:
            return [];
        }
      },
      getVisibleCategoryBudgets: () => {
        const { categoryBudgets, currentOwner, contextMode } = get();
        if (!currentOwner) return [];
        switch (contextMode) {
          case 'private':
            return categoryBudgets.filter(b => b.owner === currentOwner && b.visibility === 'private');
          case 'couple':
            return categoryBudgets.filter(b => b.visibility === 'couple');
          case 'unified':
            return categoryBudgets.filter(b =>
              b.visibility === 'couple' || (b.owner === currentOwner && b.visibility === 'private')
            );
          default:
            return [];
        }
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

      // ═══════════ COUPLE HUB & PARTNERSHIP ═══════════
      createCoupleSpace: (name = 'Espacio de Pareja', defaultRatio = { david: 50, cami: 50 }) => {
        const randomCode = `COUPLE-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const currentOwner = get().currentOwner || 'david';
        const currentUser = get().currentUser;
        const currentAccount = get().accounts.find(a => a.owner === currentOwner);
        const userName = currentAccount?.displayName || currentUser?.displayName || 'Usuario 1';
        const userId = currentAccount?.id || currentUser?.id || 'acc-user1';

        const newSpace: CoupleSpace = {
          id: `cs-${Date.now()}`,
          code: randomCode,
          status: 'pending',
          name,
          user1Id: userId,
          user1Name: userName,
          defaultSplitRatio: defaultRatio,
          createdAt: new Date().toISOString(),
        };
        set({ coupleSpace: newSpace });
        return newSpace;
      },
      joinCoupleSpace: (code) => {
        const current = get().coupleSpace;
        const currentOwner = get().currentOwner || 'cami';
        const currentUser = get().currentUser;
        const currentAccount = get().accounts.find(a => a.owner === currentOwner);
        const userName = currentAccount?.displayName || currentUser?.displayName || 'Usuario 2';
        const userId = currentAccount?.id || currentUser?.id || 'acc-user2';

        if (!current) {
          const newSpace: CoupleSpace = {
            id: `cs-${Date.now()}`,
            code: code.trim().toUpperCase(),
            status: 'active',
            name: 'Espacio Compartido',
            user1Id: 'acc-partner',
            user2Id: userId,
            user1Name: 'Pareja',
            user2Name: userName,
            defaultSplitRatio: { david: 50, cami: 50 },
            createdAt: new Date().toISOString(),
          };
          set({ coupleSpace: newSpace });
          return true;
        }
        if (current.code.toLowerCase() === code.trim().toLowerCase()) {
          set({
            coupleSpace: {
              ...current,
              status: 'active',
              user2Id: userId,
              user2Name: userName,
            },
          });
          return true;
        }
        return false;
      },
      updateCoupleSpace: (updates) =>
        set(s => ({
          coupleSpace: s.coupleSpace ? { ...s.coupleSpace, ...updates } : null,
        })),
      unlinkCoupleSpace: () => set({ coupleSpace: null }),

      addExpense: (expense) => set(s => ({ expenses: [expense, ...s.expenses] })),
      updateExpense: (id, updates) =>
        set(s => ({
          expenses: s.expenses.map(e => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteExpense: (id) => set(s => ({ expenses: s.expenses.filter(e => e.id !== id) })),
      getBalance: () => {
        const expenses = get().expenses;
        // Only couple-shared expenses count towards the split/debt balance!
        const sharedExpenses = expenses.filter(e => e.visibility === 'couple');

        let davidTotalPaid = 0;
        let camiTotalPaid = 0;
        let davidOwesCami = 0;
        let camiOwesDavid = 0;

        sharedExpenses.forEach(e => {
          const payer = e.paidBy;
          if (payer === 'david') davidTotalPaid += e.amount;
          else if (payer === 'cami') camiTotalPaid += e.amount;

          // Determine each person's required share
          let davidShare = 0;
          let camiShare = 0;

          if (e.splitType === 'equal' || !e.splitType) {
            davidShare = e.amount / 2;
            camiShare = e.amount / 2;
          } else if (e.splitType === 'percentage' && e.splitRatio) {
            const dPct = e.splitRatio.david ?? 50;
            const cPct = e.splitRatio.cami ?? (100 - dPct);
            davidShare = (e.amount * dPct) / 100;
            camiShare = (e.amount * cPct) / 100;
          } else if (e.splitType === 'exact' && e.exactSplit) {
            davidShare = e.exactSplit.david ?? 0;
            camiShare = e.exactSplit.cami ?? 0;
          } else if (e.splitType === 'single') {
            if (e.singleBeneficiary === 'david') {
              davidShare = e.amount;
              camiShare = 0;
            } else if (e.singleBeneficiary === 'cami') {
              davidShare = 0;
              camiShare = e.amount;
            } else {
              if (payer === 'david') davidShare = e.amount;
              else camiShare = e.amount;
            }
          }

          // Who owes who?
          if (payer === 'david') {
            camiOwesDavid += camiShare;
          } else if (payer === 'cami') {
            davidOwesCami += davidShare;
          }
        });

        const net = camiOwesDavid - davidOwesCami;

        return {
          david: davidTotalPaid,
          cami: camiTotalPaid,
          net: Math.round(net),
        };
      },

      addCategoryBudget: (budget) => set(s => ({ categoryBudgets: [...s.categoryBudgets, budget] })),
      updateCategoryBudget: (id, updates) =>
        set(s => ({
          categoryBudgets: s.categoryBudgets.map(b => (b.id === id ? { ...b, ...updates } : b)),
        })),
      deleteCategoryBudget: (id) =>
        set(s => ({ categoryBudgets: s.categoryBudgets.filter(b => b.id !== id) })),

      // ═══════════ INVESTMENTS ($ USD) ═══════════
      addInvestment: (inv) => set(s => ({ investments: [inv, ...s.investments] })),
      updateInvestment: (id, updates) =>
        set(s => ({
          investments: s.investments.map(i => (i.id === id ? { ...i, ...updates } : i)),
        })),
      deleteInvestment: (id) => set(s => ({ investments: s.investments.filter(i => i.id !== id) })),
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
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (version < 3) {
          // Discard mock/preloaded demo data and enforce clean authentication
          return {
            ...persistedState,
            currentUser: null,
            currentOwner: null,
            isAuthenticated: false,
            accounts: [],
            coupleSpace: null,
            categoryBudgets: [],
            investments: [],
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
