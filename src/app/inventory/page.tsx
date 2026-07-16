'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Bill, Expense, DayClose } from '@/types';
import { 
  ArrowLeft, Plus, Trash2, IndianRupee, Calendar, TrendingUp, 
  ShoppingBag, Coffee, FileText, Lightbulb, Briefcase, Loader2, 
  Sparkles, Filter, Lock, Unlock, AlertTriangle, CheckCircle2, 
  Clock, CalendarDays
} from 'lucide-react';
import Link from 'next/link';
import { Modal } from '@/components/Modal';
import { DateTimeDisplay } from '@/components/DateTimeDisplay';

type FilterPeriod = 'today' | 'week' | 'month' | 'year' | 'all';
type Tab = 'dashboard' | 'day_close';

export default function InventoryExpensesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dayCloses, setDayCloses] = useState<DayClose[]>([]);
  const [occupiedTables, setOccupiedTables] = useState<number[]>([]);
  const [isTodayClosed, setIsTodayClosed] = useState(false);
  const [isTodayOpen, setIsTodayOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [period, setPeriod] = useState<FilterPeriod>('today');

  // Input states for new expense
  const [category, setCategory] = useState<'raw_material' | 'electricity' | 'other'>('raw_material');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Day close states
  const [dayCloseNotes, setDayCloseNotes] = useState<string>('');

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, type: 'alert' | 'confirm', onConfirm?: () => void}>({isOpen: false, title: '', message: '', type: 'alert'});
  const showAlert = (title: string, message: string) => setModalConfig({isOpen: true, title, message, type: 'alert'});
  const showConfirm = (title: string, message: string, onConfirm: () => void) => setModalConfig({isOpen: true, title, message, type: 'confirm', onConfirm});
  const closeModal = () => setModalConfig(prev => ({...prev, isOpen: false}));

  const getTodayString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const todayDate = getTodayString();
      const [billHistory, expenseList, dayCloseHistory, tablesList, systemStatus] = await Promise.all([
        db.getBillHistory(),
        db.getExpenses(),
        db.getDayCloses(),
        db.getTables(),
        db.getSystemStatus(todayDate)
      ]);

      setBills(billHistory);
      setExpenses(expenseList);
      setDayCloses(dayCloseHistory);
      setIsTodayClosed(systemStatus.isClosed);
      setIsTodayOpen(systemStatus.isOpen);

      const occupied = tablesList
        .filter((t: any) => t.status === 'occupied')
        .map((t: any) => t.table_number);
      setOccupiedTables(occupied);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
  };

  const isThisWeek = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
  };

  const isThisMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth();
  };

  const isThisYear = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear();
  };

  const periodLabel = (p: FilterPeriod) => {
    switch (p) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      case 'all': return 'All Time';
    }
  };

  const filterByPeriod = (dateStr: string) => {
    if (period === 'today') return isToday(dateStr);
    if (period === 'week') return isThisWeek(dateStr);
    if (period === 'month') return isThisMonth(dateStr);
    if (period === 'year') return isThisYear(dateStr);
    return true;
  };

  const filteredBills = bills.filter(b => filterByPeriod(b.created_at));
  const filteredExpenses = expenses.filter(e => filterByPeriod(e.created_at));

  const totalRevenue = filteredBills.reduce((s, b) => s + Number(b.total), 0);
  const cashRevenue = filteredBills.reduce((s, b) => s + Number(b.cash_amount || (b.payment_method === 'online' ? 0 : b.total)), 0);
  const onlineRevenue = filteredBills.reduce((s, b) => s + Number(b.online_amount || (b.payment_method === 'online' ? b.total : 0)), 0);
  
  const rawMaterialCost = filteredExpenses
    .filter(e => e.category === 'raw_material')
    .reduce((s, e) => s + Number(e.amount), 0);

  const electricityCost = filteredExpenses
    .filter(e => e.category === 'electricity')
    .reduce((s, e) => s + Number(e.amount), 0);

  const otherCost = filteredExpenses
    .filter(e => e.category === 'other')
    .reduce((s, e) => s + Number(e.amount), 0);

  const totalExpenses = rawMaterialCost + electricityCost + otherCost;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const todayRevenue = bills.filter(b => isToday(b.created_at)).reduce((s, b) => s + Number(b.total), 0);
  const todayCashRevenue = bills.filter(b => isToday(b.created_at)).reduce((s, b) => s + Number(b.cash_amount || (b.payment_method === 'online' ? 0 : b.total)), 0);
  const todayOnlineRevenue = bills.filter(b => isToday(b.created_at)).reduce((s, b) => s + Number(b.online_amount || (b.payment_method === 'online' ? b.total : 0)), 0);
  const todayExpenses = expenses.filter(e => isToday(e.created_at)).reduce((s, e) => s + Number(e.amount), 0);
  const todayProfit = todayRevenue - todayExpenses;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    const finalDescription = description.trim() || 
      (category === 'raw_material' ? 'Raw Material' : 
       category === 'electricity' ? 'Electricity (Light)' : 'Other Expense');

    setBusy(true);
    try {
      await db.addExpense(category, Number(amount), finalDescription);
      setDescription('');
      setAmount('');
      const expenseList = await db.getExpenses();
      setExpenses(expenseList);
    } catch (err) {
      console.error('Failed to add expense:', err);
      showAlert('Error', 'Failed to add expense');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    showConfirm('Delete Entry', 'Are you sure you want to delete this entry?', async () => {
      closeModal();
      setBusy(true);
      try {
        await db.deleteExpense(expenseId);
        const expenseList = await db.getExpenses();
        setExpenses(expenseList);
      } catch (err) {
        console.error('Failed to delete expense:', err);
        showAlert('Error', 'Failed to delete expense');
      } finally {
        setBusy(false);
      }
    });
  };

  const handleOpenDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTodayOpen) return;
    setBusy(true);
    try {
      const todayDate = getTodayString();
      await db.openDay(todayDate, openingCash);
      showAlert('Success', 'Business day opened successfully.');
      fetchData();
    } catch (err: any) {
      console.error(err);
      showAlert('Error', err.message || 'Failed to open day.');
    } finally {
      setBusy(false);
    }
  };

  const handleReopenDay = async () => {
    setBusy(true);
    try {
      const todayDate = getTodayString();
      await db.reopenDay(todayDate);
      showAlert('Success', 'Business day has been re-opened for modifications.');
      fetchData();
    } catch (err: any) {
      console.error(err);
      showAlert('Error', err.message || 'Failed to reopen day.');
    } finally {
      setBusy(false);
    }
  };

  const handleCloseDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (occupiedTables.length > 0) {
      showAlert('Active Tables', 'Cannot close the day while tables are occupied. Please close all active table orders first.');
      return;
    }

    showConfirm('Close Day', "Are you sure you want to close today's sales? This will log today's totals permanently.", async () => {
      closeModal();
      setBusy(true);
      try {
        const todayDate = getTodayString();
        await db.closeDay(todayDate, todayRevenue, todayExpenses, todayProfit, dayCloseNotes.trim(), todayCashRevenue, todayOnlineRevenue);
        setDayCloseNotes('');
        setIsTodayClosed(true);
        const dayCloseList = await db.getDayCloses();
        setDayCloses(dayCloseList);
      } catch (err: any) {
        console.error('Failed to close day:', err);
        showAlert('Error', err.message || 'Failed to close day');
      } finally {
        setBusy(false);
      }
    });
  };

  const getCategoryBadgeColor = (cat: 'raw_material' | 'electricity' | 'other') => {
    switch (cat) {
      case 'raw_material': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'electricity': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'other': return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getCategoryIcon = (cat: 'raw_material' | 'electricity' | 'other') => {
    switch (cat) {
      case 'raw_material': return <ShoppingBag className="h-3.5 w-3.5" />;
      case 'electricity': return <Lightbulb className="h-3.5 w-3.5" />;
      case 'other': return <Briefcase className="h-3.5 w-3.5" />;
    }
  };

  const getCategoryLabel = (cat: 'raw_material' | 'electricity' | 'other') => {
    switch (cat) {
      case 'raw_material': return 'Raw Material';
      case 'electricity': return 'Electricity (Light)';
      case 'other': return 'Other Expense';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-40 shadow-md">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-1 hover:bg-primary-foreground/10 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
              <TrendingUp className="h-5 w-5" />
              <div>
                <h1 className="font-serif text-xl font-bold leading-tight">Inventory & Profit Report</h1>
                <p className="text-[10px] uppercase tracking-widest opacity-70 font-sans">Cafe Blossom · Finance Hub</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="text-[11px] text-primary-foreground underline cursor-pointer font-sans">
              Refresh
            </button>
            <div className="border-l border-primary-foreground/20 pl-3">
              <DateTimeDisplay />
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-primary/5 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 flex gap-4 font-sans text-sm">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-1 border-b-2 font-semibold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Expenses & Profit
          </button>
          <button
            onClick={() => setActiveTab('day_close')}
            className={`py-3 px-1 border-b-2 font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'day_close'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {isTodayClosed ? <Lock className="h-3.5 w-3.5 text-primary" /> : <Unlock className="h-3.5 w-3.5 text-green-600 animate-pulse" />}
            Day Open / Close
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        
        {activeTab === 'dashboard' ? (
          <>
            {/* Period tabs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-card border border-border p-4 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-sans">Filter Profit Report Period:</span>
              </div>
              <div className="flex flex-wrap gap-2 font-sans">
                {(['today', 'week', 'month', 'year', 'all'] as FilterPeriod[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      period === p
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {periodLabel(p)}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold uppercase tracking-wider font-sans">Total Revenue</span>
                    <IndianRupee className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-3xl font-black font-mono text-foreground">₹{totalRevenue}</p>
                </div>
                <div className="mt-3 text-xs text-muted-foreground font-sans space-y-1 border-t border-border/50 pt-2.5">
                  <div className="flex justify-between">
                    <span>💵 Cash Revenue</span>
                    <span className="font-mono font-semibold text-green-700">₹{cashRevenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🌐 Online Revenue</span>
                    <span className="font-mono font-semibold text-blue-700">₹{onlineRevenue}</span>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-border/50 flex justify-between text-xs text-muted-foreground font-sans">
                  <span>{filteredBills.length} Order{filteredBills.length !== 1 ? 's' : ''} Completed</span>
                  <span>In {periodLabel(period)}</span>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold uppercase tracking-wider font-sans">Total Expenses</span>
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <p className="text-3xl font-black font-mono text-red-600">₹{totalExpenses}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground font-sans">
                  <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3 text-amber-600" /> ₹{rawMaterialCost} Raw</span>
                  <span className="flex items-center gap-1"><Lightbulb className="h-3 w-3 text-sky-600" /> ₹{electricityCost} Light</span>
                  <span className="flex items-center gap-1"><Briefcase className="h-3 w-3 text-slate-600" /> ₹{otherCost} Other</span>
                </div>
              </div>

              <div className={`border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between transition-colors ${
                netProfit >= 0 
                  ? 'bg-green-50/50 border-green-200 text-green-900' 
                  : 'bg-red-50/50 border-red-200 text-red-900'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center justify-between opacity-80">
                    <span className="text-xs font-semibold uppercase tracking-wider font-sans">Net Profit</span>
                    <Sparkles className={`h-4 w-4 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <p className={`text-3xl font-black font-mono ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {netProfit < 0 ? '-' : ''}₹{Math.abs(netProfit)}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-green-200/50 flex justify-between text-xs font-medium font-sans">
                  <span>Margin Rate</span>
                  <span className="font-mono">{profitMargin}%</span>
                </div>
              </div>

            </div>

            {/* Input & List */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm h-fit space-y-4">
                <div>
                  <h2 className="font-serif text-lg font-bold text-foreground">Add Expense / Material</h2>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">Input raw materials, light bills, or any cafe expense.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Category
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setCategory('raw_material')}
                        className={`py-2 px-1 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          category === 'raw_material'
                            ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400'
                            : 'bg-background border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <ShoppingBag className="h-4 w-4" />
                        <span>Raw Material</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCategory('electricity')}
                        className={`py-2 px-1 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          category === 'electricity'
                            ? 'bg-sky-50 border-sky-400 text-sky-900 ring-1 ring-sky-400'
                            : 'bg-background border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <Lightbulb className="h-4 w-4" />
                        <span>Light Bill</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCategory('other')}
                        className={`py-2 px-1 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          category === 'other'
                            ? 'bg-slate-50 border-slate-400 text-slate-900 ring-1 ring-slate-400'
                            : 'bg-background border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <Briefcase className="h-4 w-4" />
                        <span>Other</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Amount (₹)
                    </label>
                    <div className="flex rounded-lg border border-border overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                      <span className="bg-muted px-3 py-2 text-sm text-muted-foreground border-r border-border flex items-center">₹</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="250"
                        className="flex-1 px-3 py-2 bg-background text-foreground focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Description / Note
                    </label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="e.g. Milk & Sugar supply, June light bill, napkins"
                        rows={3}
                        className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer shadow-sm mt-2"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Add Entry
                  </button>
                </form>
              </div>

              <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-foreground">Expense Log</h2>
                    <p className="text-xs text-muted-foreground font-sans mt-0.5">List of raw materials & costs for {periodLabel(period).toLowerCase()}.</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-border bg-muted/40 font-sans">
                    {filteredExpenses.length} entries
                  </span>
                </div>

                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl bg-muted/10 text-center flex-1">
                    <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground font-sans">No expenses logged for this period.</p>
                    <p className="text-xs text-muted-foreground/60 font-sans mt-1">Use the form to log your first expense.</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-[500px] pr-1 space-y-3.5 scrollbar-none flex-1">
                    {filteredExpenses.map((expense) => {
                      const dt = new Date(expense.created_at);
                      return (
                        <div 
                          key={expense.id} 
                          className="flex items-start gap-3 bg-background border border-border/60 hover:border-border p-3.5 rounded-xl transition-all shadow-sm group"
                        >
                          <div className={`p-2 rounded-lg border ${getCategoryBadgeColor(expense.category)} flex items-center justify-center shrink-0`}>
                            {getCategoryIcon(expense.category)}
                          </div>

                          <div className="flex-1 min-w-0 font-sans">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {getCategoryLabel(expense.category)}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-foreground mt-0.5 leading-normal">
                              {expense.description}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0 ml-1">
                            <span className="font-mono font-bold text-red-600 text-sm">
                              -₹{expense.amount}
                            </span>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              disabled={busy}
                              className="p-1 rounded hover:bg-red-50 text-muted-foreground/40 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-30 cursor-pointer"
                              title="Delete entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </>
        ) : (
          /* Day Close System */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                <div>
                  <h2 className="font-serif text-lg font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="h-5 w-5 text-primary" />
                    {!isTodayOpen ? "Open Today's Business" : "Close Today's Business"}
                  </h2>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">
                    {!isTodayOpen 
                      ? "Start the day by entering the opening cash balance."
                      : "Generate the end of day financial closure. Make sure all guest orders are closed before finalizing."}
                  </p>
                </div>

                {loading ? (
                  <div className="flex py-6 justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !isTodayOpen ? (
                  <form onSubmit={handleOpenDay} className="space-y-4 font-sans text-sm">
                    <div className="bg-muted/40 border border-border/75 rounded-xl p-4 space-y-3">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Opening Cash Balance (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={openingCash || ''}
                        onChange={(e) => setOpeningCash(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        placeholder="0"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      {busy ? (
                        <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : <Unlock className="h-4 w-4" />}
                      Open Day
                    </button>
                  </form>
                ) : isTodayClosed ? (
                  <div className="bg-green-50 border border-green-200 text-green-950 p-4 rounded-xl space-y-3 font-sans">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <span className="font-bold text-sm">Today is Closed</span>
                    </div>
                    <p className="text-xs leading-relaxed mb-3">
                      End of day financials for today ({new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}) have been finalized and locked. No further closures can be submitted today.
                    </p>
                    <button
                      type="button"
                      onClick={handleReopenDay}
                      disabled={busy}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase tracking-wider py-2 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs"
                    >
                      {busy ? (
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : <Unlock className="h-3 w-3" />}
                      Reopen Day (Undo)
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCloseDay} className="space-y-4 font-sans text-sm">
                    {occupiedTables.length > 0 ? (
                      <div className="bg-red-50 border border-red-200 text-red-950 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-red-800">
                          <AlertTriangle className="h-5 w-5 shrink-0" />
                          <span className="font-bold text-sm">Active Tables Detected</span>
                        </div>
                        <p className="text-xs leading-relaxed">
                          Table {occupiedTables.join(', ')} still have active guest orders. You must close or complete these bills before executing the Day Close.
                        </p>
                        <Link 
                          href="/admin" 
                          className="inline-block text-xs font-bold text-red-800 underline hover:text-red-900 mt-1"
                        >
                          Go to Table Grid &rarr;
                        </Link>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-100 text-green-950 p-3.5 rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="h-4.5 w-4.5 text-green-600 shrink-0" />
                        <span className="text-xs font-medium">All guest tables are clear. Ready to close.</span>
                      </div>
                    )}

                    <div className="bg-muted/40 border border-border/75 rounded-xl p-4 space-y-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Today&apos;s Financial Summary</p>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Total Revenue</span>
                        <span className="font-mono font-bold text-foreground">₹{todayRevenue}</span>
                      </div>
                      <div className="pl-3 space-y-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>💵 Cash Sales</span>
                          <span className="font-mono font-medium text-green-700">₹{todayCashRevenue}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>🌐 Online Sales</span>
                          <span className="font-mono font-medium text-blue-700">₹{todayOnlineRevenue}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Total Expenses</span>
                        <span className="font-mono font-bold text-red-600">-₹{todayExpenses}</span>
                      </div>
                      <div className="border-t border-border/50 pt-2 flex justify-between text-sm font-bold">
                        <span className="text-foreground">Today&apos;s Profit</span>
                        <span className="font-mono font-black text-primary">₹{todayProfit}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Closing Notes (Optional)</label>
                      <textarea
                        value={dayCloseNotes}
                        onChange={(e) => setDayCloseNotes(e.target.value)}
                        placeholder="Any discrepancies or notes..."
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm resize-none h-20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={busy || occupiedTables.length > 0}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      {busy ? (
                        <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : <Lock className="h-4 w-4" />}
                      Finalize &amp; Close Day
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-lg font-bold text-foreground flex items-center gap-1.5">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Day Closure History
                  </h2>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">List of verified daily financial reports.</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-border bg-muted/40 font-sans">
                  {dayCloses.length} closures
                </span>
              </div>

              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : dayCloses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-xl bg-muted/10 text-center flex-1">
                  <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground font-sans">No day closure records found.</p>
                  <p className="text-xs text-muted-foreground/60 font-sans mt-1">Submit your first day close using the form.</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[500px] pr-1 space-y-3.5 scrollbar-none flex-1">
                  {dayCloses.map((dc) => {
                    const dt = new Date(dc.created_at);
                    const formattedDate = new Date(dc.date + 'T00:00:00').toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                    
                    return (
                      <div 
                        key={dc.id} 
                        className="bg-background border border-border/60 p-4 rounded-xl space-y-3 font-sans shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                          <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-primary" />
                            {formattedDate}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Closed at {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center py-1">
                          <div className="bg-muted/30 border border-border/40 p-2 rounded-lg">
                            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Revenue</p>
                            <p className="text-sm font-bold text-foreground font-mono mt-0.5">₹{dc.revenue}</p>
                          </div>
                          <div className="bg-muted/30 border border-border/40 p-2 rounded-lg">
                            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Expenses</p>
                            <p className="text-sm font-bold text-red-600 font-mono mt-0.5">-₹{dc.expenses}</p>
                          </div>
                          <div className={`border p-2 rounded-lg ${
                            dc.profit >= 0 
                              ? 'bg-green-50/30 border-green-100 text-green-950' 
                              : 'bg-red-50/30 border-red-100 text-red-950'
                          }`}>
                            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Profit</p>
                            <p className={`text-sm font-bold font-mono mt-0.5 ${dc.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {dc.profit < 0 ? '-' : ''}₹{Math.abs(dc.profit)}
                            </p>
                          </div>
                        </div>

                        {(dc.cash_revenue !== undefined || dc.online_revenue !== undefined) && (
                          <div className="flex justify-between text-[11px] text-muted-foreground bg-muted/20 border border-border/30 px-3 py-1.5 rounded-lg">
                            <span>💵 Cash: <strong className="font-mono text-green-700">₹{dc.cash_revenue || 0}</strong></span>
                            <span>🌐 Online: <strong className="font-mono text-blue-700">₹{dc.online_revenue || 0}</strong></span>
                          </div>
                        )}

                        {dc.notes && (
                          <div className="bg-muted/10 border border-border/20 px-3 py-2 rounded-lg">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Notes</p>
                            <p className="text-xs text-foreground/90 mt-0.5 italic leading-relaxed">
                              &ldquo;{dc.notes}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      <Modal 
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
}
