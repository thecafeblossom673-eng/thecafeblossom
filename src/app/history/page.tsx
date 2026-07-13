'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Bill } from '@/lib/supabase';
import { ArrowLeft, Search, Coffee, History, IndianRupee, ShoppingBag, TrendingUp, MessageCircle, CheckCircle, Clock, Calendar, Phone, Trash2 } from 'lucide-react';
import Link from 'next/link';

type FilterPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

export default function BillHistoryPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const [busy, setBusy] = useState(false);

  const handleDeleteBill = async (billId: string, orderId: string) => {
    const password = prompt('Enter admin password to delete this bill:');
    if (password === null) return;
    if (password !== '7707') {
      alert('Incorrect password. Deletion cancelled.');
      return;
    }

    if (!confirm('Are you sure you want to delete this bill? This cannot be undone.')) return;
    setBusy(true);
    try {
      await db.deleteBill(billId, orderId);
      await fetchHistory();
    } catch (err) {
      console.error('Failed to delete bill:', err);
      alert('Failed to delete bill.');
    } finally {
      setBusy(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await db.getBillHistory();
      setBills(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  // ── Date helpers ─────────────────────────────────────────────────
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

  // ── Period label helper ────────────────────────────────────────────
  const periodLabel = (p: FilterPeriod) => {
    switch (p) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      case 'all': return 'All Time';
    }
  };

  // ── Filtered bills for the table ────────────────────────────────
  const filtered = bills.filter(b => {
    // Period filter
    if (period === 'today' && !isToday(b.created_at)) return false;
    if (period === 'week' && !isThisWeek(b.created_at)) return false;
    if (period === 'month' && !isThisMonth(b.created_at)) return false;
    if (period === 'year' && !isThisYear(b.created_at)) return false;

    // Table filter
    if (tableFilter) {
      const tNum = b.orders?.tables?.table_number?.toString() ?? '';
      if (tNum !== tableFilter) return false;
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const phone = b.orders?.customer_phone ?? '';
      const tNum = b.orders?.tables?.table_number?.toString() ?? '';
      if (!phone.includes(q) && !tNum.includes(q)) return false;
    }

    return true;
  });

  const filteredRevenue = filtered.reduce((s, b) => s + Number(b.total), 0);
  const filteredCashRevenue = filtered.reduce((s, b) => s + Number(b.cash_amount || (b.payment_method === 'online' ? 0 : b.total)), 0);
  const filteredOnlineRevenue = filtered.reduce((s, b) => s + Number(b.online_amount || (b.payment_method === 'online' ? b.total : 0)), 0);
  const filteredAvg = filtered.length > 0 ? Math.round(filteredRevenue / filtered.length) : 0;
  const filteredBillCount = filtered.length;
  const filteredWhatsappSent = filtered.filter(b => b.whatsapp_sent_at).length;

  // Unique tables served in the filtered period
  const filteredTablesServed = new Set(filtered.map(b => b.orders?.tables?.table_number).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-40 shadow-md">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="p-1 hover:bg-primary-foreground/10 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            <div>
              <h1 className="font-serif text-xl font-bold leading-tight">Bill History</h1>
              <p className="text-[10px] uppercase tracking-widest opacity-70 font-sans">Cafe Blossom · Ishvarpur</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">

        {/* ── PERIOD STATS ──────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 font-sans flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {periodLabel(period)}&apos;s Summary
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <IndianRupee className="h-4 w-4 opacity-70" />
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70 font-sans">Revenue</span>
              </div>
              <p className="text-2xl font-black font-mono">₹{filteredRevenue}</p>
              <p className="text-[10px] opacity-60 font-sans mt-0.5">{filteredBillCount} bill{filteredBillCount !== 1 ? 's' : ''}</p>
            </div>

            <div className="bg-secondary text-secondary-foreground rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-4 w-4 opacity-70" />
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70 font-sans">Avg Order</span>
              </div>
              <p className="text-2xl font-black font-mono">₹{filteredAvg}</p>
              <p className="text-[10px] opacity-60 font-sans mt-0.5">Per table</p>
            </div>

            <div className="bg-accent text-accent-foreground rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <ShoppingBag className="h-4 w-4 opacity-70" />
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70 font-sans">Bills</span>
              </div>
              <p className="text-2xl font-black font-mono">{filteredBillCount}</p>
              <p className="text-[10px] opacity-60 font-sans mt-0.5">{filteredTablesServed} table{filteredTablesServed !== 1 ? 's' : ''} served</p>
            </div>

            <div className="bg-green-600 text-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageCircle className="h-4 w-4 opacity-70" />
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70 font-sans">WhatsApp</span>
              </div>
              <p className="text-2xl font-black font-mono">{filteredWhatsappSent}</p>
              <p className="text-[10px] opacity-60 font-sans mt-0.5">Receipts sent</p>
            </div>
          </div>
        </div>

        {/* ── PERIOD TABS + FILTERS ──────────────────────────────────── */}
        <div className="space-y-3">
          {/* Period pills */}
          <div className="flex flex-wrap gap-2 font-sans">
            {(['today', 'week', 'month', 'year', 'all'] as FilterPeriod[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {periodLabel(p)}
              </button>
            ))}
            <button onClick={fetchHistory} className="ml-auto text-xs text-primary underline font-sans cursor-pointer">
              Refresh
            </button>
          </div>

          {/* Search + Table filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by phone or table..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm font-sans text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <select
              value={tableFilter}
              onChange={e => setTableFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-sans text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">All Tables</option>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Table {i + 1}</option>
              ))}
            </select>
          </div>

          {/* Filtered summary */}
          {filtered.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-sans text-muted-foreground border border-border rounded-lg px-4 py-2 bg-card">
              <span>{filtered.length} bill{filtered.length !== 1 ? 's' : ''}</span>
              <span>·</span>
              <span className="text-primary font-bold">₹{filteredRevenue} total</span>
              <span>·</span>
              <span className="text-green-700 font-semibold flex items-center gap-1">💵 Cash: ₹{filteredCashRevenue}</span>
              <span>·</span>
              <span className="text-blue-700 font-semibold flex items-center gap-1">🌐 Online: ₹{filteredOnlineRevenue}</span>
              <span>·</span>
              <span>₹{filteredAvg} avg</span>
            </div>
          )}
        </div>

        {/* ── BILLS TABLE ───────────────────────────────────────────── */}
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-xl bg-card text-center">
            <History className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground font-sans">
              {period === 'today' ? 'No bills yet today.' : `No records found for ${periodLabel(period).toLowerCase()}.`}
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            {/* Mobile card view */}
            <div className="sm:hidden divide-y divide-border">
              {filtered.map(bill => {
                const tNum = bill.orders?.tables?.table_number;
                const phone = bill.orders?.customer_phone;
                const dt = new Date(bill.created_at);
                return (
                  <div key={bill.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-serif font-bold text-sm">
                          {tNum ?? '?'}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-foreground font-sans">
                            {tNum === 9 ? 'Zomato' : tNum === 10 ? 'Parcel' : `Table ${tNum ?? '?'}`}
                          </p>
                          <p className="text-xs text-muted-foreground font-sans">
                            {dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-black text-primary text-lg">₹{bill.total}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground font-sans">
                          <Phone className="h-3 w-3" />+{phone}
                        </span>
                      )}
                      {bill.whatsapp_sent_at ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                          <CheckCircle className="h-3 w-3" /> Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                      {(bill.payment_method || 'cash') === 'cash' && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-semibold">💵 Cash</span>
                      )}
                      {(bill.payment_method || 'cash') === 'online' && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">🌐 Online</span>
                      )}
                      {(bill.payment_method || 'cash') === 'split' && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">🥞 Split</span>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeleteBill(bill.id, bill.order_id)}
                        disabled={busy}
                        className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete bill"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop table view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Table</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date &amp; Time</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">WhatsApp</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                    <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(bill => {
                    const tNum = bill.orders?.tables?.table_number;
                    const phone = bill.orders?.customer_phone;
                    const dt = new Date(bill.created_at);
                    return (
                      <tr key={bill.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-serif font-bold text-sm">
                            {tNum ?? '?'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          <p>{dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                          <p className="text-xs text-muted-foreground">{dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {phone ? (
                            <span className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3 text-muted-foreground/60" />+{phone}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">&mdash;</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {bill.whatsapp_sent_at ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                              <CheckCircle className="h-3 w-3" /> Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {(bill.payment_method || 'cash') === 'cash' && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                              💵 Cash
                            </span>
                          )}
                          {(bill.payment_method || 'cash') === 'online' && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                              🌐 Online
                            </span>
                          )}
                          {(bill.payment_method || 'cash') === 'split' && (
                            <div className="flex flex-col">
                              <span className="inline-flex w-fit items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                                🥞 Split
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                                C:₹{bill.cash_amount || 0} · O:₹{bill.online_amount || 0}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-primary text-base">
                          ₹{bill.total}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteBill(bill.id, bill.order_id)}
                            disabled={busy}
                            className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete bill"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


