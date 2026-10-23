import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Sparkles,
  Check,
  Eye,
  Layers,
  Calendar,
  Briefcase,
  User,
  Heart,
  DollarSign,
  Share2,
  Bookmark,
  ChevronRight,
  ArrowLeft,
  FileText,
  CheckSquare,
  List,
  Code,
  Info,
  Plane,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import { BUILTIN_TEMPLATES } from '../../services/templates';
import type { TaskTemplate, TemplateCategory, PageBlock } from '../../types/nexus';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TaskTemplate) => void;
  title?: string;
  confirmButtonText?: string;
  initialTemplateId?: string;
  filterCategory?: TemplateCategory;
}

const CATEGORY_TABS: { id: TemplateCategory; label: string; icon: any }[] = [
  { id: 'all', label: 'Todas', icon: Layers },
  { id: 'daily', label: 'Diarias', icon: Calendar },
  { id: 'travel', label: 'Viajes', icon: Plane },
  { id: 'work', label: 'Trabajo', icon: Briefcase },
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'health', label: 'Salud', icon: Heart },
  { id: 'finance', label: 'Finanzas', icon: DollarSign },
  { id: 'couple', label: 'Pareja', icon: Share2 },
  { id: 'custom', label: 'Mis plantillas', icon: Bookmark },
];

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  title = 'Galería de Plantillas',
  confirmButtonText = 'Usar esta plantilla',
  initialTemplateId,
  filterCategory,
}) => {
  const { customTemplates } = useNexusStore();

  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>(filterCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'list' | 'preview'>('list');

  // All combined templates
  const allTemplates = useMemo(() => {
    return [...BUILTIN_TEMPLATES, ...(customTemplates || [])];
  }, [customTemplates]);

  // Set initial selected template
  useEffect(() => {
    if (isOpen) {
      if (initialTemplateId && allTemplates.some(t => t.id === initialTemplateId)) {
        setSelectedTemplateId(initialTemplateId);
        setMobileTab('preview');
      } else if (allTemplates.length > 0) {
        setSelectedTemplateId(allTemplates[0].id);
        setMobileTab('list');
      }
      if (filterCategory) {
        setSelectedCategory(filterCategory);
      }
      setSearchQuery('');
    }
  }, [isOpen, initialTemplateId, filterCategory, allTemplates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(t => {
      const matchesCategory =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'custom'
          ? t.isCustom || (customTemplates || []).some(ct => ct.id === t.id)
          : t.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.blocks.some(b => b.content.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [allTemplates, selectedCategory, searchQuery, customTemplates]);

  // Active template for preview
  const currentTemplate = useMemo(() => {
    return (
      allTemplates.find(t => t.id === selectedTemplateId) ||
      filteredTemplates[0] ||
      allTemplates[0]
    );
  }, [allTemplates, selectedTemplateId, filteredTemplates]);

  // Lock body scroll on open
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

  const handleApply = () => {
    if (currentTemplate) {
      onSelectTemplate(currentTemplate);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="glass-panel w-full max-w-5xl h-[88vh] max-h-[820px] rounded-3xl shadow-2xl relative z-10 border border-nexus-border flex flex-col overflow-hidden bg-nexus-surface/95"
        >
          {/* Header */}
          <div className="p-4 sm:px-6 sm:py-4 border-b border-nexus-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-nexus-text flex items-center gap-2">
                  <span>{title}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-nexus-surface-2 border border-nexus-border text-nexus-text-muted">
                    {filteredTemplates.length} disponibles
                  </span>
                </h2>
                <p className="text-xs text-nexus-text-muted hidden sm:block">
                  Previsualiza y selecciona la estructura ideal para tus notas y proyectos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile Tab Toggle */}
              <div className="flex sm:hidden items-center p-0.5 bg-nexus-surface-2 rounded-xl border border-nexus-border text-xs">
                <button
                  type="button"
                  onClick={() => setMobileTab('list')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    mobileTab === 'list'
                      ? 'bg-nexus-surface-3 text-nexus-text font-bold shadow-xs'
                      : 'text-nexus-text-muted'
                  }`}
                >
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('preview')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    mobileTab === 'preview'
                      ? 'bg-nexus-surface-3 text-nexus-text font-bold shadow-xs'
                      : 'text-nexus-text-muted'
                  }`}
                >
                  Vista previa
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="px-4 sm:px-6 py-3 border-b border-nexus-border/80 bg-nexus-surface-2/40 space-y-2.5 shrink-0">
            <div className="flex items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-nexus-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar plantillas por nombre o contenido..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text placeholder-nexus-text-muted focus:outline-none focus:border-indigo-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nexus-text-muted hover:text-nexus-text p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {CATEGORY_TABS.map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                const count =
                  cat.id === 'all'
                    ? allTemplates.length
                    : cat.id === 'custom'
                    ? (customTemplates || []).length
                    : allTemplates.filter(t => t.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                        : 'bg-nexus-surface-2 text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-3 border border-nexus-border'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-nexus-surface-3 text-nexus-text-muted'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body: Split View (List + Preview) */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Template List */}
            <div
              className={`w-full sm:w-[380px] lg:w-[420px] border-r border-nexus-border overflow-y-auto p-3 sm:p-4 space-y-2 shrink-0 ${
                mobileTab === 'preview' ? 'hidden sm:block' : 'block'
              }`}
            >
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-nexus-text-muted text-xs space-y-2">
                  <p className="font-semibold text-sm">No se encontraron plantillas</p>
                  <p>Prueba con otro término de búsqueda o categoría.</p>
                </div>
              ) : (
                filteredTemplates.map(tmpl => {
                  const isSelected = tmpl.id === selectedTemplateId;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => {
                        setSelectedTemplateId(tmpl.id);
                        setMobileTab('preview');
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer group flex items-start gap-3 relative ${
                        isSelected
                          ? 'bg-indigo-500/10 border-indigo-500/50 shadow-sm'
                          : 'bg-nexus-surface-2/60 hover:bg-nexus-surface-2 border-nexus-border hover:border-nexus-border-hover'
                      }`}
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-nexus-surface-3 border border-nexus-border flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                        {tmpl.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-nexus-text truncate group-hover:text-indigo-400 transition-colors">
                            {tmpl.name}
                          </h4>
                          <span className="text-[10px] font-mono text-nexus-text-muted shrink-0">
                            {tmpl.blocks?.length || 0} bloques
                          </span>
                        </div>
                        <p className="text-[11px] text-nexus-text-muted line-clamp-2 mt-1 leading-relaxed">
                          {tmpl.description}
                        </p>
                      </div>

                      {/* Right Indicator */}
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform mt-3 ${
                          isSelected
                            ? 'text-indigo-400 translate-x-0.5'
                            : 'text-nexus-text-muted opacity-40 group-hover:opacity-100'
                        }`}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Live Interactive Preview */}
            <div
              className={`flex-1 flex flex-col overflow-hidden bg-nexus-surface-2/20 ${
                mobileTab === 'list' ? 'hidden sm:flex' : 'flex'
              }`}
            >
              {currentTemplate ? (
                <>
                  {/* Preview Header */}
                  <div className="p-4 sm:p-5 border-b border-nexus-border bg-nexus-surface-2/40 flex items-start justify-between gap-3 shrink-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-nexus-surface-3 border border-nexus-border flex items-center justify-center text-2xl shrink-0 shadow-sm">
                        {currentTemplate.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-nexus-text">
                            {currentTemplate.name}
                          </h3>
                          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-nexus-surface-3 text-nexus-text-secondary border border-nexus-border font-mono">
                            {currentTemplate.category}
                          </span>
                        </div>
                        <p className="text-xs text-nexus-text-muted mt-1 leading-relaxed">
                          {currentTemplate.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleApply}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white text-xs font-bold transition shadow-md shadow-indigo-500/25 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{confirmButtonText}</span>
                      </button>
                    </div>
                  </div>

                  {/* Rendered Template Outline */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                    <div className="text-[11px] font-semibold text-nexus-text-muted uppercase tracking-wider flex items-center justify-between pb-2 border-b border-nexus-border/60">
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Vista previa de la estructura ({currentTemplate.blocks?.length || 0} bloques)</span>
                      </span>
                      <span className="text-nexus-text-muted font-mono text-[10px]">Lienzo interactivo</span>
                    </div>

                    <div className="space-y-2.5 max-w-2xl mx-auto py-2">
                      {currentTemplate.blocks.map((block: PageBlock) => {
                        switch (block.type) {
                          case 'heading1':
                            return (
                              <h1
                                key={block.id}
                                className="text-lg font-bold text-nexus-text pt-2 border-b border-nexus-border/50 pb-1"
                              >
                                {block.content || 'Encabezado principal'}
                              </h1>
                            );
                          case 'heading2':
                            return (
                              <h2
                                key={block.id}
                                className="text-sm font-bold text-nexus-text pt-2 flex items-center gap-1.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span>{block.content || 'Sección'}</span>
                              </h2>
                            );
                          case 'heading3':
                            return (
                              <h3
                                key={block.id}
                                className="text-xs font-bold text-nexus-text-secondary pt-1 uppercase tracking-wider"
                              >
                                {block.content || 'Subsección'}
                              </h3>
                            );
                          case 'callout':
                            return (
                              <div
                                key={block.id}
                                className="p-3 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text flex items-start gap-2.5 shadow-inner"
                              >
                                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                <div className="whitespace-pre-line text-nexus-text leading-relaxed">
                                  {block.content || 'Cuadro de enfoque'}
                                </div>
                              </div>
                            );
                          case 'todo':
                            return (
                              <div
                                key={block.id}
                                className="flex items-center gap-2.5 text-xs text-nexus-text pl-1"
                              >
                                <div className="w-4 h-4 rounded-md border border-nexus-border bg-nexus-surface-2 shrink-0 flex items-center justify-center text-nexus-text-muted">
                                  {block.checked && <Check className="w-3 h-3 text-emerald-400" />}
                                </div>
                                <span className="leading-relaxed">{block.content || 'Elemento de lista'}</span>
                              </div>
                            );
                          case 'bullet_list':
                            return (
                              <div
                                key={block.id}
                                className="flex items-start gap-2 text-xs text-nexus-text pl-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                                <span className="leading-relaxed">{block.content}</span>
                              </div>
                            );
                          case 'numbered_list':
                            return (
                              <div
                                key={block.id}
                                className="flex items-start gap-2 text-xs text-nexus-text pl-2 font-mono"
                              >
                                <span className="text-indigo-400 text-xs shrink-0">•</span>
                                <span className="leading-relaxed font-sans">{block.content}</span>
                              </div>
                            );
                          case 'code':
                            return (
                              <div
                                key={block.id}
                                className="p-3 rounded-xl bg-black/40 border border-nexus-border font-mono text-xs text-emerald-400 overflow-x-auto shadow-inner"
                              >
                                <div className="text-[10px] text-nexus-text-muted pb-1 mb-1 border-b border-nexus-border/40 font-sans flex items-center justify-between">
                                  <span>{block.language || 'bash'}</span>
                                  <Code className="w-3 h-3 text-nexus-text-muted" />
                                </div>
                                <pre className="whitespace-pre-wrap">{block.content}</pre>
                              </div>
                            );
                          case 'divider':
                            return <hr key={block.id} className="border-nexus-border/60 my-2" />;
                          case 'paragraph':
                          default:
                            return (
                              <p
                                key={block.id}
                                className="text-xs text-nexus-text-muted italic leading-relaxed pl-1"
                              >
                                {block.content || '(Espacio para texto libre)'}
                              </p>
                            );
                        }
                      })}
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="p-4 border-t border-nexus-border bg-nexus-surface-2/60 flex items-center justify-between shrink-0">
                    <button
                      type="button"
                      onClick={() => setMobileTab('list')}
                      className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-nexus-surface-2 text-xs text-nexus-text-muted hover:text-nexus-text transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver a la lista</span>
                    </button>

                    <span className="hidden sm:inline text-xs text-nexus-text-muted">
                      Esta estructura se cargará en tu documento y podrás editar cada bloque libremente.
                    </span>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleApply}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white text-xs font-bold transition shadow-md shadow-indigo-500/25 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{confirmButtonText}</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-nexus-text-muted text-xs p-6 text-center">
                  Selecciona una plantilla del listado para previsualizar su contenido.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TemplateGalleryModal;
