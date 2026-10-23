import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  List,
  ListOrdered,
  Info,
  CheckCircle2,
  Minus,
  Sparkles,
  ExternalLink,
  ArrowUpRight,
  Bookmark,
  Share2,
  ArrowUp,
  ArrowDown,
  Layers,
  FileText,
  Bold,
  Italic,
  Quote,
  Clock,
  RotateCcw,
  Flame,
  Heart,
  Wand2,
  Play,
  Check,
  Search,
  Link2,
  Unlink,
  Save,
  Target,
  FolderKanban,
  X,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { DailyNote, PageBlock, BlockType, Owner, TaskTemplate, Task } from '../../types/nexus';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, addDays, subDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import MarkdownStudio from '../../components/ui/MarkdownStudio';
import CreateTemplateModal from '../../components/ui/CreateTemplateModal';

const SLASH_COMMANDS: { type: BlockType; label: string; icon: any; desc: string }[] = [
  { type: 'paragraph', label: 'Texto', icon: AlignLeft, desc: 'Párrafo de texto simple' },
  { type: 'heading1', label: 'Encabezado 1', icon: Heading1, desc: 'Título principal grande' },
  { type: 'heading2', label: 'Encabezado 2', icon: Heading2, desc: 'Subtítulo mediano' },
  { type: 'heading3', label: 'Encabezado 3', icon: Heading3, desc: 'Sección pequeña' },
  { type: 'todo', label: 'Lista de tareas', icon: CheckSquare, desc: 'Seguimiento con casillas' },
  { type: 'bullet_list', label: 'Viñetas', icon: List, desc: 'Lista simple con puntos' },
  { type: 'numbered_list', label: 'Lista numerada', icon: ListOrdered, desc: 'Lista con secuencia' },
  { type: 'code', label: 'Bloque de código', icon: Code, desc: 'Fragmento de código monoespaciado' },
  { type: 'callout', label: 'Destacado / Callout', icon: Info, desc: 'Cuadro de énfasis visual' },
  { type: 'divider', label: 'Divisor', icon: Minus, desc: 'Línea horizontal divisoria' },
];

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

// ─── Exhaustive Daily Note Templates ──────────────────────────────
const getLifeOSTemplate = (): PageBlock[] => [
  { id: uuidv4(), type: 'heading2', content: '🌅 1. ENFOQUE MATUTINO & INTENCIÓN' },
  {
    id: uuidv4(),
    type: 'callout',
    content: '☀️ Intención del día: Concentración plena en lo esencial, cero distracciones y cuidar el bienestar personal y en pareja.',
    calloutType: 'info',
  },
  { id: uuidv4(), type: 'heading2', content: '🎯 2. TOP 3 OBJETIVOS PRIORITARIOS (Must-Do)' },
  { id: uuidv4(), type: 'todo', content: '🚀 Objetivo 1: Avance crítico en microservicio / módulo principal', checked: false },
  { id: uuidv4(), type: 'todo', content: '⚡ Objetivo 2: Resolver tarea bloqueante o bugfix urgente', checked: false },
  { id: uuidv4(), type: 'todo', content: '🌿 Objetivo 3: Sesión de hábitos y bienestar de calidad', checked: false },
  { id: uuidv4(), type: 'heading2', content: '⚡ 3. BLOQUES DE TIEMPO & AGENDA' },
  { id: uuidv4(), type: 'todo', content: '☕ 08:30 - 10:30 | Deep Work: Arquitectura y código sin interrupciones', checked: false },
  { id: uuidv4(), type: 'todo', content: '💻 11:00 - 12:30 | Revisión de pull requests, emails y coordinación', checked: false },
  { id: uuidv4(), type: 'todo', content: '🥗 13:00 - 14:00 | Almuerzo tranquilo sin pantallas', checked: false },
  { id: uuidv4(), type: 'todo', content: '🛠️ 14:30 - 17:00 | Desarrollo y pruebas en entorno local', checked: false },
  { id: uuidv4(), type: 'todo', content: '🏃 17:30 - 18:30 | Actividad física, estiramientos o caminata', checked: false },
  { id: uuidv4(), type: 'todo', content: '💑 19:30 - 21:30 | Cena y tiempo de calidad con Cami / David', checked: false },
  { id: uuidv4(), type: 'heading2', content: '💡 4. BITÁCORA TÉCNICA & APRENDIZAJES' },
  { id: uuidv4(), type: 'paragraph', content: 'Documenta aquí descubrimientos técnicos, decisiones de base de datos o comandos clave del día...' },
  { id: uuidv4(), type: 'code', content: '// Snippet técnico de referencia rápida\ngit status && npm run test', language: 'bash' },
  { id: uuidv4(), type: 'heading2', content: '💑 5. ACUERDOS & NOTAS DE PAREJA' },
  { id: uuidv4(), type: 'todo', content: '🛒 Coordinar compras o pendientes del hogar', checked: false },
  { id: uuidv4(), type: 'todo', content: '✈️ Revisión del presupuesto o planes de viaje', checked: false },
  { id: uuidv4(), type: 'heading2', content: '🏆 6. VICTORIAS DEL DÍA & REFLEXIÓN NOCTURNA' },
  {
    id: uuidv4(),
    type: 'callout',
    content: '🌟 3 cosas por las que doy gracias hoy: 1) Buena salud y energía, 2) Trabajo con propósito, 3) Paz en el hogar.',
    calloutType: 'info',
  },
];

const getTechSprintTemplate = (): PageBlock[] => [
  { id: uuidv4(), type: 'heading2', content: '💻 SPRINT DE INGENIERÍA & ARQUITECTURA' },
  {
    id: uuidv4(),
    type: 'callout',
    content: '🔥 Objetivo del sprint: Entregar código limpio, tests unitarios pasando y 0 errores en build.',
    calloutType: 'info',
  },
  { id: uuidv4(), type: 'heading3', content: '🎯 Tareas Críticas de Código' },
  { id: uuidv4(), type: 'todo', content: '🛠️ Implementar endpoints y validación de tipos en TypeScript/Go', checked: false },
  { id: uuidv4(), type: 'todo', content: '🧪 Escribir tests unitarios y verificar cobertura', checked: false },
  { id: uuidv4(), type: 'todo', content: '🚀 Optimizar índices de base de datos y tiempos de respuesta', checked: false },
  { id: uuidv4(), type: 'heading3', content: '📝 Bitácora de Cambios & Comandos' },
  { id: uuidv4(), type: 'code', content: '# Comandos del día\nnpx tsc --noEmit\nnpm run build', language: 'bash' },
  { id: uuidv4(), type: 'heading3', content: '🏁 Cierre y Retrospectiva' },
  { id: uuidv4(), type: 'paragraph', content: 'Resumen de qué funcionó bien hoy y qué bloqueos se resolvieron...' },
];

const getWellnessCoupleTemplate = (): PageBlock[] => [
  { id: uuidv4(), type: 'heading2', content: '🌿 BIENESTAR, HÁBITOS & CONEXIÓN EN PAREJA' },
  {
    id: uuidv4(),
    type: 'callout',
    content: '💖 Intención: Desconectar del trabajo mental, reconectar con uno mismo y compartir tiempo de calidad.',
    calloutType: 'info',
  },
  { id: uuidv4(), type: 'heading3', content: '🧘 Hábitos de Cuidado Personal' },
  { id: uuidv4(), type: 'todo', content: '💧 Beber al menos 2.5 litros de agua hoy', checked: false },
  { id: uuidv4(), type: 'todo', content: '🥑 Alimentación balanceada y comida casera', checked: false },
  { id: uuidv4(), type: 'todo', content: '🏃 Entrenamiento o sesión de yoga de 30 minutos', checked: false },
  { id: uuidv4(), type: 'todo', content: '📚 20 minutos de lectura libre o meditación', checked: false },
  { id: uuidv4(), type: 'heading3', content: '💑 Momentos en Pareja' },
  { id: uuidv4(), type: 'todo', content: '☕ Conversación matutina con café sin celular', checked: false },
  { id: uuidv4(), type: 'todo', content: '🎬 Plan relajante para la noche: cena rica o película', checked: false },
  { id: uuidv4(), type: 'heading3', content: '✨ Gratitud del Día' },
  { id: uuidv4(), type: 'paragraph', content: 'Escribe aquí los momentos o gestos especiales vividos hoy...' },
];

export default function DailyNoteView() {
  const {
    dailyNotes,
    upsertDailyNote,
    currentOwner,
    currentUser,
    accounts,
    tasks,
    projects,
    habits,
    setSelectedTaskId,
    updateTask,
    toggleTaskStatus,
    startTimer,
    customTemplates,
    deleteCustomTemplate,
  } = useNexusStore();

  const currentAccount = accounts.find(a => a.owner === currentOwner || a.id === currentUser?.id);
  const currentDisplayName = currentUser?.displayName || currentAccount?.displayName || 'Mi Usuario';
  const currentAvatar = currentAccount?.avatar || currentUser?.avatar || '👤';

  const [currentDateStr, setCurrentDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Editor mode: 'blocks' | 'markdown'
  const [editorMode, setEditorMode] = useState<'blocks' | 'markdown'>('blocks');
  const [markdownText, setMarkdownText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [slashMenuBlockIndex, setSlashMenuBlockIndex] = useState<number | null>(null);
  const [wikiLinkPromptIndex, setWikiLinkPromptIndex] = useState<number | null>(null);
  const [wikiLinkQuery, setWikiLinkQuery] = useState('');

  // Custom template modal & Task linking states
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [templateInitialMarkdown, setTemplateInitialMarkdown] = useState('');
  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  // Find daily note for date reactively from store
  const note = useMemo(() => {
    return dailyNotes.find(n => n.date === currentDateStr && n.owner === currentOwner);
  }, [dailyNotes, currentDateStr, currentOwner]);

  useEffect(() => {
    if (!note && currentOwner) {
      const newNote: DailyNote = {
        id: `dn-${currentOwner}-${currentDateStr}`,
        date: currentDateStr,
        owner: currentOwner,
        content: getLifeOSTemplate(),
        wikiLinks: [],
      };
      upsertDailyNote(newNote);
    }
  }, [currentDateStr, note, currentOwner, upsertDailyNote]);

  const activeContent: PageBlock[] = useMemo(() => {
    if (note?.content && note.content.length > 0) return note.content;
    return getLifeOSTemplate();
  }, [note?.content]);

  // Sync markdownText whenever note, activeContent, or editorMode changes
  useEffect(() => {
    if (editorMode === 'markdown') {
      setMarkdownText(blocksToMarkdown(activeContent));
    }
  }, [note?.id, currentDateStr, editorMode, activeContent]);

  // Update whole note safely
  const updateNoteContent = (newBlocks: PageBlock[], additionalWikiLinks?: string[]) => {
    const existing: DailyNote = note || {
      id: `dn-${currentOwner}-${currentDateStr}`,
      date: currentDateStr,
      owner: currentOwner || 'david',
      content: newBlocks,
      wikiLinks: [],
    };
    const combinedWikiLinks = Array.from(
      new Set([...(existing.wikiLinks || []), ...(additionalWikiLinks || [])])
    );
    upsertDailyNote({
      ...existing,
      content: newBlocks,
      wikiLinks: combinedWikiLinks,
    });
  };

  const handleUpdateBlock = (index: number, updates: Partial<PageBlock>) => {
    const newBlocks = [...activeContent];
    newBlocks[index] = { ...newBlocks[index], ...updates };

    if (typeof updates.content === 'string') {
      const val = updates.content;
      if (val === '/') {
        setSlashMenuBlockIndex(index);
      } else if (val.includes('[[')) {
        const lastIdx = val.lastIndexOf('[[');
        const query = val.slice(lastIdx + 2);
        if (!query.includes(']]')) {
          setWikiLinkPromptIndex(index);
          setWikiLinkQuery(query);
        } else {
          setWikiLinkPromptIndex(null);
        }
      } else {
        if (slashMenuBlockIndex === index) setSlashMenuBlockIndex(null);
        if (wikiLinkPromptIndex === index) setWikiLinkPromptIndex(null);
      }
    }

    updateNoteContent(newBlocks);
  };

  const handleAddBlockBelow = (index: number, type: BlockType = 'paragraph') => {
    const newBlock: PageBlock = {
      id: uuidv4(),
      type,
      content: '',
      checked: type === 'todo' ? false : undefined,
      calloutType: type === 'callout' ? 'info' : undefined,
    };
    const newBlocks = [...activeContent];
    newBlocks.splice(index + 1, 0, newBlock);
    updateNoteContent(newBlocks);
    setSlashMenuBlockIndex(null);
  };

  const handleDeleteBlock = (index: number) => {
    if (activeContent.length <= 1) return;
    const newBlocks = activeContent.filter((_, i) => i !== index);
    updateNoteContent(newBlocks);
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === activeContent.length - 1)
    ) {
      return;
    }
    const newBlocks = [...activeContent];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    updateNoteContent(newBlocks);
  };

  const handleChangeBlockType = (index: number, type: BlockType) => {
    const newBlocks = [...activeContent];
    const prev = newBlocks[index];
    newBlocks[index] = {
      ...prev,
      type,
      content: prev.content.replace(/^\//, ''),
      checked: type === 'todo' ? false : undefined,
    };
    updateNoteContent(newBlocks);
    setSlashMenuBlockIndex(null);
  };

  const handleApplyTemplate = (templateName: 'lifeos' | 'tech' | 'wellness' | 'clean') => {
    if (
      activeContent.length > 3 &&
      !window.confirm('¿Deseas aplicar esta plantilla? Se reemplazará el contenido actual de la nota del día.')
    ) {
      return;
    }

    let newBlocks: PageBlock[] = [];
    if (templateName === 'lifeos') newBlocks = getLifeOSTemplate();
    else if (templateName === 'tech') newBlocks = getTechSprintTemplate();
    else if (templateName === 'wellness') newBlocks = getWellnessCoupleTemplate();
    else if (templateName === 'clean') {
      newBlocks = [
        { id: uuidv4(), type: 'heading2', content: '📝 Notas Rápidas' },
        { id: uuidv4(), type: 'paragraph', content: '' },
      ];
    }

    updateNoteContent(newBlocks);
    setMarkdownText(blocksToMarkdown(newBlocks));
  };

  const handleApplyCustomTemplate = (template: TaskTemplate) => {
    if (
      activeContent.length > 3 &&
      !window.confirm(`¿Deseas aplicar la plantilla "${template.name}"? Se reemplazará el contenido actual de la nota del día.`)
    ) {
      return;
    }

    let newBlocks: PageBlock[] = [];
    if (template.blocks && template.blocks.length > 0) {
      newBlocks = template.blocks.map(b => ({ ...b, id: uuidv4() }));
    } else if (template.markdown) {
      newBlocks = markdownToBlocks(template.markdown);
    } else {
      newBlocks = [
        { id: uuidv4(), type: 'heading2', content: `${template.icon || '📝'} ${template.name}` },
        { id: uuidv4(), type: 'paragraph', content: template.description || '' },
      ];
    }

    updateNoteContent(newBlocks);
    setMarkdownText(blocksToMarkdown(newBlocks));
  };

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMarkdownChange = (val: string) => {
    setMarkdownText(val);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const converted = markdownToBlocks(val);
      updateNoteContent(converted);
    }, 250);
  };

  const handleFlushMarkdown = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      const converted = markdownToBlocks(markdownText);
      updateNoteContent(converted);
    }
  };

  const insertMarkdownFormatting = (prefix: string, suffix = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = markdownText.substring(start, end) || placeholder;
    const replacement = `${prefix}${selected}${suffix}`;
    const nextText =
      markdownText.substring(0, start) + replacement + markdownText.substring(end);
    handleMarkdownChange(nextText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 10);
  };

  // Date Navigation
  const handlePrevDay = () => {
    const prev = subDays(parseISO(currentDateStr), 1);
    setCurrentDateStr(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const next = addDays(parseISO(currentDateStr), 1);
    setCurrentDateStr(format(next, 'yyyy-MM-dd'));
  };

  const handleToday = () => {
    setCurrentDateStr(format(new Date(), 'yyyy-MM-dd'));
  };

  // Formatted date title
  let formattedDateHeader = currentDateStr;
  try {
    formattedDateHeader = format(parseISO(currentDateStr), "EEEE, d 'de' MMMM 'de' yyyy", {
      locale: es,
    });
    formattedDateHeader =
      formattedDateHeader.charAt(0).toUpperCase() + formattedDateHeader.slice(1);
  } catch {
    // fallback
  }

  // Task / Checkbox stats
  const todoBlocks = activeContent.filter(b => b.type === 'todo');
  const completedTodoCount = todoBlocks.filter(b => b.checked).length;
  const todoPercent = todoBlocks.length > 0 ? Math.round((completedTodoCount / todoBlocks.length) * 100) : 0;

  // Backlinks & Outgoing links
  const allWorkspaceItems = useMemo(() => {
    const items: { id: string; title: string; type: string }[] = [];
    tasks.forEach(t => items.push({ id: t.id, title: t.title, type: 'task' }));
    projects.forEach(p => items.push({ id: p.id, title: `${p.emoji} ${p.name}`, type: 'project' }));
    habits.forEach(h => items.push({ id: h.id, title: `${h.icon} ${h.name}`, type: 'habit' }));
    return items;
  }, [tasks, projects, habits]);

  const backlinks = useMemo(() => {
    if (!note) return [];
    return tasks.filter(
      t =>
        (t.wikiLinks && t.wikiLinks.includes(note.id)) ||
        t.title.includes(currentDateStr) ||
        t.pageContent?.some(b => b.content.includes(currentDateStr))
    );
  }, [tasks, note, currentDateStr]);

  const outgoingLinks = useMemo(() => {
    if (!note?.wikiLinks) return [];
    return allWorkspaceItems.filter(item => note.wikiLinks.includes(item.id));
  }, [note, allWorkspaceItems]);

  const wikiSuggestions = useMemo(() => {
    if (wikiLinkPromptIndex === null) return [];
    const q = wikiLinkQuery.toLowerCase().trim();
    return allWorkspaceItems.filter(i => i.title.toLowerCase().includes(q)).slice(0, 6);
  }, [wikiLinkPromptIndex, wikiLinkQuery, allWorkspaceItems]);

  // Tasks specifically linked to this daily note
  const linkedProjectTasks = useMemo(() => {
    if (!note) return [];
    return tasks.filter(t => {
      const isWikiLinked =
        note.wikiLinks?.includes(t.id) ||
        note.wikiLinks?.includes(t.title) ||
        note.content?.some(b => b.content.includes(`[[${t.title}]]`)) ||
        (editorMode === 'markdown' && markdownText.includes(`[[${t.title}]]`));
      const isBacklinked =
        t.wikiLinks?.includes(note.id) ||
        t.wikiLinks?.includes(currentDateStr);
      return isWikiLinked || isBacklinked;
    });
  }, [tasks, note, currentDateStr, editorMode, markdownText]);

  // Tasks available to be linked
  const availableProjectTasks = useMemo(() => {
    const linkedIds = new Set(linkedProjectTasks.map(t => t.id));
    const q = taskSearchQuery.toLowerCase().trim();
    return tasks.filter(t => {
      if (linkedIds.has(t.id)) return false;
      if (!q) return true;
      const project = projects.find(p => p.id === t.projectId || (p.taskIds && p.taskIds.includes(t.id)));
      return (
        t.title.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (project && project.name.toLowerCase().includes(q))
      );
    });
  }, [tasks, linkedProjectTasks, taskSearchQuery, projects]);

  const handleLinkTask = (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    // Update daily note wikiLinks
    const currentLinks = note?.wikiLinks || [];
    if (!currentLinks.includes(taskId)) {
      updateNoteContent(activeContent, [...currentLinks, taskId]);
    }

    // Bi-directionally update task's wikiLinks
    const taskLinks = targetTask.wikiLinks || [];
    const noteRef = note?.id || `dn-${currentOwner}-${currentDateStr}`;
    if (!taskLinks.includes(noteRef) || !taskLinks.includes(currentDateStr)) {
      const newLinks = Array.from(new Set([...taskLinks, noteRef, currentDateStr]));
      updateTask(taskId, {
        wikiLinks: newLinks,
      });
    }
  };

  const handleUnlinkTask = (taskId: string) => {
    if (!note) return;
    const newLinks = (note.wikiLinks || []).filter(id => id !== taskId);
    const existing: DailyNote = {
      ...note,
      wikiLinks: newLinks,
    };
    upsertDailyNote(existing);

    const targetTask = tasks.find(t => t.id === taskId);
    if (targetTask && targetTask.wikiLinks) {
      updateTask(taskId, {
        wikiLinks: targetTask.wikiLinks.filter(l => l !== note.id && l !== currentDateStr),
      });
    }
  };

  const handleInsertTaskIntoNote = (task: Task) => {
    const linkStr = `\n- [${task.status === 'done' ? 'x' : ' '}] [[${task.title}]] (${task.priority})\n`;
    if (editorMode === 'markdown') {
      const nextText = markdownText ? `${markdownText.trimEnd()}\n${linkStr}` : linkStr.trim();
      handleMarkdownChange(nextText);
    } else {
      const newBlock: PageBlock = {
        id: uuidv4(),
        type: 'todo',
        content: `[[${task.title}]] (${task.priority})`,
        checked: task.status === 'done',
      };
      updateNoteContent([...activeContent, newBlock]);
    }
    handleLinkTask(task.id);
  };

  const handleSelectWikiLink = (item: { id: string; title: string; type?: string }) => {
    if (wikiLinkPromptIndex === null) return;
    const block = activeContent[wikiLinkPromptIndex];
    if (!block) return;
    const lastIdx = block.content.lastIndexOf('[[');
    const newContent = `${block.content.slice(0, lastIdx)}[[${item.title}]] `;
    handleUpdateBlock(wikiLinkPromptIndex, { content: newContent });
    setWikiLinkPromptIndex(null);
    if (item.type === 'task') {
      handleLinkTask(item.id);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto space-y-8 select-text pb-20">
      {/* ─── Top Bar: Date Navigator & Switcher ─────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-nexus-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-nexus-text-muted uppercase tracking-wider">
            <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
            <span>Diario Personal</span>
            <span className="text-nexus-border">•</span>
            <span className="text-indigo-400 font-bold flex items-center gap-1">
              <span>{currentAvatar}</span>
              <span>{currentDisplayName}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-nexus-text tracking-tight flex items-center gap-2.5">
            <span>📝 Nota del Día</span>
            <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-nexus-surface-2 border border-nexus-border text-emerald-400">
              ✔ Autoguardado
            </span>
          </h1>
          <p className="text-sm font-medium text-nexus-text-secondary">{formattedDateHeader}</p>
        </div>

        {/* Date switcher controls */}
        <div className="flex items-center gap-2 self-start sm:self-center bg-nexus-surface border border-nexus-border p-1 rounded-2xl shadow-lg">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition cursor-pointer"
            title="Día anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              isToday(parseISO(currentDateStr))
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2'
            }`}
          >
            Hoy
          </button>

          <input
            type="date"
            value={currentDateStr}
            onChange={e => e.target.value && setCurrentDateStr(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text focus:outline-none focus:border-indigo-500 font-mono"
          />

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition cursor-pointer"
            title="Día siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Templates Bar & Progress Stats ─────────────────────── */}
      <div className="p-4 rounded-2xl bg-nexus-surface border border-nexus-border shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-nexus-text">
              Plantillas Rápidas
            </span>
          </div>

          {/* Mode Switcher: Blocks vs Markdown */}
          <div className="flex items-center gap-1 bg-nexus-surface-2 p-1 rounded-xl border border-nexus-border text-xs">
            <button
              type="button"
              onClick={() => {
                setEditorMode('blocks');
                if (markdownText) {
                  const updated = markdownToBlocks(markdownText);
                  updateNoteContent(updated);
                }
              }}
              className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1.5 ${
                editorMode === 'blocks'
                  ? 'bg-nexus-surface-3 text-nexus-text font-bold shadow-sm'
                  : 'text-nexus-text-muted hover:text-nexus-text'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bloques Notion</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditorMode('markdown');
                setMarkdownText(blocksToMarkdown(activeContent));
              }}
              className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1.5 ${
                editorMode === 'markdown'
                  ? 'bg-nexus-surface-3 text-nexus-text font-bold shadow-sm'
                  : 'text-nexus-text-muted hover:text-nexus-text'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-pink-400" />
              <span>Hoja Infinita (Markdown)</span>
            </button>
          </div>
        </div>

        {/* Template Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-nexus-border/60">
          <button
            type="button"
            onClick={() => handleApplyTemplate('lifeos')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-xs font-medium text-nexus-text transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>🌟 Master LifeOS Completa</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyTemplate('tech')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-xs font-medium text-nexus-text transition cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>💻 Sprint Tech & Arquitectura</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyTemplate('wellness')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-xs font-medium text-nexus-text transition cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 text-pink-400" />
            <span>🌿 Bienestar & Pareja</span>
          </button>

          {/* Plantillas Personalizadas */}
          {customTemplates.map(tpl => (
            <div
              key={tpl.id}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-xs font-medium text-nexus-text transition group"
            >
              <button
                type="button"
                onClick={() => handleApplyCustomTemplate(tpl)}
                className="flex items-center gap-1.5 cursor-pointer text-left"
                title={tpl.description || tpl.name}
              >
                <span>{tpl.icon || '📝'}</span>
                <span className="group-hover:text-indigo-400">{tpl.name}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`¿Eliminar la plantilla "${tpl.name}"?`)) {
                    deleteCustomTemplate(tpl.id);
                  }
                }}
                className="text-nexus-text-muted hover:text-red-400 p-0.5 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer ml-1"
                title="Eliminar plantilla"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Botones para crear y guardar plantilla */}
          <button
            type="button"
            onClick={() => {
              setTemplateInitialMarkdown('');
              setIsCreateTemplateOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
            title="Diseñar una nueva plantilla personalizada"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Plantilla</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTemplateInitialMarkdown(blocksToMarkdown(activeContent));
              setIsCreateTemplateOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-xs font-medium text-nexus-text-secondary hover:text-nexus-text transition cursor-pointer"
            title="Guardar el contenido actual como una plantilla reutilizable"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guardar como Plantilla</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyTemplate('clean')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-xs text-nexus-text-muted hover:text-nexus-text transition cursor-pointer ml-auto"
            title="Reiniciar a hoja en blanco"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>

        {/* Task Completion Progress Bar */}
        {todoBlocks.length > 0 && (
          <div className="pt-2 border-t border-nexus-border/60 space-y-1.5">
            <div className="flex justify-between text-xs text-nexus-text-muted font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cumplimiento de tareas del día</span>
              </span>
              <span className="font-semibold text-nexus-text font-mono">
                {todoPercent}% ({completedTodoCount} de {todoBlocks.length})
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-nexus-surface-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${todoPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── Widget: Tareas de Proyectos Trabajadas Hoy ───────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-nexus-surface border border-nexus-border shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-nexus-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-nexus-text">
                  🎯 Tareas de Proyectos Trabajadas Hoy
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-nexus-surface-3 font-mono font-semibold text-indigo-400">
                  {linkedProjectTasks.length}
                </span>
              </div>
              <p className="text-xs text-nexus-text-muted">
                Conecta las tareas de tus proyectos que avanzas hoy: marca su estado, inicia el temporizador o insértalas en tu bitácora.
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTaskPickerOpen(prev => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition cursor-pointer"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>+ Vincular Tarea de Proyecto</span>
            </button>

            {/* Task Picker Dropdown */}
            {isTaskPickerOpen && (
              <div className="absolute right-0 top-full mt-2 z-40 w-80 sm:w-96 rounded-2xl border border-nexus-border bg-nexus-surface p-3 shadow-2xl space-y-2 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-nexus-border/60">
                  <span className="text-xs font-bold text-nexus-text">Seleccionar Tarea</span>
                  <button
                    type="button"
                    onClick={() => setIsTaskPickerOpen(false)}
                    className="p-1 rounded-lg text-nexus-text-muted hover:text-nexus-text transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-nexus-text-muted absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={taskSearchQuery}
                    onChange={e => setTaskSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre o proyecto..."
                    className="w-full bg-nexus-surface-2 border border-nexus-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-nexus-text placeholder-nexus-text-muted focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1">
                  {availableProjectTasks.map(t => {
                    const project = projects.find(
                      p => p.id === t.projectId || (p.taskIds && p.taskIds.includes(t.id))
                    );
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          handleLinkTask(t.id);
                          setIsTaskPickerOpen(false);
                          setTaskSearchQuery('');
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-nexus-surface-2 transition text-left group cursor-pointer border border-transparent hover:border-nexus-border/60"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-medium text-nexus-text truncate group-hover:text-indigo-400">
                            {t.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-nexus-text-muted mt-0.5">
                            {project && (
                              <span className="font-semibold text-nexus-text-secondary truncate">
                                {project.emoji} {project.name}
                              </span>
                            )}
                            {project && <span>•</span>}
                            <span className="font-mono">{t.priority}</span>
                            <span>•</span>
                            <span className="capitalize">{t.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-nexus-text-muted group-hover:text-indigo-400 shrink-0" />
                      </button>
                    );
                  })}
                  {availableProjectTasks.length === 0 && (
                    <div className="p-3 text-center text-xs text-nexus-text-muted">
                      {taskSearchQuery ? 'No se encontraron tareas con ese término' : 'Todas las tareas disponibles ya están vinculadas'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Linked Tasks List */}
        {linkedProjectTasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5">
            {linkedProjectTasks.map(t => {
              const project = projects.find(
                p => p.id === t.projectId || (p.taskIds && p.taskIds.includes(t.id))
              );
              const isDone = t.status === 'done';

              return (
                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-nexus-surface-2/60 border border-nexus-border hover:border-indigo-500/40 transition group shadow-sm"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(t.id)}
                      className="mt-0.5 sm:mt-0 text-nexus-text-muted hover:text-emerald-400 transition shrink-0 cursor-pointer"
                      title={isDone ? 'Marcar como pendiente' : 'Marcar como completada'}
                    >
                      {isDone ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTaskId(t.id)}
                          className={`text-xs font-semibold text-left truncate hover:text-indigo-400 transition cursor-pointer ${
                            isDone ? 'line-through text-nexus-text-muted' : 'text-nexus-text'
                          }`}
                          title="Abrir hoja de tarea"
                        >
                          {t.title}
                        </button>
                        <ExternalLink
                          onClick={() => setSelectedTaskId(t.id)}
                          className="w-3 h-3 text-nexus-text-muted hover:text-indigo-400 shrink-0 cursor-pointer"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-nexus-text-muted">
                        {project && (
                          <span className="px-2 py-0.5 rounded-md bg-nexus-surface-3 border border-nexus-border text-nexus-text-secondary font-medium flex items-center gap-1">
                            <span>{project.emoji}</span>
                            <span className="truncate max-w-[120px]">{project.name}</span>
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-nexus-surface-3 font-mono text-[10px] text-nexus-text-muted">
                          {t.priority}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            isDone
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : t.status === 'in_progress'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-nexus-surface-3 text-nexus-text-muted'
                          }`}
                        >
                          {isDone ? 'Completada' : t.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => startTimer(t.id, 'task', t.title)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-[11px] font-medium text-indigo-400 transition cursor-pointer"
                      title="Iniciar temporizador Pomodoro / enfoque para esta tarea"
                    >
                      <Play className="w-3 h-3" />
                      <span>Enfoque</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInsertTaskIntoNote(t)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-nexus-surface-3 hover:bg-nexus-surface-2 border border-nexus-border text-[11px] font-medium text-nexus-text-muted hover:text-nexus-text transition cursor-pointer"
                      title="Insertar viñeta con [[tarea]] en el contenido de la nota de hoy"
                    >
                      <Plus className="w-3 h-3" />
                      <span>En Nota</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUnlinkTask(t.id)}
                      className="p-1 rounded-lg text-nexus-text-muted hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                      title="Desvincular de la nota de hoy"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-nexus-surface-2/40 border border-dashed border-nexus-border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-nexus-text">
                No hay tareas de proyectos vinculadas a hoy
              </p>
              <p className="text-[11px] text-nexus-text-muted">
                Vincula las tareas en las que vas a avanzar hoy para darles seguimiento, cronometrar tu tiempo y conectarlas en el Grafo de Conocimiento, o escribe <span className="font-mono text-indigo-400">[[</span> en el texto para enlazarlas al escribir.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsTaskPickerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-nexus-surface-3 hover:bg-nexus-surface-2 border border-nexus-border text-xs font-medium text-indigo-400 transition shrink-0 cursor-pointer"
            >
              + Vincular primera tarea
            </button>
          </div>
        )}
      </div>

      {/* ─── Mode 1: Markdown Infinite Canvas (Studio with Preview & Slash Menu) ─── */}
      {editorMode === 'markdown' ? (
        <MarkdownStudio
          value={markdownText}
          onChange={handleMarkdownChange}
          onBlur={handleFlushMarkdown}
          placeholder="Escribe libremente como en Word o Obsidian: títulos con #, listas con -, tareas con - [ ], etc... Escribe / para comandos o [[ para enlazar."
          minHeight="460px"
          contextTitle={`Nota del día - ${currentDateStr}`}
          onWikiLinkSelect={(item) => {
            if (item.type === 'task') {
              handleLinkTask(item.id);
            }
          }}
          onWikiLinkClick={(wikiTitle) => {
            const targetTask = tasks.find(t => t.title.toLowerCase() === wikiTitle.toLowerCase());
            if (targetTask) setSelectedTaskId(targetTask.id);
          }}
        />
      ) : (
        /* ─── Mode 2: Notion Structured Blocks ─────────────────── */
        <div className="space-y-2 min-h-96 relative">
          {activeContent.map((block, idx) => {
            return (
              <div
                key={block.id}
                className="group relative rounded-2xl hover:bg-nexus-surface-2/40 transition duration-150 p-2 sm:px-3 border border-transparent hover:border-nexus-border/50"
              >
                {/* Sleek top-right hover menu that NEVER collides with text */}
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-nexus-surface-3/95 backdrop-blur-md px-1.5 py-1 rounded-xl border border-nexus-border shadow-md z-10">
                  <button
                    type="button"
                    onClick={() => handleMoveBlock(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded text-nexus-text-muted hover:text-nexus-text disabled:opacity-20 transition cursor-pointer"
                    title="Subir bloque"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveBlock(idx, 'down')}
                    disabled={idx === activeContent.length - 1}
                    className="p-1 rounded text-nexus-text-muted hover:text-nexus-text disabled:opacity-20 transition cursor-pointer"
                    title="Bajar bloque"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-[1px] h-3 bg-nexus-border mx-0.5" />
                  <button
                    type="button"
                    onClick={() => handleAddBlockBelow(idx)}
                    className="p-1 rounded text-nexus-text-muted hover:text-indigo-400 transition cursor-pointer"
                    title="Agregar bloque abajo (/)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(idx)}
                    className="p-1 rounded text-nexus-text-muted hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    title="Eliminar bloque"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Block Content Container with right padding to prevent collision */}
                <div className="pr-20">
                  {/* Heading 1 */}
                  {block.type === 'heading1' && (
                    <input
                      type="text"
                      value={block.content}
                      onChange={e => handleUpdateBlock(idx, { content: e.target.value })}
                      placeholder="Encabezado 1..."
                      className="w-full bg-transparent text-2xl font-bold text-nexus-text border-none focus:outline-none placeholder-nexus-text-muted py-1"
                    />
                  )}

                  {/* Heading 2 */}
                  {block.type === 'heading2' && (
                    <input
                      type="text"
                      value={block.content}
                      onChange={e => handleUpdateBlock(idx, { content: e.target.value })}
                      placeholder="Encabezado 2..."
                      className="w-full bg-transparent text-xl font-bold text-nexus-text border-none focus:outline-none placeholder-nexus-text-muted py-1"
                    />
                  )}

                  {/* Heading 3 */}
                  {block.type === 'heading3' && (
                    <input
                      type="text"
                      value={block.content}
                      onChange={e => handleUpdateBlock(idx, { content: e.target.value })}
                      placeholder="Encabezado 3..."
                      className="w-full bg-transparent text-base font-semibold text-nexus-text border-none focus:outline-none placeholder-nexus-text-muted py-1"
                    />
                  )}

                  {/* Todo Checkbox */}
                  {block.type === 'todo' && (
                    <div className="flex items-start gap-3 py-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateBlock(idx, { checked: !block.checked })}
                        className="mt-0.5 text-nexus-text-muted hover:text-indigo-400 transition shrink-0 cursor-pointer"
                      >
                        {block.checked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <input
                        type="text"
                        value={block.content}
                        onChange={e => handleUpdateBlock(idx, { content: e.target.value })}
                        placeholder="Tarea pendiente... (Escribe / para opciones o [[ para enlazar)"
                        className={`w-full bg-transparent text-sm border-none focus:outline-none placeholder-nexus-text-muted ${
                          block.checked ? 'line-through text-nexus-text-muted' : 'text-nexus-text'
                        }`}
                      />
                    </div>
                  )}

                  {/* Bullet List */}
                  {block.type === 'bullet_list' && (
                    <div className="flex items-center gap-2.5 py-1">
                      <span className="text-indigo-400 font-bold text-base leading-none">•</span>
                      <input
                        type="text"
                        value={block.content}
                        onChange={e => handleUpdateBlock(idx, { content: e.target.value })}
                        placeholder="Elemento de lista..."
                        className="w-full bg-transparent text-sm text-nexus-text border-none focus:outline-none placeholder-nexus-text-muted"
                      />
                    </div>
                  )}

                  {/* Numbered List */}
                  {block.type === 'numbered_list' && (
                    <div className="flex items-center gap-2.5 py-1">
                      <span className="text-indigo-400 font-mono text-xs font-bold min-w-4">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={block.content}
                        onChange={e => handleUpdateBlock(idx, { content: e.target.value })}
                        placeholder="Elemento numerado..."
                        className="w-full bg-transparent text-sm text-nexus-text border-none focus:outline-none placeholder-nexus-text-muted"
                      />
                    </div>
                  )}

                  {/* Code Block */}
                  {block.type === 'code' && (
                    <div className="rounded-2xl border border-nexus-border bg-nexus-surface-2 p-3.5 font-mono text-xs space-y-2">
                      <div className="flex items-center justify-between text-nexus-text-muted border-b border-nexus-border/60 pb-1.5">
                        <span className="uppercase text-[10px] font-semibold tracking-wider">Código</span>
                        <input
                          type="text"
                          value={block.language || 'typescript'}
                          onChange={e => handleUpdateBlock(idx, { language: e.target.value })}
                          placeholder="lenguaje"
                          className="bg-transparent text-right text-[11px] text-indigo-400 focus:outline-none w-24"
                        />
                      </div>
                      <textarea
                        rows={Math.max(2, block.content.split('\n').length)}
                        value={block.content}
                        onChange={e => handleUpdateBlock(idx, { content: e.target.value })}
                        placeholder="console.log('NexusOS');"
                        className="w-full bg-transparent text-emerald-400 border-none focus:outline-none resize-y leading-relaxed font-mono"
                      />
                    </div>
                  )}

                  {/* Callout */}
                  {block.type === 'callout' && (
                    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 flex items-start gap-3">
                      <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <input
                        type="text"
                        value={block.content}
                        onChange={e => handleUpdateBlock(idx, { content: e.target.value })}
                        placeholder="Destacado o nota importante..."
                        className="w-full bg-transparent text-sm text-indigo-200 border-none focus:outline-none placeholder-indigo-300/40"
                      />
                    </div>
                  )}

                  {/* Divider */}
                  {block.type === 'divider' && (
                    <div className="py-3">
                      <hr className="border-nexus-border" />
                    </div>
                  )}

                  {/* Paragraph (Default) */}
                  {block.type === 'paragraph' && (
                    <textarea
                      rows={Math.max(1, Math.ceil(block.content.length / 80))}
                      value={block.content}
                      onChange={e => handleUpdateBlock(idx, { content: e.target.value })}
                      placeholder="Escribe algo, escribe '/' para comandos o '[[' para enlazar..."
                      className="w-full bg-transparent text-sm text-nexus-text border-none focus:outline-none placeholder-nexus-text-muted resize-none leading-relaxed"
                    />
                  )}
                </div>

                {/* Slash Command Popup Menu */}
                {slashMenuBlockIndex === idx && (
                  <div className="absolute left-4 top-10 z-30 w-72 rounded-2xl border border-nexus-border bg-nexus-surface p-2 shadow-2xl space-y-1 animate-fade-in">
                    <div className="px-2 py-1 text-[11px] font-bold uppercase text-nexus-text-muted">
                      Comandos de Bloque
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-0.5">
                      {SLASH_COMMANDS.map(cmd => {
                        const Icon = cmd.icon;
                        return (
                          <button
                            key={cmd.type}
                            type="button"
                            onClick={() => handleChangeBlockType(idx, cmd.type)}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-nexus-surface-2 transition text-left group cursor-pointer"
                          >
                            <div className="p-1.5 rounded-lg bg-nexus-surface-3 border border-nexus-border text-nexus-text-secondary group-hover:text-indigo-400">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-nexus-text">{cmd.label}</p>
                              <p className="text-[10px] text-nexus-text-muted truncate">{cmd.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* WikiLink Autocomplete Popup */}
                {wikiLinkPromptIndex === idx && (
                  <div className="absolute left-6 top-10 z-30 w-80 rounded-2xl border border-nexus-border bg-nexus-surface p-2 shadow-2xl space-y-1 animate-fade-in">
                    <div className="px-2 py-1 text-[11px] font-bold uppercase text-nexus-text-muted flex items-center justify-between">
                      <span>Enlazar a elemento [[...]]</span>
                      <span className="text-[10px] font-mono text-indigo-400">
                        {wikiSuggestions.length}
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {wikiSuggestions.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectWikiLink(item)}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-nexus-surface-2 transition text-left group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-nexus-text truncate">
                              {item.title}
                            </p>
                            <span className="text-[10px] text-nexus-text-muted uppercase font-mono">
                              {item.type}
                            </span>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-nexus-text-muted group-hover:text-indigo-400" />
                        </button>
                      ))}
                      {wikiSuggestions.length === 0 && (
                        <p className="text-xs text-nexus-text-muted p-3 text-center">
                          No se encontraron tareas o notas
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Block at Bottom */}
          <button
            onClick={() => handleAddBlockBelow(activeContent.length - 1)}
            className="flex items-center gap-2 text-xs font-semibold text-nexus-text-muted hover:text-nexus-text py-3 px-3 rounded-xl transition cursor-pointer hover:bg-nexus-surface-2/40 border border-dashed border-nexus-border hover:border-nexus-border-hover w-full justify-center"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>+ Agregar nuevo bloque</span>
          </button>
        </div>
      )}

      {/* ─── Bottom: Backlinks & References ─────────────────────── */}
      <div className="pt-8 border-t border-nexus-border space-y-6">
        {/* Outgoing Links */}
        {outgoingLinks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-nexus-text uppercase tracking-wider">
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
              <span>Elementos Enlazados en esta Nota</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-nexus-surface-3 text-nexus-text-muted">
                {outgoingLinks.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {outgoingLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => setSelectedTaskId(link.id)}
                  className="px-3 py-1.5 rounded-xl bg-nexus-surface border border-nexus-border hover:border-indigo-500/60 text-xs font-medium text-nexus-text flex items-center gap-1.5 transition group shadow-sm cursor-pointer"
                >
                  <span className="text-indigo-400">[[</span>
                  <span className="group-hover:text-indigo-400">{link.title}</span>
                  <span className="text-indigo-400">]]</span>
                  <ExternalLink className="w-3 h-3 text-nexus-text-muted group-hover:text-indigo-400 ml-1" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Backlinks */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-nexus-text uppercase tracking-wider">
            <Share2 className="w-4 h-4 text-pink-400" />
            <span>Backlinks & Menciones ({backlinks.length})</span>
          </div>

          {backlinks.length === 0 ? (
            <p className="text-xs text-nexus-text-muted bg-nexus-surface/50 border border-nexus-border/50 rounded-2xl p-4">
              Ninguna otra tarea o nota enlaza a esta fecha todavía. Usa <span className="font-mono text-indigo-400">[[{currentDateStr}]]</span> en cualquier tarea o proyecto para conectarla aquí.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {backlinks.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTaskId(t.id)}
                  className="p-3.5 rounded-2xl bg-nexus-surface border border-nexus-border hover:border-nexus-border-hover cursor-pointer transition group shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-nexus-text truncate group-hover:text-pink-400">
                      {t.title}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-nexus-surface-2 text-nexus-text-muted font-mono">
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-nexus-text-muted mt-1 truncate">
                    {t.category} • {accounts.find(a => a.owner === t.owner)?.displayName || t.owner || currentDisplayName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Modal de Crear / Guardar Plantilla Personalizada ─── */}
      <CreateTemplateModal
        isOpen={isCreateTemplateOpen}
        onClose={() => setIsCreateTemplateOpen(false)}
        initialMarkdown={templateInitialMarkdown}
        onSaveSuccess={() => {
          setIsCreateTemplateOpen(false);
        }}
      />
    </div>
  );
}
