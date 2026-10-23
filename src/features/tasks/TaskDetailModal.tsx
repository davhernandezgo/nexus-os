import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Tag as TagIcon,
  Folder,
  Shield,
  Layers,
  FileText,
  AlertCircle,
  Code2,
  ChevronRight,
  Sparkles,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Table as TableIcon,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Link as LinkIcon,
  ExternalLink,
  Wand2,
  Check,
  Bookmark,
  Save,
  Filter,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { Task, Priority, TaskStatus, Visibility, BlockType, PageBlock, TaskTemplate, TemplateCategory } from '../../types/nexus';
import { getDeliveryStatus } from '../../types/nexus';
import { BUILTIN_TEMPLATES } from '../../services/templates';
import CreateTemplateModal from '../../components/ui/CreateTemplateModal';
import TemplateGalleryModal from '../../components/ui/TemplateGalleryModal';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import MarkdownStudio from '../../components/ui/MarkdownStudio';

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  P1: { label: 'P1 - Crítica (Urgente & Importante)', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
  P2: { label: 'P2 - Alta (No urgente & Importante)', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  P3: { label: 'P3 - Media (Urgente & No importante)', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
  P4: { label: 'P4 - Baja (Ni urgente ni importante)', color: 'text-slate-400', bg: 'bg-slate-500/15 border-slate-500/30' },
};

// Helper: Convert PageBlock[] to Markdown string
const blocksToMarkdown = (blocks: PageBlock[]): string => {
  if (!blocks || blocks.length === 0) return '';
  return blocks
    .map(b => {
      switch (b.type) {
        case 'heading1':
          return `# ${b.content}`;
        case 'heading2':
          return `## ${b.content}`;
        case 'heading3':
          return `### ${b.content}`;
        case 'todo':
          return `- [${b.checked ? 'x' : ' '}] ${b.content}`;
        case 'bullet_list':
          return `- ${b.content}`;
        case 'numbered_list':
          return `1. ${b.content}`;
        case 'code':
          return `\`\`\`${b.language || ''}\n${b.content}\n\`\`\``;
        case 'callout':
          return `> 💡 ${b.content}`;
        case 'divider':
          return '---';
        case 'paragraph':
        default:
          return b.content;
      }
    })
    .join('\n\n');
};

// Helper: Convert Markdown string to PageBlock[]
const markdownToBlocks = (md: string): PageBlock[] => {
  if (!md.trim()) return [];
  const lines = md.split('\n');
  const blocks: PageBlock[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          id: `block-${uuidv4().slice(0, 8)}`,
          type: 'code',
          content: codeBuffer.join('\n'),
          language: codeLang || undefined,
        });
        inCodeBlock = false;
        codeBuffer = [];
        codeLang = '';
      } else {
        inCodeBlock = true;
        codeLang = trimmed.replace('```', '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    if (!trimmed) continue;

    if (trimmed.startsWith('# ')) {
      blocks.push({
        id: `block-${uuidv4().slice(0, 8)}`,
        type: 'heading1',
        content: trimmed.replace(/^#\s+/, ''),
      });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({
        id: `block-${uuidv4().slice(0, 8)}`,
        type: 'heading2',
        content: trimmed.replace(/^##\s+/, ''),
      });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({
        id: `block-${uuidv4().slice(0, 8)}`,
        type: 'heading3',
        content: trimmed.replace(/^###\s+/, ''),
      });
    } else if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
      const checked = trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ');
      blocks.push({
        id: `block-${uuidv4().slice(0, 8)}`,
        type: 'todo',
        content: trimmed.replace(/^- \[[ xX]\]\s+/, ''),
        checked,
      });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({
        id: `block-${uuidv4().slice(0, 8)}`,
        type: 'bullet_list',
        content: trimmed.replace(/^[-*]\s+/, ''),
      });
    } else if (/^\d+\.\s+/.test(trimmed)) {
      blocks.push({
        id: `block-${uuidv4().slice(0, 8)}`,
        type: 'numbered_list',
        content: trimmed.replace(/^\d+\.\s+/, ''),
      });
    } else if (trimmed.startsWith('>')) {
      blocks.push({
        id: `block-${uuidv4().slice(0, 8)}`,
        type: 'callout',
        content: trimmed.replace(/^>\s*(💡)?\s*/, ''),
        calloutType: 'info',
      });
    } else if (trimmed === '---' || trimmed === '***') {
      blocks.push({
        id: `block-${uuidv4().slice(0, 8)}`,
        type: 'divider',
        content: '',
      });
    } else {
      blocks.push({
        id: `block-${uuidv4().slice(0, 8)}`,
        type: 'paragraph',
        content: trimmed,
      });
    }
  }

  return blocks;
};

const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'Todas', icon: '🌟' },
  { id: 'custom', label: 'Mis Plantillas', icon: '🎨' },
  { id: 'work', label: 'Trabajo & Tech', icon: '💼' },
  { id: 'couple', label: 'Pareja & Hogar', icon: '💑' },
  { id: 'personal', label: 'Personal', icon: '🔒' },
  { id: 'health', label: 'Salud & Bienestar', icon: '🥗' },
  { id: 'finance', label: 'Finanzas', icon: '💰' },
];

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, onClose }) => {
  const {
    tasks,
    updateTask,
    deleteTask,
    addSubtask,
    getSubtasks,
    toggleTaskStatus,
    getVisibleProjects,
    startTimer,
    timer,
    setSelectedTaskId,
    currentOwner,
    dailyNotes,
    sharedNotes,
    customTemplates,
    deleteCustomTemplate,
  } = useNexusStore();

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);
  const [editorMode, setEditorMode] = useState<'markdown' | 'blocks'>('markdown');
  const [markdownText, setMarkdownText] = useState('');
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');
  const [createTemplateModalOpen, setCreateTemplateModalOpen] = useState(false);
  const [templateInitialMarkdown, setTemplateInitialMarkdown] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleClose = () => {
    handleFlushMarkdown();
    onClose();
  };

  // Lock body scroll and register ESC key
  useEffect(() => {
    if (!taskId) return;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [taskId, onClose]);

  const task = useMemo(() => {
    if (!taskId) return null;
    return tasks.find(t => t.id === taskId) || null;
  }, [tasks, taskId]);

  const currentTaskIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize markdown text reactively when task ID changes without mutating store on mount
  useEffect(() => {
    if (task && currentTaskIdRef.current !== task.id) {
      currentTaskIdRef.current = task.id;
      if (task.pageContent && task.pageContent.length > 0) {
        setMarkdownText(blocksToMarkdown(task.pageContent));
      } else if (task.description && task.description.trim()) {
        const fallbackMd = `## 📌 Notas & Contexto\n\n${task.description.trim()}`;
        setMarkdownText(fallbackMd);
      } else {
        const defaultMd = `# ${task.title}\n\nEscribe aquí notas, ideas o elige una plantilla arriba...`;
        setMarkdownText(defaultMd);
      }
    }
  }, [task?.id]);

  useEffect(() => {
    if (!taskId) {
      currentTaskIdRef.current = null;
    }
  }, [taskId]);

  if (!task) return null;

  const projects = getVisibleProjects();
  const currentProject = projects.find(p => p.id === task.projectId);
  const parentTask = task.parentTaskId ? tasks.find(t => t.id === task.parentTaskId) : null;
  const subtasks = getSubtasks(task.id);
  const isTimerRunningOnThisTask = timer.state === 'running' && timer.targetId === task.id;
  const deliveryStatus = getDeliveryStatus(task);

  const handleUpdate = (updates: Partial<Task>) => {
    updateTask(task.id, updates);
  };

  // Sync Markdown Text with store blocks with 250ms debounce for 60fps typing
  const handleMarkdownChange = (newMd: string) => {
    setMarkdownText(newMd);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const parsedBlocks = markdownToBlocks(newMd);
      handleUpdate({ pageContent: parsedBlocks });
    }, 250);
  };

  const handleFlushMarkdown = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const parsedBlocks = markdownToBlocks(markdownText);
    handleUpdate({ pageContent: parsedBlocks });
  };

  // Insert formatting snippet into textarea
  const insertFormatting = (prefix: string, suffix: string = '', placeholder: string = 'texto') => {
    const el = textareaRef.current;
    if (!el) {
      handleMarkdownChange(markdownText + `\n\n${prefix}${placeholder}${suffix}`);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = markdownText.substring(start, end);
    const textToInsert = selected ? `${prefix}${selected}${suffix}` : `${prefix}${placeholder}${suffix}`;

    const updated = markdownText.substring(0, start) + textToInsert + markdownText.substring(end);
    handleMarkdownChange(updated);

    setTimeout(() => {
      el.focus();
      const newPos = selected ? start + textToInsert.length : start + prefix.length;
      el.setSelectionRange(newPos, newPos + (selected ? 0 : placeholder.length));
    }, 10);
  };

  // Quick Action Buttons for Markdown Toolbar
  const handleInsertTimestamp = () => {
    const timeStr = format(new Date(), 'HH:mm');
    insertFormatting(`⏱️ **[${timeStr}]** `, '', 'Actividad realizada');
  };

  const handleInsertTable = () => {
    const tableTemplate = `\n| Item / Tópico | Responsable | Estado |\n| --- | --- | --- |\n| Paso 1 | Responsable 1 | En curso |\n| Paso 2 | Responsable 2 | Pendiente |\n`;
    handleMarkdownChange(markdownText + tableTemplate);
  };

  // Combined built-in and user custom templates
  const allTemplates = useMemo(() => {
    return [...(customTemplates || []), ...BUILTIN_TEMPLATES];
  }, [customTemplates]);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return allTemplates;
    if (selectedCategory === 'custom') return allTemplates.filter(t => t.isCustom);
    return allTemplates.filter(t => t.category === selectedCategory);
  }, [allTemplates, selectedCategory]);

  const handleApplyTemplate = (tmpl: TaskTemplate) => {
    if (
      task.pageContent &&
      task.pageContent.length > 2 &&
      !window.confirm('¿Deseas aplicar esta plantilla? Se reemplazará el contenido actual del documento.')
    ) {
      return;
    }
    const clonedBlocks = tmpl.blocks.map(b => ({
      ...b,
      id: `block-${uuidv4().slice(0, 8)}`,
    }));
    handleUpdate({ pageContent: clonedBlocks });
    setMarkdownText(tmpl.markdown || blocksToMarkdown(clonedBlocks));
    setShowTemplatesMenu(false);
  };

  const handleOpenSaveAsTemplate = () => {
    setTemplateInitialMarkdown(markdownText);
    setCreateTemplateModalOpen(true);
    setShowTemplatesMenu(false);
  };

  const handleOpenCreateBlankTemplate = () => {
    setTemplateInitialMarkdown('');
    setCreateTemplateModalOpen(true);
    setShowTemplatesMenu(false);
  };

  // Subtask handlers
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Task = {
      id: `task-${uuidv4().slice(0, 8)}`,
      title: newSubtaskTitle.trim(),
      description: '',
      status: 'todo',
      priority: task.priority,
      owner: currentOwner || task.owner,
      visibility: task.visibility,
      parentTaskId: task.id,
      projectId: task.projectId,
      subtaskIds: [],
      tags: [...task.tags],
      category: task.category,
      createdAt: new Date().toISOString(),
      actualMinutes: 0,
      pageContent: [
        {
          id: `block-${uuidv4().slice(0, 8)}`,
          type: 'heading1',
          content: newSubtaskTitle.trim(),
        },
        {
          id: `block-${uuidv4().slice(0, 8)}`,
          type: 'paragraph',
          content: `Hoja de notas y detalles para la subtarea de "${task.title}".`,
        },
      ],
      wikiLinks: [task.id],
    };

    addSubtask(task.id, newSubtask);
    setNewSubtaskTitle('');
  };

  // Block management handlers (for blocks mode)
  const handleAddBlockDirect = (type: BlockType, content: string = '') => {
    const newBlock: PageBlock = {
      id: `block-${uuidv4().slice(0, 8)}`,
      type,
      content,
      checked: type === 'todo' ? false : undefined,
      language: type === 'code' ? 'typescript' : undefined,
    };
    const updated = [...(task.pageContent || []), newBlock];
    handleUpdate({ pageContent: updated });
    setMarkdownText(blocksToMarkdown(updated));
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<PageBlock>) => {
    const updated = (task.pageContent || []).map(b => (b.id === blockId ? { ...b, ...updates } : b));
    handleUpdate({ pageContent: updated });
    setMarkdownText(blocksToMarkdown(updated));
  };

  const handleDeleteBlock = (blockId: string) => {
    const updated = (task.pageContent || []).filter(b => b.id !== blockId);
    handleUpdate({ pageContent: updated });
    setMarkdownText(blocksToMarkdown(updated));
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const blocks = [...(task.pageContent || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const temp = blocks[index];
    blocks[index] = blocks[targetIdx];
    blocks[targetIdx] = temp;
    handleUpdate({ pageContent: blocks });
    setMarkdownText(blocksToMarkdown(blocks));
  };

  // Tags handlers
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim().replace(/^#/, '');
    if (!task.tags.includes(tag)) {
      handleUpdate({ tags: [...task.tags, tag] });
    }
    setNewTagInput('');
    setShowAddTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleUpdate({ tags: task.tags.filter(t => t !== tagToRemove) });
  };

  // Backlinks detection across tasks, daily notes and shared notes
  const backlinks = useMemo(() => {
    const links: { title: string; type: 'task' | 'daily' | 'shared'; id: string }[] = [];
    const titleLower = (task?.title || '').toLowerCase().trim();
    if (!titleLower) return links;

    (tasks || []).forEach(t => {
      if (!t || t.id === task?.id) return;
      const tDesc = (t.description || '').toLowerCase();
      const hasMention =
        (t.pageContent || []).some(b => (b?.content || '').toLowerCase().includes(`[[${titleLower}]]`)) ||
        tDesc.includes(`[[${titleLower}]]`);
      if (hasMention || (t.wikiLinks || []).includes(task?.id || '')) {
        links.push({ title: t.title || 'Tarea', type: 'task', id: t.id });
      }
    });

    (dailyNotes || []).forEach(dn => {
      if (!dn) return;
      const hasMention = (dn.content || []).some((b: PageBlock) => (b?.content || '').toLowerCase().includes(`[[${titleLower}]]`));
      if (hasMention) {
        links.push({ title: `Nota del día (${dn.date || ''})`, type: 'daily', id: dn.id });
      }
    });

    (sharedNotes || []).forEach(sn => {
      if (!sn) return;
      const snContent = (sn.content || '').toLowerCase();
      if (snContent.includes(`[[${titleLower}]]`)) {
        links.push({ title: `Nota compartida: ${sn.title || ''}`, type: 'shared', id: sn.id });
      }
    });

    return links;
  }, [tasks, dailyNotes, sharedNotes, task?.id, task?.title]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Modal Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] bg-nexus-surface rounded-2xl border border-nexus-border shadow-2xl flex flex-col overflow-hidden z-10 my-4"
      >
          {/* ── TOP ACTIONS & AUDIT BAR ── */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-nexus-border bg-nexus-surface-2/70 shrink-0">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Project Breadcrumb */}
              {currentProject ? (
                <div className="flex items-center gap-1.5 font-medium text-nexus-text-secondary">
                  <span>{currentProject.emoji}</span>
                  <span className="truncate max-w-[130px] sm:max-w-[180px]">{currentProject.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-nexus-text-muted shrink-0" />
                </div>
              ) : null}

              {/* Parent Task Breadcrumb if subtask */}
              {parentTask && (
                <button
                  type="button"
                  onClick={() => setSelectedTaskId(parentTask.id)}
                  className="hover:text-indigo-300 text-nexus-text-secondary flex items-center gap-1 font-medium transition-colors group"
                  title={`Volver a tarea padre: ${parentTask.title}`}
                >
                  <span className="truncate max-w-[130px] sm:max-w-[180px] group-hover:underline">{parentTask.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-nexus-text-muted shrink-0" />
                </button>
              )}

              {/* Current Entity Badge */}
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-semibold text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                {task.parentTaskId ? 'Hoja de Subtarea' : 'Hoja de Tarea'}
              </span>

              {/* Delivery Audit Badge */}
              {task.dueDate && (
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                    deliveryStatus === 'on_time'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : deliveryStatus === 'late'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : deliveryStatus === 'overdue'
                      ? 'bg-red-500/15 text-red-300 border-red-500/30'
                      : 'bg-nexus-surface-3 text-nexus-text-muted border-nexus-border'
                  }`}
                >
                  {deliveryStatus === 'on_time' && '✔ Entregado a tiempo'}
                  {deliveryStatus === 'late' && '⚠ Entregado con retraso'}
                  {deliveryStatus === 'overdue' && '⏰ Vencida'}
                  {deliveryStatus === 'pending' && '📅 Programada'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Eliminar esta tarea y todo su contenido?')) {
                    deleteTask(task.id);
                    onClose();
                  }
                }}
                className="p-2 text-nexus-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                title="Eliminar tarea permanentemente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-3 rounded-xl transition-colors"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── MODAL CONTENT SCROLL AREA ── */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-7">
            {/* Title & Short Description */}
            <div>
              <div className="flex items-start gap-3.5">
                <button
                  type="button"
                  onClick={() => toggleTaskStatus(task.id)}
                  className="mt-1 text-nexus-text-muted hover:text-emerald-400 transition-colors shrink-0"
                  title={task.status === 'done' ? 'Marcar como pendiente' : 'Marcar como completada'}
                >
                  {task.status === 'done' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 stroke-[2.5]" />
                  ) : (
                    <Circle className="w-6 h-6 stroke-[1.8]" />
                  )}
                </button>
                <input
                  type="text"
                  value={task.title}
                  onChange={e => handleUpdate({ title: e.target.value })}
                  placeholder="Título de la tarea..."
                  className={`w-full bg-transparent text-xl sm:text-2xl font-bold text-nexus-text placeholder-nexus-text-muted outline-hidden ${
                    task.status === 'done' ? 'line-through text-nexus-text-muted' : ''
                  }`}
                />
              </div>

              <div className="mt-2.5 pl-9 sm:pl-10">
                <input
                  type="text"
                  value={task.description}
                  onChange={e => handleUpdate({ description: e.target.value })}
                  placeholder="Agregar descripción o contexto corto..."
                  className="w-full bg-transparent text-sm text-nexus-text-secondary placeholder-nexus-text-muted outline-hidden"
                />
              </div>
            </div>

            {/* Properties Grid */}
            <div className="bg-nexus-surface-2/60 border border-nexus-border rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs shadow-inner">
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-nexus-text-muted flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Estado
                </label>
                <select
                  value={task.status}
                  onChange={e => handleUpdate({ status: e.target.value as TaskStatus })}
                  className="w-full bg-nexus-surface-3 border border-nexus-border rounded-xl px-3 py-2 text-nexus-text outline-hidden focus:border-indigo-500 transition-colors"
                >
                  <option value="todo">Por hacer</option>
                  <option value="in_progress">En progreso</option>
                  <option value="blocked">Bloqueada</option>
                  <option value="done">Completada</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-nexus-text-muted flex items-center gap-1.5 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" /> Prioridad
                </label>
                <select
                  value={task.priority}
                  onChange={e => handleUpdate({ priority: e.target.value as Priority })}
                  className="w-full bg-nexus-surface-3 border border-nexus-border rounded-xl px-3 py-2 text-nexus-text outline-hidden focus:border-indigo-500 transition-colors"
                >
                  <option value="P1">P1 - Crítica (Urgente & Importante)</option>
                  <option value="P2">P2 - Alta (No urgente & Importante)</option>
                  <option value="P3">P3 - Media (Urgente & No importante)</option>
                  <option value="P4">P4 - Baja (Ni urgente ni importante)</option>
                </select>
              </div>

              {/* Visibility */}
              <div className="space-y-1.5">
                <label className="text-nexus-text-muted flex items-center gap-1.5 font-semibold">
                  <Shield className="w-3.5 h-3.5" /> Visibilidad
                </label>
                <select
                  value={task.visibility}
                  onChange={e => handleUpdate({ visibility: e.target.value as Visibility })}
                  className="w-full bg-nexus-surface-3 border border-nexus-border rounded-xl px-3 py-2 text-nexus-text outline-hidden focus:border-indigo-500 transition-colors"
                >
                  <option value="private">🔒 Privado ({task.owner})</option>
                  <option value="couple">💑 Pareja (Compartido)</option>
                </select>
              </div>

              {/* Project */}
              <div className="space-y-1.5">
                <label className="text-nexus-text-muted flex items-center gap-1.5 font-semibold">
                  <Folder className="w-3.5 h-3.5" /> Proyecto
                </label>
                <select
                  value={task.projectId || ''}
                  onChange={e => handleUpdate({ projectId: e.target.value || undefined })}
                  className="w-full bg-nexus-surface-3 border border-nexus-border rounded-xl px-3 py-2 text-nexus-text outline-hidden focus:border-indigo-500 truncate transition-colors"
                >
                  <option value="">Sin proyecto asignado</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.emoji} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-nexus-text-muted flex items-center gap-1.5 font-semibold">
                  <Calendar className="w-3.5 h-3.5" /> Fecha Límite
                </label>
                <input
                  type="date"
                  value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                  onChange={e => {
                    const val = e.target.value;
                    handleUpdate({ dueDate: val ? new Date(val).toISOString() : undefined });
                  }}
                  className="w-full bg-nexus-surface-3 border border-nexus-border rounded-xl px-3 py-2 text-nexus-text outline-hidden focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Time Tracking & Timer */}
              <div className="space-y-1.5">
                <label className="text-nexus-text-muted flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3.5 h-3.5" /> Tiempo (Estimado / Real)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Est. min"
                    value={task.estimatedMinutes || ''}
                    onChange={e =>
                      handleUpdate({ estimatedMinutes: parseInt(e.target.value, 10) || undefined })
                    }
                    className="w-20 bg-nexus-surface-3 border border-nexus-border rounded-xl px-2.5 py-1.5 text-nexus-text outline-hidden text-center font-mono"
                    title="Minutos estimados de dedicación"
                  />
                  <span className="text-nexus-text-muted">/</span>
                  <span className="text-nexus-text font-mono text-xs px-2.5 py-1.5 bg-nexus-surface-3 rounded-xl border border-nexus-border">
                    {task.actualMinutes}m
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isTimerRunningOnThisTask) {
                        startTimer(task.id, 'task', task.title);
                      }
                    }}
                    disabled={isTimerRunningOnThisTask}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                      isTimerRunningOnThisTask
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isTimerRunningOnThisTask ? 'Enfoque Activo' : 'Iniciar'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-nexus-text-secondary uppercase tracking-wider">
                <TagIcon className="w-3.5 h-3.5" /> Etiquetas
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {task.tags.map(t => (
                  <span
                    key={t}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-red-400 transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {showAddTag ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Nueva etiqueta..."
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                      className="bg-nexus-surface-3 border border-indigo-500/50 rounded-full px-3 py-1 text-xs text-nexus-text outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 px-1.5"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddTag(false)}
                      className="text-xs text-nexus-text-muted hover:text-nexus-text"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddTag(true)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs border border-dashed border-nexus-border text-nexus-text-muted hover:text-nexus-text hover:border-nexus-text-secondary transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Agregar Etiqueta
                  </button>
                )}
              </div>
            </div>

            {/* Subtasks Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-nexus-text-secondary uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5" /> Subtareas ({subtasks.length})
                </div>
              </div>

              <div className="space-y-1.5">
                {subtasks.map(st => (
                  <div
                    key={st.id}
                    className="group flex items-center justify-between p-3 bg-nexus-surface-2/40 hover:bg-nexus-surface-2 rounded-xl border border-nexus-border/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(st.id)}
                        className="text-nexus-text-muted hover:text-emerald-400 transition-colors shrink-0"
                      >
                        {st.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTaskId(st.id)}
                        className={`text-sm text-left truncate hover:underline ${
                          st.status === 'done' ? 'line-through text-nexus-text-muted' : 'text-nexus-text'
                        }`}
                      >
                        {st.title}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                      {st.estimatedMinutes && (
                        <span className="text-xs text-nexus-text-muted font-mono">
                          ~{st.estimatedMinutes}m
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedTaskId(st.id)}
                        className="px-2.5 py-1 text-nexus-text-muted hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium border border-transparent hover:border-indigo-500/20"
                        title="Abrir hoja y documento propio de la subtarea"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Ver Hoja</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    placeholder="Agregar una nueva subtarea con hoja propia..."
                    className="flex-1 bg-nexus-surface-2/40 border border-dashed border-nexus-border rounded-xl px-3.5 py-2 text-sm text-nexus-text placeholder-nexus-text-muted outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!newSubtaskTitle.trim()}
                    className="px-4 py-2 bg-nexus-surface-3 hover:bg-indigo-600 disabled:opacity-40 text-nexus-text text-xs rounded-xl font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar
                  </button>
                </form>
              </div>
            </div>

            {/* ── DOCUMENT STUDIO (HOJA LIBRE & BLOQUES) ── */}
            <div className="pt-4 border-t border-nexus-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-nexus-text">
                    {task.parentTaskId
                      ? 'Documento de la subtarea'
                      : 'Documento de la tarea'}
                  </h3>
                  {currentProject && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-nexus-surface-3 text-nexus-text-secondary border border-nexus-border flex items-center gap-1">
                      <span>{currentProject.emoji}</span>
                      <span>{currentProject.name}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsGalleryOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-all shadow-xs cursor-pointer"
                    title="Explorar el catálogo completo de plantillas y previsualizar su contenido"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Plantillas ({allTemplates.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenSaveAsTemplate}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-xs text-nexus-text-muted hover:text-nexus-text transition cursor-pointer"
                    title="Guardar el contenido actual como plantilla reutilizable"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Guardar como plantilla</span>
                  </button>

                  {/* Mode Switcher: Bloques vs Markdown */}
                  <div className="flex items-center gap-1 bg-nexus-surface-2 p-1 rounded-xl border border-nexus-border text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setEditorMode('blocks');
                        const parsed = markdownToBlocks(markdownText);
                        handleUpdate({ pageContent: parsed });
                      }}
                      className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 cursor-pointer ${
                        editorMode === 'blocks'
                          ? 'bg-nexus-surface-3 text-nexus-text font-bold shadow-xs'
                          : 'text-nexus-text-muted hover:text-nexus-text'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Bloques</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditorMode('markdown');
                        if (task.pageContent && task.pageContent.length > 0) {
                          setMarkdownText(blocksToMarkdown(task.pageContent));
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 cursor-pointer ${
                        editorMode === 'markdown'
                          ? 'bg-nexus-surface-3 text-nexus-text font-bold shadow-xs'
                          : 'text-nexus-text-muted hover:text-nexus-text'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-pink-400" />
                      <span>Markdown</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. MODO HOJA INFINITA (MARKDOWN STUDIO CON LIVE PREVIEW & / COMANDOS) */}
              {editorMode === 'markdown' && (
                <MarkdownStudio
                  value={markdownText}
                  onChange={handleMarkdownChange}
                  onBlur={handleFlushMarkdown}
                  placeholder="Escribe libremente aquí... Usa encabezados (#), listas (- [ ]), código (```), tablas o [[WikiLinks]]. Escribe / para comandos."
                  minHeight="360px"
                  contextTitle={task.title}
                  onWikiLinkClick={(wikiTitle) => {
                    const targetTask = tasks.find(t => t.title.toLowerCase() === wikiTitle.toLowerCase());
                    if (targetTask) setSelectedTaskId(targetTask.id);
                  }}
                />
              )}

              {/* 2. MODO BLOQUES INTERACTIVOS */}
              {editorMode === 'blocks' && (
                <div className="space-y-3">
                  {(!task.pageContent || task.pageContent.length === 0) ? (
                    <div className="text-center py-10 text-nexus-text-muted text-sm border border-dashed border-nexus-border/60 rounded-2xl p-6 space-y-3">
                      <p>Esta página no tiene bloques todavía.</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddBlockDirect('paragraph', 'Escribe tu nota aquí...')}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                        >
                          + Agregar Párrafo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(BUILTIN_TEMPLATES[0])}
                          className="px-3 py-1.5 rounded-xl bg-nexus-surface-3 hover:bg-nexus-surface-2 text-nexus-text text-xs font-semibold border border-nexus-border"
                        >
                          ✈️ Aplicar Plantilla de Viaje
                        </button>
                      </div>
                    </div>
                  ) : (
                    task.pageContent.map((block, index) => (
                      <div
                        key={block.id}
                        className="group relative flex items-start gap-2.5 p-3 rounded-xl bg-nexus-surface-2/40 hover:bg-nexus-surface-2/80 border border-nexus-border/60 transition-colors"
                      >
                        {/* Drag / Reorder Controls */}
                        <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity pt-1">
                          <button
                            type="button"
                            onClick={() => handleMoveBlock(index, 'up')}
                            disabled={index === 0}
                            className="p-0.5 hover:text-indigo-400 disabled:opacity-20 text-nexus-text-muted"
                            title="Subir bloque"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveBlock(index, 'down')}
                            disabled={index === (task.pageContent?.length || 0) - 1}
                            className="p-0.5 hover:text-indigo-400 disabled:opacity-20 text-nexus-text-muted"
                            title="Bajar bloque"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Block Content Editor */}
                        <div className="flex-1 min-w-0 pr-12">
                          {block.type === 'heading1' && (
                            <input
                              type="text"
                              value={block.content}
                              onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddBlockDirect('paragraph');
                                }
                              }}
                              placeholder="Título Principal..."
                              className="w-full bg-transparent text-xl font-bold text-nexus-text outline-hidden"
                            />
                          )}

                          {block.type === 'heading2' && (
                            <input
                              type="text"
                              value={block.content}
                              onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddBlockDirect('paragraph');
                                }
                              }}
                              placeholder="Subtítulo..."
                              className="w-full bg-transparent text-base font-bold text-nexus-text outline-hidden"
                            />
                          )}

                          {block.type === 'heading3' && (
                            <input
                              type="text"
                              value={block.content}
                              onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddBlockDirect('paragraph');
                                }
                              }}
                              placeholder="Sección..."
                              className="w-full bg-transparent text-sm font-semibold text-nexus-text outline-hidden"
                            />
                          )}

                          {block.type === 'paragraph' && (
                            <textarea
                              rows={2}
                              value={block.content}
                              onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddBlockDirect('paragraph');
                                }
                              }}
                              placeholder="Escribe texto libre aquí... (soporta [[wikiLinks]])"
                              className="w-full bg-transparent text-sm text-nexus-text placeholder-nexus-text-muted outline-hidden resize-none leading-relaxed"
                            />
                          )}

                          {block.type === 'todo' && (
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={!!block.checked}
                                onChange={e => handleUpdateBlock(block.id, { checked: e.target.checked })}
                                className="w-4 h-4 rounded-md border-nexus-border bg-nexus-surface-3 text-indigo-500 focus:ring-0 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={block.content}
                                onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddBlockDirect('todo');
                                  }
                                }}
                                placeholder="Elemento de lista de tareas..."
                                className={`w-full bg-transparent text-sm outline-hidden ${
                                  block.checked ? 'line-through text-nexus-text-muted' : 'text-nexus-text'
                                }`}
                              />
                            </div>
                          )}

                          {block.type === 'bullet_list' && (
                            <div className="flex items-center gap-2">
                              <span className="text-nexus-text-muted text-base leading-none">•</span>
                              <input
                                type="text"
                                value={block.content}
                                onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddBlockDirect('bullet_list');
                                  }
                                }}
                                placeholder="Elemento con viñeta..."
                                className="w-full bg-transparent text-sm text-nexus-text outline-hidden"
                              />
                            </div>
                          )}

                          {block.type === 'code' && (
                            <div className="rounded-xl overflow-hidden border border-nexus-border bg-black/50 font-mono text-xs">
                              <div className="flex items-center justify-between px-3 py-1 bg-nexus-surface-3 text-nexus-text-muted text-[10px]">
                                <span>{block.language || 'code'}</span>
                              </div>
                              <textarea
                                rows={3}
                                value={block.content}
                                onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                                className="w-full p-3 bg-transparent text-emerald-400 outline-hidden resize-none font-mono"
                              />
                            </div>
                          )}

                          {block.type === 'callout' && (
                            <div className="flex items-start gap-3 p-3 bg-cyan-950/25 border border-cyan-800/40 rounded-xl text-cyan-200 text-xs">
                              <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                              <textarea
                                rows={2}
                                value={block.content}
                                onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                                className="w-full bg-transparent text-xs text-cyan-100 outline-hidden resize-none"
                              />
                            </div>
                          )}
                        </div>

                        {/* Floating Block Actions (Safe top-right) */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleDeleteBlock(block.id)}
                            className="p-1 text-nexus-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Eliminar bloque"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Direct Add Block Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-xs text-nexus-text-muted font-medium">Agregar:</span>
                    <button
                      type="button"
                      onClick={() => handleAddBlockDirect('paragraph')}
                      className="px-2.5 py-1 text-xs rounded-lg bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-nexus-text transition-colors"
                    >
                      + Párrafo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlockDirect('todo')}
                      className="px-2.5 py-1 text-xs rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
                    >
                      + Tarea [ ]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlockDirect('heading2')}
                      className="px-2.5 py-1 text-xs rounded-lg bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-nexus-text font-bold transition-colors"
                    >
                      + H2
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlockDirect('callout')}
                      className="px-2.5 py-1 text-xs rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors"
                    >
                      + Callout 💡
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlockDirect('code')}
                      className="px-2.5 py-1 text-xs rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                    >
                      + Código &lt;/&gt;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── OBSIDIAN BACKLINKS & MENCIONES ── */}
            {backlinks.length > 0 && (
              <div className="pt-4 border-t border-nexus-border space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-nexus-text-secondary uppercase tracking-wider">
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Backlinks & Conexiones Obsidian ({backlinks.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {backlinks.map((link, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (link.type === 'task') {
                          setSelectedTaskId(link.id);
                        }
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-nexus-surface-2/60 hover:bg-nexus-surface-2 border border-nexus-border/60 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs">🔗</span>
                        <span className="text-xs font-medium text-nexus-text group-hover:text-indigo-400 transition-colors truncate">
                          {link.title}
                        </span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-nexus-text-muted group-hover:text-indigo-400 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Modal for Creating Custom Templates */}
        <CreateTemplateModal
          isOpen={createTemplateModalOpen}
          onClose={() => setCreateTemplateModalOpen(false)}
          initialMarkdown={templateInitialMarkdown}
          onSaveSuccess={(newTmpl) => {
            handleApplyTemplate(newTmpl);
          }}
        />

        {/* Template Gallery with Live Preview */}
        <TemplateGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          onSelectTemplate={(tmpl) => handleApplyTemplate(tmpl)}
          title="Galería & Vista Previa de Plantillas"
          confirmButtonText="Aplicar a este documento"
        />
      </motion.div>,
      document.body
    );
};

export default TaskDetailModal;
