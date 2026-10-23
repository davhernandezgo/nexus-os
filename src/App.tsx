import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNexusStore } from './store/nexusStore';
import { supabase } from './lib/supabase';
import LoginScreen from './features/auth/LoginScreen';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import QuickAdd from './components/ui/QuickAdd';
import CommandPalette from './features/command-palette/CommandPalette';
import TaskDetailModal from './features/tasks/TaskDetailModal';
import ProfileModal from './features/profile/ProfileModal';

// Views
import InboxView from './features/tasks/InboxView';
import KanbanView from './features/tasks/KanbanView';
import EisenhowerView from './features/tasks/EisenhowerView';
import CalendarView from './features/calendar/CalendarView';
import HabitsView from './features/habits/HabitsView';
import CoupleView from './features/couple/CoupleView';
import InvestmentsView from './features/investments/InvestmentsView';
import GraphView from './features/graph/GraphView';
import DailyNoteView from './features/notes/DailyNoteView';
import ProjectView from './features/tasks/ProjectView';

const App: React.FC = () => {
  const {
    isAuthenticated,
    setCommandPaletteOpen,
    selectedTaskId,
    setSelectedTaskId,
    theme,
  } = useNexusStore();

  const location = useLocation();

  // Sync theme with HTML root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('light', theme === 'light');
      document.documentElement.setAttribute('data-theme', theme || 'dark');
    }
  }, [theme]);

  // Sync with Supabase Auth session
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          useNexusStore.getState().setSupabaseUser(session.user);
        } else {
          const state = useNexusStore.getState();
          if (state.isAuthenticated && !state.currentUser) {
            useNexusStore.getState().logout();
          }
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          useNexusStore.getState().setSupabaseUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          useNexusStore.getState().logout();
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen]);

  // If not authenticated, show LoginScreen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-nexus-bg text-nexus-text">
      {/* Left Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <Header />

        {/* Smart NLP Quick-Add bar pinned below header */}
        <QuickAdd />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              <Routes location={location}>
                <Route path="/" element={<Navigate to="/inbox" replace />} />
                <Route path="/inbox" element={<InboxView />} />
                <Route path="/kanban" element={<KanbanView />} />
                <Route path="/eisenhower" element={<EisenhowerView />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/habits" element={<HabitsView />} />
                <Route path="/couple" element={<CoupleView />} />
                <Route path="/investments" element={<InvestmentsView />} />
                <Route path="/graph" element={<GraphView />} />
                <Route path="/daily-note" element={<DailyNoteView />} />
                <Route path="/project/:projectId" element={<ProjectView />} />
                <Route path="*" element={<Navigate to="/inbox" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Command Palette (Cmd+K) Modal */}
      <CommandPalette />

      {/* User Profile & Appearance Modal */}
      <ProfileModal />

      {/* Task Page Modal */}
      <AnimatePresence>
        {selectedTaskId && (
          <TaskDetailModal
            key={selectedTaskId}
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
