import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pin,
  Plus,
  Trash2,
  Edit3,
  Check,
  Clock,
  Sparkles,
  FileText,
  StickyNote,
  Eye,
  CheckSquare,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { SharedNote, Owner } from '../../types/nexus';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SharedBoard() {
  const { sharedNotes, addSharedNote, updateSharedNote, deleteSharedNote, currentOwner } = useNexusStore();

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Sort: pinned first, then by updatedAt descending
  const sortedNotes = [...sharedNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim()) return;

    const note: SharedNote = {
      id: `sn-${uuidv4().slice(0, 8)}`,
      title: newTitle.trim() || 'Nota sin título',
      content: newContent.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: currentOwner || 'david',
      pinned: false,
    };

    addSharedNote(note);
    setNewTitle('');
    setNewContent('');
    setShowAddForm(false);
  };

  const handleTogglePin = (note: SharedNote) => {
    updateSharedNote(note.id, {
      pinned: !note.pinned,
      updatedAt: new Date().toISOString(),
      updatedBy: currentOwner || 'david',
    });
  };

  const handleUpdateContent = (id: string, updates: Partial<SharedNote>) => {
    updateSharedNote(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: currentOwner || 'david',
    });
  };

  const formatRelativeTime = (isoDate: string) => {
    try {
      return formatDistanceToNow(parseISO(isoDate), { addSuffix: true, locale: es });
    } catch {
      return 'recientemente';
    }
  };

  // Render markdown-like content nicely
  const renderMarkdownContent = (note: SharedNote) => {
    const lines = note.content.split('\n');

    return (
      <div className="space-y-1 text-sm text-nexus-text leading-relaxed">
        {lines.map((line, idx) => {
          // Checkbox syntax: - [ ] or - [x]
          const checkboxMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
          if (checkboxMatch) {
            const isChecked = checkboxMatch[2].toLowerCase() === 'x';
            const text = checkboxMatch[3];

            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 cursor-pointer group py-0.5"
                onClick={e => {
                  e.stopPropagation();
                  // Toggle checkbox in note content
                  const updatedLines = [...lines];
                  const newCheckedChar = isChecked ? ' ' : 'x';
                  updatedLines[idx] = `${checkboxMatch[1]}- [${newCheckedChar}] ${text}`;
                  handleUpdateContent(note.id, { content: updatedLines.join('\n') });
                }}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 transition ${
                    isChecked
                      ? 'bg-nexus-accent-pink border-nexus-accent-pink text-white'
                      : 'border-nexus-border group-hover:border-nexus-accent-pink/60 bg-nexus-surface-2'
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span
                  className={`text-xs transition ${
                    isChecked ? 'line-through text-nexus-text-muted' : 'text-nexus-text'
                  }`}
                >
                  {text}
                </span>
              </div>
            );
          }

          // Bullet point: - item or * item
          if (line.match(/^(\s*)[-*]\s+(.*)$/)) {
            const itemText = line.replace(/^(\s*)[-*]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 text-xs py-0.5">
                <span className="text-nexus-accent-pink font-bold leading-none mt-1">•</span>
                <span className="text-nexus-text">{itemText}</span>
              </div>
            );
          }

          // Numbered list: 1. item
          const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 text-xs py-0.5">
                <span className="text-nexus-accent-indigo font-mono font-semibold text-[11px] min-w-4">
                  {numMatch[1]}.
                </span>
                <span className="text-nexus-text">{numMatch[2]}</span>
              </div>
            );
          }

          // Heading: # text or ## text
          if (line.startsWith('#')) {
            const headingText = line.replace(/^#+\s*/, '');
            return (
              <p key={idx} className="font-bold text-sm text-nexus-text pt-1">
                {headingText}
              </p>
            );
          }

          // Empty line
          if (!line.trim()) {
            return <div key={idx} className="h-2" />;
          }

          // Normal paragraph
          return (
            <p key={idx} className="text-xs text-nexus-text-secondary">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Bar ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-nexus-text-muted">
            <StickyNote className="w-4 h-4 text-nexus-accent-pink" />
            <span>Pizarra Compartida</span>
          </div>
          <h2 className="text-2xl font-bold text-nexus-text mt-1">Notas, Ideas & Acuerdos</h2>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 text-white font-medium text-sm transition shadow-lg shadow-pink-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Nota</span>
        </button>
      </div>

      {/* ─── Add Note Form (Collapsible) ───────────────────────── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateNote}
            className="rounded-2xl border border-nexus-border bg-nexus-surface p-5 shadow-xl space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-nexus-border pb-2">
              <span className="text-sm font-semibold text-nexus-text">Crear Nota en la Pizarra</span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-nexus-text-muted hover:text-nexus-text"
              >
                Cerrar
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Título de la nota (ej. 🛒 Lista de compras, 💡 Ideas)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text text-sm font-medium focus:outline-none focus:border-nexus-accent-pink"
            />

            <textarea
              rows={4}
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Contenido en markdown... Usa - [ ] para listas de chequeo, - para viñetas o 1. para números"
              className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text text-sm focus:outline-none focus:border-nexus-accent-pink leading-relaxed"
            />

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-nexus-text-muted hover:text-nexus-text"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-nexus-accent-pink text-white text-xs font-semibold shadow-md shadow-pink-500/20 hover:opacity-90 transition"
              >
                Publicar Nota
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ─── Notes Grid ────────────────────────────────────────── */}
      {sortedNotes.length === 0 ? (
        <div className="rounded-2xl border border-nexus-border bg-nexus-surface p-12 text-center shadow-xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mx-auto text-2xl">
            📌
          </div>
          <h3 className="text-base font-bold text-nexus-text">Pizarra vacía</h3>
          <p className="text-xs text-nexus-text-muted max-w-sm mx-auto">
            Crea notas compartidas para listas de compras, acuerdos de convivencia o planes del fin de semana.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedNotes.map(note => {
            const isEditing = editingNoteId === note.id;

            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`rounded-2xl border p-5 shadow-xl flex flex-col justify-between transition-all duration-200 ${
                  note.pinned
                    ? 'bg-nexus-surface border-pink-500/40 shadow-pink-500/5 ring-1 ring-pink-500/20'
                    : 'bg-nexus-surface border-nexus-border hover:border-nexus-border-hover'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={note.title}
                          onChange={e => handleUpdateContent(note.id, { title: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-nexus-surface-2 border border-nexus-border text-sm font-bold text-nexus-text focus:outline-none focus:border-nexus-accent-pink"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {note.pinned && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30 font-semibold flex items-center gap-1">
                              📌 Fijado
                            </span>
                          )}
                          <h3 className="font-bold text-base text-nexus-text truncate">{note.title}</h3>
                        </div>
                      )}
                    </div>

                    {/* Actions: Pin, Edit, Delete */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleTogglePin(note)}
                        className={`p-1.5 rounded-lg transition ${
                          note.pinned
                            ? 'text-pink-400 bg-pink-500/10'
                            : 'text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2'
                        }`}
                        title={note.pinned ? 'Desfijar' : 'Fijar nota'}
                      >
                        <Pin className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setEditingNoteId(isEditing ? null : note.id)}
                        className={`p-1.5 rounded-lg transition ${
                          isEditing
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2'
                        }`}
                        title={isEditing ? 'Ver formato' : 'Editar nota'}
                      >
                        {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => deleteSharedNote(note.id)}
                        className="p-1.5 rounded-lg text-nexus-text-muted hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="py-2 min-h-24">
                    {isEditing ? (
                      <textarea
                        rows={6}
                        value={note.content}
                        onChange={e => handleUpdateContent(note.id, { content: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text text-xs focus:outline-none focus:border-nexus-accent-pink leading-relaxed resize-y font-mono"
                      />
                    ) : (
                      renderMarkdownContent(note)
                    )}
                  </div>
                </div>

                {/* Card Footer: Metadata */}
                <div className="pt-4 mt-3 border-t border-nexus-border/40 flex items-center justify-between text-[11px] text-nexus-text-muted">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{note.updatedBy === 'david' ? '👨‍💻' : '👩‍🎨'}</span>
                    <span>
                      Actualizado por{' '}
                      <span className={note.updatedBy === 'david' ? 'text-indigo-400 font-semibold' : 'text-pink-400 font-semibold'}>
                        {note.updatedBy === 'david' ? 'David' : 'Cami'}
                      </span>
                    </span>
                  </div>

                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(note.updatedAt)}</span>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
