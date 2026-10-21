import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isPast,
  addDays,
  startOfWeek,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';
import { es } from 'date-fns/locale';

const CalendarView: React.FC = () => {
  const { getVisibleTasks, toggleTaskStatus, setSelectedTaskId } = useNexusStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const tasks = getVisibleTasks();

  // Generate 14 days preview starting from beginning of current week
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 13),
  });

  const overdueTasks = tasks.filter(
    t => t.dueDate && t.status !== 'done' && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate))
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Overdue Alert banner if any */}
      {overdueTasks.length > 0 && (
        <div className="p-4 bg-red-950/30 border border-red-800/40 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-red-200">
                {overdueTasks.length} {overdueTasks.length === 1 ? 'tarea vencida' : 'tareas vencidas'}
              </h4>
              <p className="text-xs text-red-300/80">Revisa y reprograma para mantener tu flujo al día.</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (overdueTasks[0]) setSelectedTaskId(overdueTasks[0].id);
            }}
            className="text-xs font-semibold px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
          >
            Ver primera
          </button>
        </div>
      )}

      {/* Date Carousel Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-nexus-text capitalize flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-indigo-400" />
          {format(selectedDate, "MMMM yyyy", { locale: es })}
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            className="p-1.5 rounded-lg border border-nexus-border hover:bg-nexus-surface-2 text-nexus-text transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1 text-xs font-medium rounded-lg border border-nexus-border hover:bg-nexus-surface-2 text-nexus-text transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            className="p-1.5 rounded-lg border border-nexus-border hover:bg-nexus-surface-2 text-nexus-text transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day strip */}
      <div className="grid grid-cols-7 gap-2 overflow-x-auto pb-2">
        {days.slice(0, 7).map(day => {
          const isCurrent = isSameDay(day, selectedDate);
          const isTodayDay = isToday(day);
          const tasksOnDay = tasks.filter(
            t => t.dueDate && isSameDay(parseISO(t.dueDate), day)
          );

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`p-3 rounded-xl border text-center transition-all ${
                isCurrent
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                  : 'bg-nexus-surface-2/60 border-nexus-border hover:border-nexus-border-hover text-nexus-text'
              }`}
            >
              <div className="text-[11px] uppercase tracking-wider text-nexus-text-muted">
                {format(day, 'EEE', { locale: es })}
              </div>
              <div
                className={`text-lg font-bold my-1 ${
                  isTodayDay ? 'text-indigo-400' : 'text-nexus-text'
                }`}
              >
                {format(day, 'd')}
              </div>
              <div className="h-1.5 flex items-center justify-center gap-1">
                {tasksOnDay.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Agenda for Selected Day */}
      <div className="bg-nexus-surface-2/40 border border-nexus-border rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-nexus-text-secondary uppercase tracking-wider flex items-center justify-between">
          <span>Tareas para {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}</span>
          <span className="text-xs font-normal text-nexus-text-muted lowercase">
            {isToday(selectedDate) ? '(Hoy)' : isTomorrow(selectedDate) ? '(Mañana)' : ''}
          </span>
        </h3>

        <div className="space-y-2">
          {tasks.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), selectedDate)).length === 0 ? (
            <div className="py-10 text-center text-xs text-nexus-text-muted border border-dashed border-nexus-border/60 rounded-xl">
              No hay tareas programadas para este día.
            </div>
          ) : (
            tasks
              .filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), selectedDate))
              .map(task => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="flex items-center justify-between p-3 bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border rounded-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleTaskStatus(task.id);
                      }}
                      className="text-nexus-text-muted hover:text-emerald-400 transition-colors"
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <span
                        className={`text-sm font-medium ${
                          task.status === 'done'
                            ? 'line-through text-nexus-text-muted'
                            : 'text-nexus-text'
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-nexus-text-muted mt-0.5">
                        <span className="font-bold text-[10px] text-indigo-400">{task.priority}</span>
                        {task.estimatedMinutes && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {task.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
