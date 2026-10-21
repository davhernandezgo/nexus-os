import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  Sparkles,
  Folder,
  CheckSquare,
  FileText,
  ArrowRight,
  Layers,
  Share2,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import KnowledgeGraph from './KnowledgeGraph';

const GraphView: React.FC = () => {
  const { getVisibleTasks, getVisibleProjects, getVisibleHabits, setSelectedTaskId } = useNexusStore();
  const [viewMode, setViewMode] = useState<'visual' | 'clusters'>('visual');

  const tasks = getVisibleTasks();
  const projects = getVisibleProjects();
  const habits = getVisibleHabits();

  // Nodes summary
  const totalNodes = tasks.length + projects.length + habits.length;

  return (
    <div className="h-full flex flex-col space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-nexus-text flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" />
            <span>Grafo de Conocimiento & Enlaces</span>
          </h2>
          <p className="text-xs text-nexus-text-muted mt-0.5">
            Explora las conexiones visuales interactivas tipo Obsidian entre proyectos, tareas y notas
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-nexus-surface-2 p-1 rounded-xl border border-nexus-border text-xs">
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`px-3 py-1.5 rounded-lg transition font-semibold flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'visual'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-nexus-text-muted hover:text-nexus-text'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Grafo Visual 2D</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('clusters')}
              className={`px-3 py-1.5 rounded-lg transition font-semibold flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'clusters'
                  ? 'bg-nexus-surface-3 text-nexus-text border border-nexus-border shadow-xs'
                  : 'text-nexus-text-muted hover:text-nexus-text'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vista de Clústeres</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-nexus-text-muted">
            <span className="px-2.5 py-1.5 rounded-xl bg-nexus-surface-2 border border-nexus-border">
              {totalNodes} nodos
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-[620px] h-[calc(100vh-13.5rem)] relative">
        <AnimatePresence mode="wait">
          {viewMode === 'visual' ? (
            <motion.div
              key="visual-graph"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full"
            >
              <KnowledgeGraph />
            </motion.div>
          ) : (
            <motion.div
              key="clusters-list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full bg-nexus-surface-2/30 border border-nexus-border rounded-3xl p-6 relative overflow-y-auto space-y-6"
            >
              {/* Decorative Grid Background */}
              <div className="absolute inset-0 bg-[radial-gradient(rgba(99,102,241,0.08)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

              {/* Projects Clusters */}
              <div className="space-y-4 relative z-10">
                <h3 className="text-xs font-semibold text-nexus-text-secondary uppercase tracking-wider">
                  Clústeres por Proyecto
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map(project => {
                    const projectTasks = tasks.filter(t => t.projectId === project.id);

                    return (
                      <div
                        key={project.id}
                        className="p-4 bg-nexus-surface-2/80 border border-nexus-border/80 backdrop-blur-md rounded-2xl space-y-3 shadow-sm hover:border-indigo-500/50 transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{project.emoji}</span>
                          <h4 className="text-sm font-bold text-nexus-text truncate">{project.name}</h4>
                          <span className="ml-auto text-[11px] font-mono text-nexus-text-muted">
                            {projectTasks.length} tareas
                          </span>
                        </div>

                        {/* Connected task nodes */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {projectTasks.length === 0 ? (
                            <span className="text-[11px] text-nexus-text-muted">Sin tareas enlazadas</span>
                          ) : (
                            projectTasks.map(t => (
                              <button
                                key={t.id}
                                onClick={() => setSelectedTaskId(t.id)}
                                className="px-2.5 py-1 bg-nexus-surface-3 hover:bg-indigo-600/25 border border-nexus-border hover:border-indigo-500 rounded-lg text-xs text-nexus-text transition-all truncate max-w-[200px] cursor-pointer"
                                title={t.title}
                              >
                                {t.title}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Global WikiLinks & Standalone Tasks */}
              <div className="pt-4 border-t border-nexus-border/60 relative z-10">
                <h3 className="text-xs font-semibold text-nexus-text-secondary uppercase tracking-wider mb-3">
                  Nodos con WikiLinks Bidireccionales
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tasks
                    .filter(t => t.wikiLinks && t.wikiLinks.length > 0)
                    .map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                      >
                        <span>[[{t.title}]]</span>
                        <span className="text-[10px] bg-indigo-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                          {t.wikiLinks.length} refs
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GraphView;
