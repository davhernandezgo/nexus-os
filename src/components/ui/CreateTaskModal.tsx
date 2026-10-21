import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  FolderPlus,
  Tag as TagIcon,
  Calendar,
  Clock,
  Lock,
  Heart,
  FileText,
  Sparkles,
  Flame,
  AlertTriangle,
  Zap,
  Coffee,
  Check,
  ChevronRight,
  Folder,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { Priority, Visibility, Task, Project, PageBlock, Tag } from '../../types/nexus';
import { v4 as uuidv4 } from 'uuid';
import EmojiPicker from './EmojiPicker';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultVisibility?: Visibility;
}

const PRIORITIES: {
  id: Priority;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeBorder: string;
  badgeBg: string;
}[] = [
  {
    id: 'P1',
    label: 'P1 Urgente',
    desc: 'Crítico / Hoy',
    icon: Flame,
    color: 'text-red-400',
    activeBorder: 'border-red-500/60 ring-2 ring-red-500/20 bg-red-500/10',
    badgeBg: 'bg-red-500/20 text-red-400',
  },
  {
    id: 'P2',
    label: 'P2 Alta',
    desc: 'Esta semana',
    icon: AlertTriangle,
    color: 'text-amber-400',
    activeBorder: 'border-amber-500/60 ring-2 ring-amber-500/20 bg-amber-500/10',
    badgeBg: 'bg-amber-500/20 text-amber-400',
  },
  {
    id: 'P3',
    label: 'P3 Media',
    desc: 'Secundario',
    icon: Zap,
    color: 'text-blue-400',
    activeBorder: 'border-blue-500/60 ring-2 ring-blue-500/20 bg-blue-500/10',
    badgeBg: 'bg-blue-500/20 text-blue-400',
  },
  {
    id: 'P4',
    label: 'P4 Baja',
    desc: 'Ideas / Backlog',
    icon: Coffee,
    color: 'text-slate-400',
    activeBorder: 'border-slate-500/60 ring-2 ring-slate-500/20 bg-slate-500/10',
    badgeBg: 'bg-slate-500/20 text-slate-400',
  },
];

const TIME_PRESETS = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: '4h', minutes: 240 },
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  defaultProjectId,
  defaultVisibility,
}) => {
  const {
    currentOwner,
    contextMode,
    getVisibleProjects,
    getVisibleTags,
    addTask,
    addProject,
    addTag,
    setSelectedTaskId,
  } = useNexusStore();

  const projects = getVisibleProjects();
  const availableTags = getVisibleTags();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('P2');
  const [visibility, setVisibility] = useState<Visibility>(
    defaultVisibility || (contextMode === 'couple' ? 'couple' : 'private')
  );

  // Project selection mode: 'existing' | 'new' | 'none'
  const [projectMode, setProjectMode] = useState<'existing' | 'new' | 'none'>(
    defaultProjectId ? 'existing' : 'none'
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || '');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectEmoji, setNewProjectEmoji] = useState('📁');

  // Tags
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // Schedule & Estimation
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(undefined);

  const handleSaveRef = useRef<(openAfterCreate: boolean) => void>(() => {});

  // Escape key & Ctrl/Cmd+Enter listener & Body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveRef.current(true);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };

  const handleCreateNewTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (!trimmed) return;
    if (!selectedTags.includes(trimmed)) {
      setSelectedTags(prev => [...prev, trimmed]);
    }
    const exists = availableTags.some(t => t.name.toLowerCase() === trimmed.toLowerCase());
    if (!exists && currentOwner) {
      const newTagObj: Tag = {
        id: `tag-${Date.now()}`,
        name: trimmed,
        color: '#6366f1',
        owner: currentOwner,
        visibility: visibility,
      };
      addTag(newTagObj);
    }
    setNewTagInput('');
    setShowTagInput(false);
  };

  const handleSave = (openAfterCreate: boolean) => {
    if (!title.trim() || !currentOwner) return;

  handleSaveRef.current = handleSave;

    let targetProjectId: string | undefined = undefined;

    // Handle new project creation on the fly
    if (projectMode === 'new' && newProjectName.trim()) {
      const newProjId = `proj-${uuidv4().slice(0, 8)}`;
      const newProj: Project = {
        id: newProjId,
        name: newProjectName.trim(),
        emoji: newProjectEmoji,
        color: visibility === 'couple' ? '#ec4899' : '#6366f1',
        owner: currentOwner,
        visibility: visibility,
        description: '',
        taskIds: [],
        createdAt: new Date().toISOString(),
      };
      addProject(newProj);
      targetProjectId = newProjId;
    } else if (projectMode === 'existing' && selectedProjectId) {
      targetProjectId = selectedProjectId;
    }

    const taskId = `task-${uuidv4().slice(0, 8)}`;
    const initialPageContent: PageBlock[] = description.trim()
      ? [
          {
            id: `block-${uuidv4().slice(0, 8)}`,
            type: 'heading2',
            content: '📌 Notas & Contexto',
          },
          {
            id: `block-${uuidv4().slice(0, 8)}`,
            type: 'paragraph',
            content: description.trim(),
          },
        ]
      : [
          {
            id: `block-${uuidv4().slice(0, 8)}`,
            type: 'heading1',
            content: title.trim(),
          },
          {
            id: `block-${uuidv4().slice(0, 8)}`,
            type: 'callout',
            content: '💡 Hoja en blanco lista. Escribe tus notas, usa la barra de formato o escribe / para agregar bloques.',
            calloutType: 'info',
          },
          {
            id: `block-${uuidv4().slice(0, 8)}`,
            type: 'paragraph',
            content: '',
          },
        ];

    const newTask: Task = {
      id: taskId,
      title: title.trim(),
      description: description.trim(),
      status: 'todo',
      priority,
      owner: currentOwner,
      visibility,
      projectId: targetProjectId,
      subtaskIds: [],
      tags: selectedTags,
      category: targetProjectId ? 'Proyecto' : 'General',
      createdAt: new Date().toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      estimatedMinutes,
      actualMinutes: 0,
      pageContent: initialPageContent,
      wikiLinks: [],
    };

    addTask(newTask);

    // Reset fields
    setTitle('');
    setDescription('');

    if (openAfterCreate) {
      setSelectedTaskId(taskId);
    }

    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 360 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#0B0F19] border border-nexus-border rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Glow Accent */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ─── Header ────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-nexus-border flex items-center justify-between bg-nexus-surface-2/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-nexus-text flex items-center gap-2">
                <span>Nueva Tarea</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-nexus-surface-3 text-indigo-400 border border-nexus-border">
                  con Hoja Notion
                </span>
              </h2>
              <p className="text-xs text-nexus-text-muted">Crea una tarea; su hoja de notas y documento se asociará automáticamente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-3 transition"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Body Form (Scrollable) ────────────────────────── */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-nexus-text-secondary uppercase tracking-wider flex items-center justify-between">
              <span>Título de la Tarea *</span>
              <span className="text-[11px] text-nexus-text-muted font-normal lowercase">obligatorio</span>
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Optimizar servicio de autenticación en Go..."
              className="w-full px-4 py-3 rounded-2xl bg-nexus-surface-2 border border-nexus-border text-nexus-text placeholder-nexus-text-muted focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-base font-medium transition shadow-inner"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSave(false);
                }
              }}
            />
          </div>

          {/* Project Destination Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-nexus-text-secondary uppercase tracking-wider">
              ¿Dónde quieres ubicarla?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProjectMode('none')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  projectMode === 'none'
                    ? 'bg-nexus-surface-3 border-indigo-500/70 text-indigo-300 shadow-sm ring-1 ring-indigo-500/30'
                    : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                <span>📥 Inbox</span>
              </button>

              <button
                type="button"
                onClick={() => setProjectMode('existing')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  projectMode === 'existing'
                    ? 'bg-nexus-surface-3 border-indigo-500/70 text-indigo-300 shadow-sm ring-1 ring-indigo-500/30'
                    : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                <span>📁 Proyecto Existente</span>
              </button>

              <button
                type="button"
                onClick={() => setProjectMode('new')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  projectMode === 'new'
                    ? 'bg-nexus-surface-3 border-indigo-500/70 text-indigo-300 shadow-sm ring-1 ring-indigo-500/30'
                    : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Proyecto</span>
              </button>
            </div>

            {/* Existing project dropdown */}
            {projectMode === 'existing' && (
              <div className="pt-1">
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Selecciona un proyecto destino --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.emoji} {p.name} {p.visibility === 'couple' ? '(💑 Pareja)' : '(🔒 Privado)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* New project inline input */}
            {projectMode === 'new' && (
              <div className="p-3.5 rounded-2xl bg-nexus-surface-2 border border-nexus-border space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-2 rounded-xl bg-nexus-surface-3 border border-nexus-border inline-block shadow-sm">
                    {newProjectEmoji}
                  </span>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    placeholder="Nombre del nuevo proyecto (ej. Microservicios Go)..."
                    className="flex-1 px-3 py-2.5 rounded-xl bg-nexus-surface-3 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-indigo-500"
                  />
                </div>
                {/* Rich Searchable & Categorized Emoji Picker */}
                <EmojiPicker
                  selectedEmoji={newProjectEmoji}
                  onSelectEmoji={setNewProjectEmoji}
                  title="Ícono del Proyecto"
                />
              </div>
            )}
          </div>

          {/* Criticality / Priority Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-nexus-text-secondary uppercase tracking-wider">
              Criticidad / Prioridad
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRIORITIES.map(p => {
                const Icon = p.icon;
                const isSelected = priority === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? `${p.activeBorder} shadow-sm`
                        : 'bg-nexus-surface-2 border-nexus-border hover:border-nexus-border-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon className={`w-4 h-4 ${p.color}`} />
                      {isSelected && <Check className="w-3.5 h-3.5 text-nexus-text" />}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${p.color}`}>{p.label}</div>
                      <div className="text-[10px] text-nexus-text-muted mt-0.5">{p.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visibility / Context: Private vs Couple */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-nexus-text-secondary uppercase tracking-wider">
              Privacidad y Acceso
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition ${
                  visibility === 'private'
                    ? 'bg-nexus-surface-3 border-indigo-500/60 shadow-sm ring-2 ring-indigo-500/20'
                    : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:border-nexus-border-hover'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-nexus-text">🔒 Solo Mío (Privado)</div>
                  <div className="text-[10px] text-nexus-text-muted">Aislamiento total en tu bóveda</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('couple')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition ${
                  visibility === 'couple'
                    ? 'bg-nexus-surface-3 border-pink-500/60 shadow-sm ring-2 ring-pink-500/20'
                    : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:border-nexus-border-hover'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-pink-400">💑 En Pareja (Compartido)</div>
                  <div className="text-[10px] text-nexus-text-muted">Visible para David y Cami</div>
                </div>
              </button>
            </div>
          </div>

          {/* Tags Selector & Quick Creation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-nexus-text-secondary uppercase tracking-wider">
                Etiquetas / Tags
              </label>
              <button
                type="button"
                onClick={() => setShowTagInput(!showTagInput)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva etiqueta</span>
              </button>
            </div>

            {/* Inline tag creator */}
            {showTagInput && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-nexus-surface-2 border border-nexus-border">
                <TagIcon className="w-4 h-4 text-nexus-text-muted ml-1" />
                <input
                  type="text"
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  placeholder="Nombre de la nueva etiqueta (ej. Backend, Salud)..."
                  className="flex-1 bg-transparent text-xs text-nexus-text placeholder-nexus-text-muted focus:outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateNewTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreateNewTag}
                  className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                >
                  Agregar
                </button>
              </div>
            )}

            {/* Available tag pills */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
              {availableTags.map(t => {
                const isSelected = selectedTags.includes(t.name);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleToggleTag(t.name)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200'
                        : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-secondary hover:text-nexus-text'
                    }`}
                  >
                    <span>#{t.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                  </button>
                );
              })}
              {availableTags.length === 0 && (
                <span className="text-xs text-nexus-text-muted italic">No hay etiquetas creadas todavía.</span>
              )}
            </div>
          </div>

          {/* Schedule & Time Estimation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Due date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-nexus-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Fecha Programada</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Estimated time */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-nexus-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tiempo Estimado</span>
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {TIME_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      setEstimatedMinutes(
                        estimatedMinutes === preset.minutes ? undefined : preset.minutes
                      )
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      estimatedMinutes === preset.minutes
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Notes / Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-nexus-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Documento / Hoja de Notas de la Tarea</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Escribe notas preliminares, objetivos o enlaces (esta hoja se asocia a la tarea y la puedes editar en Notion)..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text placeholder-nexus-text-muted focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* ─── Footer Actions ─────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-nexus-border bg-nexus-surface-2/60 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-nexus-text-muted hidden sm:block">
            Atajo: <kbd className="px-1.5 py-0.5 rounded bg-nexus-surface-3 font-mono border border-nexus-border">Ctrl + Enter</kbd> para guardar
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-3 transition"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={!title.trim()}
              onClick={() => handleSave(false)}
              className="px-4 py-2 rounded-xl bg-nexus-surface-3 hover:bg-nexus-surface-2 border border-nexus-border text-xs font-semibold text-nexus-text transition disabled:opacity-40"
            >
              Crear Rápido
            </button>

            <button
              type="button"
              disabled={!title.trim()}
              onClick={() => handleSave(true)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-pink-600 hover:opacity-90 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 disabled:opacity-40 active:scale-95"
            >
              <span>Guardar y Abrir Documento</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default CreateTaskModal;
