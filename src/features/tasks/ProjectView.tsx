import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  CheckCircle2,
  Circle,
  Plus,
  Calendar,
  Clock,
  ArrowLeft,
  FileText,
  Edit3,
  Trash2,
  Sparkles,
  Tag,
  Flame,
  AlertTriangle,
  Zap,
  Coffee,
  X,
  Check,
  MoreVertical,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { Task, Priority, PageBlock } from '../../types/nexus';
import { getDeliveryStatus } from '../../types/nexus';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import CreateTaskModal from '../../components/ui/CreateTaskModal';
import EmojiPicker from '../../components/ui/EmojiPicker';

export const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const {
    getVisibleProjects,
    getVisibleTasks,
    toggleTaskStatus,
    setSelectedTaskId,
    addTask,
    deleteTask,
    updateProject,
    deleteProject,
    currentOwner,
  } = useNexusStore();

  const projects = getVisibleProjects();
  const project = projects.find(p => p.id === projectId);
  const allTasks = getVisibleTasks();
  const tasks = allTasks.filter(t => t.projectId === projectId);

  // Filter state
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [isAddingQuick, setIsAddingQuick] = useState(false);

  // Edit project state
  const [editName, setEditName] = useState(project?.name || '');
  const [editDesc, setEditDesc] = useState(project?.description || '');
  const [editEmoji, setEditEmoji] = useState(project?.emoji || '📁');

  if (!project) {
    return (
      <div className="text-center py-20 max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-nexus-surface-2 border border-nexus-border flex items-center justify-center text-3xl mx-auto">
          📁
        </div>
        <h2 className="text-base font-bold text-nexus-text">Proyecto no encontrado</h2>
        <p className="text-nexus-text-muted text-xs">
          Es posible que pertenezca a otra cuenta o a un contexto de privacidad diferente.
        </p>
        <button
          onClick={() => navigate('/inbox')}
          className="px-4 py-2 rounded-xl bg-nexus-surface-3 hover:bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text inline-flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inbox
        </button>
      </div>
    );
  }

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status !== 'done';
    if (filter === 'done') return t.status === 'done';
    return true;
  });

  // Quick task creator directly inside project
  const handleCreateNewTask = () => {
    if (!currentOwner) return;
    const newId = `task-${uuidv4().slice(0, 8)}`;
    const newTask: Task = {
      id: newId,
      title: 'Nueva Tarea sin título',
      description: '',
      status: 'todo',
      priority: 'P2',
      owner: project.owner,
      visibility: project.visibility,
      projectId: project.id,
      subtaskIds: [],
      tags: [],
      category: 'General',
      createdAt: new Date().toISOString(),
      actualMinutes: 0,
      pageContent: [
        {
          id: `block-${uuidv4().slice(0, 8)}`,
          type: 'heading1',
          content: 'Nueva Tarea sin título',
        },
        {
          id: `block-${uuidv4().slice(0, 8)}`,
          type: 'paragraph',
          content: 'Escribe aquí las notas, especificaciones o detalles de esta tarea usando bloques o Markdown...',
        },
      ],
      wikiLinks: [],
    };

    addTask(newTask);
    setSelectedTaskId(newId);
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !currentOwner) return;

    const newId = `task-${uuidv4().slice(0, 8)}`;
    const newTask: Task = {
      id: newId,
      title: quickTitle.trim(),
      description: '',
      status: 'todo',
      priority: 'P3',
      owner: project.owner,
      visibility: project.visibility,
      projectId: project.id,
      subtaskIds: [],
      tags: [],
      category: 'Tarea',
      createdAt: new Date().toISOString(),
      actualMinutes: 0,
      pageContent: [
        {
          id: `block-${uuidv4().slice(0, 8)}`,
          type: 'heading1',
          content: quickTitle.trim(),
        },
        {
          id: `block-${uuidv4().slice(0, 8)}`,
          type: 'paragraph',
          content: `Hoja de notas y detalles para la tarea de "${project.name}".`,
        },
      ],
      wikiLinks: [],
    };

    addTask(newTask);
    setQuickTitle('');
    setIsAddingQuick(false);
  };

  const handleSaveProjectEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updateProject(project.id, {
      name: editName.trim(),
      description: editDesc.trim(),
      emoji: editEmoji,
    });
    setShowEditProjectModal(false);
  };

  const handleDeleteProject = () => {
    if (window.confirm(`¿Seguro que deseas eliminar el proyecto "${project.name}"? Las tareas quedarán en el inbox.`)) {
      deleteProject(project.id);
      navigate('/inbox');
    }
  };

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'P1': return { color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: Flame };
      case 'P2': return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: AlertTriangle };
      case 'P3': return { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Zap };
      case 'P4': return { color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: Coffee };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* ─── Project Header Card ───────────────────────────────── */}
      <div className="p-6 bg-nexus-surface border border-nexus-border rounded-3xl space-y-5 shadow-xl relative overflow-hidden">
        {/* Glow */}
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: project.color || '#6366f1' }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
          <div className="flex items-center gap-3.5">
            <span className="text-3xl p-3 rounded-2xl bg-nexus-surface-2 border border-nexus-border shrink-0 shadow-sm">
              {project.emoji}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-nexus-text">{project.name}</h1>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                  project.visibility === 'couple'
                    ? 'text-pink-400 bg-pink-500/10 border-pink-500/20'
                    : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                }`}>
                  {project.visibility === 'couple' ? '💑 Pareja' : '🔒 Privado'}
                </span>
              </div>
              <p className="text-xs text-nexus-text-muted mt-1 leading-relaxed">
                {project.description || 'Sin descripción detallada.'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setEditName(project.name);
                setEditDesc(project.description);
                setEditEmoji(project.emoji);
                setShowEditProjectModal(true);
              }}
              className="p-2 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-nexus-text-secondary hover:text-nexus-text transition"
              title="Editar detalles del proyecto"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-xs font-medium text-nexus-text transition"
            >
              <Plus className="w-4 h-4 text-nexus-accent-indigo" />
              <span>Opciones</span>
            </button>

            <button
              onClick={handleCreateNewTask}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-nexus-accent-indigo to-indigo-600 hover:opacity-95 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Tarea</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Stats */}
        <div className="pt-2 border-t border-nexus-border/60 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex justify-between text-xs text-nexus-text-muted font-medium">
              <span>Progreso de cumplimiento</span>
              <span className="font-semibold text-nexus-text">{progressPercent}% ({completedCount} de {tasks.length})</span>
            </div>
            <div className="w-full h-2.5 bg-nexus-surface-2 rounded-full overflow-hidden border border-nexus-border/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-nexus-accent-indigo to-nexus-accent-pink rounded-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 text-xs text-nexus-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {tasks.length - completedCount} pendientes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {completedCount} completadas
            </span>
          </div>
        </div>
      </div>

      {/* ─── Controls: Filter Tabs & Quick Inline Input ──────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-nexus-surface rounded-xl border border-nexus-border">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === 'all'
                ? 'bg-nexus-surface-3 text-nexus-text shadow-sm'
                : 'text-nexus-text-muted hover:text-nexus-text'
            }`}
          >
            Todas ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === 'pending'
                ? 'bg-nexus-surface-3 text-nexus-text shadow-sm'
                : 'text-nexus-text-muted hover:text-nexus-text'
            }`}
          >
            Pendientes ({tasks.length - completedCount})
          </button>
          <button
            onClick={() => setFilter('done')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === 'done'
                ? 'bg-nexus-surface-3 text-nexus-text shadow-sm'
                : 'text-nexus-text-muted hover:text-nexus-text'
            }`}
          >
            Completadas ({completedCount})
          </button>
        </div>

        {/* Quick inline adder */}
        <div className="flex items-center gap-2">
          {isAddingQuick ? (
            <form onSubmit={handleQuickAddSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                autoFocus
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                placeholder="Nombre de la nueva tarea..."
                className="px-3 py-1.5 rounded-xl bg-nexus-surface border border-nexus-accent-indigo text-xs text-nexus-text focus:outline-none w-64 shadow-sm"
              />
              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="px-3 py-1.5 rounded-xl bg-nexus-accent-indigo text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                Agregar
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickTitle('');
                  setIsAddingQuick(false);
                }}
                className="p-1.5 rounded-lg text-nexus-text-muted hover:text-nexus-text"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingQuick(true)}
              className="text-xs text-nexus-accent-indigo hover:text-indigo-300 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-xl bg-nexus-accent-indigo/10 border border-nexus-accent-indigo/20 transition hover:bg-nexus-accent-indigo/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Tarea Rápida</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Tasks & Pages List ─────────────────────────────────── */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-nexus-border bg-nexus-surface/40 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-nexus-surface-2 border border-nexus-border flex items-center justify-center text-2xl mx-auto">
              📄
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-nexus-text">No hay tareas en este proyecto</p>
              <p className="text-xs text-nexus-text-muted">
                {filter === 'done'
                  ? 'Aún no has completado ninguna tarea en este proyecto.'
                  : 'Crea tu primera tarea para organizar este proyecto.'}
              </p>
            </div>
            <button
              onClick={handleCreateNewTask}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nexus-accent-indigo hover:bg-nexus-accent-indigo/90 text-white text-xs font-semibold transition shadow-md shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Primera Tarea</span>
            </button>
          </div>
        ) : (
          filteredTasks.map(task => {
            const priorityMeta = getPriorityBadge(task.priority);
            const PriorityIcon = priorityMeta.icon;
            const delivery = getDeliveryStatus(task);
            const isPage = (task.pageContent && task.pageContent.length > 0) || task.category === 'Documento';

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="group p-4 rounded-2xl bg-nexus-surface hover:bg-nexus-surface-2 border border-nexus-border hover:border-nexus-border-hover transition-all cursor-pointer shadow-sm flex items-center justify-between gap-4"
              >
                {/* Left: Checkbox + Title */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleTaskStatus(task.id);
                    }}
                    className="text-nexus-text-muted hover:text-emerald-400 transition-colors shrink-0"
                  >
                    {task.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {isPage && (
                        <span className="p-1 rounded bg-nexus-surface-3 text-nexus-text-muted text-[10px] shrink-0" title="Tiene documento asociado">
                          <FileText className="w-3 h-3 text-indigo-400" />
                        </span>
                      )}
                      {task.parentTaskId && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 font-medium">
                          Subtarea
                        </span>
                      )}
                      <h4
                        className={`text-sm font-semibold truncate transition-colors ${
                          task.status === 'done'
                            ? 'line-through text-nexus-text-muted'
                            : 'text-nexus-text group-hover:text-nexus-accent-indigo'
                        }`}
                      >
                        {task.title}
                      </h4>
                    </div>

                    {/* Metadata row */}
                    <div className="flex flex-wrap items-center gap-2.5 mt-1 text-[11px] text-nexus-text-muted">
                      {/* Priority pill */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-semibold ${priorityMeta.color}`}>
                        <PriorityIcon className="w-3 h-3" />
                        {task.priority}
                      </span>

                      {/* Due date */}
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(task.dueDate), "d 'de' MMM", { locale: es })}
                        </span>
                      )}

                      {/* Delivery Audit */}
                      {delivery === 'on_time' && (
                        <span className="text-emerald-400 font-medium">✔ A tiempo</span>
                      )}
                      {delivery === 'late' && (
                        <span className="text-amber-400 font-medium">⚠ Con retraso</span>
                      )}
                      {delivery === 'overdue' && (
                        <span className="text-red-400 font-medium">⏰ Vencida</span>
                      )}

                      {/* Time audit */}
                      {(task.estimatedMinutes || task.actualMinutes > 0) && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {task.actualMinutes}m / {task.estimatedMinutes ? `${task.estimatedMinutes}m` : '0m'}
                        </span>
                      )}

                      {/* Subtasks counter */}
                      {task.subtaskIds && task.subtaskIds.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-nexus-surface-3 text-nexus-text-secondary font-mono">
                          {task.subtaskIds.length} subtareas
                        </span>
                      )}

                      {/* Tags */}
                      {task.tags?.map(t => (
                        <span key={t} className="text-indigo-400">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Quick actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (window.confirm('¿Eliminar esta tarea y su documento asociado?')) {
                        deleteTask(task.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-nexus-text-muted hover:text-red-400 hover:bg-red-500/10 transition"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Edit Project Modal ─────────────────────────────────── */}
      {showEditProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-nexus-surface border border-nexus-border rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-nexus-border pb-3">
              <h3 className="text-sm font-bold text-nexus-text">Editar Proyecto</h3>
              <button
                onClick={() => setShowEditProjectModal(false)}
                className="text-nexus-text-muted hover:text-nexus-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProjectEdit} className="space-y-4">
              {/* Rich Searchable & Categorized Emoji Picker */}
              <EmojiPicker
                selectedEmoji={editEmoji}
                onSelectEmoji={setEditEmoji}
                title="Ícono del Proyecto"
              />

              <div className="space-y-1.5">
                <label className="text-xs text-nexus-text-secondary font-semibold">Nombre del Proyecto</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-sm text-nexus-text focus:outline-none focus:border-nexus-accent-indigo"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-nexus-text-secondary font-semibold">Descripción / Metas</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-nexus-accent-indigo resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  className="px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 font-medium transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Proyecto</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditProjectModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-nexus-accent-indigo text-white text-xs font-semibold hover:opacity-90"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ─── Create Task / Page Modal ───────────────────────────── */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        defaultProjectId={project.id}
        defaultVisibility={project.visibility}
      />
    </div>
  );
};

export default ProjectView;
