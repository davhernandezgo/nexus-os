import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertTriangle,
  Play,
  Tag,
  Filter,
  Search,
  Plus,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import { getDeliveryStatus } from '../../types/nexus';
import type { Priority } from '../../types/nexus';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import CreateTaskModal from '../../components/ui/CreateTaskModal';

const PRIORITY_BADGES: Record<Priority, { label: string; class: string }> = {
  P1: { label: 'P1', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
  P2: { label: 'P2', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  P3: { label: 'P3', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  P4: { label: 'P4', class: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

const InboxView: React.FC = () => {
  const {
    getVisibleTasks,
    toggleTaskStatus,
    setSelectedTaskId,
    getVisibleProjects,
    startTimer,
    timer,
  } = useNexusStore();

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const tasks = getVisibleTasks();
  const projects = getVisibleProjects();

  const filteredTasks = tasks.filter(task => {
    // Hide subtasks from top-level inbox view
    if (task.parentTaskId) return false;

    if (filterStatus === 'pending' && task.status === 'done') return false;
    if (filterStatus === 'done' && task.status !== 'done') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchTags = task.tags.some(t => t.toLowerCase().includes(q));
      return matchTitle || matchTags;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-nexus-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por título o #etiqueta..."
            className="w-full pl-10 pr-4 py-2 bg-nexus-surface-2/70 border border-nexus-border rounded-xl text-sm text-nexus-text placeholder-nexus-text-muted outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-nexus-surface-2 rounded-xl border border-nexus-border">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-nexus-surface-3 text-nexus-text'
                  : 'text-nexus-text-muted hover:text-nexus-text'
              }`}
            >
              Todas ({tasks.filter(t => !t.parentTaskId).length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-nexus-surface-3 text-nexus-text'
                  : 'text-nexus-text-muted hover:text-nexus-text'
              }`}
            >
              Pendientes ({tasks.filter(t => !t.parentTaskId && t.status !== 'done').length})
            </button>
            <button
              onClick={() => setFilterStatus('done')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                filterStatus === 'done'
                  ? 'bg-nexus-surface-3 text-nexus-text'
                  : 'text-nexus-text-muted hover:text-nexus-text'
              }`}
            >
              Completadas ({tasks.filter(t => !t.parentTaskId && t.status === 'done').length})
            </button>
          </div>

          {/* + Nueva Tarea Pop-up Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-pink-600 hover:opacity-95 text-white text-xs font-bold shrink-0 shadow-md shadow-indigo-500/25 active:scale-95 transition cursor-pointer"
            title="Crear nueva tarea con hoja Notion integrada (Pop-up)"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 px-4 bg-nexus-surface-2/30 border border-dashed border-nexus-border rounded-2xl">
            <p className="text-nexus-text-secondary text-sm">No hay tareas que mostrar en esta vista.</p>
            <p className="text-nexus-text-muted text-xs mt-1">
              Usa la barra de captura rápida de arriba para crear una nueva tarea.
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const project = projects.find(p => p.id === task.projectId);
            const delivery = getDeliveryStatus(task);
            const isTimerRunning = timer.state === 'running' && timer.targetId === task.id;

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTaskId(task.id)}
                className="group flex items-center justify-between p-3.5 bg-nexus-surface-2/50 hover:bg-nexus-surface-2 border border-nexus-border/60 hover:border-nexus-border rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md select-none"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
                  {/* Status Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskStatus(task.id);
                    }}
                    className="text-nexus-text-muted hover:text-emerald-400 transition-colors shrink-0"
                    title={task.status === 'done' ? 'Marcar como pendiente' : 'Marcar como completada'}
                  >
                    {task.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  {/* Priority Badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 ${
                      PRIORITY_BADGES[task.priority].class
                    }`}
                  >
                    {task.priority}
                  </span>

                  {/* Title & Project & Tags */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium text-left truncate group-hover:text-indigo-400 transition-colors ${
                          task.status === 'done'
                            ? 'line-through text-nexus-text-muted'
                            : 'text-nexus-text'
                        }`}
                      >
                        {task.title}
                      </span>

                      {project && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-nexus-surface-3 text-nexus-text-secondary border border-nexus-border shrink-0 flex items-center gap-1">
                          <span>{project.emoji}</span>
                          <span className="truncate max-w-[100px]">{project.name}</span>
                        </span>
                      )}

                      {task.visibility === 'couple' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-300 border border-pink-500/30 shrink-0">
                          💑 Pareja
                        </span>
                      )}
                    </div>

                    {/* Metadata Sub-row */}
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-nexus-text-muted">
                      {task.subtaskIds && task.subtaskIds.length > 0 && (
                        <span>{task.subtaskIds.length} subtareas</span>
                      )}

                      {task.dueDate && (
                        <span
                          className={`flex items-center gap-1 ${
                            delivery === 'overdue'
                              ? 'text-red-400 font-semibold'
                              : 'text-nexus-text-muted'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(task.dueDate), "d 'de' MMM", { locale: es })}
                        </span>
                      )}

                      {task.tags.map(t => (
                        <span key={t} className="text-nexus-text-muted hover:text-indigo-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {/* Time info */}
                  <div className="text-right font-mono text-xs text-nexus-text-muted hidden sm:block">
                    {task.estimatedMinutes ? (
                      <span>
                        {task.actualMinutes}m / {task.estimatedMinutes}m
                      </span>
                    ) : task.actualMinutes > 0 ? (
                      <span>{task.actualMinutes}m</span>
                    ) : null}
                  </div>

                  {/* Play Timer Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startTimer(task.id, 'task', task.title);
                    }}
                    disabled={isTimerRunning}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isTimerRunning
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 animate-pulse'
                        : 'border-nexus-border text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-3'
                    }`}
                    title={isTimerRunning ? 'Temporizador activo' : 'Iniciar temporizador'}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>

                  {/* Open Document / Sheet Indicator on Hover */}
                  <div
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded-lg border border-indigo-500/20"
                    title="Abrir hoja de notas y documento Notion asociado"
                  >
                    <FileText className="w-3 h-3" />
                    <span className="hidden md:inline">Documento</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default InboxView;
