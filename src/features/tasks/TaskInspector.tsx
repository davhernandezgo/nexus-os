import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  Square,
  Clock,
  Calendar,
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  MessageSquare,
  Minus,
  Link2,
  Lock,
  Heart,
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
  FileText,
  CornerDownRight,
  Folder,
  CheckSquare,
  Bold,
  Italic,
  Quote,
  BookOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { useNexusStore } from '../../store/nexusStore';
import type { Task, Priority, TaskStatus, Visibility, PageBlock, BlockType, TimeLog } from '../../types/nexus';
import { getDeliveryStatus, getEfficiencyRatio } from '../../types/nexus';

const TEMPLATES = [
  {
    id: 'engineering',
    name: '🛠️ Bitácora de Ingeniería',
    generate: (): PageBlock[] => [
      { id: uuidv4(), type: 'heading2', content: '🎯 Objetivo & Hipótesis' },
      { id: uuidv4(), type: 'paragraph', content: 'Describir el problema técnico, impacto en el sistema y solución propuesta.' },
      { id: uuidv4(), type: 'heading2', content: '🔍 Diagnóstico & Métricas' },
      { id: uuidv4(), type: 'callout', content: 'Benchmark inicial: latencia p99, consumo de memoria o tasa de error observada.', calloutType: 'info' },
      { id: uuidv4(), type: 'code', content: '// Repositorio & Comando de prueba\nmake test-integration', language: 'go' },
      { id: uuidv4(), type: 'heading2', content: '🛠️ Tareas de Implementación' },
      { id: uuidv4(), type: 'todo', content: 'Reproducir el caso en ambiente de desarrollo local', checked: false },
      { id: uuidv4(), type: 'todo', content: 'Implementar solución y validar edge cases', checked: false },
      { id: uuidv4(), type: 'todo', content: 'Ejecutar suite de tests y verificar regresiones', checked: false },
      { id: uuidv4(), type: 'heading2', content: '📊 Conclusiones & Rollout' },
      { id: uuidv4(), type: 'paragraph', content: 'Métricas obtenidas post-deploy y plan de monitoreo.' },
    ],
  },
  {
    id: 'meeting',
    name: '📋 Reunión',
    generate: (): PageBlock[] => [
      { id: uuidv4(), type: 'heading2', content: '👥 Asistentes & Objetivo' },
      { id: uuidv4(), type: 'paragraph', content: 'Objetivo claro de la sesión y participantes involucrados.' },
      { id: uuidv4(), type: 'heading2', content: '📝 Puntos Clave Tratados' },
      { id: uuidv4(), type: 'bullet_list', content: 'Punto principal de discusión...' },
      { id: uuidv4(), type: 'bullet_list', content: 'Decisión técnica o de negocio acordada...' },
      { id: uuidv4(), type: 'heading2', content: '✅ Acuerdos & Próximos Pasos' },
      { id: uuidv4(), type: 'todo', content: 'Minuta y compromisos enviados', checked: false },
      { id: uuidv4(), type: 'todo', content: 'Definir fecha para siguiente checkpoint', checked: false },
    ],
  },
  {
    id: 'couple_project',
    name: '🏡 Proyecto de Pareja',
    generate: (): PageBlock[] => [
      { id: uuidv4(), type: 'heading2', content: '💑 Visión Conjunta' },
      { id: uuidv4(), type: 'callout', content: 'Nuestra meta y qué queremos lograr juntos con este proyecto.', calloutType: 'success' },
      { id: uuidv4(), type: 'heading2', content: '📋 Plan de Pasos & Responsables' },
      { id: uuidv4(), type: 'todo', content: 'Definir presupuesto y recursos disponibles', checked: false },
      { id: uuidv4(), type: 'todo', content: 'Repartir responsabilidades y fechas objetivo', checked: false },
      { id: uuidv4(), type: 'todo', content: 'Coordinar compras o reservas conjuntas', checked: false },
      { id: uuidv4(), type: 'heading2', content: '💡 Ideas & Inspiración' },
      { id: uuidv4(), type: 'paragraph', content: 'Links, referencias, fotos y notas de inspiración.' },
    ],
  },
  {
    id: 'travel_checklist',
    name: '✈️ Checklist de Viaje',
    generate: (): PageBlock[] => [
      { id: uuidv4(), type: 'heading2', content: '✈️ Itinerario & Reservas' },
      { id: uuidv4(), type: 'callout', content: 'Destino, vuelos y fechas confirmadas del viaje.', calloutType: 'info' },
      { id: uuidv4(), type: 'heading2', content: '💼 Documentación & Finanzas' },
      { id: uuidv4(), type: 'todo', content: 'Pasaportes / DNIs vigentes y fotocopias guardadas', checked: false },
      { id: uuidv4(), type: 'todo', content: 'Tarjetas habilitadas para el exterior y seguro de viaje', checked: false },
      { id: uuidv4(), type: 'todo', content: 'Reservas de hotel y traslados descargadas offline', checked: false },
      { id: uuidv4(), type: 'heading2', content: '🎒 Equipaje & Esenciales' },
      { id: uuidv4(), type: 'todo', content: 'Ropa según clima y muda en equipaje de mano', checked: false },
      { id: uuidv4(), type: 'todo', content: 'Cargadores, cables y adaptadores internacionales', checked: false },
      { id: uuidv4(), type: 'todo', content: 'Botiquín básico con medicamentos necesarios', checked: false },
    ],
  },
];

const SLASH_COMMANDS: { type: BlockType; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'paragraph', label: 'Párrafo', desc: 'Texto estándar', icon: FileText },
  { type: 'heading1', label: 'Título 1', desc: 'Encabezado grande', icon: Heading1 },
  { type: 'heading2', label: 'Título 2', desc: 'Encabezado mediano', icon: Heading2 },
  { type: 'heading3', label: 'Título 3', desc: 'Encabezado pequeño', icon: Heading3 },
  { type: 'bullet_list', label: 'Lista de viñetas', desc: 'Lista no ordenada', icon: List },
  { type: 'numbered_list', label: 'Lista numerada', desc: 'Lista secuencial', icon: ListOrdered },
  { type: 'todo', label: 'Tarea pendiente', desc: 'Casilla de verificación', icon: CheckSquare },
  { type: 'code', label: 'Código', desc: 'Bloque de código monoespaciado', icon: Code },
  { type: 'callout', label: 'Callout', desc: 'Caja destacada con borde', icon: MessageSquare },
  { type: 'divider', label: 'Divisor', desc: 'Línea horizontal separadora', icon: Minus },
  { type: 'timestamp', label: 'Marca de tiempo', desc: 'Inserta la fecha y hora actual', icon: Clock },
  { type: 'wikilink', label: 'Enlace wiki', desc: 'Vincular a otra tarea o nota', icon: Link2 },
];

export const blocksToMarkdown = (blocks: PageBlock[]): string => {
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
        case 'bullet_list':
          return `- ${b.content}`;
        case 'numbered_list':
          return `1. ${b.content}`;
        case 'todo':
          return `- [${b.checked ? 'x' : ' '}] ${b.content}`;
        case 'code':
          return `\`\`\`${b.language || 'typescript'}\n${b.content}\n\`\`\``;
        case 'callout':
          return `> 💡 ${b.content}`;
        case 'divider':
          return `---`;
        case 'timestamp':
          return `⏱️ ${b.content}`;
        case 'wikilink':
          return `[[${b.content}]]`;
        default:
          return b.content;
      }
    })
    .join('\n\n');
};

export const markdownToBlocks = (md: string): PageBlock[] => {
  if (!md.trim()) return [];
  const lines = md.split('\n');
  const blocks: PageBlock[] = [];
  let inCode = false;
  let codeLang = '';
  let codeBuffer: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCode) {
        blocks.push({
          id: uuidv4(),
          type: 'code',
          content: codeBuffer.join('\n'),
          language: codeLang || 'typescript',
        });
        inCode = false;
        codeBuffer = [];
        codeLang = '';
      } else {
        inCode = true;
        codeLang = line.replace('```', '').trim();
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ')) {
      blocks.push({ id: uuidv4(), type: 'heading1', content: trimmed.slice(2) });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ id: uuidv4(), type: 'heading2', content: trimmed.slice(3) });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({ id: uuidv4(), type: 'heading3', content: trimmed.slice(4) });
    } else if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
      const isChecked = trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ');
      blocks.push({ id: uuidv4(), type: 'todo', content: trimmed.slice(6), checked: isChecked });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({ id: uuidv4(), type: 'bullet_list', content: trimmed.slice(2) });
    } else if (/^\d+\.\s/.test(trimmed)) {
      blocks.push({ id: uuidv4(), type: 'numbered_list', content: trimmed.replace(/^\d+\.\s/, '') });
    } else if (trimmed.startsWith('> ')) {
      blocks.push({ id: uuidv4(), type: 'callout', content: trimmed.slice(2) });
    } else if (trimmed === '---') {
      blocks.push({ id: uuidv4(), type: 'divider', content: '' });
    } else {
      blocks.push({ id: uuidv4(), type: 'paragraph', content: line });
    }
  }

  return blocks;
};

export default function TaskInspector() {
  const {
    selectedTaskId,
    setSelectedTaskId,
    getVisibleTasks,
    getVisibleProjects,
    updateTask,
    deleteTask,
    addSubtask,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    timer,
    timeLogs,
  } = useNexusStore();

  const visibleTasks = getVisibleTasks();
  const visibleProjects = getVisibleProjects();

  // Find currently selected task (can be task or subtask)
  const task = useMemo(() => {
    if (!selectedTaskId) return null;
    return visibleTasks.find(t => t.id === selectedTaskId) || null;
  }, [selectedTaskId, visibleTasks]);

  // Find parent task if this is a subtask
  const parentTask = useMemo(() => {
    if (!task?.parentTaskId) return null;
    return visibleTasks.find(t => t.id === task.parentTaskId) || null;
  }, [task, visibleTasks]);

  // Subtasks of the currently inspected task
  const subtasks = useMemo(() => {
    if (!task) return [];
    return visibleTasks.filter(t => t.parentTaskId === task.id);
  }, [task, visibleTasks]);

  // Backlinks: tasks or subtasks that link to this task in wikiLinks or pageContent
  const backlinks = useMemo(() => {
    if (!task) return [];
    return visibleTasks.filter(t => {
      if (t.id === task.id) return false;
      const inWikiLinks = t.wikiLinks && t.wikiLinks.includes(task.id);
      const inPageContent = t.pageContent && t.pageContent.some(b => b.content.includes(task.id));
      return inWikiLinks || inPageContent;
    });
  }, [task, visibleTasks]);

  // Time logs for this task
  const taskTimeLogs = useMemo(() => {
    if (!task) return [];
    return timeLogs.filter(tl => tl.taskId === task.id);
  }, [task, timeLogs]);

  // Local states for inputs
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [activeSlashMenuBlockId, setActiveSlashMenuBlockId] = useState<string | null>(null);
  const [slashSearch, setSlashSearch] = useState('');
  const [activeWikilinkBlockId, setActiveWikilinkBlockId] = useState<string | null>(null);

  // Infinite Markdown & Word Toolbar States
  const [editorMode, setEditorMode] = useState<'markdown' | 'blocks'>('markdown');
  const [markdownText, setMarkdownText] = useState<string>('');
  const [showProperties, setShowProperties] = useState<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync markdownText when task changes
  useEffect(() => {
    if (task) {
      setMarkdownText(blocksToMarkdown(task.pageContent || []));
    }
  }, [task?.id]);

  const handleMarkdownChange = (newText: string) => {
    if (!task) return;
    setMarkdownText(newText);
    const updatedBlocks = markdownToBlocks(newText);
    updateTask(task.id, { pageContent: updatedBlocks, description: newText.slice(0, 160) });
  };

  const insertMarkdownFormatting = (prefix: string, suffix: string = '', defaultText: string = 'texto') => {
    if (!task) return;
    const el = textareaRef.current;
    if (!el) {
      handleMarkdownChange(`${markdownText}\n${prefix}${defaultText}${suffix}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = markdownText.substring(start, end) || defaultText;
    const replacement = `${prefix}${selected}${suffix}`;
    const newText = markdownText.substring(0, start) + replacement + markdownText.substring(end);
    handleMarkdownChange(newText);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  // Close inspector on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTaskId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedTaskId]);

  if (!task) return null;

  // Delivery status calculation
  const deliveryStatus = getDeliveryStatus(task);
  const efficiencyRatio = getEfficiencyRatio(task);

  // Timer status for this task
  const isTimerRunningHere = timer.targetId === task.id && timer.state === 'running';
  const isTimerPausedHere = timer.targetId === task.id && timer.state === 'paused';

  // Handle property updates
  const handleUpdate = (updates: Partial<Task>) => {
    updateTask(task.id, updates);
  };

  // Add tag
  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (!trimmed) return;
    if (!task.tags.includes(trimmed)) {
      handleUpdate({ tags: [...task.tags, trimmed] });
    }
    setNewTagInput('');
    setShowTagInput(false);
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    handleUpdate({ tags: task.tags.filter(t => t !== tagToRemove) });
  };

  // Add subtask
  const handleCreateSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Task = {
      id: `task-${uuidv4()}`,
      title: newSubtaskTitle.trim(),
      description: '',
      status: 'todo',
      priority: task.priority,
      owner: task.owner,
      visibility: task.visibility,
      parentTaskId: task.id,
      subtaskIds: [],
      tags: [...task.tags],
      category: task.category,
      createdAt: new Date().toISOString(),
      estimatedMinutes: 30,
      actualMinutes: 0,
      pageContent: [],
      wikiLinks: [task.id],
    };

    addSubtask(task.id, newSubtask);
    setNewSubtaskTitle('');
  };

  // Apply template
  const handleApplyTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const newBlocks = template.generate();
    handleUpdate({
      pageContent: [...(task.pageContent || []), ...newBlocks],
    });
  };

  // Add block
  const handleAddBlock = (type: BlockType = 'paragraph', content = '') => {
    const newBlock: PageBlock = {
      id: uuidv4(),
      type,
      content,
      checked: type === 'todo' ? false : undefined,
      language: type === 'code' ? 'typescript' : undefined,
      calloutType: type === 'callout' ? 'info' : undefined,
    };
    handleUpdate({
      pageContent: [...(task.pageContent || []), newBlock],
    });
  };

  // Update single block
  const handleUpdateBlock = (blockId: string, updates: Partial<PageBlock>) => {
    const updated = (task.pageContent || []).map(b => (b.id === blockId ? { ...b, ...updates } : b));
    handleUpdate({ pageContent: updated });
  };

  // Delete block
  const handleDeleteBlock = (blockId: string) => {
    const updated = (task.pageContent || []).filter(b => b.id !== blockId);
    handleUpdate({ pageContent: updated });
  };

  // Move block up/down
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const blocks = [...(task.pageContent || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const temp = blocks[index];
    blocks[index] = blocks[targetIdx];
    blocks[targetIdx] = temp;
    handleUpdate({ pageContent: blocks });
  };

  // Convert block type from slash command
  const handleSelectSlashCommand = (blockId: string, type: BlockType) => {
    if (type === 'timestamp') {
      const nowStr = new Date().toISOString();
      handleUpdateBlock(blockId, { type: 'timestamp', content: nowStr });
    } else if (type === 'wikilink') {
      setActiveWikilinkBlockId(blockId);
    } else {
      handleUpdateBlock(blockId, {
        type,
        checked: type === 'todo' ? false : undefined,
        language: type === 'code' ? 'typescript' : undefined,
        calloutType: type === 'callout' ? 'info' : undefined,
        content: '',
      });
    }
    setActiveSlashMenuBlockId(null);
    setSlashSearch('');
  };

  // Select wikilink target
  const handleSelectWikilink = (blockId: string, targetTask: Task) => {
    handleUpdateBlock(blockId, {
      type: 'wikilink',
      content: targetTask.id,
    });
    // Also track wikiLink in task.wikiLinks
    if (!task.wikiLinks.includes(targetTask.id)) {
      handleUpdate({ wikiLinks: [...task.wikiLinks, targetTask.id] });
    }
    setActiveWikilinkBlockId(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setSelectedTaskId(null)}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
      />

      {/* Slide-in panel / drawer */}
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed inset-y-0 right-0 w-full sm:w-[580px] md:w-[660px] lg:w-[720px] bg-nexus-surface border-l border-nexus-border shadow-2xl z-50 flex flex-col overflow-hidden text-nexus-text"
      >
        {/* Top Header Bar */}
        <div className="p-4 border-b border-nexus-border bg-nexus-surface-2/70 flex items-center justify-between shrink-0">
          {/* Breadcrumbs for subtask */}
          <div className="flex items-center gap-1.5 text-xs text-nexus-text-muted truncate max-w-[80%]">
            {parentTask ? (
              <>
                <button
                  onClick={() => setSelectedTaskId(parentTask.id)}
                  className="hover:text-indigo-400 text-nexus-text-secondary truncate max-w-[200px] flex items-center gap-1 font-medium cursor-pointer"
                  title="Volver a la tarea padre"
                >
                  <Folder className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{parentTask.title}</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                <span className="text-nexus-text truncate font-semibold">Hoja de Subtarea</span>
              </>
            ) : (
              <span className="text-nexus-text-secondary font-medium flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Hoja de Tarea</span>
              </span>
            )}
          </div>

          {/* Action buttons: Close & Delete */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (confirm('¿Eliminar esta tarea y sus subtareas?')) {
                  deleteTask(task.id);
                  setSelectedTaskId(null);
                }
              }}
              className="p-1.5 text-nexus-text-muted hover:text-red-400 hover:bg-nexus-surface-3 rounded-lg transition-colors cursor-pointer"
              title="Eliminar tarea"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedTaskId(null)}
              className="p-1.5 text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-3 rounded-lg transition-colors cursor-pointer"
              title="Cerrar panel (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title Area */}
          <div>
            <input
              type="text"
              value={task.title}
              onChange={e => handleUpdate({ title: e.target.value })}
              placeholder="Título sin nombre..."
              className="w-full text-2xl font-bold bg-transparent text-nexus-text border-none focus:outline-none placeholder:text-nexus-text-muted/50"
            />
          </div>

          {/* Timer Action Banner */}
          <div className="p-3.5 rounded-xl bg-nexus-surface-2 border border-nexus-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${isTimerRunningHere ? 'bg-indigo-600/30 text-indigo-400 animate-pulse' : 'bg-nexus-surface-3 text-nexus-text-muted'}`}>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-nexus-text flex items-center gap-2">
                  <span>Temporizador de Tarea</span>
                  {isTimerRunningHere && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                      EN CURSO: {Math.floor(timer.elapsed / 60)}m {timer.elapsed % 60}s
                    </span>
                  )}
                  {isTimerPausedHere && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                      PAUSADO
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-nexus-text-muted mt-0.5">
                  Tiempo acumulado: <strong className="text-nexus-text font-mono">{task.actualMinutes}m</strong>
                  {task.estimatedMinutes ? ` / Meta: ${task.estimatedMinutes}m` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {isTimerRunningHere ? (
                <>
                  <button
                    onClick={() => pauseTimer()}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pausar</span>
                  </button>
                  <button
                    onClick={() => stopTimer('Sesión de trabajo finalizada')}
                    className="px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Terminar</span>
                  </button>
                </>
              ) : isTimerPausedHere ? (
                <>
                  <button
                    onClick={() => resumeTimer()}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Reanudar</span>
                  </button>
                  <button
                    onClick={() => stopTimer('Sesión pausada finalizada')}
                    className="px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Terminar</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => startTimer(task.id, 'task', task.title)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Iniciar Timer</span>
                </button>
              )}
            </div>
          </div>

          {/* Properties Header (Table Style like Notion) */}
          <div className="bg-nexus-surface-2/60 rounded-xl border border-nexus-border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-nexus-text-muted">
              Propiedades
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Status Dropdown */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-nexus-surface border border-nexus-border/60">
                <span className="text-nexus-text-muted flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Estado
                </span>
                <select
                  value={task.status}
                  onChange={e => {
                    const newStatus = e.target.value as TaskStatus;
                    handleUpdate({
                      status: newStatus,
                      completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
                    });
                  }}
                  className="bg-transparent text-nexus-text font-medium outline-none cursor-pointer text-right"
                >
                  <option value="todo" className="bg-nexus-surface">Por Hacer</option>
                  <option value="in_progress" className="bg-nexus-surface">En Curso</option>
                  <option value="blocked" className="bg-nexus-surface">Bloqueado</option>
                  <option value="done" className="bg-nexus-surface">Completado</option>
                </select>
              </div>

              {/* Priority Dropdown */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-nexus-surface border border-nexus-border/60">
                <span className="text-nexus-text-muted flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Prioridad
                </span>
                <select
                  value={task.priority}
                  onChange={e => handleUpdate({ priority: e.target.value as Priority })}
                  className="bg-transparent font-medium outline-none cursor-pointer text-right"
                >
                  <option value="P1" className="bg-nexus-surface text-red-400">🔥 P1 - Urgente</option>
                  <option value="P2" className="bg-nexus-surface text-amber-400">⚡ P2 - Importante</option>
                  <option value="P3" className="bg-nexus-surface text-blue-400">🔷 P3 - Media</option>
                  <option value="P4" className="bg-nexus-surface text-slate-400">📦 P4 - Baja</option>
                </select>
              </div>

              {/* Visibility Badge & Switcher */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-nexus-surface border border-nexus-border/60">
                <span className="text-nexus-text-muted flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Privacidad
                </span>
                <button
                  onClick={() =>
                    handleUpdate({ visibility: task.visibility === 'private' ? 'couple' : 'private' })
                  }
                  className="font-medium flex items-center gap-1 cursor-pointer"
                >
                  {task.visibility === 'couple' ? (
                    <span className="text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Heart className="w-3 h-3" /> 💑 Pareja
                    </span>
                  ) : (
                    <span className="text-nexus-text-secondary bg-nexus-surface-3 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> 🔒 Privado
                    </span>
                  )}
                </button>
              </div>

              {/* Project Assignment */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-nexus-surface border border-nexus-border/60">
                <span className="text-nexus-text-muted flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5" /> Proyecto
                </span>
                <select
                  value={task.projectId || 'none'}
                  onChange={e =>
                    handleUpdate({ projectId: e.target.value === 'none' ? undefined : e.target.value })
                  }
                  className="bg-transparent text-nexus-text font-medium outline-none cursor-pointer text-right max-w-[140px] truncate"
                >
                  <option value="none" className="bg-nexus-surface">Sin Proyecto</option>
                  {visibleProjects.map(p => (
                    <option key={p.id} value={p.id} className="bg-nexus-surface">
                      {p.emoji} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-nexus-surface border border-nexus-border/60">
                <span className="text-nexus-text-muted flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Vencimiento
                </span>
                <input
                  type="date"
                  value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                  onChange={e =>
                    handleUpdate({
                      dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    })
                  }
                  className="bg-transparent text-nexus-text font-mono text-right outline-none cursor-pointer"
                />
              </div>

              {/* Reminder Date */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-nexus-surface border border-nexus-border/60">
                <span className="text-nexus-text-muted flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Recordatorio
                </span>
                <input
                  type="datetime-local"
                  value={task.reminderDate ? task.reminderDate.slice(0, 16) : ''}
                  onChange={e =>
                    handleUpdate({
                      reminderDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    })
                  }
                  className="bg-transparent text-nexus-text font-mono text-[11px] text-right outline-none cursor-pointer"
                />
              </div>

              {/* Estimated Minutes */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-nexus-surface border border-nexus-border/60">
                <span className="text-nexus-text-muted flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Estimado (min)
                </span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={task.estimatedMinutes || ''}
                  onChange={e => handleUpdate({ estimatedMinutes: parseInt(e.target.value) || 0 })}
                  placeholder="ej. 60"
                  className="bg-transparent text-nexus-text font-mono text-right w-20 outline-none"
                />
              </div>

              {/* Category */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-nexus-surface border border-nexus-border/60">
                <span className="text-nexus-text-muted flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Categoría
                </span>
                <input
                  type="text"
                  value={task.category || ''}
                  onChange={e => handleUpdate({ category: e.target.value })}
                  placeholder="General"
                  className="bg-transparent text-nexus-text text-right w-28 outline-none"
                />
              </div>
            </div>

            {/* Completed At & Delivery Audit Badge */}
            {task.status === 'done' && (
              <div className="mt-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-nexus-text-secondary">
                    Completada el:{' '}
                    <strong className="text-nexus-text font-mono">
                      {task.completedAt
                        ? format(new Date(task.completedAt), 'dd/MM/yyyy HH:mm', { locale: es })
                        : 'Recientemente'}
                    </strong>
                  </span>
                </div>

                <div>
                  {deliveryStatus === 'on_time' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✔ A tiempo
                    </span>
                  )}
                  {deliveryStatus === 'late' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      ⚠ Retrasado
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Efficiency Ratio Bar (Estimated vs Actual) */}
            {task.estimatedMinutes !== undefined && task.estimatedMinutes > 0 && (
              <div className="p-2.5 rounded-lg bg-nexus-surface border border-nexus-border/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-nexus-text-muted">Eficiencia de Ejecución:</span>
                  <span className="font-mono text-nexus-text font-medium">
                    {task.actualMinutes}m / {task.estimatedMinutes}m{' '}
                    {efficiencyRatio && (
                      <span className={efficiencyRatio >= 1 ? 'text-emerald-400' : 'text-amber-400'}>
                        ({efficiencyRatio.toFixed(2)}x)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2 bg-nexus-surface-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      task.actualMinutes > task.estimatedMinutes
                        ? 'bg-red-400'
                        : task.actualMinutes === task.estimatedMinutes
                        ? 'bg-emerald-400'
                        : 'bg-indigo-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((task.actualMinutes / task.estimatedMinutes) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Tags Display and Add/Remove */}
            <div className="pt-2 border-t border-nexus-border/40 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-nexus-text-muted flex items-center gap-1 mr-1">
                <Tag className="w-3 h-3" /> Tags:
              </span>
              {task.tags.map(t => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-nexus-surface-3 text-nexus-text-secondary border border-nexus-border/60"
                >
                  <span>#{t}</span>
                  <button
                    onClick={() => handleRemoveTag(t)}
                    className="text-nexus-text-muted hover:text-red-400 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}

              {showTagInput ? (
                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    value={newTagInput}
                    onChange={e => setNewTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddTag();
                      if (e.key === 'Escape') setShowTagInput(false);
                    }}
                    placeholder="nuevo-tag..."
                    className="w-24 text-xs bg-nexus-surface text-nexus-text px-2 py-0.5 rounded border border-indigo-500 outline-none"
                  />
                  <button
                    onClick={handleAddTag}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="text-xs text-nexus-text-muted hover:text-nexus-text px-2 py-0.5 rounded border border-dashed border-nexus-border hover:border-nexus-border-hover flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Tag
                </button>
              )}
            </div>
          </div>

          {/* Subtasks Section (Auditable subtasks) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-nexus-text-muted flex items-center gap-1.5">
                <CornerDownRight className="w-3.5 h-3.5 text-indigo-400" />
                <span>Subtareas con Auditoría ({subtasks.length})</span>
              </h3>
            </div>

            {/* Subtask list */}
            <div className="space-y-1.5">
              {subtasks.map(st => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-nexus-surface-2 border border-nexus-border hover:border-nexus-border-hover transition-colors group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={() => {
                        const newStatus: TaskStatus = st.status === 'done' ? 'todo' : 'done';
                        updateTask(st.id, {
                          status: newStatus,
                          completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
                        });
                      }}
                      className="text-nexus-text-muted hover:text-emerald-400 transition-colors shrink-0"
                    >
                      {st.status === 'done' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Circle className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedTaskId(st.id)}
                      className={`text-xs text-left truncate hover:text-indigo-400 cursor-pointer ${
                        st.status === 'done' ? 'line-through text-nexus-text-muted' : 'text-nexus-text'
                      }`}
                      title="Abrir página completa de esta subtarea"
                    >
                      {st.title}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-nexus-text-muted shrink-0">
                    {st.actualMinutes > 0 && <span>{st.actualMinutes}m</span>}
                    <button
                      onClick={() => setSelectedTaskId(st.id)}
                      className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded bg-nexus-surface-3 hover:bg-nexus-surface-2 text-indigo-300 transition-opacity"
                    >
                      Abrir ↗
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Subtask Form */}
            <form onSubmit={handleCreateSubtask} className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                placeholder="Nueva subtarea con su propia página y timer..."
                className="flex-1 text-xs bg-nexus-surface-2 text-nexus-text px-3 py-2 rounded-lg border border-nexus-border focus:border-indigo-500 outline-none"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="px-3 py-2 bg-nexus-surface-3 hover:bg-indigo-600 disabled:opacity-40 text-xs font-medium rounded-lg text-nexus-text hover:text-white transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </form>
          </div>

          {/* Templates Section */}
          <div className="space-y-2 pt-2 border-t border-nexus-border">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-nexus-text-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Plantillas Disponibles</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl.id)}
                  className="p-2.5 rounded-lg bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border hover:border-indigo-500/50 text-left transition-all text-xs font-medium text-nexus-text flex flex-col gap-1 cursor-pointer"
                >
                  <span className="truncate">{tpl.name}</span>
                  <span className="text-[10px] text-nexus-text-muted">Insertar bloques</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notion-Style Page Content & Infinite Markdown Canvas */}
          <div className="space-y-3 pt-2 border-t border-nexus-border">
            {/* Header with Mode Switcher & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-nexus-accent-indigo" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-nexus-text">
                  Hoja de Documento & Notas
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-nexus-surface-2 border border-nexus-border text-emerald-400 font-mono">
                  ✔ Guardado en tiempo real
                </span>
              </div>

              {/* Mode Toggle: Markdown vs Blocks */}
              <div className="flex items-center gap-1 bg-nexus-surface-2 p-1 rounded-xl border border-nexus-border text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEditorMode('markdown');
                    setMarkdownText(blocksToMarkdown(task.pageContent || []));
                  }}
                  className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1.5 ${
                    editorMode === 'markdown'
                      ? 'bg-nexus-surface-3 text-nexus-text font-bold shadow-sm'
                      : 'text-nexus-text-muted hover:text-nexus-text'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Hoja Infinita (Markdown)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditorMode('blocks');
                    const updated = markdownToBlocks(markdownText);
                    updateTask(task.id, { pageContent: updated });
                  }}
                  className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1.5 ${
                    editorMode === 'blocks'
                      ? 'bg-nexus-surface-3 text-nexus-text font-bold shadow-sm'
                      : 'text-nexus-text-muted hover:text-nexus-text'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-pink-400" />
                  <span>Bloques Notion</span>
                </button>
              </div>
            </div>

            {/* Word-Style Sticky Formatting Toolbar */}
            <div className="sticky top-0 z-20 p-1.5 bg-nexus-surface-2/95 backdrop-blur-md rounded-xl border border-nexus-border flex items-center gap-1 overflow-x-auto shadow-sm">
              <button
                type="button"
                onClick={() => insertMarkdownFormatting('**', '**', 'negrita')}
                className="p-1.5 rounded-lg hover:bg-nexus-surface-3 text-nexus-text-muted hover:text-nexus-text transition"
                title="Negrita (**texto**)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownFormatting('*', '*', 'cursiva')}
                className="p-1.5 rounded-lg hover:bg-nexus-surface-3 text-nexus-text-muted hover:text-nexus-text transition"
                title="Cursiva (*texto*)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <div className="w-[1px] h-4 bg-nexus-border mx-0.5" />

              <button
                type="button"
                onClick={() => insertMarkdownFormatting('# ', '', 'Título Principal')}
                className="px-2 py-1 rounded-lg hover:bg-nexus-surface-3 text-[11px] font-bold text-nexus-text-muted hover:text-nexus-text transition"
                title="Título 1 (# )"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownFormatting('## ', '', 'Subtítulo')}
                className="px-2 py-1 rounded-lg hover:bg-nexus-surface-3 text-[11px] font-bold text-nexus-text-muted hover:text-nexus-text transition"
                title="Título 2 (## )"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownFormatting('### ', '', 'Sección')}
                className="px-2 py-1 rounded-lg hover:bg-nexus-surface-3 text-[11px] font-bold text-nexus-text-muted hover:text-nexus-text transition"
                title="Título 3 (### )"
              >
                H3
              </button>
              <div className="w-[1px] h-4 bg-nexus-border mx-0.5" />

              <button
                type="button"
                onClick={() => insertMarkdownFormatting('- ', '', 'Elemento de lista')}
                className="p-1.5 rounded-lg hover:bg-nexus-surface-3 text-nexus-text-muted hover:text-nexus-text transition"
                title="Lista con viñetas (- )"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownFormatting('1. ', '', 'Elemento numerado')}
                className="p-1.5 rounded-lg hover:bg-nexus-surface-3 text-nexus-text-muted hover:text-nexus-text transition"
                title="Lista numerada (1. )"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownFormatting('- [ ] ', '', 'Tarea pendiente')}
                className="p-1.5 rounded-lg hover:bg-nexus-surface-3 text-nexus-text-muted hover:text-nexus-text transition"
                title="Checklist interactivo (- [ ] )"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              </button>
              <div className="w-[1px] h-4 bg-nexus-border mx-0.5" />

              <button
                type="button"
                onClick={() => insertMarkdownFormatting('```typescript\n', '\n```', '// Código')}
                className="p-1.5 rounded-lg hover:bg-nexus-surface-3 text-nexus-text-muted hover:text-nexus-text transition"
                title="Bloque de código"
              >
                <Code className="w-3.5 h-3.5 text-amber-400" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownFormatting('> 💡 ', '', 'Nota destacada')}
                className="p-1.5 rounded-lg hover:bg-nexus-surface-3 text-nexus-text-muted hover:text-nexus-text transition"
                title="Callout / Cita"
              >
                <Quote className="w-3.5 h-3.5 text-cyan-400" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownFormatting('⏱️ ', '', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
                className="p-1.5 rounded-lg hover:bg-nexus-surface-3 text-nexus-text-muted hover:text-nexus-text transition"
                title="Insertar Timestamp"
              >
                <Clock className="w-3.5 h-3.5 text-purple-400" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownFormatting('[[', ']]', 'Nombre de Tarea')}
                className="p-1.5 rounded-lg hover:bg-nexus-surface-3 text-nexus-text-muted hover:text-nexus-text transition"
                title="Insertar WikiLink [[...]]"
              >
                <Link2 className="w-3.5 h-3.5 text-pink-400" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownFormatting('\n---\n', '', '')}
                className="p-1.5 rounded-lg hover:bg-nexus-surface-3 text-nexus-text-muted hover:text-nexus-text transition"
                title="Línea separadora"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Markdown Infinite Canvas View */}
            {editorMode === 'markdown' ? (
              <div className="space-y-2">
                <div className="relative rounded-2xl bg-nexus-surface-2 border border-nexus-border p-4 shadow-inner focus-within:border-nexus-accent-indigo transition">
                  <textarea
                    ref={textareaRef}
                    rows={16}
                    value={markdownText}
                    onChange={e => handleMarkdownChange(e.target.value)}
                    placeholder="Escribe libremente como en Word o Notion: títulos con #, listas con -, checklists con - [ ], código, etc..."
                    className="w-full bg-transparent text-nexus-text text-sm leading-relaxed outline-none resize-y font-sans placeholder-nexus-text-muted min-h-[320px]"
                  />
                  <div className="flex items-center justify-between pt-2 border-t border-nexus-border/40 text-[11px] text-nexus-text-muted">
                    <span>
                      {markdownText.split(/\s+/).filter(Boolean).length} palabras • {markdownText.length} caracteres
                    </span>
                    <span className="font-mono text-nexus-text-muted">Markdown + Controles Word</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[11px] text-nexus-text-muted">Escribe '/' en un párrafo para insertar bloques</span>
                  <button
                    onClick={() => handleAddBlock('paragraph')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Bloque
                  </button>
                </div>

                <div className="space-y-3">
                  {(task.pageContent || []).length === 0 ? (
                    <div
                      onClick={() => handleAddBlock('paragraph')}
                      className="p-6 text-center border border-dashed border-nexus-border rounded-xl text-nexus-text-muted text-xs hover:border-nexus-border-hover hover:bg-nexus-surface-2/30 cursor-pointer"
                    >
                      Escribe algo o presiona <strong className="text-indigo-400">+ Bloque</strong> para comenzar tu documento Notion-style...
                    </div>
                  ) : (
                    task.pageContent.map((block, idx) => {
                  const isSlashActive = activeSlashMenuBlockId === block.id;

                  return (
                    <div
                      key={block.id}
                      className="group relative p-1.5 rounded-lg hover:bg-nexus-surface-2/40 transition-colors border border-transparent hover:border-nexus-border/60"
                    >
                      {/* Block Controls hover menu */}
                      <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-nexus-surface-3/90 px-1.5 py-0.5 rounded-md border border-nexus-border text-nexus-text-muted z-10">
                        <button
                          onClick={() => handleMoveBlock(idx, 'up')}
                          disabled={idx === 0}
                          className="hover:text-nexus-text disabled:opacity-30 p-0.5 cursor-pointer"
                          title="Subir bloque"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveBlock(idx, 'down')}
                          disabled={idx === (task.pageContent?.length || 0) - 1}
                          className="hover:text-nexus-text disabled:opacity-30 p-0.5 cursor-pointer"
                          title="Bajar bloque"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="hover:text-red-400 p-0.5 cursor-pointer"
                          title="Eliminar bloque"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Block Renderers based on type */}
                      {block.type === 'heading1' && (
                        <input
                          type="text"
                          value={block.content}
                          onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                          placeholder="Título grande..."
                          className="w-full text-xl font-bold bg-transparent text-nexus-text border-none focus:outline-none"
                        />
                      )}

                      {block.type === 'heading2' && (
                        <input
                          type="text"
                          value={block.content}
                          onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                          placeholder="Título mediano..."
                          className="w-full text-base font-semibold bg-transparent text-nexus-text border-none focus:outline-none"
                        />
                      )}

                      {block.type === 'heading3' && (
                        <input
                          type="text"
                          value={block.content}
                          onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                          placeholder="Título pequeño..."
                          className="w-full text-sm font-semibold text-nexus-text-secondary bg-transparent border-none focus:outline-none"
                        />
                      )}

                      {block.type === 'paragraph' && (
                        <textarea
                          rows={Math.max(1, Math.ceil(block.content.length / 70))}
                          value={block.content}
                          onChange={e => {
                            const val = e.target.value;
                            if (val.startsWith('/')) {
                              setActiveSlashMenuBlockId(block.id);
                              setSlashSearch(val.slice(1));
                            } else {
                              setActiveSlashMenuBlockId(null);
                            }
                            handleUpdateBlock(block.id, { content: val });
                          }}
                          placeholder="Escribe texto o '/' para ver comandos..."
                          className="w-full text-xs text-nexus-text bg-transparent border-none focus:outline-none resize-none leading-relaxed"
                        />
                      )}

                      {block.type === 'bullet_list' && (
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-nexus-text-muted mt-2 shrink-0" />
                          <input
                            type="text"
                            value={block.content}
                            onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                            placeholder="Elemento de lista..."
                            className="w-full text-xs text-nexus-text bg-transparent border-none focus:outline-none"
                          />
                        </div>
                      )}

                      {block.type === 'numbered_list' && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-nexus-text-muted font-mono mt-0.5 shrink-0">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={block.content}
                            onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                            placeholder="Elemento numerado..."
                            className="w-full text-xs text-nexus-text bg-transparent border-none focus:outline-none"
                          />
                        </div>
                      )}

                      {block.type === 'todo' && (
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => handleUpdateBlock(block.id, { checked: !block.checked })}
                            className="mt-0.5 text-nexus-text-muted hover:text-emerald-400 transition-colors shrink-0"
                          >
                            {block.checked ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <input
                            type="text"
                            value={block.content}
                            onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                            placeholder="Tarea pendiente..."
                            className={`w-full text-xs bg-transparent border-none focus:outline-none ${
                              block.checked ? 'line-through text-nexus-text-muted' : 'text-nexus-text'
                            }`}
                          />
                        </div>
                      )}

                      {block.type === 'code' && (
                        <div className="rounded-lg bg-nexus-bg border border-nexus-border p-3 font-mono text-xs">
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-nexus-border/50 text-nexus-text-muted text-[10px]">
                            <span>Bloque de Código</span>
                            <input
                              type="text"
                              value={block.language || ''}
                              onChange={e => handleUpdateBlock(block.id, { language: e.target.value })}
                              placeholder="lenguaje (ej. go, sql, ts)"
                              className="bg-transparent text-right outline-none text-nexus-text-secondary"
                            />
                          </div>
                          <textarea
                            rows={Math.max(2, block.content.split('\n').length)}
                            value={block.content}
                            onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                            placeholder="// Escribe código aquí..."
                            className="w-full bg-transparent text-emerald-400 font-mono text-xs border-none focus:outline-none resize-none leading-relaxed"
                          />
                        </div>
                      )}

                      {block.type === 'callout' && (
                        <div className="p-3 rounded-lg bg-nexus-surface-2 border-l-4 border-l-indigo-500 border border-nexus-border flex items-start gap-2.5">
                          <MessageSquare className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                          <textarea
                            rows={Math.max(1, Math.ceil(block.content.length / 60))}
                            value={block.content}
                            onChange={e => handleUpdateBlock(block.id, { content: e.target.value })}
                            placeholder="Información destacada o nota clave..."
                            className="w-full text-xs text-nexus-text bg-transparent border-none focus:outline-none resize-none leading-relaxed"
                          />
                        </div>
                      )}

                      {block.type === 'divider' && (
                        <div className="py-2">
                          <hr className="border-nexus-border/70" />
                        </div>
                      )}

                      {block.type === 'timestamp' && (
                        <div className="p-2 rounded-lg bg-nexus-surface-2 border border-nexus-border flex items-center gap-2 text-xs font-mono text-nexus-text-secondary">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>
                            {block.content
                              ? format(new Date(block.content), "d 'de' MMMM yyyy, HH:mm", { locale: es })
                              : 'Ahora'}
                          </span>
                        </div>
                      )}

                      {block.type === 'wikilink' && (
                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-indigo-300">
                            <Link2 className="w-3.5 h-3.5" />
                            <span>
                              {(() => {
                                const target = visibleTasks.find(t => t.id === block.content);
                                return target ? `[[${target.title}]]` : `[[Enlace: ${block.content}]]`;
                              })()}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const target = visibleTasks.find(t => t.id === block.content);
                              if (target) setSelectedTaskId(target.id);
                            }}
                            className="text-[11px] px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 transition-colors cursor-pointer"
                          >
                            Ir a la tarea ↗
                          </button>
                        </div>
                      )}

                      {/* Slash Command Bar Menu */}
                      {isSlashActive && (
                        <div className="absolute left-4 top-10 w-64 bg-nexus-surface-2 border border-nexus-border rounded-xl shadow-2xl p-2 z-50 animate-fade-in max-h-60 overflow-y-auto">
                          <div className="text-[10px] font-bold text-nexus-text-muted uppercase px-2 py-1">
                            Comandos Básicos
                          </div>
                          {SLASH_COMMANDS.filter(cmd =>
                            cmd.label.toLowerCase().includes(slashSearch.toLowerCase()) ||
                            cmd.type.toLowerCase().includes(slashSearch.toLowerCase())
                          ).map(cmd => {
                            const Icon = cmd.icon;
                            return (
                              <button
                                key={cmd.type}
                                onClick={() => handleSelectSlashCommand(block.id, cmd.type)}
                                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs text-nexus-text hover:bg-nexus-surface-3 transition-colors cursor-pointer"
                              >
                                <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <div>
                                  <div className="font-medium">{cmd.label}</div>
                                  <div className="text-[10px] text-nexus-text-muted">{cmd.desc}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Wikilink Selector Dropdown */}
                      {activeWikilinkBlockId === block.id && (
                        <div className="p-3 bg-nexus-surface-2 border border-nexus-border rounded-xl mt-2 space-y-2">
                          <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5" />
                            <span>Selecciona una tarea para enlazar (WikiLink):</span>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {visibleTasks
                              .filter(t => t.id !== task.id)
                              .map(t => (
                                <button
                                  key={t.id}
                                  onClick={() => handleSelectWikilink(block.id, t)}
                                  className="w-full text-left text-xs px-2.5 py-1.5 rounded bg-nexus-surface hover:bg-indigo-600/20 text-nexus-text hover:text-indigo-300 flex items-center justify-between transition-colors"
                                >
                                  <span className="truncate">{t.title}</span>
                                  <span className="text-[10px] text-nexus-text-muted font-mono">{t.priority}</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add block button */}
            <div className="pt-2">
              <button
                onClick={() => handleAddBlock('paragraph')}
                className="w-full py-2 rounded-lg border border-dashed border-nexus-border hover:border-nexus-border-hover text-nexus-text-muted hover:text-nexus-text text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar nuevo bloque</span>
              </button>
            </div>
          </div>
        )}
      </div>

          {/* Time Logs Section */}
          <div className="space-y-2 pt-2 border-t border-nexus-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-nexus-text-muted flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Registros de Tiempo ({taskTimeLogs.length})</span>
            </h3>

            {taskTimeLogs.length === 0 ? (
              <p className="text-xs text-nexus-text-muted italic bg-nexus-surface-2/40 p-3 rounded-lg border border-nexus-border/40">
                Sin sesiones registradas aún. ¡Inicia el temporizador arriba para acumular minutos automáticamente!
              </p>
            ) : (
              <div className="space-y-1.5">
                {taskTimeLogs.map(log => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-nexus-surface-2 border border-nexus-border text-xs font-mono"
                  >
                    <div>
                      <span className="text-nexus-text font-bold text-indigo-400">+{log.durationMinutes} min</span>
                      {log.note && (
                        <span className="text-nexus-text-muted font-sans ml-2 text-[11px]">— {log.note}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-nexus-text-muted">
                      {format(new Date(log.endedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backlinks Section */}
          <div className="space-y-2 pt-2 border-t border-nexus-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-nexus-text-muted flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Backlinks & Menciones ({backlinks.length})</span>
            </h3>

            {backlinks.length === 0 ? (
              <p className="text-xs text-nexus-text-muted italic bg-nexus-surface-2/40 p-3 rounded-lg border border-nexus-border/40">
                Esta tarea no ha sido vinculada desde otras notas o tareas todavía.
              </p>
            ) : (
              <div className="space-y-1.5">
                {backlinks.map(bTask => (
                  <button
                    key={bTask.id}
                    onClick={() => setSelectedTaskId(bTask.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-left transition-colors cursor-pointer"
                  >
                    <span className="text-xs text-nexus-text hover:text-indigo-400 font-medium truncate">
                      ← Mencionado en: {bTask.title}
                    </span>
                    <span className="text-[10px] text-nexus-text-muted font-mono">{bTask.priority}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
