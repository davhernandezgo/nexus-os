import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Inbox,
  Kanban,
  Target,
  Calendar,
  CheckSquare,
  HeartHandshake,
  Network,
  FileText,
  Play,
  Pause,
  Square,
  Lock,
  Heart,
  Zap,
  LogOut,
  ArrowRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { ContextMode } from '../../types/nexus';

interface PaletteItem {
  id: string;
  category: 'Navegación' | 'Acciones' | 'Tareas' | 'Hábitos';
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    getVisibleTasks,
    getVisibleHabits,
    setSelectedTaskId,
    switchContext,
    timer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    logout,
    setActiveView,
  } = useNexusStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Reset query and focus on open
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const visibleTasks = getVisibleTasks();
  const visibleHabits = getVisibleHabits();

  // Build searchable items
  const items = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [];

    // Navigation items
    const navs = [
      { id: 'nav-inbox', label: 'Ir a Inbox', path: '/inbox', view: 'inbox', icon: Inbox },
      { id: 'nav-kanban', label: 'Ir a Tablero Kanban', path: '/kanban', view: 'kanban', icon: Kanban },
      { id: 'nav-eisenhower', label: 'Ir a Matriz Eisenhower', path: '/eisenhower', view: 'eisenhower', icon: Target },
      { id: 'nav-calendar', label: 'Ir a Calendario', path: '/calendar', view: 'calendar', icon: Calendar },
      { id: 'nav-habits', label: 'Ir a Hábitos', path: '/habits', view: 'habits', icon: CheckSquare },
      { id: 'nav-couple', label: 'Ir a Hub de Pareja', path: '/couple', view: 'couple', icon: HeartHandshake },
      { id: 'nav-graph', label: 'Ir a Grafo de Conocimiento', path: '/graph', view: 'graph', icon: Network },
      { id: 'nav-daily-note', label: 'Ir a Nota del Día', path: '/daily-note', view: 'daily-note', icon: FileText },
    ];

    navs.forEach(n => {
      list.push({
        id: n.id,
        category: 'Navegación',
        label: n.label,
        icon: n.icon,
        action: () => {
          setActiveView(n.view);
          navigate(n.path);
        },
      });
    });

    // Actions items
    if (timer.state === 'running') {
      list.push({
        id: 'act-pause-timer',
        category: 'Acciones',
        label: 'Pausar Temporizador',
        description: `Corriendo: ${timer.targetTitle || 'Global'}`,
        icon: Pause,
        action: () => pauseTimer(),
      });
      list.push({
        id: 'act-stop-timer',
        category: 'Acciones',
        label: 'Detener Temporizador',
        description: 'Guardar sesión y detener',
        icon: Square,
        action: () => stopTimer(),
      });
    } else if (timer.state === 'paused') {
      list.push({
        id: 'act-resume-timer',
        category: 'Acciones',
        label: 'Reanudar Temporizador',
        icon: Play,
        action: () => resumeTimer(),
      });
    } else {
      list.push({
        id: 'act-start-timer',
        category: 'Acciones',
        label: 'Iniciar Temporizador Global',
        icon: Play,
        action: () => startTimer(undefined, undefined, 'Enfoque general'),
      });
    }

    list.push({
      id: 'act-ctx-private',
      category: 'Acciones',
      label: 'Cambiar a Contexto Privado (Mi Bóveda)',
      icon: Lock,
      action: () => switchContext('private'),
    });
    list.push({
      id: 'act-ctx-couple',
      category: 'Acciones',
      label: 'Cambiar a Contexto Pareja (Hub Pareja)',
      icon: Heart,
      action: () => switchContext('couple'),
    });
    list.push({
      id: 'act-ctx-unified',
      category: 'Acciones',
      label: 'Cambiar a Contexto Unificado',
      icon: Zap,
      action: () => switchContext('unified'),
    });
    list.push({
      id: 'act-logout',
      category: 'Acciones',
      label: 'Cerrar Sesión',
      icon: LogOut,
      action: () => logout(),
    });

    // Tasks (matching query or recent)
    visibleTasks.forEach(t => {
      list.push({
        id: `task-${t.id}`,
        category: 'Tareas',
        label: t.title,
        description: `Prioridad: ${t.priority} • ${t.status === 'done' ? 'Completada' : 'Pendiente'}`,
        icon: CheckCircle2,
        action: () => {
          setSelectedTaskId(t.id);
        },
      });
    });

    // Habits
    visibleHabits.forEach(h => {
      list.push({
        id: `habit-${h.id}`,
        category: 'Hábitos',
        label: `${h.icon} ${h.name}`,
        description: `Meta: ${h.frequencyPerWeek} días por semana`,
        icon: Flame,
        action: () => {
          setActiveView('habits');
          navigate('/habits');
        },
      });
    });

    return list;
  }, [visibleTasks, visibleHabits, timer, navigate, setActiveView, setSelectedTaskId, switchContext, pauseTimer, resumeTimer, startTimer, stopTimer, logout]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items.slice(0, 15);
    const q = query.toLowerCase();
    return items
      .filter(item => item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
      .slice(0, 20);
  }, [items, query]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        setCommandPaletteOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCommandPaletteOpen(false);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!commandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setCommandPaletteOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-lg glass-panel rounded-2xl shadow-2xl border border-nexus-border overflow-hidden z-10 flex flex-col"
        >
          {/* Search Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-nexus-border bg-nexus-surface-2/60">
            <Search className="w-4 h-4 text-nexus-text-muted shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un comando o busca tareas, hábitos..."
              className="w-full bg-transparent text-sm text-nexus-text placeholder-nexus-text-muted outline-none"
            />
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-nexus-surface-3 border border-nexus-border rounded text-nexus-text-muted shrink-0">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div ref={listRef} className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-nexus-text-muted">
                No se encontraron comandos o tareas para "{query}"
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;

                return (
                  <div
                    key={item.id}
                    data-active={isSelected}
                    onClick={() => {
                      item.action();
                      setCommandPaletteOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-nexus-surface-3 text-nexus-text font-medium shadow-sm'
                        : 'text-nexus-text-secondary hover:text-nexus-text'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg border shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-nexus-text font-medium truncate">{item.label}</div>
                        {item.description && (
                          <div className="text-[11px] text-nexus-text-muted truncate">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-nexus-surface-2 border border-nexus-border text-nexus-text-muted">
                        {item.category}
                      </span>
                      {isSelected && <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts guide */}
          <div className="px-4 py-2 border-t border-nexus-border/60 bg-nexus-surface-2/40 flex items-center justify-between text-[11px] text-nexus-text-muted">
            <div className="flex items-center gap-3">
              <span>↑↓ para navegar</span>
              <span>↵ para seleccionar</span>
            </div>
            <span>NexusOS Palette</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CommandPalette;
