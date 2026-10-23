import React, { useState, useMemo } from 'react';
import {
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  User,
  Heart,
  Lock,
  Flame,
  CheckSquare,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { useNexusStore } from '../../store/nexusStore';
import type { Task, TaskStatus, Priority } from '../../types/nexus';
import { getDeliveryStatus } from '../../types/nexus';

interface ColumnDef {
  status: TaskStatus;
  title: string;
  emoji: string;
  badgeBg: string;
  borderColor: string;
  glowColor: string;
}

const COLUMNS: ColumnDef[] = [
  {
    status: 'todo',
    title: 'Por Hacer',
    emoji: '📋',
    badgeBg: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    borderColor: 'border-slate-800',
    glowColor: 'group-hover:border-slate-600',
  },
  {
    status: 'in_progress',
    title: 'En Curso',
    emoji: '⚡',
    badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    borderColor: 'border-indigo-950/50',
    glowColor: 'group-hover:border-indigo-500/40',
  },
  {
    status: 'blocked',
    title: 'Bloqueado',
    emoji: '🛑',
    badgeBg: 'bg-red-500/15 text-red-300 border-red-500/30',
    borderColor: 'border-red-950/50',
    glowColor: 'group-hover:border-red-500/40',
  },
  {
    status: 'done',
    title: 'Completado',
    emoji: '✅',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    borderColor: 'border-emerald-950/50',
    glowColor: 'group-hover:border-emerald-500/40',
  },
];

export default function KanbanView() {
  const {
    getVisibleTasks,
    getVisibleProjects,
    setSelectedTaskId,
    updateTask,
    addTask,
    currentOwner,
    accounts,
  } = useNexusStore();

  const visibleTasks = getVisibleTasks();
  const visibleProjects = getVisibleProjects();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeNewTaskCol, setActiveNewTaskCol] = useState<TaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Project lookup map
  const projectMap = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string }>();
    visibleProjects.forEach(p => map.set(p.id, { name: p.name, emoji: p.emoji }));
    return map;
  }, [visibleProjects]);

  // Subtasks map for progress calculation
  const subtasksMap = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    visibleTasks.forEach(task => {
      if (task.parentTaskId) {
        const current = map.get(task.parentTaskId) || { total: 0, done: 0 };
        current.total += 1;
        if (task.status === 'done') current.done += 1;
        map.set(task.parentTaskId, current);
      }
    });
    return map;
  }, [visibleTasks]);

  // Filter top-level tasks
  const filteredTasks = useMemo(() => {
    return visibleTasks.filter(task => {
      // Show top-level tasks in board
      if (task.parentTaskId) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesTag = task.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesTag) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

      // Project filter
      if (projectFilter !== 'all') {
        if (projectFilter === 'none') {
          if (task.projectId) return false;
        } else if (task.projectId !== projectFilter) {
          return false;
        }
      }

      return true;
    });
  }, [visibleTasks, searchQuery, priorityFilter, projectFilter]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      blocked: [],
      done: [],
    };

    filteredTasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }, [filteredTasks]);

  // Move task status
  const handleMoveStatus = (taskId: string, newStatus: TaskStatus) => {
    const isDone = newStatus === 'done';
    updateTask(taskId, {
      status: newStatus,
      completedAt: isDone ? new Date().toISOString() : undefined,
    });
  };

  // Next status progression helper
  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    switch (current) {
      case 'todo': return 'in_progress';
      case 'in_progress': return 'done';
      case 'blocked': return 'in_progress';
      case 'done': return null;
    }
  };

  // Previous status regression helper
  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    switch (current) {
      case 'todo': return null;
      case 'in_progress': return 'todo';
      case 'blocked': return 'in_progress';
      case 'done': return 'in_progress';
    }
  };

  // Drag and drop handlers (HTML5 native for convenience)
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      handleMoveStatus(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  // Quick create in column
  const handleCreateInColumn = (status: TaskStatus) => {
    if (!newTaskTitle.trim()) {
      setActiveNewTaskCol(null);
      return;
    }

    const newTask: Task = {
      id: `task-${uuidv4()}`,
      title: newTaskTitle.trim(),
      description: '',
      status,
      priority: 'P2',
      owner: currentOwner || 'david',
      visibility: 'private',
      projectId: projectFilter !== 'all' && projectFilter !== 'none' ? projectFilter : undefined,
      subtaskIds: [],
      tags: [],
      category: 'General',
      createdAt: new Date().toISOString(),
      actualMinutes: 0,
      pageContent: [],
      wikiLinks: [],
    };

    addTask(newTask);
    setNewTaskTitle('');
    setActiveNewTaskCol(null);
  };

  // Render priority dot
  const renderPriorityDot = (p: Priority) => {
    switch (p) {
      case 'P1': return <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" title="Prioridad P1" />;
      case 'P2': return <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Prioridad P2" />;
      case 'P3': return <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" title="Prioridad P3" />;
      case 'P4': return <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" title="Prioridad P4" />;
    }
  };

  // Render Delivery Badge
  const renderDeliveryBadge = (task: Task) => {
    const status = getDeliveryStatus(task);
    if (status === 'on_time') {
      return (
        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
          ✔ A tiempo
        </span>
      );
    }
    if (status === 'late') {
      return (
        <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
          ⚠ Retrasado
        </span>
      );
    }
    if (status === 'overdue') {
      return (
        <span className="text-[10px] font-medium text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/30">
          ⏰ Vencida
        </span>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col bg-nexus-bg overflow-hidden text-nexus-text">
      {/* Top Header & Filters */}
      <div className="p-4 border-b border-nexus-border bg-nexus-surface/50 backdrop-blur-md shrink-0 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-nexus-text flex items-center gap-2">
              <span>📊 Tablero Kanban</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-nexus-surface-3 text-nexus-text-secondary font-mono">
                {filteredTasks.length} tareas
              </span>
            </h1>
            <p className="text-xs text-nexus-text-muted">
              Flujo visual de trabajo por columnas con soporte de arrastre o cambio rápido de estado
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-nexus-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filtrar..."
                className="w-36 sm:w-48 bg-nexus-surface-2 text-xs text-nexus-text pl-8 pr-3 py-1.5 rounded-lg border border-nexus-border focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as 'all' | Priority)}
              aria-label="Filtrar por prioridad"
              className="bg-nexus-surface-2 text-xs text-nexus-text px-2.5 py-1.5 rounded-lg border border-nexus-border outline-none cursor-pointer"
            >
              <option value="all" className="bg-nexus-surface">Prioridad: Todas</option>
              <option value="P1" className="bg-nexus-surface">🔥 P1</option>
              <option value="P2" className="bg-nexus-surface">⚡ P2</option>
              <option value="P3" className="bg-nexus-surface">🔷 P3</option>
              <option value="P4" className="bg-nexus-surface">📦 P4</option>
            </select>

            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              aria-label="Filtrar por proyecto"
              className="bg-nexus-surface-2 text-xs text-nexus-text px-2.5 py-1.5 rounded-lg border border-nexus-border outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="all" className="bg-nexus-surface">Proyectos: Todos</option>
              <option value="none" className="bg-nexus-surface">Sin Proyecto</option>
              {visibleProjects.map(p => (
                <option key={p.id} value={p.id} className="bg-nexus-surface">
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-[900px]">
          {COLUMNS.map(col => {
            const tasksInCol = tasksByStatus[col.status] || [];
            const isAddingHere = activeNewTaskCol === col.status;

            return (
              <div
                key={col.status}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, col.status)}
                className={`flex-1 flex flex-col bg-nexus-surface/40 rounded-xl border ${col.borderColor} min-w-[260px] max-w-[340px] overflow-hidden transition-colors ${
                  draggedTaskId ? 'border-dashed border-indigo-500/50 bg-indigo-500/5' : ''
                }`}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-nexus-border bg-nexus-surface-2/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{col.emoji}</span>
                    <h2 className="text-sm font-semibold text-nexus-text">{col.title}</h2>
                    <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border ${col.badgeBg}`}>
                      {tasksInCol.length}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveNewTaskCol(isAddingHere ? null : col.status);
                      setNewTaskTitle('');
                    }}
                    className="p-1 text-nexus-text-muted hover:text-indigo-400 hover:bg-nexus-surface-3 rounded transition-colors cursor-pointer"
                    title={`Agregar tarea a ${col.title}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Add Form in Column */}
                {isAddingHere && (
                  <div className="p-2 border-b border-nexus-border bg-nexus-surface-2/90 animate-fade-in">
                    <input
                      type="text"
                      autoFocus
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleCreateInColumn(col.status);
                        if (e.key === 'Escape') setActiveNewTaskCol(null);
                      }}
                      placeholder="Título de la tarea + Enter..."
                      className="w-full text-xs bg-nexus-surface text-nexus-text px-2.5 py-1.5 rounded border border-nexus-border focus:border-indigo-500 outline-none"
                    />
                    <div className="flex items-center justify-end gap-1.5 mt-2">
                      <button
                        onClick={() => setActiveNewTaskCol(null)}
                        className="text-[11px] px-2 py-1 text-nexus-text-muted hover:text-nexus-text"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleCreateInColumn(col.status)}
                        className="text-[11px] px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}

                {/* Column Task Cards */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                  {tasksInCol.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center border border-dashed border-nexus-border/60 rounded-lg text-nexus-text-muted text-xs">
                      <span>Sin tareas</span>
                    </div>
                  ) : (
                    tasksInCol.map(task => {
                      const subtaskInfo = subtasksMap.get(task.id);
                      const project = task.projectId ? projectMap.get(task.projectId) : null;
                      const prevStatus = getPrevStatus(task.status);
                      const nextStatus = getNextStatus(task.status);

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={e => handleDragStart(e, task.id)}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="group relative bg-nexus-surface-2 rounded-lg border border-nexus-border hover:border-nexus-border-hover p-3 space-y-2 cursor-pointer shadow-sm hover:shadow-md transition-all select-none hover:-translate-y-0.5"
                        >
                          {/* Card Header: Priority dot, Title, Assignee avatar */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <div className="pt-1">{renderPriorityDot(task.priority)}</div>
                              <h3
                                className={`text-xs font-medium text-nexus-text leading-snug line-clamp-2 hover:text-indigo-400 transition-colors ${
                                  task.status === 'done' ? 'line-through text-nexus-text-muted' : ''
                                }`}
                              >
                                {task.title}
                              </h3>
                            </div>

                            {/* Assignee Avatar / Visibility */}
                            <div className="shrink-0 flex items-center gap-1">
                              {task.visibility === 'couple' ? (
                                <span
                                  className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-[10px]"
                                  title="Tarea compartida de pareja"
                                >
                                  💑
                                </span>
                              ) : (
                                <span
                                  className="w-5 h-5 rounded-full bg-nexus-surface-3 text-nexus-text-muted flex items-center justify-center text-[11px]"
                                  title={`Asignada a ${task.owner}`}
                                >
                                  {accounts.find(a => a.owner === task.owner)?.avatar || (task.owner === 'david' ? '👨‍💻' : task.owner === 'cami' ? '👩‍🎨' : '👤')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Project & Subtasks Row */}
                          {(project || subtaskInfo) && (
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                              {project && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-nexus-surface-3/80 text-nexus-text-secondary border border-nexus-border/40 font-medium">
                                  <span>{project.emoji}</span>
                                  <span className="truncate max-w-[120px]">{project.name}</span>
                                </span>
                              )}

                              {subtaskInfo && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-nexus-surface-3/50 text-nexus-text-muted font-mono text-[10px]">
                                  <CheckSquare className="w-2.5 h-2.5" />
                                  <span>{subtaskInfo.done}/{subtaskInfo.total}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Tags */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.tags.map(t => (
                                <span
                                  key={t}
                                  className="text-[10px] px-1.5 py-0.2 rounded bg-nexus-surface-3 text-nexus-text-muted"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Footer: Due date + Delivery Badge + Move intent buttons */}
                          <div className="pt-1.5 border-t border-nexus-border/40 flex items-center justify-between text-[11px] text-nexus-text-secondary">
                            <div className="flex items-center gap-1.5">
                              {task.dueDate && (
                                <div className="flex items-center gap-1 font-mono text-[10px]">
                                  <Calendar className="w-3 h-3 text-nexus-text-muted" />
                                  <span>{format(new Date(task.dueDate), 'd MMM', { locale: es })}</span>
                                </div>
                              )}
                              {renderDeliveryBadge(task)}
                            </div>

                            {/* Drag intent status progression buttons */}
                            <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                              {prevStatus && (
                                <button
                                  onClick={() => handleMoveStatus(task.id, prevStatus)}
                                  className="p-1 rounded hover:bg-nexus-surface-3 text-nexus-text-muted hover:text-nexus-text transition-colors"
                                  title={`Mover atrás a ${prevStatus}`}
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                              )}

                              {/* Quick toggle to Done or Blocked */}
                              {task.status !== 'blocked' && task.status !== 'done' && (
                                <button
                                  onClick={() => handleMoveStatus(task.id, 'blocked')}
                                  className="px-1 text-[9px] rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                  title="Bloquear tarea"
                                >
                                  Bloquear
                                </button>
                              )}

                              {nextStatus && (
                                <button
                                  onClick={() => handleMoveStatus(task.id, nextStatus)}
                                  className="p-1 rounded hover:bg-nexus-surface-3 text-nexus-text-muted hover:text-indigo-400 transition-colors"
                                  title={`Avanzar a ${nextStatus}`}
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
