import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  PieChart,
  Tag,
  ArrowRightLeft,
  X,
  CreditCard,
  ShoppingBag,
  Home,
  Zap,
  Car,
  UtensilsCrossed,
  Plane,
  HelpCircle,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { Expense, Owner } from '../../types/nexus';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatCOP = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const CATEGORIES = [
  { name: 'Vivienda', icon: Home, color: '#a855f7', bgClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { name: 'Mercado', icon: ShoppingBag, color: '#f59e0b', bgClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { name: 'Servicios', icon: Zap, color: '#3b82f6', bgClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { name: 'Transporte', icon: Car, color: '#10b981', bgClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { name: 'Salidas', icon: UtensilsCrossed, color: '#f43f5e', bgClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { name: 'Hogar', icon: CreditCard, color: '#ec4899', bgClass: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  { name: 'Viaje', icon: Plane, color: '#06b6d4', bgClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { name: 'Otro', icon: HelpCircle, color: '#64748b', bgClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
] as const;

export default function ExpenseTracker() {
  const { getVisibleExpenses, getBalance, addExpense, deleteExpense, currentOwner } = useNexusStore();
  const expenses = getVisibleExpenses();
  const balance = getBalance();

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<Owner>(currentOwner || 'david');
  const [category, setCategory] = useState<string>('Mercado');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Inline Fast Add State
  const [fastDesc, setFastDesc] = useState('');
  const [fastAmount, setFastAmount] = useState('');
  const [fastPaidBy, setFastPaidBy] = useState<Owner>(currentOwner || 'david');
  const [fastCat, setFastCat] = useState('Mercado');

  // Filter State
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<'all' | 'this_month' | 'last_month'>('all');

  const totalPaid = balance.david + balance.cami;
  const davidPercent = totalPaid > 0 ? Math.round((balance.david / totalPaid) * 100) : 50;
  const camiPercent = totalPaid > 0 ? 100 - davidPercent : 50;

  // Filter logic
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastYearMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => {
        if (filterCategory !== 'all' && e.category !== filterCategory) return false;
        if (filterTime === 'this_month') return e.date.startsWith(currentYearMonth);
        if (filterTime === 'last_month') return e.date.startsWith(lastYearMonth);
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filterCategory, filterTime, currentYearMonth, lastYearMonth]);

  // Category totals
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  const maxCategoryAmount = categoryTotals.length > 0 ? categoryTotals[0][1] : 1;

  // SVG Donut calculation
  const donutSlices = useMemo(() => {
    if (filteredTotal === 0) return [];
    let cumulativePercent = 0;

    return categoryTotals.map(([catName, sum]) => {
      const percent = sum / filteredTotal;
      const startAngle = cumulativePercent * 2 * Math.PI;
      cumulativePercent += percent;
      const endAngle = cumulativePercent * 2 * Math.PI;

      const meta = CATEGORIES.find(c => c.name === catName) || CATEGORIES[7];

      // Convert angles to SVG path
      const r = 50;
      const cx = 60;
      const cy = 60;
      const x1 = cx + r * Math.sin(startAngle);
      const y1 = cy - r * Math.cos(startAngle);
      const x2 = cx + r * Math.sin(endAngle);
      const y2 = cy - r * Math.cos(endAngle);
      const largeArc = percent > 0.5 ? 1 : 0;

      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return {
        catName,
        sum,
        percent: Math.round(percent * 100),
        color: meta.color,
        pathData,
      };
    });
  }, [categoryTotals, filteredTotal]);

  // Handle fast inline add
  const handleFastAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(fastAmount.replace(/[^0-9]/g, ''));
    if (!fastDesc.trim() || isNaN(cleanAmount) || cleanAmount <= 0) return;

    const newExp: Expense = {
      id: `exp-${uuidv4().slice(0, 8)}`,
      description: fastDesc.trim(),
      amount: cleanAmount,
      currency: 'COP',
      paidBy: fastPaidBy,
      category: fastCat,
      date: new Date().toISOString().split('T')[0],
      splitType: 'equal',
    };

    addExpense(newExp);
    setFastDesc('');
    setFastAmount('');
  };

  // Handle modal submit
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!description.trim() || isNaN(cleanAmount) || cleanAmount <= 0) return;

    const newExpense: Expense = {
      id: `exp-${uuidv4().slice(0, 8)}`,
      description: description.trim(),
      amount: cleanAmount,
      currency: 'COP',
      paidBy,
      category,
      date,
      splitType: 'equal',
    };

    addExpense(newExpense);
    setDescription('');
    setAmount('');
    setShowAddModal(false);
  };

  const getCategoryMeta = (catName: string) => {
    return CATEGORIES.find(c => c.name.toLowerCase() === catName.toLowerCase()) || CATEGORIES[7];
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* ─── Balance Summary Card ─────────────────────────────── */}
      <div className="rounded-3xl border border-nexus-border bg-nexus-surface p-6 shadow-xl relative overflow-hidden">
        {/* Glow accent in background */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-nexus-text-muted">
              <ArrowRightLeft className="w-4 h-4 text-nexus-accent-indigo" />
              <span>Balance Compartido de Pareja</span>
            </div>
            <h2 className="text-2xl font-bold text-nexus-text mt-1">Presupuesto & Split 50/50</h2>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-nexus-accent-indigo to-indigo-600 hover:opacity-95 text-white font-semibold text-xs transition shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Gasto Detallado</span>
          </button>
        </div>

        {/* Totals per person */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-nexus-surface-2 border border-nexus-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">👨‍💻</span>
              <div>
                <p className="text-xs text-nexus-text-muted font-medium">David Pagó</p>
                <p className="text-lg font-bold text-indigo-400">{formatCOP(balance.david)}</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold">
              {davidPercent}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-nexus-surface-2 border border-nexus-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 rounded-xl bg-pink-500/10 border border-pink-500/20">👩‍🎨</span>
              <div>
                <p className="text-xs text-nexus-text-muted font-medium">Cami Pagó</p>
                <p className="text-lg font-bold text-pink-400">{formatCOP(balance.cami)}</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 font-mono font-bold">
              {camiPercent}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-nexus-surface-2 border border-nexus-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-nexus-text-muted font-medium">Total Compartido</p>
                <p className="text-lg font-bold text-nexus-text">{formatCOP(totalPaid)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Proportions visual bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs text-nexus-text-muted font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              David ({davidPercent}%)
            </span>
            <span className="flex items-center gap-1.5">
              Cami ({camiPercent}%)
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" />
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-nexus-surface-3 overflow-hidden flex p-0.5 border border-nexus-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${davidPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-indigo-500 rounded-l-full"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${camiPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-pink-500 rounded-r-full"
            />
          </div>
        </div>

        {/* Net debt settlement card */}
        <div className="p-4 rounded-2xl border border-nexus-border bg-nexus-surface-2/80 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {balance.net === 0 ? '🎉' : balance.net > 0 ? '💡' : '🌸'}
            </span>
            <div>
              <p className="text-sm font-semibold text-nexus-text">
                {balance.net === 0 ? (
                  <span className="text-emerald-400">¡Están completamente a mano! 50/50 equilibrado</span>
                ) : balance.net > 0 ? (
                  <>
                    <span className="text-pink-400 font-bold">Cami</span> le transfiere a{' '}
                    <span className="text-indigo-400 font-bold">David</span>:{' '}
                    <span className="text-emerald-400 font-mono text-base font-bold ml-1">
                      {formatCOP(Math.abs(balance.net))}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-indigo-400 font-bold">David</span> le transfiere a{' '}
                    <span className="text-pink-400 font-bold">Cami</span>:{' '}
                    <span className="text-emerald-400 font-mono text-base font-bold ml-1">
                      {formatCOP(Math.abs(balance.net))}
                    </span>
                  </>
                )}
              </p>
              <p className="text-[11px] text-nexus-text-muted mt-0.5">
                Cálculo automático con división equitativa en todos los gastos registrados.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Fast Inline Expense Adder (ALWAYS ACCESSIBLE) ───────── */}
      <div className="p-5 rounded-3xl border border-nexus-border bg-nexus-surface shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-nexus-accent-indigo" />
            <span className="text-xs font-bold uppercase tracking-wider text-nexus-text">
              Registro Rápido de Gasto
            </span>
          </div>
          <span className="text-[11px] text-nexus-text-muted">Añade en 1 clic sin abrir modales</span>
        </div>

        <form onSubmit={handleFastAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          <div className="sm:col-span-4">
            <input
              type="text"
              value={fastDesc}
              onChange={e => setFastDesc(e.target.value)}
              placeholder="Descripción (ej. Supermercado, Domicilio)..."
              className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-nexus-accent-indigo"
              required
            />
          </div>

          <div className="sm:col-span-3">
            <input
              type="number"
              min="100"
              step="500"
              value={fastAmount}
              onChange={e => setFastAmount(e.target.value)}
              placeholder="Monto COP (ej. 85000)..."
              className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text font-mono focus:outline-none focus:border-nexus-accent-indigo"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <div className="grid grid-cols-2 gap-1 bg-nexus-surface-2 p-1 rounded-xl border border-nexus-border">
              <button
                type="button"
                onClick={() => setFastPaidBy('david')}
                className={`py-1 rounded-lg text-xs font-medium transition ${
                  fastPaidBy === 'david' ? 'bg-indigo-600 text-white font-bold' : 'text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                David
              </button>
              <button
                type="button"
                onClick={() => setFastPaidBy('cami')}
                className={`py-1 rounded-lg text-xs font-medium transition ${
                  fastPaidBy === 'cami' ? 'bg-pink-600 text-white font-bold' : 'text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                Cami
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <select
              value={fastCat}
              onChange={e => setFastCat(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-nexus-accent-indigo"
            >
              {CATEGORIES.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              disabled={!fastDesc.trim() || !fastAmount.trim()}
              className="w-full py-2 rounded-xl bg-nexus-accent-indigo hover:bg-nexus-accent-indigo/90 text-white text-xs font-semibold flex items-center justify-center transition disabled:opacity-40"
              title="Guardar gasto"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* ─── Visual Charts & Category Breakdown ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: SVG Donut Chart (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-nexus-border bg-nexus-surface p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-nexus-accent-indigo" />
              <h3 className="text-sm font-bold text-nexus-text">Gráfico de Categorías</h3>
            </div>
            <span className="text-xs font-mono font-semibold text-nexus-text-muted">
              {formatCOP(filteredTotal)}
            </span>
          </div>

          {/* SVG Donut Visual */}
          <div className="relative flex items-center justify-center py-4">
            <svg viewBox="0 0 120 120" className="w-48 h-48 drop-shadow-md">
              {donutSlices.map((slice, idx) => (
                <path
                  key={slice.catName}
                  d={slice.pathData}
                  fill={slice.color}
                  opacity="0.85"
                  className="transition-all hover:opacity-100 hover:scale-105 origin-center cursor-pointer"
                >
                  <title>{`${slice.catName}: ${formatCOP(slice.sum)} (${slice.percent}%)`}</title>
                </path>
              ))}
              {/* Center hole for donut look */}
              <circle cx="60" cy="60" r="32" fill="#0D1117" />
            </svg>

            {/* Donut Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] uppercase font-bold text-nexus-text-muted tracking-wider">
                Total
              </span>
              <span className="text-xs font-bold text-nexus-text font-mono">
                {categoryTotals.length} cats
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-nexus-border/60">
            {donutSlices.slice(0, 6).map(s => (
              <div key={s.catName} className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-nexus-text truncate">{s.catName}</span>
                <span className="text-nexus-text-muted font-mono font-semibold ml-auto">{s.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Category Progress Bars (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-nexus-border bg-nexus-surface p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-nexus-accent-pink" />
              <h3 className="text-sm font-bold text-nexus-text">Desglose Detallado</h3>
            </div>
            <span className="text-xs text-nexus-text-muted">
              {categoryTotals.length} categorías registradas
            </span>
          </div>

          {categoryTotals.length === 0 ? (
            <p className="text-xs text-nexus-text-muted py-10 text-center">No hay gastos para mostrar con este filtro</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {categoryTotals.map(([catName, sumAmount]) => {
                const meta = getCategoryMeta(catName);
                const Icon = meta.icon;
                const percent = filteredTotal > 0 ? Math.round((sumAmount / filteredTotal) * 100) : 0;
                const barWidthPercent = Math.max(8, Math.round((sumAmount / maxCategoryAmount) * 100));

                return (
                  <div key={catName} className="space-y-1.5 p-2 rounded-xl hover:bg-nexus-surface-2 transition">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className={`p-1 rounded-md border ${meta.bgClass}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-nexus-text font-semibold">{catName}</span>
                        <span className="text-nexus-text-muted text-[11px]">({percent}%)</span>
                      </div>
                      <span className="font-mono text-nexus-text font-semibold">{formatCOP(sumAmount)}</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-nexus-surface-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidthPercent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Expense History List ───────────────────────────────── */}
      <div className="rounded-3xl border border-nexus-border bg-nexus-surface p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-nexus-border pb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-nexus-accent-pink" />
            <h3 className="text-sm font-bold text-nexus-text">Historial de Gastos</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-nexus-surface-3 text-nexus-text-secondary border border-nexus-border font-mono font-semibold">
              {filteredExpenses.length}
            </span>
          </div>

          {/* Time & Category filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Time filter */}
            <div className="flex items-center gap-1 bg-nexus-surface-2 p-1 rounded-xl border border-nexus-border text-xs">
              <button
                onClick={() => setFilterTime('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterTime === 'all' ? 'bg-nexus-surface-3 text-nexus-text font-semibold' : 'text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterTime('this_month')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterTime === 'this_month' ? 'bg-nexus-surface-3 text-nexus-text font-semibold' : 'text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                Este Mes
              </button>
              <button
                onClick={() => setFilterTime('last_month')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterTime === 'last_month' ? 'bg-nexus-surface-3 text-nexus-text font-semibold' : 'text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                Mes Anterior
              </button>
            </div>

            {/* Category filter dropdown */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none"
            >
              <option value="all">Todas las categorías</option>
              {CATEGORIES.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expenses List */}
        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-nexus-text-muted text-xs border border-dashed border-nexus-border rounded-2xl">
            No se encontraron gastos con los filtros aplicados.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredExpenses.map(expense => {
              const meta = getCategoryMeta(expense.category);
              const Icon = meta.icon;
              const isDavid = expense.paidBy === 'david';

              return (
                <div
                  key={expense.id}
                  className="p-3.5 rounded-2xl bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className={`p-2.5 rounded-xl border ${meta.bgClass} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-nexus-text truncate">
                          {expense.description}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-nexus-surface-3 text-nexus-text-muted border border-nexus-border/60">
                          {expense.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-nexus-text-muted mt-0.5">
                        <span>{format(parseISO(expense.date), "d 'de' MMMM, yyyy", { locale: es })}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium">
                          <span>{isDavid ? '👨‍💻' : '👩‍🎨'}</span>
                          <span className={isDavid ? 'text-indigo-400' : 'text-pink-400'}>
                            Pagado por {isDavid ? 'David' : 'Cami'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm font-bold text-nexus-text">
                      {formatCOP(expense.amount)}
                    </span>

                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar gasto "${expense.description}"?`)) {
                          deleteExpense(expense.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-nexus-text-muted hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                      title="Eliminar gasto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Add Detailed Expense Modal ─────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-nexus-border bg-nexus-surface p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-nexus-border pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-nexus-accent-indigo" />
                  <h3 className="text-base font-bold text-nexus-text">Registrar Nuevo Gasto</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    Descripción del Gasto *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ej. Cuota Apartamento Eskala, Mercado Carulla..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text placeholder-nexus-text-muted text-xs focus:outline-none focus:border-nexus-accent-indigo"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    Monto (COP) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="500"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Ej. 350000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text placeholder-nexus-text-muted text-xs font-mono focus:outline-none focus:border-nexus-accent-indigo"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    ¿Quién Pagó?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaidBy('david')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition border ${
                        paidBy === 'david'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500'
                          : 'bg-nexus-surface-2 text-nexus-text-muted border-nexus-border hover:text-nexus-text'
                      }`}
                    >
                      <span>👨‍💻 David</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaidBy('cami')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition border ${
                        paidBy === 'cami'
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500'
                          : 'bg-nexus-surface-2 text-nexus-text-muted border-nexus-border hover:text-nexus-text'
                      }`}
                    >
                      <span>👩‍🎨 Cami</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                      Categoría
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text text-xs focus:outline-none focus:border-nexus-accent-indigo"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text text-xs focus:outline-none focus:border-nexus-accent-indigo"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-nexus-border">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-nexus-accent-indigo hover:bg-nexus-accent-indigo/90 text-white font-semibold text-xs transition shadow-lg shadow-indigo-500/20"
                  >
                    Guardar Gasto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
