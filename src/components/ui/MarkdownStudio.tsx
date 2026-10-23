import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Square,
  Code,
  Quote,
  Table as TableIcon,
  Link as LinkIcon,
  Clock,
  Minus,
  Eye,
  Edit3,
  Columns2,
  Sparkles,
  Copy,
  Check,
  Info,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Flame,
  Lightbulb,
  FileText,
  Search,
  X,
  Plus,
  ArrowUpRight,
  Folder,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNexusStore } from '../../store/nexusStore';

export interface MarkdownStudioProps {
  value: string;
  onChange: (newValue: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minHeight?: string;
  contextTitle?: string;
  onWikiLinkClick?: (linkTitle: string) => void;
  onWikiLinkSelect?: (item: { id: string; title: string; type: string }) => void;
  className?: string;
}

interface SlashCommandItem {
  id: string;
  category: 'Estructura' | 'Tareas & Listas' | 'Destacados' | 'Código & Datos' | 'NexusOS & Obsidian';
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  snippet: string;
  cursorOffset?: number; // relative to end of snippet
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  // ── Estructura ──
  {
    id: 'h1',
    category: 'Estructura',
    label: 'Encabezado 1',
    desc: 'Título principal de sección (#)',
    icon: Heading1,
    snippet: '# ',
  },
  {
    id: 'h2',
    category: 'Estructura',
    label: 'Encabezado 2',
    desc: 'Subtítulo mediano (##)',
    icon: Heading2,
    snippet: '## ',
  },
  {
    id: 'h3',
    category: 'Estructura',
    label: 'Encabezado 3',
    desc: 'Sección secundaria (###)',
    icon: Heading3,
    snippet: '### ',
  },
  {
    id: 'divider',
    category: 'Estructura',
    label: 'Separador horizontal',
    desc: 'Línea divisoria estética (---)',
    icon: Minus,
    snippet: '\n---\n\n',
  },
  {
    id: 'details',
    category: 'Estructura',
    label: 'Desplegable colapsable',
    desc: 'Detalle expandible (<details>)',
    icon: ChevronRight,
    snippet: '<details>\n<summary>📌 Título del bloque desplegable</summary>\n\nContenido detallado aquí...\n</details>\n\n',
  },

  // ── Tareas & Listas ──
  {
    id: 'todo',
    category: 'Tareas & Listas',
    label: 'Tarea con casilla',
    desc: 'Casilla interactiva (- [ ])',
    icon: CheckSquare,
    snippet: '- [ ] ',
  },
  {
    id: 'todo-list',
    category: 'Tareas & Listas',
    label: 'Checklist de 3 tareas',
    desc: 'Bloque de seguimiento rápido',
    icon: CheckSquare,
    snippet: '- [ ] Tarea prioritaria 1\n- [ ] Tarea prioritaria 2\n- [ ] Tarea prioritaria 3\n\n',
  },
  {
    id: 'bullet',
    category: 'Tareas & Listas',
    label: 'Lista con viñetas',
    desc: 'Lista con puntos (-)',
    icon: List,
    snippet: '- ',
  },
  {
    id: 'numbered',
    category: 'Tareas & Listas',
    label: 'Lista numerada',
    desc: 'Lista secuencial (1.)',
    icon: ListOrdered,
    snippet: '1. ',
  },

  // ── Destacados & Callouts ──
  {
    id: 'callout-info',
    category: 'Destacados',
    label: 'Callout Informativo',
    desc: 'Recuadro azul con bombilla (💡)',
    icon: Lightbulb,
    snippet: '> 💡 **Nota:** Escribe aquí la información relevante...\n\n',
  },
  {
    id: 'callout-warning',
    category: 'Destacados',
    label: 'Alerta / Advertencia',
    desc: 'Recuadro ámbar de atención (⚠️)',
    icon: AlertTriangle,
    snippet: '> ⚠️ **Atención:** Ten en cuenta esta consideración crítica...\n\n',
  },
  {
    id: 'callout-success',
    category: 'Destacados',
    label: 'Éxito / Aprobado',
    desc: 'Recuadro verde de logro (✅)',
    icon: CheckCircle2,
    snippet: '> ✅ **Completado:** El objetivo fue alcanzado exitosamente.\n\n',
  },
  {
    id: 'quote',
    category: 'Destacados',
    label: 'Cita textual',
    desc: 'Bloque de cita formal (>)',
    icon: Quote,
    snippet: '> "La excelencia no es un acto, sino un hábito."\n> — *Aristóteles*\n\n',
  },

  // ── Código & Datos ──
  {
    id: 'code-ts',
    category: 'Código & Datos',
    label: 'Código TypeScript / JS',
    desc: 'Bloque con resaltado de sintaxis',
    icon: Code,
    snippet: '```typescript\nfunction execute(): void {\n  console.log("NexusOS");\n}\n```\n\n',
  },
  {
    id: 'code-sql',
    category: 'Código & Datos',
    label: 'Código SQL',
    desc: 'Consultas y scripts de base de datos',
    icon: Code,
    snippet: '```sql\nSELECT id, name, created_at\nFROM tasks\nWHERE status = \'in_progress\';\n```\n\n',
  },
  {
    id: 'table',
    category: 'Código & Datos',
    label: 'Tabla Markdown',
    desc: 'Cuadrícula con encabezados y filas',
    icon: TableIcon,
    snippet: '| Entidad | Responsable | Estado |\n| :--- | :--- | :--- |\n| Frontend | Persona 1 | En progreso |\n| Diseño | Persona 2 | Completado |\n\n',
  },

  // ── NexusOS & Obsidian ──
  {
    id: 'wikilink',
    category: 'NexusOS & Obsidian',
    label: 'WikiLink Obsidian [[...]]',
    desc: 'Enlazar a otra tarea, nota o proyecto',
    icon: LinkIcon,
    snippet: '[[Nombre de Tarea o Nota]]',
  },
  {
    id: 'timestamp',
    category: 'NexusOS & Obsidian',
    label: 'Fecha y Hora actual',
    desc: 'Insertar timestamp con formato',
    icon: Clock,
    snippet: `📅 ${format(new Date(), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}`,
  },
  {
    id: 'summary-template',
    category: 'NexusOS & Obsidian',
    label: 'Plantilla Resumen Ejecutivo',
    desc: 'Estructura ejecutiva de proyecto',
    icon: Sparkles,
    snippet: '## 🎯 Resumen Ejecutivo\n\n- **Objetivo:** \n- **Métricas de Éxito:** \n- **Riesgos & Mitigaciones:** \n- **Próximos Pasos:** \n\n',
  },
];

export const MarkdownStudio: React.FC<MarkdownStudioProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = 'Escribe aquí libremente usando Markdown... Escribe / para comandos o [[ para enlazar.',
  minHeight = '380px',
  contextTitle,
  onWikiLinkClick,
  onWikiLinkSelect,
  className = '',
}) => {
  const { tasks, projects, habits, dailyNotes } = useNexusStore();

  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);

  // WikiLink Autocomplete Menu State
  const [wikiMenuOpen, setWikiMenuOpen] = useState(false);
  const [wikiQuery, setWikiQuery] = useState('');
  const [wikiIndex, setWikiIndex] = useState(0);

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const slashTriggerPosRef = useRef<number>(-1);
  const wikiMenuRef = useRef<HTMLDivElement>(null);
  const wikiTriggerPosRef = useRef<number>(-1);

  // Build Workspace searchable items for WikiLinks [[...]]
  const workspaceItems = useMemo(() => {
    const list: {
      id: string;
      title: string;
      type: 'task' | 'project' | 'habit' | 'note';
      emoji: string;
      category: string;
      priority?: string;
    }[] = [];

    // Projects
    (projects || []).forEach(p => {
      list.push({
        id: p.id,
        title: p.name,
        type: 'project',
        emoji: p.emoji || '📁',
        category: 'Proyecto',
      });
    });

    // Tasks
    (tasks || []).forEach(t => {
      list.push({
        id: t.id,
        title: t.title,
        type: 'task',
        emoji: t.parentTaskId ? '🔗' : '📋',
        category: t.category || 'Tarea',
        priority: t.priority,
      });
    });

    // Habits
    (habits || []).forEach(h => {
      list.push({
        id: h.id,
        title: h.name,
        type: 'habit',
        emoji: h.icon || '⚡',
        category: 'Hábito',
      });
    });

    // Daily Notes
    (dailyNotes || []).forEach(n => {
      list.push({
        id: n.id,
        title: `Nota ${n.date}`,
        type: 'note',
        emoji: '📝',
        category: 'Diario',
      });
    });

    return list;
  }, [tasks, projects, habits, dailyNotes]);

  // Filter commands by slashQuery
  const filteredCommands = useMemo(() => {
    const q = slashQuery.trim().toLowerCase();
    if (!q) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter(
      cmd =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.desc.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        cmd.id.toLowerCase().includes(q)
    );
  }, [slashQuery]);

  // Filter items by wikiQuery
  const filteredWikiItems = useMemo(() => {
    const q = wikiQuery.trim().toLowerCase();
    if (!q) return workspaceItems.slice(0, 14);
    return workspaceItems
      .filter(
        item =>
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
      )
      .slice(0, 14);
  }, [wikiQuery, workspaceItems]);

  // Keep selected index within bounds
  useEffect(() => {
    setSlashIndex(0);
  }, [slashQuery]);

  useEffect(() => {
    setWikiIndex(0);
  }, [wikiQuery]);

  // Handle outside clicks to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        slashMenuRef.current &&
        !slashMenuRef.current.contains(target) &&
        textareaRef.current &&
        !textareaRef.current.contains(target)
      ) {
        setSlashMenuOpen(false);
      }
      if (
        wikiMenuRef.current &&
        !wikiMenuRef.current.contains(target) &&
        textareaRef.current &&
        !textareaRef.current.contains(target)
      ) {
        setWikiMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Insert formatting at cursor
  const insertFormatting = (prefix: string, suffix: string = '', placeholderText: string = 'texto') => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + `\n${prefix}${placeholderText}${suffix}`);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);
    const textToInsert = selected ? `${prefix}${selected}${suffix}` : `${prefix}${placeholderText}${suffix}`;

    const updated = value.substring(0, start) + textToInsert + value.substring(end);
    onChange(updated);

    setTimeout(() => {
      el.focus();
      const newCursor = start + prefix.length + (selected ? selected.length : placeholderText.length);
      el.setSelectionRange(newCursor, newCursor);
    }, 10);
  };

  // Open WikiLink Autocomplete directly
  const handleOpenWikiLinkMenu = () => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);

    if (selected.trim()) {
      // Wrap selected in [[...]]
      insertFormatting('[[', ']]', selected);
      return;
    }

    // Insert '[[' and trigger menu
    const before = value.substring(0, start);
    const after = value.substring(end);
    const updated = before + '[[' + after;
    onChange(updated);
    wikiTriggerPosRef.current = start;
    setWikiMenuOpen(true);
    setWikiQuery('');
    setWikiIndex(0);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + 2, start + 2);
    }, 10);
  };

  // Execute slash command
  const executeCommand = (cmd: SlashCommandItem) => {
    const el = textareaRef.current;
    if (!el) return;

    if (cmd.id === 'wikilink') {
      setSlashMenuOpen(false);
      handleOpenWikiLinkMenu();
      return;
    }

    const triggerPos = slashTriggerPosRef.current >= 0 ? slashTriggerPosRef.current : el.selectionStart;
    const currentPos = el.selectionStart;

    const before = value.substring(0, triggerPos);
    const after = value.substring(currentPos);
    const updated = before + cmd.snippet + after;

    onChange(updated);
    setSlashMenuOpen(false);
    setSlashQuery('');
    slashTriggerPosRef.current = -1;

    setTimeout(() => {
      el.focus();
      const newCursor = triggerPos + cmd.snippet.length + (cmd.cursorOffset || 0);
      el.setSelectionRange(newCursor, newCursor);
    }, 15);
  };

  // Execute WikiLink selection
  const executeWikiLink = (item: { id: string; title: string; type: string }) => {
    const el = textareaRef.current;
    if (!el) return;

    const triggerPos = wikiTriggerPosRef.current >= 0 ? wikiTriggerPosRef.current : Math.max(0, el.selectionStart - 2);
    const currentPos = el.selectionStart;

    const before = value.substring(0, triggerPos);
    const after = value.substring(currentPos);
    const linkSnippet = `[[${item.title}]] `;
    const updated = before + linkSnippet + after;

    onChange(updated);
    setWikiMenuOpen(false);
    setWikiQuery('');
    wikiTriggerPosRef.current = -1;

    if (onWikiLinkSelect) {
      onWikiLinkSelect(item);
    }

    setTimeout(() => {
      el.focus();
      const newCursor = triggerPos + linkSnippet.length;
      el.setSelectionRange(newCursor, newCursor);
    }, 15);
  };

  // Textarea input watcher for slash trigger and [[ trigger
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    const pos = e.target.selectionStart;
    onChange(newVal);

    // 1. Check if user typed '[['
    if (pos >= 2 && newVal.substring(pos - 2, pos) === '[[') {
      wikiTriggerPosRef.current = pos - 2;
      setWikiMenuOpen(true);
      setWikiQuery('');
      setWikiIndex(0);
      setSlashMenuOpen(false);
      return;
    }

    // 2. Check if user just typed '/'
    const charJustTyped = newVal[pos - 1];
    const prevChar = pos > 1 ? newVal[pos - 2] : '\n';

    if (charJustTyped === '/' && (prevChar === '\n' || prevChar === ' ' || prevChar === '\r')) {
      slashTriggerPosRef.current = pos - 1;
      setSlashMenuOpen(true);
      setSlashQuery('');
      setSlashIndex(0);
      setWikiMenuOpen(false);
      return;
    }

    // 3. If WikiLink menu is open, update search query based on text after '[['
    if (wikiMenuOpen && wikiTriggerPosRef.current >= 0) {
      if (pos < wikiTriggerPosRef.current + 2) {
        setWikiMenuOpen(false);
        wikiTriggerPosRef.current = -1;
        return;
      }
      const queryText = newVal.substring(wikiTriggerPosRef.current + 2, pos);
      // Close if newline or closing brackets entered
      if (queryText.includes('\n') || queryText.includes(']]')) {
        setWikiMenuOpen(false);
        wikiTriggerPosRef.current = -1;
      } else {
        setWikiQuery(queryText);
      }
    }

    // 4. If slash menu is open, update search query based on text after '/'
    if (slashMenuOpen && slashTriggerPosRef.current >= 0) {
      if (pos < slashTriggerPosRef.current) {
        setSlashMenuOpen(false);
        slashTriggerPosRef.current = -1;
        return;
      }
      const queryText = newVal.substring(slashTriggerPosRef.current + 1, pos);
      // Close if whitespace or newline entered
      if (queryText.includes(' ') || queryText.includes('\n')) {
        setSlashMenuOpen(false);
        slashTriggerPosRef.current = -1;
      } else {
        setSlashQuery(queryText);
      }
    }
  };

  // Keyboard navigation for slash menu and WikiLink menu
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. WikiLink Keyboard Navigation
    if (wikiMenuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setWikiIndex(prev => (prev + 1) % Math.max(1, filteredWikiItems.length));
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setWikiIndex(prev => (prev - 1 + filteredWikiItems.length) % Math.max(1, filteredWikiItems.length));
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredWikiItems.length > 0) {
          e.preventDefault();
          executeWikiLink(filteredWikiItems[wikiIndex]);
          return;
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setWikiMenuOpen(false);
        wikiTriggerPosRef.current = -1;
        return;
      }
    }

    // 2. Slash Menu Keyboard Navigation
    if (slashMenuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
        return;
      } else if (e.key === 'Enter') {
        if (filteredCommands.length > 0) {
          e.preventDefault();
          executeCommand(filteredCommands[slashIndex]);
          return;
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSlashMenuOpen(false);
        slashTriggerPosRef.current = -1;
        return;
      }
    }
  };

  // Copy code block helper
  const handleCopyCode = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Toggle checkbox directly in markdown when clicked in Preview mode
  const handleToggleCheckbox = (targetLineIndex: number) => {
    const lines = value.split('\n');
    let todoCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^(\s*)-\s\[([ xX])\]\s/.test(line)) {
        if (todoCount === targetLineIndex) {
          const isChecked = line.includes('- [x]') || line.includes('- [X]');
          lines[i] = isChecked
            ? line.replace(/- \[[xX]\]/, '- [ ]')
            : line.replace(/- \[ \]/, '- [x]');
          break;
        }
        todoCount++;
      }
    }
    onChange(lines.join('\n'));
  };

  // ── Render Markdown into rich elements ──
  const renderedContent = useMemo(() => {
    if (!value.trim()) {
      return (
        <div className="py-14 text-center text-nexus-text-muted space-y-3">
          <FileText className="w-8 h-8 mx-auto text-indigo-400/50" />
          <p className="text-sm font-medium">Esta hoja está vacía.</p>
          <p className="text-xs text-nexus-text-muted/80 max-w-sm mx-auto">
            Haz clic en <span className="text-indigo-400 font-semibold">Editar</span> o usa la vista dividida para comenzar a escribir con títulos, tablas, listas y enlaces.
          </p>
        </div>
      );
    }

    const lines = value.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let codeLanguage = '';
    let tableBuffer: string[] = [];
    let checkboxCounter = 0;

    const flushTable = (keyPrefix: number) => {
      if (tableBuffer.length === 0) return;
      const rows = tableBuffer.map(r =>
        r
          .split('|')
          .map(cell => cell.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      );
      tableBuffer = [];
      if (rows.length === 0) return;

      const headerRow = rows[0];
      const dataRows = rows.slice(rows.length > 1 && rows[1].every(c => /^:?-+:?$/.test(c)) ? 2 : 1);

      elements.push(
        <div key={`table-${keyPrefix}`} className="my-4 overflow-x-auto rounded-xl border border-nexus-border shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-nexus-surface-2 border-b border-nexus-border text-nexus-text font-bold">
                {headerRow.map((h, i) => (
                  <th key={i} className="px-3.5 py-2.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-nexus-border/60 bg-nexus-surface/50">
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-nexus-surface-2/60 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 text-nexus-text-secondary">
                      {renderInlineFormatting(cell, onWikiLinkClick)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Code Block handling
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          const codeString = codeBuffer.join('\n');
          const codeBlockId = `code-${i}`;
          elements.push(
            <div key={codeBlockId} className="my-3.5 rounded-2xl border border-nexus-border bg-[#0B0F19] overflow-hidden shadow-md">
              <div className="flex items-center justify-between px-4 py-2 border-b border-nexus-border/60 bg-nexus-surface-2/60 text-xs text-nexus-text-muted">
                <span className="font-mono text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                  {codeLanguage || 'CÓDIGO'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(codeString, codeBlockId)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-nexus-surface-3 text-nexus-text-muted hover:text-nexus-text text-[11px] transition-colors"
                >
                  {copiedCodeId === codeBlockId ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed whitespace-pre">
                <code>{codeString}</code>
              </pre>
            </div>
          );
          inCodeBlock = false;
          codeBuffer = [];
          codeLanguage = '';
        } else {
          flushTable(i);
          inCodeBlock = true;
          codeLanguage = trimmed.replace('```', '').trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Table Row detection
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        tableBuffer.push(trimmed);
        continue;
      } else if (tableBuffer.length > 0) {
        flushTable(i);
      }

      // Blank line
      if (!trimmed) {
        elements.push(<div key={`blank-${i}`} className="h-2" />);
        continue;
      }

      // Headings
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-2xl font-bold text-nexus-text mt-4 mb-2 pb-1 border-b border-nexus-border/50">
            {renderInlineFormatting(trimmed.replace(/^#\s+/, ''), onWikiLinkClick)}
          </h1>
        );
        continue;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-xl font-bold text-nexus-text mt-3.5 mb-1.5 flex items-center gap-2">
            {renderInlineFormatting(trimmed.replace(/^##\s+/, ''), onWikiLinkClick)}
          </h2>
        );
        continue;
      }
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-base font-semibold text-nexus-text mt-2.5 mb-1">
            {renderInlineFormatting(trimmed.replace(/^###\s+/, ''), onWikiLinkClick)}
          </h3>
        );
        continue;
      }

      // Todo Checklist with Interactive Toggling
      if (/^-\s\[([ xX])\]\s/.test(trimmed)) {
        const isChecked = trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ');
        const taskText = trimmed.replace(/^- \[[ xX]\]\s+/, '');
        const currentCheckboxIndex = checkboxCounter++;

        elements.push(
          <div
            key={`todo-${i}`}
            onClick={() => handleToggleCheckbox(currentCheckboxIndex)}
            className="flex items-start gap-2.5 py-1 px-2 rounded-lg hover:bg-nexus-surface-2/60 transition-colors cursor-pointer group select-none"
          >
            <div className="mt-0.5 shrink-0">
              {isChecked ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              ) : (
                <Square className="w-4 h-4 text-nexus-text-muted group-hover:text-indigo-400 group-hover:scale-110 transition-transform" />
              )}
            </div>
            <span
              className={`text-sm leading-relaxed ${
                isChecked ? 'line-through text-nexus-text-muted opacity-75' : 'text-nexus-text'
              }`}
            >
              {renderInlineFormatting(taskText, onWikiLinkClick)}
            </span>
          </div>
        );
        continue;
      }

      // Bullet List
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <div key={`bullet-${i}`} className="flex items-start gap-2.5 py-0.5 px-2">
            <span className="text-indigo-400 font-bold text-base leading-none mt-0.5">•</span>
            <span className="text-sm text-nexus-text-secondary leading-relaxed">
              {renderInlineFormatting(trimmed.replace(/^[-*]\s+/, ''), onWikiLinkClick)}
            </span>
          </div>
        );
        continue;
      }

      // Numbered List
      if (/^\d+\.\s+/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
        elements.push(
          <div key={`num-${i}`} className="flex items-start gap-2.5 py-0.5 px-2">
            <span className="font-mono text-xs font-bold text-indigo-400 mt-1 min-w-[18px]">
              {match ? match[1] : '1'}.
            </span>
            <span className="text-sm text-nexus-text-secondary leading-relaxed">
              {renderInlineFormatting(match ? match[2] : trimmed, onWikiLinkClick)}
            </span>
          </div>
        );
        continue;
      }

      // Callouts / Themed Quotes
      if (trimmed.startsWith('>')) {
        const quoteContent = trimmed.replace(/^>\s*/, '');
        let bg = 'bg-nexus-surface-2/70 border-nexus-border text-nexus-text-secondary';
        let icon = <Quote className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />;

        if (quoteContent.includes('💡')) {
          bg = 'bg-blue-500/10 border-blue-500/30 text-blue-200';
          icon = <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />;
        } else if (quoteContent.includes('⚠️')) {
          bg = 'bg-amber-500/10 border-amber-500/30 text-amber-200';
          icon = <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />;
        } else if (quoteContent.includes('✅')) {
          bg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200';
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />;
        } else if (quoteContent.includes('🔥')) {
          bg = 'bg-red-500/10 border-red-500/30 text-red-200';
          icon = <Flame className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />;
        }

        elements.push(
          <div key={`callout-${i}`} className={`my-2.5 p-3.5 rounded-2xl border flex items-start gap-3 shadow-xs ${bg}`}>
            {icon}
            <div className="text-xs sm:text-sm leading-relaxed flex-1">
              {renderInlineFormatting(quoteContent, onWikiLinkClick)}
            </div>
          </div>
        );
        continue;
      }

      // Horizontal Divider
      if (trimmed === '---' || trimmed === '***') {
        elements.push(<hr key={`divider-${i}`} className="my-4 border-nexus-border/80" />);
        continue;
      }

      // Regular Paragraph
      elements.push(
        <p key={`p-${i}`} className="text-sm text-nexus-text leading-relaxed my-1">
          {renderInlineFormatting(line, onWikiLinkClick)}
        </p>
      );
    }

    if (tableBuffer.length > 0) {
      flushTable(lines.length);
    }

    return elements;
  }, [value, copiedCodeId, onWikiLinkClick]);

  const wordCount = value.split(/\s+/).filter(Boolean).length;
  const charCount = value.length;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ─── Top Studio Bar: Quick Actions & View Switcher ─── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-2xl bg-nexus-surface border border-nexus-border shadow-xs">
        {/* Left: Quick Formatting Buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => insertFormatting('**', '**', 'negrita')}
            className="p-1.5 rounded-lg text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors"
            title="Negrita (**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*', 'cursiva')}
            className="p-1.5 rounded-lg text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors"
            title="Cursiva (*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-nexus-border mx-0.5" />

          <button
            type="button"
            onClick={() => insertFormatting('# ', '', 'Título Principal')}
            className="px-2 py-1 rounded-lg text-xs font-bold text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors"
            title="Encabezado 1 (#)"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('## ', '', 'Subtítulo')}
            className="px-2 py-1 rounded-lg text-xs font-semibold text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors"
            title="Encabezado 2 (##)"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('### ', '', 'Sección')}
            className="px-2 py-1 rounded-lg text-xs text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors"
            title="Encabezado 3 (###)"
          >
            H3
          </button>
          <div className="w-px h-4 bg-nexus-border mx-0.5" />

          <button
            type="button"
            onClick={() => insertFormatting('- [ ] ', '', 'Nueva tarea')}
            className="p-1.5 rounded-lg text-nexus-text-muted hover:text-emerald-400 hover:bg-nexus-surface-2 transition-colors"
            title="Casilla de verificación (- [ ])"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('- ', '', 'Elemento')}
            className="p-1.5 rounded-lg text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors"
            title="Lista con viñetas (-)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('1. ', '', 'Elemento')}
            className="p-1.5 rounded-lg text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors"
            title="Lista numerada (1.)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('> 💡 **Nota:** ', '', 'Información clave')}
            className="p-1.5 rounded-lg text-nexus-text-muted hover:text-amber-400 hover:bg-nexus-surface-2 transition-colors"
            title="Callout / Destacado"
          >
            <Lightbulb className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('```typescript\n', '\n```', '// Código')}
            className="p-1.5 rounded-lg text-nexus-text-muted hover:text-emerald-400 hover:bg-nexus-surface-2 transition-colors"
            title="Bloque de código"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('| Columna 1 | Columna 2 |\n| :--- | :--- |\n| Dato 1 | Dato 2 |\n', '', '')}
            className="p-1.5 rounded-lg text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors"
            title="Tabla Markdown"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleOpenWikiLinkMenu}
            className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center gap-1 cursor-pointer"
            title="Enlazar a otra tarea, proyecto o nota [[...]]"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold hidden sm:inline">WikiLink [[...]]</span>
          </button>

          {/* Quick Slash Menu Launcher Button */}
          <button
            type="button"
            onClick={() => {
              setSlashMenuOpen(!slashMenuOpen);
              setSlashQuery('');
              slashTriggerPosRef.current = textareaRef.current ? textareaRef.current.selectionStart : value.length;
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              slashMenuOpen
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30'
            }`}
            title="Menú completo de bloques (/)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>/ Comandos</span>
          </button>
        </div>

        {/* Right: View Mode Toggle (Editar | Vista Previa | Dividido) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              viewMode === 'edit'
                ? 'bg-nexus-surface-3 text-nexus-text shadow-xs'
                : 'text-nexus-text-muted hover:text-nexus-text'
            }`}
            title="Modo Edición puro"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-nexus-text-muted hover:text-nexus-text'
            }`}
            title="Vista previa formateada interactiva"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vista Previa</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              viewMode === 'split'
                ? 'bg-nexus-surface-3 text-nexus-text shadow-xs'
                : 'text-nexus-text-muted hover:text-nexus-text'
            }`}
            title="Editor y Vista Previa lado a lado"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Dividido</span>
          </button>
        </div>
      </div>

      {/* ─── Main Content Canvas Area ─── */}
      <div className="relative">
        {/* Floating WikiLink [[...]] Autocomplete Menu */}
        {wikiMenuOpen && (
          <div
            ref={wikiMenuRef}
            className="absolute left-3 top-2 z-50 w-80 sm:w-96 rounded-2xl border border-indigo-500/40 bg-nexus-surface/98 p-3 shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl ring-1 ring-indigo-500/20"
          >
            <div className="flex items-center justify-between pb-2 border-b border-nexus-border/80">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-bold text-nexus-text">Enlazar Elemento [[...]]</span>
              </div>
              <span className="text-[11px] font-mono text-indigo-400 font-bold">
                {filteredWikiItems.length} disponibles
              </span>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-nexus-text-muted absolute left-2.5 top-2.5" />
              <input
                type="text"
                autoFocus
                value={wikiQuery}
                onChange={e => setWikiQuery(e.target.value)}
                placeholder="Escribe el nombre de la tarea, proyecto o nota..."
                className="w-full bg-nexus-surface-2 border border-nexus-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-nexus-text focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Suggestions list */}
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {filteredWikiItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-nexus-text-muted">
                  No se encontraron elementos con "{wikiQuery}". Presiona Enter para mantener lo escrito.
                </div>
              ) : (
                filteredWikiItems.map((item, idx) => {
                  const isSelected = idx === wikiIndex;
                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => executeWikiLink(item)}
                      onMouseEnter={() => setWikiIndex(idx)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 border border-indigo-500/40 text-nexus-text'
                          : 'hover:bg-nexus-surface-2 border border-transparent text-nexus-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-sm shrink-0">{item.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-nexus-text truncate">{item.title}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-nexus-text-muted">
                            <span className="capitalize">{item.category}</span>
                            {item.priority && (
                              <span className="px-1 rounded bg-nexus-surface-3 text-indigo-300 font-mono font-bold">
                                {item.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-nexus-text-muted shrink-0 ml-2 group-hover:text-indigo-400" />
                    </button>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-nexus-border/60 flex items-center justify-between text-[11px] text-nexus-text-muted">
              <span>↑ ↓ para navegar • Enter para insertar</span>
              <span className="font-mono text-indigo-400">Esc salir</span>
            </div>
          </div>
        )}

        {/* Floating Slash Command Menu */}
        {slashMenuOpen && (
          <div
            ref={slashMenuRef}
            className="absolute left-3 top-2 z-50 w-80 sm:w-96 rounded-2xl border border-nexus-border bg-nexus-surface p-3 shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-nexus-border/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-nexus-text">Insertar Bloque o Plantilla</span>
              </div>
              <button
                type="button"
                onClick={() => setSlashMenuOpen(false)}
                className="p-1 rounded-lg text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick search input within the menu */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-nexus-text-muted absolute left-2.5 top-2.5" />
              <input
                type="text"
                autoFocus
                value={slashQuery}
                onChange={e => setSlashQuery(e.target.value)}
                placeholder="Filtrar comandos (ej: tabla, código, h1)..."
                className="w-full bg-nexus-surface-2 border border-nexus-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-nexus-text focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Commands list */}
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {filteredCommands.length === 0 ? (
                <div className="p-4 text-center text-xs text-nexus-text-muted">
                  No se encontraron comandos con "{slashQuery}"
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  const isSelected = idx === slashIndex;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSlashIndex(idx)}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/15 border border-indigo-500/30 text-nexus-text'
                          : 'hover:bg-nexus-surface-2 border border-transparent text-nexus-text-secondary'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-nexus-surface-3 text-nexus-text-muted'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-nexus-text truncate">{cmd.label}</p>
                          <span className="text-[10px] text-nexus-text-muted font-mono ml-2 shrink-0">
                            {cmd.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-nexus-text-muted truncate">{cmd.desc}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-nexus-border/60 flex items-center justify-between text-[11px] text-nexus-text-muted">
              <span>Usa ↑ ↓ para navegar, Enter para insertar</span>
              <span className="font-mono text-indigo-400">Esc para salir</span>
            </div>
          </div>
        )}

        {/* ── View: Pure Edit Mode ── */}
        {viewMode === 'edit' && (
          <div className="relative rounded-2xl bg-nexus-surface border border-nexus-border focus-within:border-indigo-500/60 p-4 transition-colors shadow-inner">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onBlur={onBlur}
              placeholder={placeholder}
              style={{ minHeight }}
              className="w-full bg-transparent text-sm sm:text-base text-nexus-text placeholder-nexus-text-muted outline-hidden resize-y leading-relaxed font-sans"
            />
          </div>
        )}

        {/* ── View: Pure Rendered Preview Mode ── */}
        {viewMode === 'preview' && (
          <div
            style={{ minHeight }}
            className="rounded-2xl bg-nexus-surface border border-nexus-border p-6 shadow-sm overflow-y-auto space-y-2 prose-invert max-w-none"
          >
            {renderedContent}
          </div>
        )}

        {/* ── View: Split Mode (Editor + Live Preview Side by Side) ── */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Editor */}
            <div className="relative rounded-2xl bg-nexus-surface border border-nexus-border focus-within:border-indigo-500/60 p-4 transition-colors shadow-inner flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-nexus-border/60 text-xs font-semibold text-nexus-text-muted">
                <span className="flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  Editor Markdown
                </span>
                <span className="text-[11px] font-mono text-indigo-400">Tip: Escribe / para bloques</span>
              </div>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                onBlur={onBlur}
                placeholder={placeholder}
                style={{ minHeight }}
                className="w-full flex-1 bg-transparent text-sm text-nexus-text placeholder-nexus-text-muted outline-hidden resize-y leading-relaxed font-sans"
              />
            </div>

            {/* Right: Rendered Preview */}
            <div
              style={{ minHeight }}
              className="rounded-2xl bg-nexus-surface-2/40 border border-nexus-border p-5 shadow-sm overflow-y-auto space-y-2 flex flex-col"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-nexus-border/60 text-xs font-semibold text-nexus-text-muted">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  Vista Previa en Vivo
                </span>
                <span className="text-[11px] text-nexus-text-muted">Casillas interactivas activas</span>
              </div>
              <div className="flex-1 overflow-y-auto">{renderedContent}</div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Meta Bar ─── */}
      <div className="flex items-center justify-between text-xs text-nexus-text-muted px-2 py-1">
        <div className="flex items-center gap-3">
          <span>{wordCount} palabras</span>
          <span>•</span>
          <span>{charCount} caracteres</span>
          <span>•</span>
          <span>~{Math.max(1, Math.ceil(wordCount / 180))} min lectura</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="hidden sm:inline">
            Escribe <code className="bg-nexus-surface-2 px-1.5 py-0.5 rounded text-indigo-300 font-mono">/</code> para menú de bloques o{' '}
            <code className="bg-nexus-surface-2 px-1.5 py-0.5 rounded text-indigo-300 font-mono">[[...]]</code> para Obsidian.
          </span>
        </div>
      </div>
    </div>
  );
};

// Helper: Parse inline formatting (bold, italic, code, WikiLinks, external links)
function renderInlineFormatting(
  text: string,
  onWikiLinkClick?: (linkTitle: string) => void
): React.ReactNode[] {
  // Regex pattern matching:
  // 1. WikiLinks [[...]]
  // 2. Bold **...**
  // 3. Italic *...*
  // 4. Inline code `...`
  // 5. Standard markdown links [text](url)
  const pattern = /(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (!part) return null;

    // WikiLink [[...]]
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const linkTitle = part.slice(2, -2).trim();
      return (
        <button
          key={`wikilink-${index}`}
          type="button"
          onClick={() => onWikiLinkClick && onWikiLinkClick(linkTitle)}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-medium text-xs transition-colors cursor-pointer group"
          title={`Abrir elemento enlazado: ${linkTitle}`}
        >
          <LinkIcon className="w-3 h-3 text-indigo-400 group-hover:rotate-12 transition-transform" />
          <span>{linkTitle}</span>
        </button>
      );
    }

    // Bold **...**
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`bold-${index}`} className="font-bold text-nexus-text">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic *...*
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={`italic-${index}`} className="italic text-nexus-text-secondary">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Inline code `...`
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={`code-${index}`}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-nexus-surface-2 border border-nexus-border/60 font-mono text-xs text-emerald-400"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Markdown link [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={`link-${index}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-0.5 mx-0.5"
        >
          <span>{linkMatch[1]}</span>
          <ExternalLink className="w-2.5 h-2.5 inline" />
        </a>
      );
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
}

export default MarkdownStudio;
