import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  DollarSign,
  Plane,
  FileText,
  Pin,
  Plus,
  ArrowRight,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const CoupleView: React.FC = () => {
  const {
    getBalance,
    getVisibleExpenses,
    sharedNotes,
    tripPlans,
    accounts,
    currentOwner,
  } = useNexusStore();

  const balance = getBalance();
  const expenses = getVisibleExpenses();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Couple Hub Header Banner */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-indigo-950/40 border border-pink-500/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-semibold">
              <Heart className="w-3.5 h-3.5 fill-pink-400" /> Hub de Pareja David & Cami
            </span>
            <h2 className="text-2xl font-bold text-nexus-text mt-2">Finanzas & Proyectos Compartidos</h2>
            <p className="text-xs text-nexus-text-secondary mt-1">
              Transparencia total en gastos compartidos, planes de viaje y notas mutuas.
            </p>
          </div>

          {/* Quick Balance Status */}
          <div className="p-4 bg-nexus-surface/80 border border-nexus-border backdrop-blur-md rounded-2xl min-w-[240px]">
            <div className="text-xs text-nexus-text-muted">Balance Neto Actual</div>
            <div
              className={`text-xl font-bold mt-1 ${
                balance.net > 0
                  ? 'text-pink-400'
                  : balance.net < 0
                  ? 'text-indigo-400'
                  : 'text-emerald-400'
              }`}
            >
              {balance.net > 0
                ? `Cami le debe ${formatCurrency(balance.net)} a David`
                : balance.net < 0
                ? `David le debe ${formatCurrency(Math.abs(balance.net))} a Cami`
                : 'Cuentas perfectamente al día 🎉'}
            </div>
            <div className="flex items-center justify-between text-[11px] text-nexus-text-muted mt-2 pt-2 border-t border-nexus-border">
              <span>👨‍💻 David: {formatCurrency(balance.david)}</span>
              <span>👩‍🎨 Cami: {formatCurrency(balance.cami)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Shared Expenses & Trip Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <div className="bg-nexus-surface-2/40 border border-nexus-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-nexus-text flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Gastos Compartidos Recientes
            </h3>
            <span className="text-xs text-nexus-text-muted">{expenses.length} registros</span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {expenses.map(exp => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3 bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border rounded-xl transition-colors"
              >
                <div>
                  <h4 className="text-sm font-medium text-nexus-text">{exp.description}</h4>
                  <div className="flex items-center gap-2 text-xs text-nexus-text-muted mt-0.5">
                    <span>{exp.category}</span>
                    <span>•</span>
                    <span className="capitalize">{exp.paidBy === 'david' ? '👨‍💻 Pagó David' : '👩‍🎨 Pagó Cami'}</span>
                    <span>•</span>
                    <span>{exp.date}</span>
                  </div>
                </div>
                <div className="text-right font-mono text-sm font-semibold text-nexus-text">
                  {formatCurrency(exp.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trip Plans */}
        <div className="bg-nexus-surface-2/40 border border-nexus-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-nexus-text flex items-center gap-2">
              <Plane className="w-4 h-4 text-cyan-400" />
              Planes de Viaje
            </h3>
          </div>

          <div className="space-y-3">
            {tripPlans.map(trip => (
              <div
                key={trip.id}
                className="p-4 bg-nexus-surface-2 border border-nexus-border rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{trip.emoji}</span>
                    <div>
                      <h4 className="font-bold text-sm text-nexus-text">{trip.title}</h4>
                      <p className="text-xs text-nexus-text-muted">{trip.destination}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs text-nexus-text-muted">
                    Presupuesto: {formatCurrency(trip.budget)}
                  </div>
                </div>
                <p className="text-xs text-nexus-text-secondary">{trip.notes}</p>
                <div className="text-[11px] text-cyan-400 font-medium pt-1">
                  Fechas: {trip.startDate} hasta {trip.endDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shared Notes */}
      <div className="bg-nexus-surface-2/40 border border-nexus-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-nexus-text flex items-center gap-2">
            <FileText className="w-4 h-4 text-pink-400" />
            Notas & Acuerdos Mutuos
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sharedNotes.map(note => (
            <div
              key={note.id}
              className="p-4 bg-nexus-surface-2 border border-nexus-border rounded-xl flex flex-col justify-between hover:border-nexus-border-hover transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-nexus-text">{note.title}</h4>
                  {note.pinned && <Pin className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />}
                </div>
                <pre className="text-xs text-nexus-text-secondary whitespace-pre-wrap font-sans leading-relaxed">
                  {note.content}
                </pre>
              </div>

              <div className="mt-4 pt-2 border-t border-nexus-border/50 text-[10px] text-nexus-text-muted flex items-center justify-between">
                <span>Editado por {note.updatedBy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoupleView;
