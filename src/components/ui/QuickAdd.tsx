import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Sparkles,
  Tag,
  Calendar,
  Clock,
  Shield,
  Flag,
  Folder,
  CheckCircle2,
  X,
  FileText,
  ChevronDown,
  Check,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import { tokenize, parseTaskInput, getTokenColorClass } from '../../utils/nlpParser';
import type { Task, Priority, Project } from '../../types/nexus';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import CreateTaskModal from './CreateTaskModal';

const QuickAdd: React.FC = () => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [createdFeedback, setCreatedFeedback] = useState<{
    id: string;
    title: string;
    projectId?: string;
    projectName?: string;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const {
    addTask,
    addProject,
    currentOwner,
    currentUser,
    contextMode,
    getVisibleProjects,
    setSelectedTaskId,
  } = useNexusStore();

  const projects = getVisibleProjects();

  // Detect active project from URL if on /project/:id
  const activeProject = useMemo(() => {
    const match = location.pathname.match(/\/project\/([^/?#]+)/);
    if (!match) return undefined;
    return projects.find(p => p.id === match[1]);
  }, [location.pathname, projects]);

  // Synchronize selectedProjectId when navigating to a specific project route
  useEffect(() => {
    if (activeProject) {
      setSelectedProjectId(activeProject.id);
    }
  }, [activeProject?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showProjectDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProjectDropdown]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showProjectDropdown) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setProjectSearch('');
    }
  }, [showProjectDropdown]);

  // Auto-dismiss confirmation toast after 6s
  useEffect(() => {
    if (!createdFeedback) return;
    const timer = setTimeout(() => {
      setCreatedFeedback(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [createdFeedback]);

  // Parse tokens as user types
  const tokens = useMemo(() => {
    if (!input.trim()) return [];
    return tokenize(input);
  }, [input]);

  const metaTokens = useMemo(() => {
    return tokens.filter(t => t.type !== 'text');
  }, [tokens]);

  const parsed = useMemo(() => parseTaskInput(input), [input]);

  // NLP project match if typed e.g. +ContaCripto
  const nlpMatchedProject = useMemo(() => {
    if (!parsed.projectQuery) return undefined;
    const q = parsed.projectQuery.toLowerCase();
    return projects.find(
      p => p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  }, [parsed.projectQuery, projects]);

  // Effective linked project: typed NLP query > manual selection > route project
  const effectiveProject = useMemo(() => {
    if (nlpMatchedProject) return nlpMatchedProject;
    if (selectedProjectId) {
      return projects.find(p => p.id === selectedProjectId);
    }
    return activeProject;
  }, [nlpMatchedProject, selectedProjectId, projects, activeProject]);

  // Filtered projects for dropdown
  const filteredProjects = useMemo(() => {
    const q = projectSearch.toLowerCase().trim();
    if (!q) return projects;
    return projects.filter(p => p.name.toLowerCase().includes(q));
  }, [projects, projectSearch]);

  const handleCreateNewProjectQuick = () => {
    const trimmed = projectSearch.trim();
    if (!trimmed || !currentOwner) return;

    const newProjId = `proj-${uuidv4().slice(0, 8)}`;
    const newProj: Project = {
      id: newProjId,
      name: trimmed,
      emoji: '📁',
      color: '#6366f1',
      owner: currentOwner,
      visibility: contextMode === 'couple' ? 'couple' : 'private',
      description: '',
      taskIds: [],
      createdAt: new Date().toISOString(),
    };

    addProject(newProj);
    setSelectedProjectId(newProjId);
    setProjectSearch('');
    setShowProjectDropdown(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) {
      setShowModal(true);
      return;
    }

    const finalTitle = parsed.title.trim() || input.trim();
    const targetProjectId = effectiveProject?.id;
    const targetProjectObj = effectiveProject;

    const finalVisibility =
      parsed.visibility ||
      targetProjectObj?.visibility ||
      (contextMode === 'couple' ? 'couple' : 'private');

    const newTaskId = `task-${uuidv4().slice(0, 8)}`;
    const newTask: Task = {
      id: newTaskId,
      title: finalTitle,
      description: '',
      status: 'todo',
      priority: parsed.priority || 'P3',
      owner: currentOwner || currentUser?.id || 'user',
      visibility: finalVisibility,
      projectId: targetProjectId,
      subtaskIds: [],
      tags: parsed.tags,
      category: targetProjectObj ? targetProjectObj.name : parsed.tags.length > 0 ? parsed.tags[0] : 'General',
      createdAt: new Date().toISOString(),
      dueDate: parsed.dueDate,
      estimatedMinutes: parsed.estimatedMinutes,
      actualMinutes: 0,
      pageContent: [
        {
          id: `block-${uuidv4().slice(0, 8)}`,
          type: 'heading1',
          content: finalTitle,
        },
        {
          id: `block-${uuidv4().slice(0, 8)}`,
          type: 'paragraph',
          content: 'Escribe aquí los detalles, notas o especificaciones de la tarea...',
        },
      ],
      wikiLinks: [],
    };

    addTask(newTask);
    setInput('');

    // Trigger visual confirmation with direct link to project and task sheet
    setCreatedFeedback({
      id: newTaskId,
      title: finalTitle,
      projectId: targetProjectId,
      projectName: targetProjectObj ? `${targetProjectObj.emoji} ${targetProjectObj.name}` : undefined,
    });
  };

  const handleUseExample = (exampleText: string) => {
    setInput(exampleText);
  };

  const renderChipContent = (token: ReturnType<typeof tokenize>[0]) => {
    switch (token.type) {
      case 'priority':
        return (
          <span className="flex items-center gap-1 font-bold">
            <Flag className="w-3 h-3" /> Prioridad {token.value}
          </span>
        );
      case 'tag':
        return (
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" /> #{token.value}
          </span>
        );
      case 'project':
        return (
          <span className="flex items-center gap-1 font-medium">
            <Folder className="w-3 h-3" /> +{token.value}
          </span>
        );
      case 'date':
        return (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(parseISO(token.value), "d 'de' MMM", { locale: es })}
          </span>
        );
      case 'estimate':
        return (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {token.value} min
          </span>
        );
      case 'visibility':
        return (
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" /> {token.value === 'couple' ? '💑 Pareja' : '🔒 Privado'}
          </span>
        );
      default:
        return token.value;
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 py-3 border-b border-nexus-border/60 bg-nexus-surface/80 backdrop-blur-md sticky top-14 z-20">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center gap-2">
            {/* Main Input Wrapper */}
            <div
              className={`relative flex-1 flex items-center bg-nexus-surface-2 rounded-xl border transition-all duration-200 shadow-sm ${
                isFocused
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-nexus-surface-2'
                  : 'border-nexus-border hover:border-nexus-border-hover'
              }`}
            >
              <div className="pl-3.5 text-nexus-text-muted shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>

              {/* ── PROJECT LINKING SELECTOR BUTTON & POPOVER ── */}
              <div className="relative shrink-0 flex items-center ml-1.5" ref={dropdownRef}>
                {effectiveProject ? (
                  <div className="flex items-center bg-indigo-500/15 border border-indigo-500/35 rounded-lg pr-1">
                    <button
                      type="button"
                      onClick={() => setShowProjectDropdown(prev => !prev)}
                      className="pl-2 pr-1.5 py-1 text-indigo-300 hover:text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer max-w-[130px] sm:max-w-[170px]"
                      title="Hacer clic para cambiar de proyecto"
                    >
                      <span className="text-sm shrink-0">{effectiveProject.emoji}</span>
                      <span className="truncate">{effectiveProject.name}</span>
                      <ChevronDown
                        className={`w-3 h-3 text-indigo-400 shrink-0 transition-transform ${
                          showProjectDropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProjectId(null);
                        if (parsed.projectQuery) {
                          setInput(prev =>
                            prev.replace(new RegExp(`\\+${parsed.projectQuery}\\b`, 'i'), '').trim()
                          );
                        }
                      }}
                      className="p-1 text-indigo-400 hover:text-red-400 hover:bg-nexus-surface-3 rounded-md transition cursor-pointer"
                      title="Desvincular proyecto (dejar tarea general)"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowProjectDropdown(prev => !prev)}
                    className="px-2.5 py-1 rounded-lg bg-nexus-surface-3/60 hover:bg-nexus-surface-3 border border-nexus-border hover:border-indigo-500/50 text-nexus-text-muted hover:text-nexus-text text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Enlazar a un proyecto"
                  >
                    <Folder className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden xs:inline">Enlazar Proyecto</span>
                    <ChevronDown
                      className={`w-3 h-3 text-nexus-text-muted transition-transform ${
                        showProjectDropdown ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                )}

                {/* Popover Dropdown */}
                <AnimatePresence>
                  {showProjectDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.12 }}
                      className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-nexus-surface border border-nexus-border rounded-2xl shadow-2xl p-2.5 z-50 text-xs"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-1.5 pb-2 border-b border-nexus-border/60">
                        <span className="font-bold text-nexus-text flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Asignar Proyecto</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowProjectDropdown(false)}
                          className="p-1 text-nexus-text-muted hover:text-nexus-text rounded-md transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Search box */}
                      <div className="my-2 relative flex items-center bg-nexus-surface-2 border border-nexus-border rounded-xl px-2.5 py-1.5">
                        <Search className="w-3.5 h-3.5 text-nexus-text-muted shrink-0 mr-1.5" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={projectSearch}
                          onChange={e => setProjectSearch(e.target.value)}
                          placeholder="Buscar o crear proyecto..."
                          className="w-full bg-transparent text-xs text-nexus-text placeholder-nexus-text-muted outline-none"
                        />
                      </div>

                      {/* Fast Action: Unassign / Sin Proyecto */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProjectId(null);
                          setShowProjectDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition text-left cursor-pointer mb-1 ${
                          !effectiveProject
                            ? 'bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30'
                            : 'hover:bg-nexus-surface-2 text-nexus-text-secondary'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>🌐</span>
                          <span>Sin Proyecto (Tarea General)</span>
                        </span>
                        {!effectiveProject && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>

                      {/* Project List */}
                      <div className="max-h-52 overflow-y-auto space-y-0.5 pr-0.5">
                        {filteredProjects.map(proj => {
                          const isSelected = effectiveProject?.id === proj.id;
                          return (
                            <button
                              key={proj.id}
                              type="button"
                              onClick={() => {
                                setSelectedProjectId(proj.id);
                                setShowProjectDropdown(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition text-left cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-500/20 text-indigo-200 font-semibold border border-indigo-500/40'
                                  : 'hover:bg-nexus-surface-2 text-nexus-text'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-sm shrink-0">{proj.emoji}</span>
                                <span className="truncate">{proj.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span className="text-[10px] text-nexus-text-muted">
                                  {proj.visibility === 'couple' ? '💑' : '🔒'}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                              </div>
                            </button>
                          );
                        })}

                        {filteredProjects.length === 0 && projectSearch.trim() && (
                          <div className="py-2 px-1 text-center">
                            <p className="text-[11px] text-nexus-text-muted mb-2">
                              No hay proyectos con "{projectSearch}".
                            </p>
                            <button
                              type="button"
                              onClick={handleCreateNewProjectQuick}
                              className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Crear proyecto "{projectSearch.trim()}"</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={
                  effectiveProject
                    ? `Agregar tarea a ${effectiveProject.name}... (ej: Terminar reporte !P1 #urgente mañana)`
                    : 'Captura rápida NLP... (ej: Optimizar query !P1 #backend mañana ~60m @privado)'
                }
                className="w-full py-2.5 px-2 bg-transparent text-sm text-nexus-text placeholder-nexus-text-muted outline-none min-w-0"
              />

              {/* Action Button: NLP submit if text exists, or open full modal if empty */}
              <button
                type="submit"
                className={`m-1.5 p-1.5 rounded-lg transition-all shrink-0 shadow-sm cursor-pointer ${
                  input.trim()
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'
                    : 'bg-nexus-surface-3 hover:bg-nexus-surface-3/80 text-nexus-text-secondary hover:text-nexus-text border border-nexus-border'
                }`}
                title={
                  input.trim()
                    ? 'Crear rápido con NLP (Enter)'
                    : 'Abrir creador completo de tarea con hoja Notion'
                }
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Intuitive Visual Create Button */}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-nexus-accent-indigo to-indigo-600 hover:opacity-95 text-white text-xs font-semibold shrink-0 shadow-sm transition active:scale-95 cursor-pointer"
              title="Crear nueva tarea con hoja Notion integrada"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Nueva Tarea</span>
            </button>
          </div>

          {/* Quick Project Clickable Shortcut Chips + Example Helper */}
          <div className="pt-2 pl-1 flex flex-wrap items-center gap-1.5 overflow-hidden">
            {/* Quick Project selector shortcuts */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-[11px] text-nexus-text-muted flex items-center gap-1 shrink-0 font-medium">
                <Folder className="w-3 h-3 text-indigo-400" />
                <span>Proyectos:</span>
              </span>
              {projects.slice(0, 5).map(p => {
                const isSelected = effectiveProject?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedProjectId(null);
                      } else {
                        setSelectedProjectId(p.id);
                      }
                    }}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border transition flex items-center gap-1 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-200 font-bold ring-1 ring-indigo-500/30'
                        : 'bg-nexus-surface-2 border-nexus-border hover:border-indigo-500/50 text-nexus-text-secondary hover:text-nexus-text'
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span className="truncate max-w-[120px]">{p.name}</span>
                    {isSelected && <span className="text-[9px] text-indigo-300 ml-0.5">✔</span>}
                  </button>
                );
              })}
            </div>

            {/* Quick NLP example if focused and empty */}
            {isFocused && !input.trim() && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[11px] text-nexus-text-muted">💡 Probar:</span>
                <button
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault(); // prevent blur
                    handleUseExample(
                      effectiveProject
                        ? 'Optimizar entregable !P1 #prioritario mañana ~45m'
                        : 'Optimizar query !P1 #backend mañana ~60m @privado'
                    );
                  }}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-nexus-surface-2 border border-nexus-border hover:border-indigo-500 text-indigo-300 font-medium transition cursor-pointer"
                >
                  {effectiveProject
                    ? 'Optimizar entregable !P1 #prioritario mañana ~45m'
                    : 'Optimizar query !P1 #backend mañana ~60m @privado'}
                </button>
              </div>
            )}
          </div>

          {/* NLP Live Token Chips */}
          <AnimatePresence>
            {metaTokens.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                className="flex flex-wrap items-center gap-1.5 pt-2 pl-1 overflow-hidden"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-nexus-text-muted mr-1">
                  Detectado:
                </span>
                {metaTokens.map((token, i) => (
                  <span
                    key={`${token.type}-${token.value}-${i}`}
                    className={`inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full border ${getTokenColorClass(
                      token.type
                    )}`}
                  >
                    {renderChipContent(token)}
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Creation Confirmation Notification Toast with direct Project & Sheet links */}
          <AnimatePresence>
            {createdFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                className="mt-2.5 p-2.5 px-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex flex-wrap items-center justify-between gap-3 shadow-lg"
              >
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-300">¡Tarea creada!</span>
                  <span className="truncate text-nexus-text font-medium">
                    "{createdFeedback.title}"
                  </span>
                  {createdFeedback.projectName && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1">
                      <Folder className="w-3 h-3 text-emerald-400" />
                      <span>en {createdFeedback.projectName}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {createdFeedback.projectId && (
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/project/${createdFeedback.projectId}`);
                        setCreatedFeedback(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-nexus-surface-2 hover:bg-nexus-surface-3 text-nexus-text border border-nexus-border font-semibold text-[11px] flex items-center gap-1 transition shadow-xs cursor-pointer"
                      title="Ir a la pantalla del proyecto"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ver Proyecto</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTaskId(createdFeedback.id);
                      setCreatedFeedback(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-[11px] flex items-center gap-1 transition shadow-xs cursor-pointer"
                    title="Abrir hoja de tarea en Notion Studio"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Abrir Hoja</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatedFeedback(null)}
                    className="p-1 text-emerald-400 hover:text-emerald-200 rounded-md transition cursor-pointer"
                    title="Cerrar aviso"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      {/* Intuitive Full Create Modal with project and visibility defaults */}
      <CreateTaskModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        defaultProjectId={effectiveProject?.id}
        defaultVisibility={
          effectiveProject?.visibility ||
          (contextMode === 'couple' ? 'couple' : 'private')
        }
      />
    </div>
  );
};

export default QuickAdd;
