import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Filter,
  Plus,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  Play,
  CornerDownRight,
  Layers,
  ArrowUpDown,
  FolderMinus,
  Lock,
  Heart,
  AlertCircle
} from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday, isPast, isThisWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { useNexusStore } from '../../store/nexusStore';
import type { Task, Priority, TaskStatus } from '../../types/nexus';
import { getDeliveryStatus } from '../../types/nexus';
import { parseTaskInput } from '../../utils/nlpParser';

type PriorityFilter = 'all' | Priority;
type StatusFilter = 'all' | 'pending' | TaskStatus;
type DueFilter = 'all' | 'today' | 'week' | 'overdue' | 'has_due' | 'no_due';
type SortOption = 'due_date' | 'priority' | 'alphabetical' | 'created_at';

export default function TaskListView() {
  const {
    getVisibleTasks,
    getVisibleProjects,
    setSelectedTaskId,
    toggleTaskStatus,
    addTask,
    startTimer,
    currentOwner,
  } = useNexusStore();

  const visibleTasks = getVisibleTasks();
  const visibleProjects = getVisibleProjects();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [collapsedSubtasks, setCollapsedSubtasks] = useState<Record<string, boolean>>({});
  const [quickInput, setQuickInput] = useState('');
  const [quickProject, setQuickProject] = useState<string>('none');
  const [showFilters, setShowFilters] = useState(false);

  // Toggle project collapse
  const toggleProjectCollapse = (projectId: string) => {
    setCollapsedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  // Toggle subtask collapse
  const toggleSubtaskCollapse = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedSubtasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Map subtasks by parent id
  const subtasksByParent = useMemo(() => {
    const map = new Map<string, Task[]>();
    visibleTasks.forEach(task => {
      if (task.parentTaskId) {
        const list = map.get(task.parentTaskId) || [];
        list.push(task);
        map.set(task.parentTaskId, list);
      }
    });
    return map;
  }, [visibleTasks]);

  // Filter top-level tasks
  const filteredTasks = useMemo(() => {
    // Only top-level tasks for main grouping
    return visibleTasks.filter(task => {
      if (task.parentTaskId) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        const matchesTag = task.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTag) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'pending') {
        if (task.status === 'done') return false;
      } else if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Due filter
      if (dueFilter !== 'all') {
        if (dueFilter === 'no_due') {
          if (task.dueDate) return false;
        } else if (!task.dueDate) {
          return false;
        } else {
          const d = new Date(task.dueDate);
          if (dueFilter === 'today' && !isToday(d)) return false;
          if (dueFilter === 'week' && !isThisWeek(d)) return false;
          if (dueFilter === 'overdue' && (!isPast(d) || task.status === 'done')) return false;
        }
      }

      return true;
    });
  }, [visibleTasks, searchQuery, priorityFilter, statusFilter, dueFilter]);

  // Priority sorting helper
  const priorityOrder: Record<Priority, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (sortBy === 'priority') {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (sortBy === 'due_date') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'created_at') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }, [filteredTasks, sortBy]);

  // Group sorted tasks by project
  const tasksByProject = useMemo(() => {
    const groups = new Map<string, Task[]>();

    sortedTasks.forEach(task => {
      const pId = task.projectId || 'none';
      const list = groups.get(pId) || [];
      list.push(task);
      groups.set(pId, list);
    });

    return groups;
  }, [sortedTasks]);

  // Handle Quick Add Task with NLP
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    const parsed = parseTaskInput(quickInput);
    const newTask: Task = {
      id: `task-${uuidv4()}`,
      title: parsed.title || quickInput,
      description: '',
      status: 'todo',
      priority: parsed.priority || 'P2',
      owner: currentOwner || 'david',
      visibility: parsed.visibility || 'private',
      projectId: quickProject !== 'none' ? quickProject : undefined,
      subtaskIds: [],
      tags: parsed.tags || [],
      category: 'General',
      createdAt: new Date().toISOString(),
      dueDate: parsed.dueDate,
      estimatedMinutes: parsed.estimatedMinutes || 30,
      actualMinutes: 0,
      pageContent: [],
      wikiLinks: [],
    };

    addTask(newTask);
    setQuickInput('');
  };

  // Helper formatting for Due Date
  const formatDueDate = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const d = new Date(dueDateStr);
    if (isNaN(d.getTime())) return null;

    let text = format(d, 'd MMM', { locale: es });
    let isUrgent = false;

    if (isToday(d)) {
      text = 'Hoy';
      isUrgent = true;
    } else if (isTomorrow(d)) {
      text = 'Mañana';
    } else if (isYesterday(d)) {
      text = 'Ayer';
      isUrgent = true;
    }

    return { text, isUrgent };
  };

  // Render Delivery Badge
  const renderDeliveryBadge = (task: Task) => {
    const status = getDeliveryStatus(task);
    if (status === 'on_time') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
          ✔ A tiempo
        </span>
      );
    }
    if (status === 'late') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
          ⚠ Retrasado
        </span>
      );
    }
    if (status === 'overdue') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 whitespace-nowrap animate-pulse">
          ⏰ Vencida
        </span>
      );
    }
    return null;
  };

  // Render Priority Badge
  const renderPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'P1':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-400 border border-red-500/40">
            P1
          </span>
        );
      case 'P2':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
            P2
          </span>
        );
      case 'P3':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">
            P3
          </span>
        );
      case 'P4':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-500/20 text-slate-400 border border-slate-500/40">
            P4
          </span>
        );
    }
  };

  // Render Time Comparison Bar
  const renderTimeBar = (task: Task) => {
    const est = task.estimatedMinutes || 0;
    const act = task.actualMinutes || 0;
    if (est === 0 && act === 0) return null;

    const percent = est > 0 ? Math.min(100, Math.round((act / est) * 100)) : 100;
    const isOver = est > 0 && act > est;

    return (
      <div className="flex items-center gap-1.5 min-w-[70px] max-w-[90px]" title={`Tiempo: ${act}m real / ${est}m estimado`}>
        <div className="flex-1 h-1.5 bg-nexus-surface-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isOver ? 'bg-red-400' : percent === 100 ? 'bg-emerald-400' : 'bg-indigo-400'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-[10px] text-nexus-text-muted whitespace-nowrap font-mono">
          {act}m{est > 0 ? `/${est}m` : ''}
        </span>
      </div>
    );
  };

  // Render Task Row
  const renderTaskRow = (task: Task, isSubtaskItem = false) => {
    const subtasks = subtasksByParent.get(task.id) || [];
    const hasSubtasks = subtasks.length > 0;
    const isCollapsed = collapsedSubtasks[task.id];
    const dueDateInfo = formatDueDate(task.dueDate);
    const completedSubtasks = subtasks.filter(s => s.status === 'done').length;

    return (
      <div key={task.id} className="group/row">
        <div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 ${
            isSubtaskItem
              ? 'ml-7 bg-nexus-surface/60 border-nexus-border/60 hover:bg-nexus-surface hover:border-nexus-border'
              : 'bg-nexus-surface-2/70 border-nexus-border hover:bg-nexus-surface-2 hover:border-nexus-border-hover'
          } ${task.status === 'done' ? 'opacity-60' : ''}`}
        >
          {/* Subtask arrow indicator if child */}
          {isSubtaskItem && (
            <CornerDownRight className="w-3.5 h-3.5 text-nexus-text-muted shrink-0 -ml-1" />
          )}

          {/* Subtask expander button if parent */}
          {!isSubtaskItem && hasSubtasks && (
            <button
              onClick={e => toggleSubtaskCollapse(task.id, e)}
              className="p-0.5 -ml-1 text-nexus-text-muted hover:text-nexus-text transition-colors rounded"
              title={isCollapsed ? 'Ver subtareas' : 'Ocultar subtareas'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Checkbox */}
          <button
            onClick={() => toggleTaskStatus(task.id)}
            className="text-nexus-text-muted hover:text-emerald-400 transition-colors shrink-0"
            title={task.status === 'done' ? 'Marcar como pendiente' : 'Marcar como completada'}
          >
            {task.status === 'done' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>

          {/* Priority */}
          <div className="shrink-0">{renderPriorityBadge(task.priority)}</div>

          {/* Title & Click to open inspector */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <button
              onClick={() => setSelectedTaskId(task.id)}
              className={`text-sm text-left truncate hover:text-indigo-400 transition-colors cursor-pointer font-medium ${
                task.status === 'done'
                  ? 'line-through text-nexus-text-muted'
                  : 'text-nexus-text'
              }`}
            >
              {task.title}
            </button>

            {/* Visibility pill */}
            {task.visibility === 'couple' ? (
              <span className="shrink-0 text-[10px] text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Heart className="w-2.5 h-2.5" /> Pareja
              </span>
            ) : (
              <span className="shrink-0 text-[10px] text-nexus-text-muted/70 bg-nexus-surface-3/50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> Privado
              </span>
            )}

            {/* Subtask count badge */}
            {!isSubtaskItem && hasSubtasks && (
              <span className="shrink-0 text-[10px] text-nexus-text-secondary bg-nexus-surface-3 px-1.5 py-0.5 rounded-full font-mono">
                {completedSubtasks}/{subtasks.length} subtareas
              </span>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="hidden md:flex items-center gap-1 shrink-0 max-w-[180px] overflow-hidden">
              {task.tags.slice(0, 2).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[11px] rounded bg-nexus-surface-3/80 text-nexus-text-secondary border border-nexus-border/50 truncate"
                >
                  #{tag}
                </span>
              ))}
              {task.tags.length > 2 && (
                <span className="text-[10px] text-nexus-text-muted">+{task.tags.length - 2}</span>
              )}
            </div>
          )}

          {/* Time bar */}
          <div className="hidden sm:block shrink-0">{renderTimeBar(task)}</div>

          {/* Due Date */}
          {dueDateInfo && (
            <div
              className={`shrink-0 flex items-center gap-1 text-[11px] font-mono ${
                dueDateInfo.isUrgent ? 'text-amber-400' : 'text-nexus-text-secondary'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{dueDateInfo.text}</span>
            </div>
          )}

          {/* Delivery Status Badge */}
          <div className="shrink-0">{renderDeliveryBadge(task)}</div>

          {/* Timer Start Quick Action */}
          <button
            onClick={e => {
              e.stopPropagation();
              startTimer(task.id, 'task', task.title);
            }}
            className="opacity-0 group-hover/row:opacity-100 p-1 text-nexus-text-muted hover:text-indigo-400 hover:bg-nexus-surface-3 rounded transition-all shrink-0"
            title="Iniciar temporizador en esta tarea"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nested Subtasks */}
        {!isSubtaskItem && hasSubtasks && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {subtasks.map(subtask => renderTaskRow(subtask, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-nexus-bg overflow-hidden text-nexus-text">
      {/* Top Header & Search Bar */}
      <div className="p-4 border-b border-nexus-border bg-nexus-surface/50 backdrop-blur-md shrink-0 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-nexus-text flex items-center gap-2">
              <span>📥 Inbox de Tareas</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-nexus-surface-3 text-nexus-text-secondary font-mono">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'tarea' : 'tareas'}
              </span>
            </h1>
            <p className="text-xs text-nexus-text-muted">
              Organización centralizada agrupada por proyectos con soporte para subtareas y auditoría
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                showFilters || priorityFilter !== 'all' || statusFilter !== 'all' || dueFilter !== 'all'
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-nexus-surface-2 text-nexus-text-secondary border-nexus-border hover:bg-nexus-surface-3'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros</span>
              {(priorityFilter !== 'all' || statusFilter !== 'all' || dueFilter !== 'all') && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-nexus-surface-2 px-2.5 py-1 rounded-lg border border-nexus-border">
              <ArrowUpDown className="w-3.5 h-3.5 text-nexus-text-muted" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                aria-label="Ordenar tareas por"
                className="bg-transparent text-xs text-nexus-text outline-none cursor-pointer"
              >
                <option value="priority" className="bg-nexus-surface">Prioridad (P1-P4)</option>
                <option value="due_date" className="bg-nexus-surface">Fecha de Vencimiento</option>
                <option value="alphabetical" className="bg-nexus-surface">Alfabético (A-Z)</option>
                <option value="created_at" className="bg-nexus-surface">Más Recientes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Add NLP input */}
        <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={quickInput}
              onChange={e => setQuickInput(e.target.value)}
              placeholder="Nueva tarea... ej: Optimizar query mañana 18:00 !P1 #backend ~60m"
              className="w-full bg-nexus-surface-2 text-sm text-nexus-text pl-9 pr-4 py-2 rounded-lg border border-nexus-border focus:border-indigo-500 focus:outline-none transition-colors"
            />
            <Sparkles className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={quickProject}
              onChange={e => setQuickProject(e.target.value)}
              aria-label="Asignar proyecto a la nueva tarea"
              className="bg-nexus-surface-2 text-xs text-nexus-text-secondary px-3 py-2 rounded-lg border border-nexus-border outline-none"
            >
              <option value="none" className="bg-nexus-surface">Sin Proyecto</option>
              {visibleProjects.map(p => (
                <option key={p.id} value={p.id} className="bg-nexus-surface">
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={!quickInput.trim()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </button>
          </div>
        </form>

        {/* Search & Extended Filter Row */}
        {showFilters && (
          <div className="pt-2 border-t border-nexus-border/60 flex flex-wrap items-center gap-2 text-xs">
            {/* Search filter input */}
            <div className="relative min-w-[200px] flex-1">
              <Search className="w-3.5 h-3.5 text-nexus-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por título o tag..."
                className="w-full bg-nexus-surface text-xs text-nexus-text pl-8 pr-3 py-1.5 rounded-md border border-nexus-border focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Priority filter */}
            <div className="flex items-center gap-1 bg-nexus-surface px-2 py-1 rounded-md border border-nexus-border">
              <span className="text-nexus-text-muted">Prioridad:</span>
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value as PriorityFilter)}
                aria-label="Filtrar por prioridad"
                className="bg-transparent text-nexus-text outline-none cursor-pointer"
              >
                <option value="all" className="bg-nexus-surface">Todas</option>
                <option value="P1" className="bg-nexus-surface">🔥 P1</option>
                <option value="P2" className="bg-nexus-surface">⚡ P2</option>
                <option value="P3" className="bg-nexus-surface">🔷 P3</option>
                <option value="P4" className="bg-nexus-surface">📦 P4</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1 bg-nexus-surface px-2 py-1 rounded-md border border-nexus-border">
              <span className="text-nexus-text-muted">Estado:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                aria-label="Filtrar por estado"
                className="bg-transparent text-nexus-text outline-none cursor-pointer"
              >
                <option value="all" className="bg-nexus-surface">Todos</option>
                <option value="pending" className="bg-nexus-surface">Pendientes</option>
                <option value="todo" className="bg-nexus-surface">Por hacer</option>
                <option value="in_progress" className="bg-nexus-surface">En curso</option>
                <option value="blocked" className="bg-nexus-surface">Bloqueado</option>
                <option value="done" className="bg-nexus-surface">Completado</option>
              </select>
            </div>

            {/* Due date filter */}
            <div className="flex items-center gap-1 bg-nexus-surface px-2 py-1 rounded-md border border-nexus-border">
              <span className="text-nexus-text-muted">Vencimiento:</span>
              <select
                value={dueFilter}
                onChange={e => setDueFilter(e.target.value as DueFilter)}
                aria-label="Filtrar por vencimiento"
                className="bg-transparent text-nexus-text outline-none cursor-pointer"
              >
                <option value="all" className="bg-nexus-surface">Todos</option>
                <option value="today" className="bg-nexus-surface">Hoy</option>
                <option value="week" className="bg-nexus-surface">Esta semana</option>
                <option value="overdue" className="bg-nexus-surface">Vencidas</option>
                <option value="no_due" className="bg-nexus-surface">Sin fecha</option>
              </select>
            </div>

            {/* Reset Filters button */}
            {(priorityFilter !== 'all' || statusFilter !== 'all' || dueFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setPriorityFilter('all');
                  setStatusFilter('all');
                  setDueFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Task List with Project Groups */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-nexus-border rounded-xl bg-nexus-surface/30">
            <Layers className="w-10 h-10 text-nexus-text-muted mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-semibold text-nexus-text">No hay tareas que mostrar</h3>
            <p className="text-xs text-nexus-text-muted mt-1 max-w-sm mx-auto">
              {searchQuery || priorityFilter !== 'all' || statusFilter !== 'all'
                ? 'Prueba modificando tus filtros o término de búsqueda.'
                : 'Crea tu primera tarea arriba usando lenguaje natural.'}
            </p>
          </div>
        ) : (
          <>
            {/* Project Sections */}
            {visibleProjects.map(project => {
              const projectTasks = tasksByProject.get(project.id) || [];
              if (projectTasks.length === 0) return null;
              const isCollapsed = collapsedProjects[project.id];

              return (
                <div key={project.id} className="space-y-2">
                  {/* Section Header */}
                  <div
                    onClick={() => toggleProjectCollapse(project.id)}
                    className="flex items-center justify-between px-2 py-1.5 rounded cursor-pointer hover:bg-nexus-surface-2/40 transition-colors group select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-nexus-text-muted group-hover:text-nexus-text transition-colors">
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                      <span className="text-base">{project.emoji}</span>
                      <h2 className="text-sm font-semibold text-nexus-text tracking-wide">
                        {project.name}
                      </h2>
                      <span className="text-xs px-2 py-0.2 rounded-full bg-nexus-surface-3 text-nexus-text-muted font-mono">
                        {projectTasks.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {project.visibility === 'couple' && (
                        <span className="text-[10px] text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5" /> Pareja
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tasks in this project */}
                  {!isCollapsed && (
                    <div className="space-y-1.5 pl-2">
                      {projectTasks.map(task => renderTaskRow(task))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Sin Proyecto Section */}
            {(() => {
              const ungroupedTasks = tasksByProject.get('none') || [];
              if (ungroupedTasks.length === 0) return null;
              const isCollapsed = collapsedProjects['none'];

              return (
                <div className="space-y-2">
                  <div
                    onClick={() => toggleProjectCollapse('none')}
                    className="flex items-center justify-between px-2 py-1.5 rounded cursor-pointer hover:bg-nexus-surface-2/40 transition-colors group select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-nexus-text-muted group-hover:text-nexus-text transition-colors">
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                      <FolderMinus className="w-4 h-4 text-nexus-text-muted" />
                      <h2 className="text-sm font-semibold text-nexus-text tracking-wide">
                        Sin Proyecto
                      </h2>
                      <span className="text-xs px-2 py-0.2 rounded-full bg-nexus-surface-3 text-nexus-text-muted font-mono">
                        {ungroupedTasks.length}
                      </span>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="space-y-1.5 pl-2">
                      {ungroupedTasks.map(task => renderTaskRow(task))}
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
