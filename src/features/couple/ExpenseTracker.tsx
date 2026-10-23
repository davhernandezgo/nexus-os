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
  Lock,
  Heart,
  Sliders,
  AlertTriangle,
  Percent,
  CheckCircle2,
  Target,
  Edit3,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { Expense, Owner, Visibility, ExpenseSplitType, CategoryBudget } from '../../types/nexus';
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
  const {
    getVisibleExpenses,
    getBalance,
    addExpense,
    deleteExpense,
    currentOwner,
    currentUser,
    accounts,
    categoryBudgets,
    getVisibleCategoryBudgets,
    addCategoryBudget,
    deleteCategoryBudget,
    coupleSpace,
  } = useNexusStore();

  const currentAccount = accounts.find(a => a.owner === currentOwner || a.id === currentUser?.id);
  const currentDisplayName = currentUser?.displayName || currentAccount?.displayName || 'tu cuenta';
  const partner1Name = coupleSpace?.user1Name || 'Usuario 1';
  const partner2Name = coupleSpace?.user2Name || 'Usuario 2';

  const allExpenses = getVisibleExpenses();
  const balance = getBalance();
  const visibleBudgets = getVisibleCategoryBudgets();

  // Primary Context Filter: 'couple' | 'personal' | 'all'
  const [scopeFilter, setScopeFilter] = useState<'couple' | 'personal' | 'all'>('couple');

  // Modal State for Expenses
  const [showAddModal, setShowAddModal] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<Owner>(currentOwner || 'david');
  const [category, setCategory] = useState<string>('Mercado');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [visibility, setVisibility] = useState<Visibility>('couple');

  // Split Customization State
  const [splitType, setSplitType] = useState<ExpenseSplitType>('equal');
  const [splitDavidPct, setSplitDavidPct] = useState<number>(50);
  const [splitExactDavid, setSplitExactDavid] = useState<string>('');
  const [splitExactCami, setSplitExactCami] = useState<string>('');
  const [singleBeneficiary, setSingleBeneficiary] = useState<Owner>(currentOwner || 'david');

  // Inline Fast Add State
  const [fastDesc, setFastDesc] = useState('');
  const [fastAmount, setFastAmount] = useState('');
  const [fastPaidBy, setFastPaidBy] = useState<Owner>(currentOwner || 'david');
  const [fastCat, setFastCat] = useState('Mercado');
  const [fastScope, setFastScope] = useState<Visibility>('couple');

  // Modal State for Category Budget
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetCat, setBudgetCat] = useState('Mercado');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgetScope, setBudgetScope] = useState<Visibility>('couple');

  // Filter State
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<'all' | 'this_month' | 'last_month'>('this_month');

  // Timestamps
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastYearMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // Filter logic based on Scope (Couple / Personal / All) + Time + Category
  const filteredExpenses = useMemo(() => {
    return allExpenses
      .filter(e => {
        // Scope filter
        if (scopeFilter === 'couple' && e.visibility !== 'couple') return false;
        if (scopeFilter === 'personal' && e.visibility !== 'private') return false;

        // Category filter
        if (filterCategory !== 'all' && e.category !== filterCategory) return false;

        // Time filter
        if (filterTime === 'this_month' && !e.date.startsWith(currentYearMonth)) return false;
        if (filterTime === 'last_month' && !e.date.startsWith(lastYearMonth)) return false;

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allExpenses, scopeFilter, filterCategory, filterTime, currentYearMonth, lastYearMonth]);

  // Current Month Expenses for Budget Limit Calculation
  const currentMonthExpenses = useMemo(() => {
    return allExpenses.filter(e => e.date.startsWith(currentYearMonth));
  }, [allExpenses, currentYearMonth]);

  // Spending per category in current month
  const categorySpentThisMonth = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthExpenses.forEach(e => {
      // If couple view, only couple expenses count towards couple budget
      if (scopeFilter === 'couple' && e.visibility !== 'couple') return;
      if (scopeFilter === 'personal' && e.visibility !== 'private') return;
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [currentMonthExpenses, scopeFilter]);

  // Category totals for charts
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

  // Couple balance calculations
  const totalPaid = balance.david + balance.cami;
  const davidPercent = totalPaid > 0 ? Math.round((balance.david / totalPaid) * 100) : 50;
  const camiPercent = totalPaid > 0 ? 100 - davidPercent : 50;

  // Donut SVG Calculations
  const donutSlices = useMemo(() => {
    if (filteredTotal === 0) return [];
    let cumulativePercent = 0;

    return categoryTotals.map(([catName, sum]) => {
      const percent = sum / filteredTotal;
      const startAngle = cumulativePercent * 2 * Math.PI;
      cumulativePercent += percent;
      const endAngle = cumulativePercent * 2 * Math.PI;

      const meta = CATEGORIES.find(c => c.name === catName) || CATEGORIES[7];

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
      owner: fastPaidBy,
      visibility: fastScope,
      category: fastCat,
      date: new Date().toISOString().split('T')[0],
      splitType: fastScope === 'couple' ? 'equal' : 'single',
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
      owner: paidBy,
      visibility,
      category,
      date,
      splitType: visibility === 'private' ? 'single' : splitType,
      splitRatio:
        visibility === 'couple' && splitType === 'percentage'
          ? { david: splitDavidPct, cami: 100 - splitDavidPct }
          : undefined,
      exactSplit:
        visibility === 'couple' && splitType === 'exact'
          ? {
              david: parseFloat(splitExactDavid) || 0,
              cami: parseFloat(splitExactCami) || 0,
            }
          : undefined,
      singleBeneficiary:
        visibility === 'couple' && splitType === 'single'
          ? singleBeneficiary
          : visibility === 'private'
          ? paidBy
          : undefined,
    };

    addExpense(newExpense);
    setDescription('');
    setAmount('');
    setSplitExactDavid('');
    setSplitExactCami('');
    setShowAddModal(false);
  };

  // Handle create/update category budget
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLimit = parseFloat(budgetLimit.replace(/[^0-9]/g, ''));
    if (isNaN(cleanLimit) || cleanLimit <= 0) return;

    const newBudget: CategoryBudget = {
      id: `cb-${Date.now()}`,
      category: budgetCat,
      monthlyLimit: cleanLimit,
      currency: 'COP',
      owner: currentOwner || currentUser?.id || 'user',
      visibility: budgetScope,
    };

    addCategoryBudget(newBudget);
    setBudgetLimit('');
    setShowBudgetModal(false);
  };

  const getCategoryMeta = (catName: string) => {
    return CATEGORIES.find(c => c.name.toLowerCase() === catName.toLowerCase()) || CATEGORIES[7];
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* ─── Context Selector: Pareja vs Personal vs Todo ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-nexus-surface border border-nexus-border rounded-2xl shadow-sm">
        <div className="flex items-center gap-1.5 p-1 bg-nexus-surface-2 rounded-xl border border-nexus-border/60">
          <button
            onClick={() => setScopeFilter('couple')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              scopeFilter === 'couple'
                ? 'bg-nexus-accent-pink text-white shadow-md shadow-pink-500/20'
                : 'text-nexus-text-muted hover:text-nexus-text'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>💑 Gastos Pareja</span>
          </button>
          <button
            onClick={() => setScopeFilter('personal')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              scopeFilter === 'personal'
                ? 'bg-nexus-accent-indigo text-white shadow-md shadow-indigo-500/20'
                : 'text-nexus-text-muted hover:text-nexus-text'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>🔒 Mis Gastos Personales</span>
          </button>
          <button
            onClick={() => setScopeFilter('all')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              scopeFilter === 'all'
                ? 'bg-nexus-surface-3 text-nexus-text border border-nexus-border'
                : 'text-nexus-text-muted hover:text-nexus-text'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>✨ Todo Combinado</span>
          </button>
        </div>

        <button
          onClick={() => {
            setVisibility(scopeFilter === 'personal' ? 'private' : 'couple');
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-nexus-accent-indigo to-indigo-600 hover:opacity-95 text-white font-semibold text-xs transition shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Registrar Gasto Detallado</span>
        </button>
      </div>

      {/* ─── Balance Summary Card (Couple or Personal) ──────────── */}
      {scopeFilter !== 'personal' ? (
        <div className="rounded-3xl border border-nexus-border bg-nexus-surface p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-nexus-text-muted">
                <ArrowRightLeft className="w-4 h-4 text-nexus-accent-pink" />
                <span>Balance Compartido de Pareja</span>
                <span className="px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-400 text-[10px] font-mono border border-pink-500/20">
                  {coupleSpace?.name || 'Espacio Compartido'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-nexus-text mt-1">Presupuesto & Acuerdos de Split</h2>
              <p className="text-xs text-nexus-text-muted mt-0.5">
                Cálculo dinámico basado en acuerdos 50/50, porcentajes personalizados y montos exactos.
              </p>
            </div>
          </div>

          {/* Totals per person */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-nexus-surface-2 border border-nexus-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">👨‍💻</span>
                <div>
                  <p className="text-xs text-nexus-text-muted font-medium">{partner1Name} Pagó</p>
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
                  <p className="text-xs text-nexus-text-muted font-medium">{partner2Name} Pagó</p>
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
                {partner1Name} ({davidPercent}%)
              </span>
              <span className="flex items-center gap-1.5">
                {partner2Name} ({camiPercent}%)
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
                    <span className="text-emerald-400">¡Están al día! Todo el balance está en paz</span>
                  ) : balance.net > 0 ? (
                    <>
                      <span className="text-pink-400 font-bold">{partner2Name}</span> le transfiere a{' '}
                      <span className="text-indigo-400 font-bold">{partner1Name}</span>:{' '}
                      <span className="text-emerald-400 font-mono text-base font-bold ml-1">
                        {formatCOP(Math.abs(balance.net))}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-indigo-400 font-bold">{partner1Name}</span> le transfiere a{' '}
                      <span className="text-pink-400 font-bold">{partner2Name}</span>:{' '}
                      <span className="text-emerald-400 font-mono text-base font-bold ml-1">
                        {formatCOP(Math.abs(balance.net))}
                      </span>
                    </>
                  )}
                </p>
                <p className="text-[11px] text-nexus-text-muted mt-0.5">
                  Los gastos marcados como 100% individuales o privados quedan excluidos de esta deuda.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Personal Budget Hero Card */
        <div className="rounded-3xl border border-nexus-border bg-nexus-surface p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-nexus-text">Mi Presupuesto Personal</h2>
              <p className="text-xs text-nexus-text-muted">
                Gastos privados y compras individuales de {currentDisplayName}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-nexus-surface-2 border border-nexus-border">
              <span className="text-xs text-nexus-text-muted">Total Gastado este Mes (Personal)</span>
              <p className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                {formatCOP(filteredTotal)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-nexus-surface-2 border border-nexus-border">
              <span className="text-xs text-nexus-text-muted">Privacidad Garantizada</span>
              <p className="text-xs text-nexus-text-secondary mt-1">
                Estos registros nunca alteran el balance de pareja ni son visibles si el usuario no tiene tu sesión activa.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Category Budgets & Monthly Limits (Metas de Presupuesto) ── */}
      <div className="rounded-3xl border border-nexus-border bg-nexus-surface p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-nexus-accent-indigo" />
            <div>
              <h3 className="text-sm font-bold text-nexus-text">
                Límites y Metas Mensuales por Categoría
              </h3>
              <p className="text-xs text-nexus-text-muted">
                Control de sobregiro y seguimiento de presupuesto para {now.toLocaleString('es-CO', { month: 'long' })}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setBudgetScope(scopeFilter === 'personal' ? 'private' : 'couple');
              setShowBudgetModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-nexus-surface-2 hover:bg-nexus-surface-3 border border-nexus-border text-nexus-text text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Definir Meta Mensual</span>
          </button>
        </div>

        {visibleBudgets.length === 0 ? (
          <div className="p-6 rounded-2xl bg-nexus-surface-2/40 border border-dashed border-nexus-border text-center text-xs text-nexus-text-muted">
            No tienes metas configuradas aún. ¡Añade límites mensuales como Mercado, Vivienda o Salidas para evitar sobrecostos!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleBudgets.map(budget => {
              const meta = getCategoryMeta(budget.category);
              const Icon = meta.icon;
              const spent = categorySpentThisMonth[budget.category] || 0;
              const percent = Math.min(200, Math.round((spent / budget.monthlyLimit) * 100));
              const isOver = spent > budget.monthlyLimit;
              const isWarning = percent >= 80 && !isOver;

              return (
                <div
                  key={budget.id}
                  className="p-4 rounded-2xl bg-nexus-surface-2 border border-nexus-border space-y-2.5 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`p-2 rounded-xl border ${meta.bgClass}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-nexus-text">{budget.category}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-nexus-surface-3 text-nexus-text-muted border border-nexus-border/50">
                            {budget.visibility === 'couple' ? '💑 Pareja' : '🔒 Personal'}
                          </span>
                        </div>
                        <p className="text-[11px] text-nexus-text-muted">
                          Gastado: <span className="font-mono font-semibold text-nexus-text">{formatCOP(spent)}</span> de {formatCOP(budget.monthlyLimit)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                          isOver
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : isWarning
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {percent}%
                      </span>

                      <button
                        onClick={() => deleteCategoryBudget(budget.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-nexus-text-muted hover:text-red-400 transition"
                        title="Eliminar meta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-nexus-surface-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, percent)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>

                  {isOver && (
                    <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Has sobrepasado el límite por {formatCOP(spent - budget.monthlyLimit)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Fast Inline Expense Adder ──────────────────────────── */}
      <div className="p-5 rounded-3xl border border-nexus-border bg-nexus-surface shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-nexus-accent-indigo" />
            <span className="text-xs font-bold uppercase tracking-wider text-nexus-text">
              Registro Rápido de Gasto
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-nexus-text-muted text-[11px]">Tipo:</span>
            <div className="flex items-center gap-1 bg-nexus-surface-2 p-0.5 rounded-lg border border-nexus-border">
              <button
                type="button"
                onClick={() => setFastScope('couple')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  fastScope === 'couple' ? 'bg-pink-600 text-white' : 'text-nexus-text-muted'
                }`}
              >
                💑 Pareja
              </button>
              <button
                type="button"
                onClick={() => setFastScope('private')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  fastScope === 'private' ? 'bg-indigo-600 text-white' : 'text-nexus-text-muted'
                }`}
              >
                🔒 Personal
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleFastAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          <div className="sm:col-span-4">
            <input
              type="text"
              value={fastDesc}
              onChange={e => setFastDesc(e.target.value)}
              placeholder="Descripción (ej. Mercado, Domicilio, Cine)..."
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
                {partner1Name}
              </button>
              <button
                type="button"
                onClick={() => setFastPaidBy('cami')}
                className={`py-1 rounded-lg text-xs font-medium transition ${
                  fastPaidBy === 'cami' ? 'bg-pink-600 text-white font-bold' : 'text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                {partner2Name}
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
        {/* Left: SVG Donut Chart */}
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

          <div className="relative flex items-center justify-center py-4">
            <svg viewBox="0 0 120 120" className="w-48 h-48 drop-shadow-md">
              {donutSlices.map((slice) => (
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
              <circle cx="60" cy="60" r="32" fill="#0D1117" />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] uppercase font-bold text-nexus-text-muted tracking-wider">
                Total
              </span>
              <span className="text-xs font-bold text-nexus-text font-mono">
                {categoryTotals.length} cats
              </span>
            </div>
          </div>

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

        {/* Right: Category Progress Bars */}
        <div className="lg:col-span-7 rounded-3xl border border-nexus-border bg-nexus-surface p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-nexus-accent-pink" />
              <h3 className="text-sm font-bold text-nexus-text">Desglose por Categoría</h3>
            </div>
            <span className="text-xs text-nexus-text-muted">
              {categoryTotals.length} categorías activas
            </span>
          </div>

          {categoryTotals.length === 0 ? (
            <p className="text-xs text-nexus-text-muted py-10 text-center">
              No hay gastos registrados para este filtro.
            </p>
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

            {/* Category filter */}
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
              const isCouple = expense.visibility === 'couple';

              // Format split rule badge
              let splitLabel = '50/50';
              if (!isCouple) {
                splitLabel = '🔒 Personal';
              } else if (expense.splitType === 'percentage' && expense.splitRatio) {
                splitLabel = `${expense.splitRatio.david}% / ${expense.splitRatio.cami}%`;
              } else if (expense.splitType === 'exact') {
                splitLabel = 'Exacto';
              } else if (expense.splitType === 'single') {
                splitLabel = `100% ${expense.singleBeneficiary === 'david' ? partner1Name : partner2Name}`;
              }

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
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                            isCouple
                              ? 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}
                        >
                          {splitLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-nexus-text-muted mt-0.5">
                        <span>{format(parseISO(expense.date), "d 'de' MMMM, yyyy", { locale: es })}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium">
                          <span>{isDavid ? '👨‍💻' : '👩‍🎨'}</span>
                          <span className={isDavid ? 'text-indigo-400' : 'text-pink-400'}>
                            Pagado por {isDavid ? partner1Name : partner2Name}
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
              className="w-full max-w-lg rounded-2xl border border-nexus-border bg-nexus-surface p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
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
                {/* Scope selection: Pareja vs Personal */}
                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    Ámbito del Gasto
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibility('couple')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                        visibility === 'couple'
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500'
                          : 'bg-nexus-surface-2 text-nexus-text-muted border-nexus-border hover:text-nexus-text'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      <span>💑 Compartido en Pareja</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility('private')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                        visibility === 'private'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500'
                          : 'bg-nexus-surface-2 text-nexus-text-muted border-nexus-border hover:text-nexus-text'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      <span>🔒 Gasto 100% Personal</span>
                    </button>
                  </div>
                </div>

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
                    placeholder="Ej. Cuota Apartamento, Mercado Carulla, Salida..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text placeholder-nexus-text-muted text-xs focus:outline-none focus:border-nexus-accent-indigo"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    Monto Total (COP) *
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

                {/* Who paid? */}
                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    ¿Quién Realizó el Pago?
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
                      <span>👨‍💻 {partner1Name}</span>
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
                      <span>👩‍🎨 {partner2Name}</span>
                    </button>
                  </div>
                </div>

                {/* Custom Split Configuration (if couple) */}
                {visibility === 'couple' && (
                  <div className="p-4 rounded-2xl bg-nexus-surface-2/70 border border-nexus-border space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-nexus-text flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-nexus-accent-pink" />
                        <span>División del Gasto (Split)</span>
                      </label>
                      <span className="text-[10px] text-nexus-text-muted font-mono">Personalizable</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-nexus-surface-3 p-1 rounded-xl border border-nexus-border">
                      <button
                        type="button"
                        onClick={() => setSplitType('equal')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                          splitType === 'equal'
                            ? 'bg-nexus-accent-pink text-white font-bold'
                            : 'text-nexus-text-muted hover:text-nexus-text'
                        }`}
                      >
                        50 / 50
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitType('percentage')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                          splitType === 'percentage'
                            ? 'bg-nexus-accent-pink text-white font-bold'
                            : 'text-nexus-text-muted hover:text-nexus-text'
                        }`}
                      >
                        Porcentaje %
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitType('exact')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                          splitType === 'exact'
                            ? 'bg-nexus-accent-pink text-white font-bold'
                            : 'text-nexus-text-muted hover:text-nexus-text'
                        }`}
                      >
                        Montos Exactos
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitType('single')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                          splitType === 'single'
                            ? 'bg-nexus-accent-pink text-white font-bold'
                            : 'text-nexus-text-muted hover:text-nexus-text'
                        }`}
                      >
                        100% Uno Solo
                      </button>
                    </div>

                    {/* Percentage controls */}
                    {splitType === 'percentage' && (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-indigo-400">{partner1Name}: {splitDavidPct}%</span>
                          <span className="text-pink-400">{partner2Name}: {100 - splitDavidPct}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={splitDavidPct}
                          onChange={e => setSplitDavidPct(Number(e.target.value))}
                          className="w-full accent-nexus-accent-pink"
                        />
                        <div className="flex gap-1.5 justify-center">
                          {[50, 60, 70, 80].map(pct => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setSplitDavidPct(pct)}
                              className={`text-[10px] px-2 py-0.5 rounded border transition ${
                                splitDavidPct === pct
                                  ? 'bg-nexus-accent-pink/20 text-pink-300 border-pink-500'
                                  : 'bg-nexus-surface-3 text-nexus-text-muted border-nexus-border'
                              }`}
                            >
                              {pct}/{100 - pct}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Exact amount controls */}
                    {splitType === 'exact' && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div>
                          <label className="text-[10px] text-nexus-text-muted block mb-1">{partner1Name} asume (COP):</label>
                          <input
                            type="number"
                            value={splitExactDavid}
                            onChange={e => setSplitExactDavid(e.target.value)}
                            placeholder={`Monto ${partner1Name}`}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-nexus-surface-3 border border-nexus-border text-xs text-nexus-text font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-nexus-text-muted block mb-1">{partner2Name} asume (COP):</label>
                          <input
                            type="number"
                            value={splitExactCami}
                            onChange={e => setSplitExactCami(e.target.value)}
                            placeholder={`Monto ${partner2Name}`}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-nexus-surface-3 border border-nexus-border text-xs text-nexus-text font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {/* 100% single person controls */}
                    {splitType === 'single' && (
                      <div className="pt-2">
                        <label className="text-[10px] text-nexus-text-muted block mb-1">
                          ¿Quién asume el 100% sin generar deuda? (Regalo/Invitación):
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSingleBeneficiary('david')}
                            className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition ${
                              singleBeneficiary === 'david'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500'
                                : 'bg-nexus-surface-3 text-nexus-text-muted border-nexus-border'
                            }`}
                          >
                            {partner1Name} asume 100%
                          </button>
                          <button
                            type="button"
                            onClick={() => setSingleBeneficiary('cami')}
                            className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition ${
                              singleBeneficiary === 'cami'
                                ? 'bg-pink-500/20 text-pink-300 border-pink-500'
                                : 'bg-nexus-surface-3 text-nexus-text-muted border-nexus-border'
                            }`}
                          >
                            {partner2Name} asume 100%
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

      {/* ─── Add/Edit Category Budget Modal ─────────────────────── */}
      <AnimatePresence>
        {showBudgetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-nexus-border bg-nexus-surface p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-nexus-border pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-nexus-accent-indigo" />
                  <h3 className="text-base font-bold text-nexus-text">Meta de Presupuesto Mensual</h3>
                </div>
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="p-1 rounded-lg text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBudget} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={budgetCat}
                    onChange={e => setBudgetCat(e.target.value)}
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
                    Límite Mensual (COP) *
                  </label>
                  <input
                    type="number"
                    required
                    min="10000"
                    step="10000"
                    value={budgetLimit}
                    onChange={e => setBudgetLimit(e.target.value)}
                    placeholder="Ej. 1200000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-nexus-text font-mono text-xs focus:outline-none focus:border-nexus-accent-indigo"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-nexus-text-muted uppercase tracking-wider mb-1.5">
                    Ámbito
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBudgetScope('couple')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                        budgetScope === 'couple'
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500'
                          : 'bg-nexus-surface-2 text-nexus-text-muted border-nexus-border'
                      }`}
                    >
                      💑 Pareja
                    </button>
                    <button
                      type="button"
                      onClick={() => setBudgetScope('private')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                        budgetScope === 'private'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500'
                          : 'bg-nexus-surface-2 text-nexus-text-muted border-nexus-border'
                      }`}
                    >
                      🔒 Personal
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-nexus-border">
                  <button
                    type="button"
                    onClick={() => setShowBudgetModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface-2 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-nexus-accent-indigo hover:bg-nexus-accent-indigo/90 text-white font-semibold text-xs transition shadow-lg shadow-indigo-500/20"
                  >
                    Guardar Meta
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
