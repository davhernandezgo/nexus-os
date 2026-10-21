import React, { useState, useMemo } from 'react';
import {
  Flame,
  ClipboardList,
  Zap,
  Archive,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Layers,
  Heart,
  Lock
} from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { useNexusStore } from '../../store/nexusStore';
import type { Task, Priority } from '../../types/nexus';
import { getDeliveryStatus } from '../../types/nexus';

interface QuadrantConfig {
  priority: Priority;
  title: string;
  subtitle: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  borderColor: string;
  headerBg: string;
  badgeBg: string;
  accentText: string;
}

const QUADRANTS: QuadrantConfig[] = [
  {
    priority: 'P1',
    title: 'Urgente & Importante',
    tagline: 'Hacer Primero',
    subtitle: 'Crisis, deadlines inminentes, bugs críticos',
    icon: Flame,
    borderColor: 'border-red-500/50 hover:border-red-500/80',
    headerBg: 'bg-red-500/10 border-red-500/20',
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/30',
    accentText: 'text-red-400',
  },
  {
    priority: 'P2',
    title: 'Importante, No Urgente',
    tagline: 'Programar & Diseñar',
    subtitle: 'Estrategia, arquitectura, hábitos y aprendizaje',
    icon: ClipboardList,
    borderColor: 'border-amber-500/50 hover:border-amber-500/80',
    headerBg: 'bg-amber-500/10 border-amber-500/20',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    accentText: 'text-amber-400',
  },
  {
    priority: 'P3',
    title: 'Urgente, No Importante',
    tagline: 'Delegar / Automatizar',
    subtitle: 'Interrupciones, tareas rutinarias, pedidos puntuales',
    icon: Zap,
    borderColor: 'border-blue-500/50 hover:border-blue-500/80',
    headerBg: 'bg-blue-500/10 border-blue-500/20',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    accentText: 'text-blue-400',
  },
  {
    priority: 'P4',
    title: 'Ni Urgente, Ni Importante',
    tagline: 'Eliminar / Backlog',
    subtitle: 'Distracciones, ideas para revisar después',
    icon: Archive,
    borderColor: 'border-slate-500/40 hover:border-slate-500/70',
    headerBg: 'bg-slate-500/10 border-slate-500/20',
    badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    accentText: 'text-slate-400',
  },
];

export default function EisenhowerView() {
  const {
    getVisibleTasks,
    getVisibleProjects,
    setSelectedTaskId,
    toggleTaskStatus,
    updateTask,
    addTask,
    currentOwner,
  } = useNexusStore();

  const visibleTasks = getVisibleTasks();
  const visibleProjects = getVisibleProjects();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [hideCompleted, setHideCompleted] = useState(true);
  const [activeNewQuadrant, setActiveNewQuadrant] = useState<Priority | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Project map
  const projectMap = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string }>();
    visibleProjects.forEach(p => map.set(p.id, { name: p.name, emoji: p.emoji }));
    return map;
  }, [visibleProjects]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return visibleTasks.filter(task => {
      // Show top-level tasks
      if (task.parentTaskId) return false;

      if (hideCompleted && task.status === 'done') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesTag = task.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesTag) return false;
      }

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
  }, [visibleTasks, hideCompleted, searchQuery, projectFilter]);

  // Group by priority
  const tasksByPriority = useMemo(() => {
    const map: Record<Priority, Task[]> = {
      P1: [],
      P2: [],
      P3: [],
      P4: [],
    };
    filteredTasks.forEach(task => {
      if (map[task.priority]) {
        map[task.priority].push(task);
      }
    });
    return map;
  }, [filteredTasks]);

  // Focus score calculation (% in P2)
  const focusStats = useMemo(() => {
    const total = filteredTasks.length;
    if (total === 0) return { p2Percent: 0, total };
    const p2Count = tasksByPriority.P2.length;
    return {
      p2Percent: Math.round((p2Count / total) * 100),
      total,
    };
  }, [filteredTasks, tasksByPriority]);

  // Handle Quick Add to Quadrant
  const handleAddInQuadrant = (priority: Priority) => {
    if (!newTitle.trim()) {
      setActiveNewQuadrant(null);
      return;
    }

    const newTask: Task = {
      id: `task-${uuidv4()}`,
      title: newTitle.trim(),
      description: '',
      status: 'todo',
      priority,
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
    setNewTitle('');
    setActiveNewQuadrant(null);
  };

  // Change Task Priority (move to another quadrant)
  const handleChangePriority = (taskId: string, newPriority: Priority, e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask(taskId, { priority: newPriority });
  };

  return (
    <div className="h-full flex flex-col bg-nexus-bg overflow-hidden text-nexus-text">
      {/* Top Header */}
      <div className="p-4 border-b border-nexus-border bg-nexus-surface/50 backdrop-blur-md shrink-0 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-nexus-text flex items-center gap-2">
              <span>🎯 Matriz de Eisenhower</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-nexus-surface-3 text-nexus-text-secondary font-mono">
                {focusStats.total} tareas activas
              </span>
            </h1>
            <p className="text-xs text-nexus-text-muted">
              Priorización estratégica por urgencia e importancia (Cuadrante 2 = Máximo Rendimiento)
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-nexus-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar tareas..."
                className="w-36 sm:w-44 bg-nexus-surface-2 text-xs text-nexus-text pl-8 pr-3 py-1.5 rounded-lg border border-nexus-border focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              aria-label="Filtrar por proyecto"
              className="bg-nexus-surface-2 text-xs text-nexus-text px-2.5 py-1.5 rounded-lg border border-nexus-border outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="all" className="bg-nexus-surface">Todos los proyectos</option>
              <option value="none" className="bg-nexus-surface">Sin proyecto</option>
              {visibleProjects.map(p => (
                <option key={p.id} value={p.id} className="bg-nexus-surface">
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>

            {/* Hide/Show completed */}
            <button
              onClick={() => setHideCompleted(!hideCompleted)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                hideCompleted
                  ? 'bg-nexus-surface-2 text-nexus-text-secondary border-nexus-border hover:bg-nexus-surface-3'
                  : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {hideCompleted ? 'Ocultar completadas' : 'Ver completadas'}
            </button>
          </div>
        </div>

        {/* Eisenhower Metric Strip */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-nexus-surface-2/60 border border-nexus-border text-xs">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-semibold">Índice de Foco P2:</span>
            <span className="font-mono text-nexus-text font-bold">{focusStats.p2Percent}%</span>
            <span className="text-nexus-text-muted hidden sm:inline">
              (El tiempo en P2 previene crisis en P1)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-red-400">P1: {tasksByPriority.P1.length}</span>
            <span className="text-amber-400">P2: {tasksByPriority.P2.length}</span>
            <span className="text-blue-400">P3: {tasksByPriority.P3.length}</span>
            <span className="text-slate-400">P4: {tasksByPriority.P4.length}</span>
          </div>
        </div>
      </div>

      {/* 2x2 Grid of Quadrants */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-[500px]">
          {QUADRANTS.map(q => {
            const Icon = q.icon;
            const tasks = tasksByPriority[q.priority] || [];
            const isAdding = activeNewQuadrant === q.priority;

            return (
              <div
                key={q.priority}
                className={`flex flex-col rounded-xl border bg-nexus-surface/60 backdrop-blur-sm overflow-hidden transition-all duration-200 ${q.borderColor}`}
              >
                {/* Quadrant Header */}
                <div className={`p-3 border-b flex items-start justify-between ${q.headerBg}`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`p-1.5 rounded-lg bg-nexus-surface/80 ${q.accentText}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border font-mono ${q.badgeBg}`}>
                          {q.priority}
                        </span>
                        <h2 className="text-sm font-semibold text-nexus-text">{q.title}</h2>
                      </div>
                      <p className="text-[11px] text-nexus-text-muted mt-0.5">
                        <span className={`font-semibold ${q.accentText}`}>{q.tagline}</span> — {q.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-nexus-surface-2 text-nexus-text-secondary border border-nexus-border">
                      {tasks.length}
                    </span>
                    <button
                      onClick={() => {
                        setActiveNewQuadrant(isAdding ? null : q.priority);
                        setNewTitle('');
                      }}
                      className="p-1 rounded text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors cursor-pointer"
                      title={`Agregar tarea ${q.priority}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Quick Add */}
                {isAdding && (
                  <div className="p-2 border-b border-nexus-border bg-nexus-surface-2/95 animate-fade-in">
                    <input
                      type="text"
                      autoFocus
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddInQuadrant(q.priority);
                        if (e.key === 'Escape') setActiveNewQuadrant(null);
                      }}
                      placeholder={`Nueva tarea para ${q.tagline}...`}
                      className="w-full text-xs bg-nexus-surface text-nexus-text px-2.5 py-1.5 rounded border border-nexus-border focus:border-indigo-500 outline-none"
                    />
                    <div className="flex items-center justify-end gap-1.5 mt-2">
                      <button
                        onClick={() => setActiveNewQuadrant(null)}
                        className="text-[11px] px-2 py-1 text-nexus-text-muted hover:text-nexus-text cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleAddInQuadrant(q.priority)}
                        className="text-[11px] px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded cursor-pointer"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                )}

                {/* Quadrant Tasks List */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                  {tasks.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center border border-dashed border-nexus-border/50 rounded-lg text-nexus-text-muted text-xs">
                      <span>No hay tareas en este cuadrante</span>
                    </div>
                  ) : (
                    tasks.map(task => {
                      const project = task.projectId ? projectMap.get(task.projectId) : null;
                      const statusBadge = getDeliveryStatus(task);

                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="group relative bg-nexus-surface-2/80 rounded-lg border border-nexus-border/80 hover:border-nexus-border-hover p-2.5 space-y-1.5 cursor-pointer hover:bg-nexus-surface-2 transition-all shadow-sm select-none"
                        >
                          <div className="flex items-start justify-between gap-2">
                            {/* Checkbox + Title */}
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleTaskStatus(task.id);
                                }}
                                className="mt-0.5 text-nexus-text-muted hover:text-emerald-400 transition-colors shrink-0"
                              >
                                {task.status === 'done' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <h3
                                className={`text-xs font-medium text-nexus-text leading-snug line-clamp-2 hover:text-indigo-400 transition-colors ${
                                  task.status === 'done' ? 'line-through text-nexus-text-muted' : ''
                                }`}
                              >
                                {task.title}
                              </h3>
                            </div>

                            {/* Visibility icon */}
                            {task.visibility === 'couple' ? (
                              <span className="shrink-0 text-[10px] text-pink-400">💑</span>
                            ) : (
                              <span className="shrink-0 text-[10px] text-nexus-text-muted/60">
                                <Lock className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>

                          {/* Footer row: Project pill, Due date, Quick priority shift */}
                          <div className="flex items-center justify-between text-[10px] text-nexus-text-secondary pt-1 border-t border-nexus-border/30">
                            <div className="flex items-center gap-1.5 truncate">
                              {project && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-nexus-surface-3 text-nexus-text-muted truncate max-w-[110px]">
                                  <span>{project.emoji}</span>
                                  <span className="truncate">{project.name}</span>
                                </span>
                              )}

                              {task.dueDate && (
                                <span className={`flex items-center gap-0.5 font-mono ${
                                  isPast(new Date(task.dueDate)) && task.status !== 'done'
                                    ? 'text-red-400'
                                    : 'text-nexus-text-muted'
                                }`}>
                                  <Calendar className="w-2.5 h-2.5" />
                                  {format(new Date(task.dueDate), 'd MMM', { locale: es })}
                                </span>
                              )}

                              {statusBadge === 'overdue' && (
                                <span className="text-red-400 font-semibold">⏰ Vencida</span>
                              )}
                            </div>

                            {/* Quick Priority switcher on hover */}
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                              {(['P1', 'P2', 'P3', 'P4'] as Priority[]).map(p => {
                                if (p === task.priority) return null;
                                return (
                                  <button
                                    key={p}
                                    onClick={e => handleChangePriority(task.id, p, e)}
                                    className="px-1 py-0.2 text-[9px] font-mono rounded bg-nexus-surface-3 hover:bg-nexus-surface-2 text-nexus-text-muted hover:text-nexus-text transition-colors"
                                    title={`Mover a ${p}`}
                                  >
                                    →{p}
                                  </button>
                                );
                              })}
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
