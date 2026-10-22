import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Inbox,
  Kanban,
  Target,
  Calendar,
  CheckSquare,
  HeartHandshake,
  Network,
  FileText,
  Folder,
  Command,
  X,
  Sparkles,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import EmojiPicker from '../ui/EmojiPicker';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'inbox', label: 'Inbox', path: '/inbox', icon: Inbox },
  { id: 'kanban', label: 'Kanban', path: '/kanban', icon: Kanban },
  { id: 'eisenhower', label: 'Eisenhower', path: '/eisenhower', icon: Target },
  { id: 'calendar', label: 'Calendario', path: '/calendar', icon: Calendar },
  { id: 'habits', label: 'Hábitos', path: '/habits', icon: CheckSquare },
  { id: 'couple', label: 'Hub Pareja', path: '/couple', icon: HeartHandshake },
  { id: 'investments', label: 'Inversiones ($)', path: '/investments', icon: TrendingUp },
  { id: 'graph', label: 'Grafo', path: '/graph', icon: Network },
  { id: 'daily-note', label: 'Nota del Día', path: '/daily-note', icon: FileText },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    sidebarOpen,
    setSidebarOpen,
    getVisibleProjects,
    setActiveView,
    setCommandPaletteOpen,
    accounts,
    currentOwner,
    contextMode,
    switchContext,
    addProject,
  } = useNexusStore();

  const [showNewProjModal, setShowNewProjModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjEmoji, setNewProjEmoji] = useState('📁');
  const [newProjVisibility, setNewProjVisibility] = useState<'private' | 'couple'>('private');

  const currentAccount = accounts.find(a => a.owner === currentOwner);
  const accentColor = currentAccount?.accentColor || '#6366f1';
  const projects = getVisibleProjects();

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !currentOwner) return;

    const newId = `proj-${Date.now()}`;
    addProject({
      id: newId,
      name: newProjName.trim(),
      emoji: newProjEmoji,
      color: newProjVisibility === 'couple' ? '#ec4899' : '#6366f1',
      owner: currentOwner,
      visibility: newProjVisibility,
      description: '',
      taskIds: [],
      createdAt: new Date().toISOString(),
    });

    setNewProjName('');
    setShowNewProjModal(false);
    navigate(`/project/${newId}`);
    setActiveView('project');
  };

  const handleNavClick = (item: NavItem) => {
    if (item.id === 'couple' && contextMode === 'private') {
      switchContext('couple');
    }
    setActiveView(item.id);
    navigate(item.path);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleProjectClick = (projectId: string) => {
    setActiveView('project');
    navigate(`/project/${projectId}`);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-nexus-border flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header Logo */}
        <div className="h-14 px-4 border-b border-nexus-border flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              navigate('/inbox');
              setActiveView('inbox');
            }}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="w-8 h-8 rounded-xl bg-nexus-surface-2 border border-nexus-border flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/50 transition-colors shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-nexus-text block leading-none">
                NexusOS
              </span>
              <span className="text-[10px] text-nexus-text-muted uppercase tracking-widest font-mono">
                LifeOS
              </span>
            </div>
          </button>

          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-nexus-text-muted hover:text-nexus-text md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation Links */}
          <div className="space-y-1">
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-nexus-text-muted">
              Vistas Principales
            </div>

            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path === '/inbox' && location.pathname === '/');

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-nexus-surface-3 text-nexus-text font-semibold shadow-sm'
                      : 'text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-surface-2'
                  }`}
                  style={
                    isActive
                      ? {
                          borderLeft: `3px solid ${accentColor}`,
                        }
                      : {}
                  }
                >
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-indigo-400' : 'text-nexus-text-muted'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Projects Section */}
          <div className="space-y-1">
            <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-nexus-text-muted">
              <span>Proyectos ({projects.length})</span>
              <button
                onClick={() => setShowNewProjModal(true)}
                className="p-1 rounded-md hover:bg-nexus-surface-3 text-nexus-text-muted hover:text-nexus-text transition"
                title="Crear nuevo proyecto"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="px-3 py-2 text-xs text-nexus-text-muted italic">
                Sin proyectos en este contexto
              </div>
            ) : (
              projects.map(proj => {
                const isCurrentProject = location.pathname === `/project/${proj.id}`;

                return (
                  <button
                    key={proj.id}
                    onClick={() => handleProjectClick(proj.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors group ${
                      isCurrentProject
                        ? 'bg-nexus-surface-3 text-nexus-text font-medium'
                        : 'text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-surface-2'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-sm shrink-0">{proj.emoji}</span>
                      <span className="truncate">{proj.name}</span>
                    </div>

                    {proj.taskIds && proj.taskIds.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-nexus-surface-3 text-nexus-text-muted font-mono">
                        {proj.taskIds.length}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Bar: Cmd+K Quick Trigger */}
        <div className="p-3 border-t border-nexus-border bg-nexus-surface-2/40">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-xs text-nexus-text-secondary hover:text-nexus-text transition-all group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Command className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Paleta de comandos</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-nexus-surface-3 border border-nexus-border rounded text-nexus-text-muted">
              ⌘K
            </kbd>
          </button>
        </div>
      </aside>

      {/* New Project Modal */}
      {showNewProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-nexus-surface border border-nexus-border rounded-2xl p-5 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-nexus-border pb-3">
              <h3 className="text-sm font-bold text-nexus-text">Nuevo Proyecto</h3>
              <button
                type="button"
                onClick={() => setShowNewProjModal(false)}
                className="text-nexus-text-muted hover:text-nexus-text transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              {/* Rich Searchable & Categorized Emoji Picker */}
              <EmojiPicker
                selectedEmoji={newProjEmoji}
                onSelectEmoji={setNewProjEmoji}
                title="Ícono del Proyecto"
              />

              <div className="space-y-1">
                <label className="text-xs text-nexus-text-secondary font-medium">Nombre</label>
                <input
                  type="text"
                  autoFocus
                  value={newProjName}
                  onChange={e => setNewProjName(e.target.value)}
                  placeholder="Ej: Infraestructura AWS..."
                  className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-nexus-text-secondary font-medium">Visibilidad</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewProjVisibility('private')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition ${
                      newProjVisibility === 'private'
                        ? 'bg-nexus-surface-3 border-indigo-500/50 text-indigo-300'
                        : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted'
                    }`}
                  >
                    🔒 Privado
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProjVisibility('couple')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition ${
                      newProjVisibility === 'couple'
                        ? 'bg-nexus-surface-3 border-pink-500/50 text-pink-300'
                        : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted'
                    }`}
                  >
                    💑 Pareja
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-nexus-text-muted hover:text-nexus-text"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newProjName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50"
                >
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
