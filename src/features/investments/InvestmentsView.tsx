import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Filter,
  PieChart,
  Layers,
  ArrowUpRight,
  Wallet,
  Coins,
  Building,
  Landmark,
  ShieldCheck,
  Package,
  X,
  ExternalLink,
  Edit2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useNexusStore } from '../../store/nexusStore';
import type { Investment, InvestmentCategory, Owner, Visibility, ContextMode } from '../../types/nexus';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, startOfWeek, endOfWeek, getQuarter } from 'date-fns';
import { es } from 'date-fns/locale';

export const INVESTMENT_CATEGORIES: {
  id: InvestmentCategory;
  name: string;
  icon: any;
  color: string;
  bgClass: string;
}[] = [
  { id: 'crypto', name: 'Criptomonedas', icon: Coins, color: '#f59e0b', bgClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { id: 'etf', name: 'ETFs & Fondos Indexados', icon: Landmark, color: '#3b82f6', bgClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { id: 'stocks', name: 'Acciones (Stocks)', icon: TrendingUp, color: '#10b981', bgClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'real_estate', name: 'Bienes Raíces', icon: Building, color: '#ec4899', bgClass: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  { id: 'fixed_income', name: 'Renta Fija & Bonos', icon: ShieldCheck, color: '#8b5cf6', bgClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { id: 'commodities', name: 'Metales & Commodities', icon: Wallet, color: '#eab308', bgClass: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { id: 'other', name: 'Otros Activos', icon: Package, color: '#64748b', bgClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
];

const SUGGESTED_ASSETS = [
  { name: 'Bitcoin (BTC)', cat: 'crypto' as InvestmentCategory },
  { name: 'Ethereum (ETH)', cat: 'crypto' as InvestmentCategory },
  { name: 'Solana (SOL)', cat: 'crypto' as InvestmentCategory },
  { name: 'VOO (Vanguard S&P 500 ETF)', cat: 'etf' as InvestmentCategory },
  { name: 'QQQ (Invesco Nasdaq 100 ETF)', cat: 'etf' as InvestmentCategory },
  { name: 'VT (Vanguard Total World)', cat: 'etf' as InvestmentCategory },
  { name: 'Apple (AAPL)', cat: 'stocks' as InvestmentCategory },
  { name: 'NVIDIA (NVDA)', cat: 'stocks' as InvestmentCategory },
  { name: 'Microsoft (MSFT)', cat: 'stocks' as InvestmentCategory },
  { name: 'Fondo Inmobiliario / REIT', cat: 'real_estate' as InvestmentCategory },
  { name: 'CDT / Bonos del Tesoro', cat: 'fixed_income' as InvestmentCategory },
];

export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function InvestmentsView() {
  const {
    getVisibleInvestments,
    addInvestment,
    deleteInvestment,
    currentOwner,
    currentUser,
    accounts,
    contextMode,
    switchContext,
    coupleSpace,
  } = useNexusStore();

  const currentAccount = accounts.find(a => a.owner === currentOwner || a.id === currentUser?.id);
  const currentDisplayName = currentUser?.displayName || currentAccount?.displayName || 'Personal';
  const currentAvatar = currentAccount?.avatar || currentUser?.avatar || '👤';

  const investments = getVisibleInvestments();

  // Filters & Granularity
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [amountUsd, setAmountUsd] = useState('');
  const [category, setCategory] = useState<InvestmentCategory>('crypto');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [visibility, setVisibility] = useState<Visibility>(contextMode === 'couple' ? 'couple' : 'private');
  const [platform, setPlatform] = useState('');
  const [notes, setNotes] = useState('');
  const [davidContrib, setDavidContrib] = useState('');
  const [camiContrib, setCamiContrib] = useState('');
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');

  // Filtered investments
  const filteredInvestments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return investments
      .filter(inv => {
        if (selectedCat !== 'all' && inv.category !== selectedCat) return false;
        if (q && !inv.asset.toLowerCase().includes(q) && !(inv.platform || '').toLowerCase().includes(q)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [investments, selectedCat, searchQuery]);

  // Total KPIs
  const totalInvested = useMemo(() => {
    return filteredInvestments.reduce((acc, curr) => acc + curr.amountUsd, 0);
  }, [filteredInvestments]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<InvestmentCategory, number>();
    filteredInvestments.forEach(inv => {
      map.set(inv.category, (map.get(inv.category) || 0) + inv.amountUsd);
    });
    const list = Array.from(map.entries()).map(([cat, sum]) => ({
      cat,
      sum,
      percent: totalInvested > 0 ? (sum / totalInvested) * 100 : 0,
    }));
    return list.sort((a, b) => b.sum - a.sum);
  }, [filteredInvestments, totalInvested]);

  // Time grouping for timeline chart
  const timelineData = useMemo(() => {
    if (filteredInvestments.length === 0) return [];

    const groups = new Map<string, { label: string; total: number; count: number }>();

    filteredInvestments.forEach(inv => {
      const d = parseISO(inv.date);
      let key = '';
      let label = '';

      if (timeFilter === 'week') {
        const sw = startOfWeek(d, { weekStartsOn: 1 });
        key = format(sw, 'yyyy-MM-dd');
        label = `Sem ${format(sw, 'd MMM', { locale: es })}`;
      } else if (timeFilter === 'quarter') {
        const q = getQuarter(d);
        const y = d.getFullYear();
        key = `${y}-Q${q}`;
        label = `Q${q} ${y}`;
      } else if (timeFilter === 'year') {
        key = String(d.getFullYear());
        label = key;
      } else {
        // month or all defaults to month
        key = format(d, 'yyyy-MM');
        label = format(d, 'MMM yyyy', { locale: es });
      }

      const existing = groups.get(key) || { label, total: 0, count: 0 };
      existing.total += inv.amountUsd;
      existing.count += 1;
      groups.set(key, existing);
    });

    const sorted = Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, v]) => v);

    // Keep the most recent 12 periods max
    return sorted.slice(-12);
  }, [filteredInvestments, timeFilter]);

  const maxTimelineVal = useMemo(() => {
    if (timelineData.length === 0) return 1;
    return Math.max(...timelineData.map(d => d.total));
  }, [timelineData]);

  // Couple contribution breakdown
  const coupleStats = useMemo(() => {
    let davidTotal = 0;
    let camiTotal = 0;

    filteredInvestments.forEach(inv => {
      if (inv.visibility === 'couple') {
        if (inv.contributions) {
          davidTotal += inv.contributions.david || 0;
          camiTotal += inv.contributions.cami || 0;
        } else {
          // Defaults 50/50
          davidTotal += inv.amountUsd / 2;
          camiTotal += inv.amountUsd / 2;
        }
      }
    });

    const sum = davidTotal + camiTotal;
    return {
      davidTotal,
      camiTotal,
      davidPct: sum > 0 ? Math.round((davidTotal / sum) * 100) : 50,
      camiPct: sum > 0 ? Math.round((camiTotal / sum) * 100) : 50,
      totalCouple: sum,
    };
  }, [filteredInvestments]);

  // Handle Save Investment
  const handleSaveInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountUsd);
    if (!assetName.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    let contributions: { david: number; cami: number } | undefined = undefined;
    if (visibility === 'couple') {
      if (splitMode === 'equal') {
        contributions = { david: parsedAmount / 2, cami: parsedAmount / 2 };
      } else {
        const d = parseFloat(davidContrib) || 0;
        const c = parseFloat(camiContrib) || 0;
        contributions = { david: d, cami: c };
      }
    }

    const newInv: Investment = {
      id: `inv-${uuidv4().slice(0, 8)}`,
      asset: assetName.trim(),
      amountUsd: parsedAmount,
      category,
      date,
      owner: currentOwner || 'david',
      visibility,
      platform: platform.trim() || undefined,
      notes: notes.trim() || undefined,
      contributions,
      createdAt: new Date().toISOString(),
    };

    addInvestment(newInv);
    setShowAddModal(false);

    // Reset Form
    setAssetName('');
    setAmountUsd('');
    setPlatform('');
    setNotes('');
    setDavidContrib('');
    setCamiContrib('');
  };

  return (
    <div className="h-full overflow-y-auto space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 select-text pb-24">
      {/* ── Top Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-nexus-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-nexus-text">
              Inversiones & Patrimonio ($ USD)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-nexus-text-secondary">
            Registra y analiza tus compras en bolsa, cripto y bienes raíces, tanto personales como conjuntas en pareja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Privacy Context Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-nexus-surface border border-nexus-border text-xs">
            {(['private', 'couple', 'unified'] as ContextMode[]).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => switchContext(mode)}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  contextMode === mode
                    ? 'bg-nexus-surface-3 text-nexus-text font-bold shadow-xs'
                    : 'text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                {mode === 'private' && '🔒 Solo Mías'}
                {mode === 'couple' && '💑 En Pareja'}
                {mode === 'unified' && '✨ Todo'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/25 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Inversión</span>
          </button>
        </div>
      </div>

      {/* ── Key Metrics Summary Cards ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Invested */}
        <div className="p-4 rounded-2xl bg-nexus-surface border border-nexus-border shadow-xs space-y-1">
          <div className="text-xs text-nexus-text-muted font-medium flex items-center justify-between">
            <span>Total Portafolio</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-nexus-text tracking-tight">
            {formatUSD(totalInvested)}
          </div>
          <div className="text-[11px] text-nexus-text-muted">
            {filteredInvestments.length} aportes registrados
          </div>
        </div>

        {/* Dominant Category */}
        <div className="p-4 rounded-2xl bg-nexus-surface border border-nexus-border shadow-xs space-y-1">
          <div className="text-xs text-nexus-text-muted font-medium flex items-center justify-between">
            <span>Categoría Principal</span>
            <PieChart className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-nexus-text truncate">
            {categoryBreakdown.length > 0
              ? INVESTMENT_CATEGORIES.find(c => c.id === categoryBreakdown[0].cat)?.name || 'Sin datos'
              : '—'}
          </div>
          <div className="text-[11px] text-indigo-400 font-mono font-medium">
            {categoryBreakdown.length > 0 ? `${categoryBreakdown[0].percent.toFixed(1)}% del capital` : '0%'}
          </div>
        </div>

        {/* Average Contribution */}
        <div className="p-4 rounded-2xl bg-nexus-surface border border-nexus-border shadow-xs space-y-1">
          <div className="text-xs text-nexus-text-muted font-medium flex items-center justify-between">
            <span>Ticket Promedio</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-nexus-text">
            {filteredInvestments.length > 0
              ? formatUSD(totalInvested / filteredInvestments.length)
              : '$0 USD'}
          </div>
          <div className="text-[11px] text-nexus-text-muted">Por compra individual</div>
        </div>

        {/* Scope Indicator */}
        <div className="p-4 rounded-2xl bg-nexus-surface border border-nexus-border shadow-xs space-y-1">
          <div className="text-xs text-nexus-text-muted font-medium flex items-center justify-between">
            <span>Ámbito de Vista</span>
            <Layers className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-xl font-bold text-nexus-text capitalize flex items-center gap-1.5">
            {contextMode === 'private'
              ? `${currentDisplayName} (Privado)`
              : contextMode === 'couple'
              ? '💑 Conjuntas'
              : '✨ Portafolio Total'}
          </div>
          <div className="text-[11px] text-nexus-text-muted">
            {contextMode === 'couple'
              ? `Aportes: David ${coupleStats.davidPct}% • Cami ${coupleStats.camiPct}%`
              : 'Aislado criptográficamente'}
          </div>
        </div>
      </div>

      {/* ── Filters & Time Granularity Bar ─────────────────────── */}
      <div className="p-4 rounded-2xl bg-nexus-surface border border-nexus-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Time Tabs */}
        <div className="flex items-center gap-1 bg-nexus-surface-2 p-1 rounded-xl border border-nexus-border text-xs w-full md:w-auto overflow-x-auto">
          {[
            { id: 'week', label: 'Semanal' },
            { id: 'month', label: 'Mensual' },
            { id: 'quarter', label: 'Trimestral' },
            { id: 'year', label: 'Anual' },
            { id: 'all', label: 'Histórico' },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTimeFilter(t.id as any)}
              className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer whitespace-nowrap ${
                timeFilter === t.id
                  ? 'bg-nexus-surface-3 text-nexus-text font-bold shadow-xs'
                  : 'text-nexus-text-muted hover:text-nexus-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCat('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
              selectedCat === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-nexus-surface-2 text-nexus-text-muted hover:text-nexus-text'
            }`}
          >
            Todas
          </button>
          {INVESTMENT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 shrink-0 ${
                selectedCat === cat.id
                  ? 'bg-nexus-surface-3 text-nexus-text border border-nexus-border font-bold'
                  : 'text-nexus-text-muted hover:text-nexus-text'
              }`}
            >
              <span>{cat.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Charts Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Bar Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-nexus-surface border border-nexus-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-nexus-text flex items-center gap-2">
                <span>📊 Flujo de Inversión en el Tiempo</span>
                <span className="text-[11px] font-mono text-indigo-400 capitalize">({timeFilter})</span>
              </h3>
              <p className="text-xs text-nexus-text-muted">Capital aportado periódicamente</p>
            </div>
            <span className="text-xs font-mono text-nexus-text-muted font-semibold">
              Max: {formatUSD(maxTimelineVal)}
            </span>
          </div>

          {timelineData.length > 0 ? (
            <div className="space-y-3 pt-4">
              <div className="h-48 flex items-end gap-2 sm:gap-4 px-2 pt-6">
                {timelineData.map((d, idx) => {
                  const heightPercent = Math.max(8, Math.round((d.total / maxTimelineVal) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition pointer-events-none absolute -top-10 bg-nexus-surface-3 border border-nexus-border rounded-lg px-2 py-1 text-[10px] font-mono whitespace-nowrap z-20 shadow-lg text-nexus-text">
                        <span className="font-bold">{formatUSD(d.total)}</span> ({d.count} compras)
                      </div>

                      <div
                        className="w-full max-w-[40px] rounded-t-xl bg-gradient-to-t from-indigo-600 via-indigo-500 to-indigo-400 group-hover:brightness-125 transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      />

                      <span className="text-[10px] font-mono text-nexus-text-muted truncate max-w-[50px] text-center">
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-nexus-border rounded-xl">
              <p className="text-xs text-nexus-text-muted">No hay inversiones registradas en este período.</p>
            </div>
          )}
        </div>

        {/* Asset Allocation Breakdown (1 col) */}
        <div className="p-5 rounded-2xl bg-nexus-surface border border-nexus-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-nexus-text">Diversificación de Activos</h3>
            <span className="text-xs text-nexus-text-muted font-mono">{categoryBreakdown.length} clases</span>
          </div>

          {categoryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {/* Stacked Progress Bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-nexus-surface-2">
                {categoryBreakdown.map((item, idx) => {
                  const catMeta = INVESTMENT_CATEGORIES.find(c => c.id === item.cat);
                  return (
                    <div
                      key={idx}
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${item.percent}%`,
                        backgroundColor: catMeta?.color || '#6366f1',
                      }}
                      title={`${catMeta?.name}: ${item.percent.toFixed(1)}%`}
                    />
                  );
                })}
              </div>

              {/* List Breakdown */}
              <div className="space-y-2 pt-2 max-h-52 overflow-y-auto pr-1">
                {categoryBreakdown.map((item, idx) => {
                  const catMeta = INVESTMENT_CATEGORIES.find(c => c.id === item.cat);
                  const Icon = catMeta?.icon || Wallet;
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-nexus-surface-2/60 border border-nexus-border/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: catMeta?.color || '#6366f1' }}
                        />
                        <span className="font-medium text-nexus-text truncate">{catMeta?.name}</span>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <span className="font-bold text-nexus-text">{formatUSD(item.sum)}</span>
                        <span className="text-nexus-text-muted ml-1.5 text-[11px]">
                          ({item.percent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-center p-4 border border-dashed border-nexus-border rounded-xl">
              <p className="text-xs text-nexus-text-muted">Sin datos de diversificación</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Investments History Table ─────────────────────────── */}
      <div className="p-5 rounded-2xl bg-nexus-surface border border-nexus-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-nexus-text">Historial de Operaciones</h3>
            <p className="text-xs text-nexus-text-muted">Todas tus compras y aportes detallados</p>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por activo o broker..."
              className="px-3 py-1.5 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text placeholder-nexus-text-muted focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-nexus-text-muted hover:text-nexus-text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {filteredInvestments.length > 0 ? (
          <div className="divide-y divide-nexus-border/60">
            {filteredInvestments.map(inv => {
              const catMeta = INVESTMENT_CATEGORIES.find(c => c.id === inv.category);
              const Icon = catMeta?.icon || Wallet;

              return (
                <div
                  key={inv.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-nexus-surface-2/40 px-2 rounded-xl transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl border shrink-0 ${catMeta?.bgClass || 'bg-nexus-surface-3'}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-nexus-text truncate">{inv.asset}</span>
                        {inv.visibility === 'couple' ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-semibold">
                            💑 Pareja
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md bg-nexus-surface-3 border border-nexus-border text-nexus-text-muted text-[10px] font-mono">
                            🔒 {accounts.find(a => a.owner === inv.owner)?.displayName || (inv.owner === 'david' ? (coupleSpace?.user1Name || 'David') : inv.owner === 'cami' ? (coupleSpace?.user2Name || 'Cami') : currentDisplayName)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-nexus-text-muted mt-0.5">
                        <span>{format(parseISO(inv.date), "d 'de' MMMM, yyyy", { locale: es })}</span>
                        {inv.platform && (
                          <>
                            <span>•</span>
                            <span className="text-nexus-text-secondary">{inv.platform}</span>
                          </>
                        )}
                        {inv.notes && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-xs">{inv.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="text-right font-mono">
                      <div className="text-base font-extrabold text-nexus-text">{formatUSD(inv.amountUsd)}</div>
                      {inv.visibility === 'couple' && inv.contributions && (
                        <div className="text-[10px] text-nexus-text-muted">
                          D: {formatUSD(inv.contributions.david)} • C: {formatUSD(inv.contributions.cami)}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar la inversión en ${inv.asset}?`)) {
                          deleteInvestment(inv.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-nexus-text-muted hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Eliminar inversión"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-nexus-surface-2/30 border border-dashed border-nexus-border">
            <p className="text-sm font-semibold text-nexus-text mb-1">No hay inversiones en esta vista</p>
            <p className="text-xs text-nexus-text-muted mb-4">
              Registra tu primera compra en bolsa, cripto o bienes raíces para comenzar a graficar tu crecimiento.
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              + Registrar Inversión
            </button>
          </div>
        )}
      </div>

      {/* ── Modal: Registrar Inversión ─────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-nexus-surface border border-nexus-border rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-nexus-border">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-nexus-text">Registrar Nueva Inversión</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-nexus-text-muted hover:text-nexus-text rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInvestment} className="space-y-4">
              {/* Asset Name with quick suggestions */}
              <div>
                <label className="block text-xs font-semibold text-nexus-text mb-1">
                  Activo o Ticker *
                </label>
                <input
                  type="text"
                  value={assetName}
                  onChange={e => setAssetName(e.target.value)}
                  placeholder="ej. Bitcoin, VOO (S&P 500), Apple..."
                  className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-indigo-500 font-medium"
                  required
                  autoFocus
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {SUGGESTED_ASSETS.slice(0, 4).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAssetName(s.name);
                        setCategory(s.cat);
                      }}
                      className="px-2 py-0.5 rounded-md bg-nexus-surface-3 hover:bg-indigo-600/20 text-[10px] text-nexus-text-muted hover:text-indigo-300 transition"
                    >
                      {s.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount in USD */}
              <div>
                <label className="block text-xs font-semibold text-nexus-text mb-1">
                  Monto en Dólares ($ USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-nexus-text-muted">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amountUsd}
                    onChange={e => setAmountUsd(e.target.value)}
                    placeholder="100.00"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-indigo-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-nexus-text mb-1">
                  Categoría de Inversión
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as InvestmentCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-indigo-500 font-medium"
                >
                  {INVESTMENT_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-nexus-text mb-1">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              {/* Visibility Scope: Personal vs Pareja */}
              <div>
                <label className="block text-xs font-semibold text-nexus-text mb-1.5">
                  Ámbito de la Inversión
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      visibility === 'private'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                    }`}
                  >
                    <span>🔒 Personal ({currentDisplayName})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility('couple')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      visibility === 'couple'
                        ? 'bg-pink-600/20 border-pink-500 text-pink-300 font-bold'
                        : 'bg-nexus-surface-2 border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                    }`}
                  >
                    <span>💑 En Pareja (Conjunta)</span>
                  </button>
                </div>
              </div>

              {/* If Couple: Split Mode & Contributions */}
              {visibility === 'couple' && (
                <div className="p-3 rounded-2xl bg-nexus-surface-2 border border-nexus-border space-y-2.5">
                  <span className="text-xs font-bold text-nexus-text flex items-center gap-1.5">
                    <span>Aportes de la Pareja</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSplitMode('equal')}
                      className={`py-1.5 px-2.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        splitMode === 'equal'
                          ? 'bg-nexus-surface-3 border-indigo-500/60 text-nexus-text font-bold'
                          : 'border-nexus-border text-nexus-text-muted'
                      }`}
                    >
                      50% / 50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMode('custom')}
                      className={`py-1.5 px-2.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        splitMode === 'custom'
                          ? 'bg-nexus-surface-3 border-indigo-500/60 text-nexus-text font-bold'
                          : 'border-nexus-border text-nexus-text-muted'
                      }`}
                    >
                      Montos Libres
                    </button>
                  </div>

                  {splitMode === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[11px] text-nexus-text-muted block mb-1">Aporte David ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={davidContrib}
                          onChange={e => setDavidContrib(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-nexus-surface-3 border border-nexus-border text-xs text-nexus-text font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-nexus-text-muted block mb-1">Aporte Cami ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={camiContrib}
                          onChange={e => setCamiContrib(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-nexus-surface-3 border border-nexus-border text-xs text-nexus-text font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Platform / Broker */}
              <div>
                <label className="block text-xs font-semibold text-nexus-text mb-1">
                  Plataforma o Broker (Opcional)
                </label>
                <input
                  type="text"
                  value={platform}
                  onChange={e => setPlatform(e.target.value)}
                  placeholder="ej. Binance, Interactive Brokers, Trii, Hapi..."
                  className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-nexus-text mb-1">Notas (Opcional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ej. DCA semanal, compra por dip, precio entrada..."
                  className="w-full px-3 py-2 rounded-xl bg-nexus-surface-2 border border-nexus-border text-xs text-nexus-text focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-nexus-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-nexus-text-muted hover:text-nexus-text cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/25 cursor-pointer"
                >
                  Guardar Inversión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
