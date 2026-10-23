import React, { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Lock,
  Heart,
  Folder
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useNexusStore } from '../../store/nexusStore';
import type { Task, Priority } from '../../types/nexus';
import { getDeliveryStatus } from '../../types/nexus';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CalendarView() {
  const {
    getVisibleTasks,
    getVisibleProjects,
    setSelectedTaskId,
    toggleTaskStatus,
    addTask,
    currentOwner,
    currentUser,
  } = useNexusStore();

  const visibleTasks = getVisibleTasks();
  const visibleProjects = getVisibleProjects();

  // Current calendar month view
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  // Selected day for the detail list
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // Quick task input for selected date
  const [newTitle, setNewTitle] = useState('');

  // Project map
  const projectMap = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string }>();
    visibleProjects.forEach(p => map.set(p.id, { name: p.name, emoji: p.emoji }));
    return map;
  }, [visibleProjects]);

  // Map tasks by date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    visibleTasks.forEach(task => {
      if (task.dueDate) {
        const dStr = task.dueDate.split('T')[0];
        const list = map.get(dStr) || [];
        list.push(task);
        map.set(dStr, list);
      }
    });
    return map;
  }, [visibleTasks]);

  // Compute days for the month grid
  const daysInGrid = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Navigation handlers
  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Tasks due on selected date
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayTasks = tasksByDate.get(selectedDateKey) || [];

  // Quick add task on selected date
  const handleAddForSelectedDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const taskDate = new Date(selectedDate);
    taskDate.setHours(12, 0, 0, 0);

    const newTask: Task = {
      id: `task-${uuidv4()}`,
      title: newTitle.trim(),
      description: '',
      status: 'todo',
      priority: 'P2',
      owner: currentOwner || currentUser?.id || 'user',
      visibility: 'private',
      subtaskIds: [],
      tags: [],
      category: 'General',
      createdAt: new Date().toISOString(),
      dueDate: taskDate.toISOString(),
      actualMinutes: 0,
      pageContent: [],
      wikiLinks: [],
    };

    addTask(newTask);
    setNewTitle('');
  };

  // Priority color helper
  const getPriorityDotClass = (p: Priority) => {
    switch (p) {
      case 'P1': return 'bg-red-400';
      case 'P2': return 'bg-amber-400';
      case 'P3': return 'bg-blue-400';
      case 'P4': return 'bg-slate-400';
    }
  };

  const getPriorityPillClass = (p: Priority) => {
    switch (p) {
      case 'P1': return 'bg-red-500/15 text-red-300 border-red-500/30';
      case 'P2': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'P3': return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'P4': return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="h-full flex flex-col bg-nexus-bg overflow-hidden text-nexus-text">
      {/* Calendar Header with Month Navigation */}
      <div className="p-4 border-b border-nexus-border bg-nexus-surface/50 backdrop-blur-md shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/30">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-nexus-text capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h1>
            <p className="text-xs text-nexus-text-muted">
              Agenda visual con distribución por fechas de entrega y auditoría
            </p>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-nexus-text transition-colors cursor-pointer"
          >
            Hoy
          </button>
          <div className="flex items-center bg-nexus-surface-2 rounded-lg border border-nexus-border">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-nexus-text-muted hover:text-nexus-text transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-px h-4 bg-nexus-border" />
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-nexus-text-muted hover:text-nexus-text transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid + Bottom Mini-List */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4">
        {/* Month Calendar Grid */}
        <div className="bg-nexus-surface rounded-xl border border-nexus-border overflow-hidden shadow-sm">
          {/* Weekday Row */}
          <div className="grid grid-cols-7 border-b border-nexus-border bg-nexus-surface-2/70 text-center py-2 text-xs font-semibold text-nexus-text-secondary">
            {WEEKDAYS.map(day => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-nexus-border/60">
            {daysInGrid.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayTasks = tasksByDate.get(dayStr) || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[72px] sm:min-h-[85px] p-1.5 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/40 ring-1 ring-inset ring-indigo-500'
                      : isCurrentMonth
                      ? 'bg-nexus-surface hover:bg-nexus-surface-2/60'
                      : 'bg-nexus-surface-2/20 text-nexus-text-muted hover:bg-nexus-surface-2/40'
                  }`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full font-mono ${
                        isTodayDay
                          ? 'bg-indigo-600 text-white font-bold shadow-sm'
                          : isSelected
                          ? 'text-indigo-400'
                          : isCurrentMonth
                          ? 'text-nexus-text'
                          : 'text-nexus-text-muted/60'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {dayTasks.length > 0 && (
                      <span className="text-[10px] text-nexus-text-muted font-mono font-medium">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Dots / Pills preview */}
                  <div className="mt-1 space-y-0.5 overflow-hidden">
                    {dayTasks.slice(0, 3).map(t => (
                      <div
                        key={t.id}
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedTaskId(t.id);
                        }}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1 font-medium border ${getPriorityPillClass(
                          t.priority
                        )} ${t.status === 'done' ? 'line-through opacity-50' : ''}`}
                        title={t.title}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getPriorityDotClass(t.priority)}`} />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[9px] text-nexus-text-muted font-mono pl-1">
                        +{dayTasks.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail Section */}
        <div className="bg-nexus-surface rounded-xl border border-nexus-border p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-nexus-text capitalize">
                Entregas para el {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </h2>
              <span className="text-xs px-2 py-0.2 rounded-full bg-nexus-surface-3 text-nexus-text-secondary font-mono">
                {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'tarea' : 'tareas'}
              </span>
            </div>

            {/* Quick add inline for selected day */}
            <form onSubmit={handleAddForSelectedDay} className="flex items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Nueva tarea para este día..."
                className="text-xs bg-nexus-surface-2 text-nexus-text px-3 py-1.5 rounded-lg border border-nexus-border focus:border-indigo-500 outline-none w-52 sm:w-64"
              />
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </form>
          </div>

          {/* List of Tasks for this day */}
          <div className="space-y-1.5">
            {selectedDayTasks.length === 0 ? (
              <p className="text-xs text-nexus-text-muted italic py-4 text-center border border-dashed border-nexus-border/60 rounded-lg">
                No hay tareas programadas para esta fecha.
              </p>
            ) : (
              selectedDayTasks.map(task => {
                const project = task.projectId ? projectMap.get(task.projectId) : null;
                const delivery = getDeliveryStatus(task);

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-nexus-surface-2 border border-nexus-border hover:border-nexus-border-hover transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className="text-nexus-text-muted hover:text-emerald-400 transition-colors shrink-0"
                      >
                        {task.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded border font-mono ${getPriorityPillClass(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>

                      <button
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`text-xs text-left truncate font-medium hover:text-indigo-400 cursor-pointer ${
                          task.status === 'done' ? 'line-through text-nexus-text-muted' : 'text-nexus-text'
                        }`}
                      >
                        {task.title}
                      </button>

                      {project && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-nexus-surface-3 text-[10px] text-nexus-text-muted truncate">
                          <span>{project.emoji}</span>
                          <span className="truncate max-w-[120px]">{project.name}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {delivery === 'on_time' && (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          ✔ A tiempo
                        </span>
                      )}
                      {delivery === 'late' && (
                        <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          ⚠ Retrasado
                        </span>
                      )}
                      {delivery === 'overdue' && (
                        <span className="text-[10px] font-medium text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/30">
                          ⏰ Vencida
                        </span>
                      )}

                      <button
                        onClick={() => setSelectedTaskId(task.id)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-0.5 rounded bg-nexus-surface-3 transition-colors cursor-pointer"
                      >
                        Ver detalles ↗
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
