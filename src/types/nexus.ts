// ═══════════════════════════════════════════════════════════════════
// NexusOS — Unified Type Contract
// All modules (Tasks, Habits, Couple Hub, Graph, Notes) share these.
// ═══════════════════════════════════════════════════════════════════

// ─── Core Identity & Privacy ────────────────────────────────────
export type Owner = 'david' | 'cami' | (string & {});
export type Visibility = 'private' | 'couple';
export type ContextMode = 'private' | 'couple' | 'unified';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
}

export interface PrivacyScope {
  owner: Owner;
  visibility: Visibility;
}

export interface Account {
  id: string;
  owner: Owner;
  displayName: string;
  avatar: string;       // emoji or URL
  pin: string;          // 4-digit PIN for local auth
  accentColor: string;  // hex color for personalisation
}

// ─── Priority & Status ──────────────────────────────────────────
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

// ─── Tags & Categories ──────────────────────────────────────────
export interface Tag {
  id: string;
  name: string;
  color: string;
  owner: Owner;
  visibility: Visibility;
}

// ─── Tasks & Subtasks ───────────────────────────────────────────
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  owner: Owner;
  visibility: Visibility;

  // Hierarchy
  projectId?: string;
  parentTaskId?: string;  // for subtasks
  subtaskIds: string[];

  // Tags
  tags: string[];
  category: string;

  // ── Triple Audit ──
  createdAt: string;        // ISO timestamp
  dueDate?: string;         // scheduled due date
  completedAt?: string;     // actual completion timestamp
  estimatedMinutes?: number;
  actualMinutes: number;    // accumulated from timer

  // Reminders
  reminderDate?: string;

  // Page content
  pageContent: PageBlock[];

  // WikiLinks referenced
  wikiLinks: string[];      // IDs of linked items
}

// Subtask uses the same Task interface with parentTaskId set.
// Every subtask has its own pageContent, dueDate, completedAt, timer.

export function isSubtask(task: Task): boolean {
  return !!task.parentTaskId;
}

export function getDeliveryStatus(task: Task): 'on_time' | 'late' | 'overdue' | 'pending' {
  if (!task.dueDate) return 'pending';
  if (task.status === 'done' && task.completedAt) {
    return new Date(task.completedAt) <= new Date(task.dueDate) ? 'on_time' : 'late';
  }
  if (task.status !== 'done' && new Date() > new Date(task.dueDate)) return 'overdue';
  return 'pending';
}

export function getEfficiencyRatio(task: Task): number | null {
  if (!task.estimatedMinutes || task.actualMinutes === 0) return null;
  return task.estimatedMinutes / task.actualMinutes; // >1 = faster than estimated
}

// ─── Page Blocks ─────────────────────────────────────────────
export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bullet_list'
  | 'numbered_list'
  | 'todo'
  | 'code'
  | 'table'
  | 'callout'
  | 'divider'
  | 'timestamp'
  | 'wikilink';

export interface PageBlock {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;    // for todo blocks
  language?: string;    // for code blocks
  calloutType?: 'info' | 'warning' | 'success' | 'error';
  children?: PageBlock[];
}

// ─── Templates (Page templates) ─────────────────────────────────
export type TemplateCategory = 'all' | 'daily' | 'work' | 'couple' | 'travel' | 'personal' | 'health' | 'finance' | 'custom';

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: TemplateCategory;
  blocks: PageBlock[];
  markdown?: string;
  isCustom?: boolean;
  owner?: Owner;
  createdAt: string;
}

// ─── Projects ───────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;
  owner: Owner;
  visibility: Visibility;
  description: string;
  taskIds: string[];
  createdAt: string;
}

// ─── Habits ─────────────────────────────────────────────────────
export type HabitGoalType = 'numeric' | 'time' | 'boolean';

export interface Habit {
  id: string;
  name: string;
  icon: string;           // emoji
  color: string;          // hex
  owner: Owner;
  visibility: Visibility;

  // Goal & Measurement Type
  goalType?: HabitGoalType;    // 'numeric' (ej. 8 vasos) | 'time' (ej. 30 min) | 'boolean' (sí/no)
  targetValue?: number;        // Ej. 8 (vasos), 10000 (pasos), 20 (páginas)
  unit?: string;               // Ej. 'vasos', 'pasos', 'páginas', 'flexiones', 'km'

  // Config
  frequencyPerWeek: number;    // target days per week
  targetMinutes?: number;      // daily goal in minutes (for goalType === 'time')
  reminderTime?: string;       // HH:mm format

  // Tracking
  completions: HabitCompletion[];
  streakFreezes: string[];     // ISO dates marked as freeze
  createdAt: string;
}

export interface HabitCompletion {
  date: string;         // YYYY-MM-DD
  completed: boolean;
  minutesLogged: number;
  valueLogged?: number; // cantidad actual registrada (ej. 5 de 8 vasos)
}

export function getCurrentStreak(habit: Habit): number {
  const sorted = [...habit.completions]
    .filter(c => c.completed)
    .map(c => c.date)
    .sort()
    .reverse();

  const freezes = new Set(habit.streakFreezes);
  let streak = 0;
  const today = new Date();

  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    if (sorted.includes(dateStr)) {
      streak++;
    } else if (freezes.has(dateStr)) {
      streak++; // freeze day preserves streak
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function getHeatmapData(habit: Habit): Map<string, number> {
  const map = new Map<string, number>();
  habit.completions.forEach(c => {
    map.set(c.date, c.valueLogged || c.minutesLogged || (c.completed ? 1 : 0));
  });
  return map;
}

// ─── Timer / Pomodoro ───────────────────────────────────────────
export type TimerMode = 'stopwatch' | 'pomodoro';
export type TimerState = 'idle' | 'running' | 'paused' | 'break';

export interface TimerSession {
  id: string;
  mode: TimerMode;
  state: TimerState;
  targetId?: string;       // task or habit ID being tracked
  targetType?: 'task' | 'habit';
  targetTitle?: string;
  startedAt?: string;
  elapsed: number;         // seconds elapsed
  pomodoroConfig?: {
    focusMinutes: number;
    breakMinutes: number;
    currentCycle: number;
    isBreak: boolean;
  };
}

export interface TimeLog {
  id: string;
  taskId: string;
  owner: Owner;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  note: string;
}

// ─── Couple Hub & Partnership ───────────────────────────────────
export interface CoupleSpace {
  id: string;
  code: string;
  status: 'pending' | 'active';
  name: string;
  user1Id: string;
  user2Id?: string;
  user1Name: string;
  user2Name?: string;
  defaultSplitRatio?: { david: number; cami: number }; // percentages e.g. { david: 50, cami: 50 }
  createdAt: string;
}

export type ExpenseSplitType = 'equal' | 'percentage' | 'exact' | 'single';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: Owner;
  owner: Owner;
  visibility: Visibility;   // 'private' (Personal) | 'couple' (Compartido en pareja)
  category: string;
  date: string;
  splitType: ExpenseSplitType;
  splitRatio?: { david: number; cami: number }; // Porcentajes e.g. { david: 60, cami: 40 }
  exactSplit?: { david: number; cami: number }; // Montos exactos e.g. { david: 300000, cami: 150000 }
  singleBeneficiary?: Owner;                   // Quién lo asume al 100% sin deuda
  projectId?: string;                          // linked couple project
}

export interface CategoryBudget {
  id: string;
  category: string;
  monthlyLimit: number;
  currency: string;
  owner: Owner;
  visibility: Visibility;
}

// ─── Investments ($ USD) ────────────────────────────────────────
export type InvestmentCategory =
  | 'crypto'
  | 'stocks'
  | 'etf'
  | 'real_estate'
  | 'fixed_income'
  | 'commodities'
  | 'other';

export interface Investment {
  id: string;
  asset: string;             // Nombre o ticker: ej. "Bitcoin (BTC)", "VOO (S&P 500)"
  amountUsd: number;         // Monto en dólares USD
  category: InvestmentCategory;
  date: string;              // YYYY-MM-DD
  owner: Owner;              // 'david' | 'cami'
  visibility: Visibility;    // 'private' (Personal) | 'couple' (Conjunta en pareja)
  platform?: string;         // Broker / Exchange (e.g. Binance, Interactive Brokers, Trii, Hapi, etc.)
  notes?: string;            // Notas de la compra
  sharesQuantity?: number;   // Cantidad comprada (opcional)
  purchasePriceUsd?: number; // Precio unitario (opcional)
  contributions?: { david: number; cami: number }; // Aportes de cada uno en USD si es conjunta
  createdAt: string;
}

export interface TripPlan {
  id: string;
  title: string;
  emoji: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  coverImage?: string;
  notes: string;
  checklistIds: string[];  // task IDs for trip checklist
}

export interface SharedNote {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  updatedBy: Owner;
  pinned: boolean;
}

// ─── Daily Notes ────────────────────────────────────────────────
export interface DailyNote {
  id: string;
  date: string;           // YYYY-MM-DD
  owner: Owner;
  content: PageBlock[];
  wikiLinks: string[];
}

// ─── Knowledge Graph ────────────────────────────────────────────
export interface GraphNode {
  id: string;
  label: string;
  type: 'task' | 'project' | 'habit' | 'note' | 'daily_note';
  owner: Owner;
  visibility: Visibility;
  color: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

// ─── Notifications / Reminders ──────────────────────────────────
export type NotificationLevel = 'info' | 'warning' | 'urgent' | 'overdue';

export interface NexusNotification {
  id: string;
  title: string;
  body: string;
  level: NotificationLevel;
  taskId?: string;
  habitId?: string;
  owner: Owner;
  read: boolean;
  createdAt: string;
  scheduledFor?: string;
}

export interface ReminderRule {
  priority: Priority;
  daysBefore: number;
  sameDayHour: number;      // hour to remind on due day
  insistEveryHours?: number; // for P1: re-remind every N hours
}

export const DEFAULT_REMINDER_RULES: ReminderRule[] = [
  { priority: 'P1', daysBefore: 1, sameDayHour: 8, insistEveryHours: 3 },
  { priority: 'P2', daysBefore: 1, sameDayHour: 9 },
  { priority: 'P3', daysBefore: 0, sameDayHour: 9 },
  { priority: 'P4', daysBefore: 0, sameDayHour: 10 },
];

// ─── NLP Quick-Add Parsing ──────────────────────────────────────
export interface ParsedTaskInput {
  title: string;
  priority?: Priority;
  tags: string[];
  visibility?: Visibility;
  projectQuery?: string;
  estimatedMinutes?: number;
  dueDate?: string;
  rawInput: string;
}

// ─── Command Palette ────────────────────────────────────────────
export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  action: () => void;
  keywords?: string[];
  category: 'task' | 'navigation' | 'action' | 'timer' | 'habit' | 'note';
}
