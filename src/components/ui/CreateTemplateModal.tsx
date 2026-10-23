import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Save,
  FileText,
  Bold,
  Italic,
  Heading1,
  Heading2,
  CheckSquare,
  List,
  AlertCircle,
  Code2,
  Table as TableIcon,
  Tag,
  Folder,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { TaskTemplate, TemplateCategory, PageBlock } from '../../types/nexus';
import { v4 as uuidv4 } from 'uuid';
import EmojiPicker from './EmojiPicker';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMarkdown?: string;
  onSaveSuccess?: (template: TaskTemplate) => void;
}

const CATEGORIES: { id: TemplateCategory; label: string; icon: string }[] = [
  { id: 'work', label: 'Trabajo & Tech', icon: '💼' },
  { id: 'couple', label: 'Pareja & Hogar', icon: '💑' },
  { id: 'personal', label: 'Personal', icon: '🔒' },
  { id: 'health', label: 'Salud & Bienestar', icon: '🥗' },
  { id: 'finance', label: 'Finanzas', icon: '💰' },
  { id: 'custom', label: 'Personalizada', icon: '🎨' },
];

export default function CreateTemplateModal({
  isOpen,
  onClose,
  initialMarkdown = '',
  onSaveSuccess,
}: CreateTemplateModalProps) {
  const { addCustomTemplate, currentOwner, currentUser } = useNexusStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📝');
  const [category, setCategory] = useState<TemplateCategory>('work');
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setIcon('📝');
      setCategory('work');
      setMarkdown(
        initialMarkdown ||
          '## 🎯 Objetivo de la Plantilla\n> 💡 Describe aquí el propósito principal.\n\n### 📋 Pasos o Checklist\n- [ ] Primer paso indispensable\n- [ ] Segundo paso de verificación\n\n### 📝 Notas y Detalles\nEscribe notas complementarias...'
      );
    }
  }, [isOpen, initialMarkdown]);

  // Lock body scroll and ESC key
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Insert formatting into markdown
  const insertFormatting = (prefix: string, suffix: string = '', placeholder: string = 'texto') => {
    setMarkdown(prev => prev + `\n\n${prefix}${placeholder}${suffix}`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Convert markdown to blocks
    const lines = markdown.split('\n');
    const blocks: PageBlock[] = [];

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('# ')) {
        blocks.push({ id: `b-${uuidv4().slice(0, 6)}`, type: 'heading1', content: trimmed.replace(/^#\s+/, '') });
      } else if (trimmed.startsWith('## ')) {
        blocks.push({ id: `b-${uuidv4().slice(0, 6)}`, type: 'heading2', content: trimmed.replace(/^##\s+/, '') });
      } else if (trimmed.startsWith('### ')) {
        blocks.push({ id: `b-${uuidv4().slice(0, 6)}`, type: 'heading3', content: trimmed.replace(/^###\s+/, '') });
      } else if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
        blocks.push({
          id: `b-${uuidv4().slice(0, 6)}`,
          type: 'todo',
          content: trimmed.replace(/^- \[[ xX]\]\s+/, ''),
          checked: trimmed.startsWith('- [x] '),
        });
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        blocks.push({ id: `b-${uuidv4().slice(0, 6)}`, type: 'bullet_list', content: trimmed.replace(/^[-*]\s+/, '') });
      } else if (trimmed.startsWith('>')) {
        blocks.push({ id: `b-${uuidv4().slice(0, 6)}`, type: 'callout', content: trimmed.replace(/^>\s*(💡)?\s*/, '') });
      } else {
        blocks.push({ id: `b-${uuidv4().slice(0, 6)}`, type: 'paragraph', content: trimmed });
      }
    }

    const newTemplate: TaskTemplate = {
      id: `tmpl-custom-${uuidv4().slice(0, 8)}`,
      name: name.trim(),
      description: description.trim() || 'Plantilla personalizada creada por el usuario',
      icon,
      category,
      blocks: blocks.length > 0 ? blocks : [{ id: `b-${uuidv4().slice(0, 6)}`, type: 'paragraph', content: markdown }],
      markdown,
      isCustom: true,
      owner: currentOwner || currentUser?.id || 'user',
      createdAt: new Date().toISOString(),
    };

    addCustomTemplate(newTemplate);
    if (onSaveSuccess) onSaveSuccess(newTemplate);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-nexus-surface rounded-2xl border border-nexus-border shadow-2xl flex flex-col overflow-hidden z-10 my-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border bg-nexus-surface-2/70 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-lg">
                ✨
              </div>
              <div>
                <h2 className="text-base font-bold text-nexus-text">Crear Nueva Plantilla</h2>
                <p className="text-xs text-nexus-text-muted">
                  Guarda estructuras y checklists reutilizables para tus tareas y proyectos.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-3 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Template Name & Emoji */}
            <div className="flex items-start gap-3">
              {/* Emoji Picker Button */}
              <div className="space-y-1 shrink-0">
                <label className="block text-[11px] font-semibold text-nexus-text-muted uppercase tracking-wider">
                  Ícono
                </label>
                <div className="w-12 h-11 rounded-xl bg-nexus-surface-2 border border-nexus-border flex items-center justify-center text-2xl shadow-inner cursor-pointer hover:border-indigo-500 transition-colors relative group">
                  <span>{icon}</span>
                </div>
              </div>

              {/* Title Input */}
              <div className="flex-1 space-y-1">
                <label className="block text-[11px] font-semibold text-nexus-text-muted uppercase tracking-wider">
                  Nombre de la Plantilla *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Revisión de Sprint, Checklist de Mudanza, Análisis..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border focus:border-indigo-500 focus:outline-hidden text-sm text-nexus-text transition-colors"
                />
              </div>
            </div>

            {/* Rich Searchable & Categorized Emoji Picker */}
            <EmojiPicker
              selectedEmoji={icon}
              onSelectEmoji={setIcon}
              title="Ícono de la Plantilla"
            />

            {/* Category & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-nexus-text-muted uppercase tracking-wider">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border focus:border-indigo-500 focus:outline-hidden text-xs text-nexus-text transition-colors"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-nexus-text-muted uppercase tracking-wider">
                  Descripción Corta
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej. Resumen de objetivos y entregables clave"
                  className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border focus:border-indigo-500 focus:outline-hidden text-xs text-nexus-text transition-colors"
                />
              </div>
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-nexus-text-muted uppercase tracking-wider">
                  Estructura de la Plantilla (Markdown / Bloques)
                </label>
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => insertFormatting('## ', '', 'Sección')}
                    className="px-2 py-0.5 rounded bg-nexus-surface-3 hover:bg-nexus-surface-2 text-nexus-text text-[11px] font-bold"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('- [ ] ', '', 'Tarea de ejemplo')}
                    className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-medium"
                  >
                    + Check
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('> 💡 ', '', 'Nota importante')}
                    className="px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[11px] font-medium"
                  >
                    + Callout
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-nexus-surface-2/50 border border-nexus-border focus-within:border-indigo-500/60 p-3 transition-colors shadow-inner">
                <textarea
                  rows={8}
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  placeholder="Escribe la estructura de la plantilla aquí..."
                  className="w-full bg-transparent text-xs text-nexus-text placeholder-nexus-text-muted outline-hidden resize-y font-mono leading-relaxed"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-nexus-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-surface-2 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Plantilla</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
