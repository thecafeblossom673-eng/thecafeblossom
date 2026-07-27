'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { clientCache } from '@/lib/cache';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Coffee, History, TrendingUp, QrCode, LogOut, Percent, Settings, KeyRound, Eye, EyeOff, CheckCircle2, X, Clock, RefreshCw, ShieldCheck, Smartphone, Monitor, Trash2, UserCheck, Lock } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { DateTimeDisplay } from '@/components/DateTimeDisplay';
import { ViraTechWatermark } from '@/components/ViraTechWatermark';
import { playOrderChime } from '@/lib/utils/sound';
import { updatePassword, verifyPassword } from '@/lib/passwords';

type TableData = {
  id: string;
  table_number: number;
  status: 'free' | 'occupied';
  activeOrder?: {
    id: string;
    status: string;
    itemsCount: number;
    totalAmount: number;
    created_at: string;
  } | null;
};

const DEFAULT_TABLES: TableData[] = Array.from({ length: 10 }, (_, i) => ({
  id: `t-${i + 1}`,
  table_number: i + 1,
  status: 'free'
}));

export default function TableBoardPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [tables, setTables] = useState<TableData[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = clientCache.get<TableData[]>('admin_tables');
      if (cached && cached.length > 0) return cached;
    }
    return DEFAULT_TABLES;
  });
  const [loading, setLoading] = useState(true);
  const [openingTable, setOpeningTable] = useState<string | null>(null);
  const [selectedTableForQr, setSelectedTableForQr] = useState<TableData | null>(null);
  const [prevTotalItems, setPrevTotalItems] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = clientCache.get<boolean>('admin_is_locked');
      if (cached !== null) return cached;
    }
    return false;
  });
  const [todayRevenue, setTodayRevenue] = useState(0);

  // ── Password & Login History Settings Modal ─────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'passwords' | 'history'>('passwords');
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [sessionToForceLogout, setSessionToForceLogout] = useState<{ id: string; device: string } | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [logToDelete, setLogToDelete] = useState<{ id: string; device: string } | null>(null);

  // Security gate for Settings modal (requires inventory password)
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [settingsPasscode, setSettingsPasscode] = useState('');
  const [showSettingsPasscode, setShowSettingsPasscode] = useState(false);
  const [settingsPassError, setSettingsPassError] = useState('');

  const [staffOld, setStaffOld] = useState('');
  const [staffNew, setStaffNew] = useState('');
  const [staffConfirm, setStaffConfirm] = useState('');
  const [showStaffOld, setShowStaffOld] = useState(false);
  const [showStaffNew, setShowStaffNew] = useState(false);
  const [staffMsg, setStaffMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [invOld, setInvOld] = useState('');
  const [invNew, setInvNew] = useState('');
  const [invConfirm, setInvConfirm] = useState('');
  const [showInvOld, setShowInvOld] = useState(false);
  const [showInvNew, setShowInvNew] = useState(false);
  const [invMsg, setInvMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchLoginLogs = async () => {
    setLoadingLogs(true);
    try {
      if (typeof window !== 'undefined') {
        const currentTabId = sessionStorage.getItem('cafe_tab_session_id');
        if (currentTabId) {
          await db.sendSessionHeartbeat(currentTabId);
        }
      }
      const logs = await db.getLoginSessions();
      setLoginLogs(logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (showSettings && settingsTab === 'history' && isSettingsUnlocked) {
      fetchLoginLogs();
    }
  }, [showSettings, settingsTab, isSettingsUnlocked]);

  const handleCloseSettings = () => {
    setShowSettings(false);
    setIsSettingsUnlocked(false);
    setSettingsPasscode('');
    setSettingsPassError('');
    setShowSettingsPasscode(false);
    setStaffOld('');
    setStaffNew('');
    setStaffConfirm('');
    setStaffMsg(null);
    setInvOld('');
    setInvNew('');
    setInvConfirm('');
    setInvMsg(null);
    setLoginLogs([]);
  };

  const handleForceLogout = async (sessionId: string) => {
    await db.forceLogoutSession(sessionId);
    await fetchLoginLogs();
  };

  const handleClearLogs = async () => {
    const currentTabId = typeof window !== 'undefined' ? sessionStorage.getItem('cafe_tab_session_id') || undefined : undefined;
    await db.clearLoginHistory(currentTabId);
    await fetchLoginLogs();
  };

  const handleChangeStaffPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPassword('staff', staffOld)) {
      setStaffMsg({ ok: false, text: 'Current staff password is incorrect.' });
      return;
    }
    if (staffNew.length < 4) { setStaffMsg({ ok: false, text: 'Minimum 4 characters.' }); return; }
    if (staffNew !== staffConfirm) { setStaffMsg({ ok: false, text: 'Passwords do not match.' }); return; }
    updatePassword('staff', staffNew);
    setStaffOld(''); setStaffNew(''); setStaffConfirm('');
    setStaffMsg({ ok: true, text: 'Staff password updated! Use it on next login.' });
  };

  const handleChangeInvPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPassword('inventory', invOld)) {
      setInvMsg({ ok: false, text: 'Current inventory password is incorrect.' });
      return;
    }
    if (invNew.length < 4) { setInvMsg({ ok: false, text: 'Minimum 4 characters.' }); return; }
    if (invNew !== invConfirm) { setInvMsg({ ok: false, text: 'Passwords do not match.' }); return; }
    updatePassword('inventory', invNew);
    setInvOld(''); setInvNew(''); setInvConfirm('');
    setInvMsg({ ok: true, text: 'Inventory password updated!' });
  };

  const printQrCode = (table: TableData) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        `${window.location.origin}/order?table=${table.table_number}`
      )}`;
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - Table ${table.table_number}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                text-align: center;
                padding: 40px;
                color: #333;
                margin: 0;
              }
              .container {
                border: 3px solid #db2777;
                border-radius: 20px;
                padding: 30px;
                max-width: 320px;
                margin: 0 auto;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .logo {
                font-size: 22px;
                font-weight: bold;
                color: #db2777;
                margin-bottom: 5px;
              }
              .sublogo {
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: #666;
                margin-bottom: 20px;
              }
              .qr-img {
                width: 220px;
                height: 220px;
                margin: 15px auto;
              }
              .table-title {
                font-size: 26px;
                font-weight: 800;
                margin: 15px 0 5px 0;
                color: #111;
              }
              .instruction {
                font-size: 13px;
                color: #555;
                margin-top: 10px;
                line-height: 1.4;
              }
              @media print {
                body {
                  padding: 0;
                }
                .container {
                  border: none;
                  box-shadow: none;
                  max-width: 100%;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">🌸 CAFE BLOSSOM</div>
              <div class="sublogo">Ishwarpur</div>
              <h1 class="table-title">TABLE ${table.table_number}</h1>
              <img class="qr-img" src="${qrCodeUrl}" alt="Table ${table.table_number} QR Code" />
              <div class="instruction">Scan to view menu & order food directly from your phone!</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const fetchTables = async () => {
    try {
      const todayDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      const [status, data] = await Promise.all([
        db.getSystemStatus(todayDate),
        db.getTables()
      ]);

      setIsLocked(status.isLocked);
      clientCache.set('admin_is_locked', status.isLocked);
      setTables(data as TableData[]);
      clientCache.set('admin_tables', data as TableData[]);

      // Calculate current total items across all active orders
      const currentTotal = data.reduce((sum, t) => sum + (t.activeOrder?.itemsCount || 0), 0);

      // Fetch today's bill revenue
      try {
        const history = await db.getBillHistory();
        const todayStr = new Date().toDateString();
        const todayTotal = history
          .filter((b: any) => new Date(b.created_at).toDateString() === todayStr)
          .reduce((sum: number, b: any) => sum + Number(b.total || 0), 0);
        setTodayRevenue(todayTotal);
      } catch { /* ignore revenue fetch error */ }

      // If we had a previous count and it has increased, play the chime!
      setPrevTotalItems(prev => {
        if (prev !== null && currentTotal > prev) {
          playOrderChime();
        }
        return currentTotal;
      });
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    // Refresh every 8 seconds to show live status (only when tab is active)
    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchTables();
    }, 8000);

    // Listen to local storage changes to trigger real-time audio alerts for mock mode
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cafe_blossom_new_order_placed') {
        playOrderChime();
        fetchTables();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // BroadcastChannel: instant cross-tab notification on same device
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('cafe_blossom_orders');
      channel.onmessage = () => {
        playOrderChime();
        fetchTables();
      };
    } catch {
      // Not supported — polling fallback is enough
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      channel?.close();
    };
  }, []);

  const handleTableClick = (table: TableData) => {
    if (isLocked) {
      alert("System is Locked. Please Open the Day from Inventory -> Day Close System to take orders.");
      return;
    }

    const targetId = table.id.startsWith('t-') ? table.table_number.toString() : table.id;
    router.push(`/tables/${targetId}`);
  };

  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const freeCount = tables.filter(t => t.status === 'free').length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isLocked && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-bold shadow-md z-50 animate-in slide-in-from-top flex items-center justify-center gap-2">
          <span>⚠️ System is Locked. Day is not open or already closed.</span>
          <Link href="/inventory" className="underline hover:text-white/80">Open Day</Link>
        </div>
      )}
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-40 shadow-md">
        <div className="mx-auto max-w-5xl px-3 py-3 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity cursor-pointer">
            <Coffee className="h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <h1 className="font-script text-2xl sm:text-3xl leading-tight truncate">Cafe Blossom</h1>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-widest opacity-70 font-sans -mt-0.5 hidden sm:block">Ishwarpur · Staff Portal</p>
            </div>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link
              href="/inventory"
              className="flex items-center gap-1 sm:gap-1.5 bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground px-2 sm:px-3 py-2 rounded-lg text-xs font-medium font-sans transition-colors"
            >
              <TrendingUp className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Profit &amp; Inventory</span>
            </Link>
            <Link
              href="/offers"
              className="flex items-center gap-1 sm:gap-1.5 bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground px-2 sm:px-3 py-2 rounded-lg text-xs font-medium font-sans transition-colors cursor-pointer"
            >
              <Percent className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Running Offer</span>
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-1 sm:gap-1.5 bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground px-2 sm:px-3 py-2 rounded-lg text-xs font-medium font-sans transition-colors"
            >
              <History className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Bill History</span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-1 sm:gap-1.5 bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground px-2 sm:px-3 py-2 rounded-lg text-xs font-medium font-sans transition-colors cursor-pointer"
              title="Lock/Logout Portal"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Logout</span>
            </button>
            <button
              onClick={() => { setShowSettings(true); setStaffMsg(null); setInvMsg(null); }}
              className="flex items-center gap-1 sm:gap-1.5 bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground px-2 sm:px-3 py-2 rounded-lg text-xs font-medium font-sans transition-colors cursor-pointer"
              title="Password Settings"
            >
              <Settings className="h-4 w-4 shrink-0" />
            </button>
            <div className="border-l border-primary-foreground/20 pl-2 sm:pl-3 ml-1 sm:ml-2 flex items-center gap-2">
              <DateTimeDisplay />
              <ViraTechWatermark />
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <div className="mx-auto max-w-5xl w-full px-3 pt-4 font-sans">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { label: 'Total', value: tables.length, letter: 'T', icon: <Coffee className="h-3 w-3" /> },
            { label: 'Occupied', value: occupiedCount, letter: 'O', dot: 'bg-secondary' },
            { label: 'Free', value: freeCount, letter: 'F', dot: 'bg-green-500' },
            { label: 'Orders', value: tables.filter(t => t.activeOrder).length, letter: 'A', icon: <Clock className="h-3 w-3" /> },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-3.5 shadow-sm relative overflow-hidden flex flex-col justify-between h-20 sm:h-24">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                {stat.dot
                  ? <span className={`h-2.5 w-2.5 rounded-full ${stat.dot} ring-4 ring-primary/10 ${stat.label === 'Occupied' ? 'animate-pulse' : ''}`} />
                  : <span className="p-1 rounded-lg bg-muted text-muted-foreground">{stat.icon}</span>}
              </div>
              <p className="text-2xl font-bold text-foreground font-serif">{stat.value}</p>
              <div className="absolute -right-3 -bottom-3 text-muted-foreground/10 font-serif font-black text-5xl pointer-events-none select-none">{stat.letter}</div>
            </div>
          ))}
          {/* Today sales card */}
          <div className="bg-card border border-border rounded-2xl p-3.5 shadow-sm relative overflow-hidden flex flex-col justify-between h-20 sm:h-24 col-span-2 sm:col-span-1">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Today's Sales</span>
              <span className="p-1 rounded-lg bg-primary/10 text-primary font-bold text-xs">₹</span>
            </div>
            <div className="flex justify-between items-baseline">
              <p className="text-xl font-bold text-foreground font-serif">₹{todayRevenue}</p>
              <button onClick={fetchTables} title="Refresh tables" className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
            <div className="absolute -right-3 -bottom-3 text-muted-foreground/10 font-serif font-black text-5xl pointer-events-none select-none">R</div>
          </div>
        </div>
      </div>

      {/* Table Grid — 3 cols on mobile, 4 on sm+ */}
      <main className="mx-auto max-w-5xl w-full px-3 py-5">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-5">
            {tables.map((table) => {
              const isOccupied = table.status === 'occupied';
              const isOpening = openingTable === table.id;
              const isBilled = table.activeOrder?.status === 'billed';
              const isDiningTable = table.table_number <= 8;

              return (
                <div
                  key={table.id}
                  className={`relative flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-border p-3 sm:p-5 text-center bg-card shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 ${
                    openingTable && openingTable !== table.id ? 'opacity-50' : ''
                  }`}
                >
                  {/* QR Code icon — only for dining tables 1-8 */}
                  {isDiningTable && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedTableForQr(table); }}
                      className="absolute top-2.5 left-2.5 p-1 rounded-md text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer z-10"
                      title={`View QR Code for Table ${table.table_number}`}
                    >
                      <QrCode className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Clickable inner area */}
                  <button
                    type="button"
                    onClick={() => handleTableClick(table)}
                    disabled={!!openingTable}
                    className="flex flex-col items-center justify-center w-full cursor-pointer disabled:cursor-not-allowed"
                  >
                    {/* Table Circle Avatar */}
                    <div className={`h-11 w-11 sm:h-14 sm:w-14 rounded-full flex items-center justify-center mb-2 sm:mb-3 font-serif font-black text-lg sm:text-xl shadow-inner ${
                      isOccupied
                        ? isBilled
                          ? 'bg-amber-500/15 text-amber-600'
                          : 'bg-secondary/15 text-secondary'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {table.table_number === 9 ? 'Z' : table.table_number === 10 ? 'P' : table.table_number}
                    </div>

                    <p className="font-serif font-bold text-sm sm:text-base text-foreground leading-tight">
                      {table.table_number === 9 ? 'Zomato' : table.table_number === 10 ? 'Parcel' : `Table ${table.table_number}`}
                    </p>

                    {isOpening ? (
                      <p className="text-[10px] text-muted-foreground mt-1 font-sans animate-pulse">Opening…</p>
                    ) : isOccupied && table.activeOrder ? (
                      <div className="mt-1.5 space-y-0.5">
                        <p className="text-[10px] font-semibold text-secondary font-sans">
                          {isBilled ? '🧾 Billed' : `${table.activeOrder.itemsCount} item${table.activeOrder.itemsCount !== 1 ? 's' : ''}`}
                        </p>
                        <p className="text-xs font-black text-primary font-mono">₹{table.activeOrder.totalAmount}</p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-1 font-sans">Tap</p>
                    )}
                  </button>

                  {/* Status dot */}
                  <div className={`absolute top-2.5 right-2.5 h-2 w-2 rounded-full ring-2 ${
                    isOccupied
                      ? isBilled
                        ? 'bg-amber-500 ring-amber-500/30'
                        : 'bg-secondary ring-secondary/30 animate-pulse'
                      : 'bg-green-500 ring-green-500/30'
                  }`} />
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8 font-sans opacity-70">
          Tap any table to open it and start adding items. Tap an occupied table to view or edit its order.
        </p>
      </main>

      {/* QR Code Preview Modal */}
      {selectedTableForQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedTableForQr(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-xs flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center">
              <p className="text-lg font-serif font-bold text-foreground">🌸 Table {selectedTableForQr.table_number}</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">Customer Ordering QR Code</p>
            </div>

            {/* QR Image */}
            <div className="p-3 bg-white rounded-xl border border-border shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/order?table=${selectedTableForQr.table_number}`
                    : `/order?table=${selectedTableForQr.table_number}`
                )}`}
                alt={`QR Code for Table ${selectedTableForQr.table_number}`}
                className="w-48 h-48"
              />
            </div>

            {/* URL */}
            <p className="text-[10px] text-muted-foreground font-mono break-all text-center bg-muted/40 rounded-lg px-3 py-2 border border-border/50">
              {typeof window !== 'undefined'
                ? `${window.location.origin}/order?table=${selectedTableForQr.table_number}`
                : `/order?table=${selectedTableForQr.table_number}`}
            </p>

            {/* Actions */}
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setSelectedTableForQr(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer font-sans"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => printQrCode(selectedTableForQr)}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer font-sans flex items-center justify-center gap-1.5"
              >
                <QrCode className="h-4 w-4" />
                Print QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Password & Login History Settings Modal ─────────────────────────────── */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleCloseSettings}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {!isSettingsUnlocked ? (
              /* Password Gate to Access Settings */
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto my-auto font-sans relative w-full">
                <button
                  onClick={handleCloseSettings}
                  className="absolute right-0 top-0 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="p-3 bg-primary/10 text-primary rounded-full border border-primary/20 mt-2">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-foreground">Protected Portal Settings</h3>
                  <p className="text-xs text-muted-foreground mt-1 font-sans leading-relaxed">
                    Enter your Inventory & Financial Password to access system settings, password management, and login history.
                  </p>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (verifyPassword('inventory', settingsPasscode)) {
                      setIsSettingsUnlocked(true);
                      setSettingsPassError('');
                    } else {
                      setSettingsPassError('Incorrect inventory password.');
                      setSettingsPasscode('');
                    }
                  }}
                  className="w-full space-y-3"
                >
                  <div className="relative">
                    <input
                      type={showSettingsPasscode ? 'text' : 'password'}
                      value={settingsPasscode}
                      onChange={e => { setSettingsPasscode(e.target.value); setSettingsPassError(''); }}
                      placeholder="Enter inventory password"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                      autoFocus
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowSettingsPasscode(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showSettingsPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {settingsPassError && (
                    <p className="text-xs text-red-600 font-sans font-bold flex items-center justify-center gap-1">
                      <X className="h-3.5 w-3.5" />
                      {settingsPassError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm font-sans"
                  >
                    Unlock Settings
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* Modal Header & Tabs */}
                <div className="border-b border-border shrink-0 bg-muted/20">
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      <h2 className="font-serif text-lg font-bold text-foreground">Admin & Staff Portal Settings</h2>
                    </div>
                    <button
                      onClick={handleCloseSettings}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Tab Selector */}
                  <div className="flex px-6 gap-2 border-t border-border/50">
                    <button
                      onClick={() => setSettingsTab('passwords')}
                      className={`flex items-center gap-2 px-4 py-3 text-xs font-bold font-sans border-b-2 transition-all cursor-pointer ${
                        settingsTab === 'passwords'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <KeyRound className="h-4 w-4" />
                      Password Management
                    </button>
                    <button
                      onClick={() => setSettingsTab('history')}
                      className={`flex items-center gap-2 px-4 py-3 text-xs font-bold font-sans border-b-2 transition-all cursor-pointer ${
                        settingsTab === 'history'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Login History & Devices
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                  {settingsTab === 'passwords' ? (
                    /* Password Management Tab */
                    <div className="space-y-6">
                      {/* Staff Password */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-sans font-bold text-sm text-foreground">Staff Portal Password</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Used to log in to /admin, /tables, /history.</p>
                        </div>
                        <form onSubmit={handleChangeStaffPass} className="space-y-2.5">
                          <div className="relative">
                            <input
                              type={showStaffOld ? 'text' : 'password'}
                              value={staffOld}
                              onChange={e => { setStaffOld(e.target.value); setStaffMsg(null); }}
                              placeholder="Current staff password"
                              className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono"
                              required
                            />
                            <button type="button" tabIndex={-1} onClick={() => setShowStaffOld(p => !p)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                              {showStaffOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showStaffNew ? 'text' : 'password'}
                              value={staffNew}
                              onChange={e => { setStaffNew(e.target.value); setStaffMsg(null); }}
                              placeholder="New staff password"
                              className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono"
                              required
                            />
                            <button type="button" tabIndex={-1} onClick={() => setShowStaffNew(p => !p)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                              {showStaffNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <input
                            type={showStaffNew ? 'text' : 'password'}
                            value={staffConfirm}
                            onChange={e => { setStaffConfirm(e.target.value); setStaffMsg(null); }}
                            placeholder="Confirm new staff password"
                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono"
                            required
                          />
                          {staffMsg && (
                            <p className={`text-xs flex items-center gap-1 font-sans ${staffMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
                              {staffMsg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                              {staffMsg.text}
                            </p>
                          )}
                          <button type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm">
                            Update Staff Password
                          </button>
                        </form>
                      </div>

                      <div className="h-px bg-border" />

                      {/* Inventory Password */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-sans font-bold text-sm text-foreground">Inventory & Financial Password</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Required every time you open /inventory and access portal settings.</p>
                        </div>
                        <form onSubmit={handleChangeInvPass} className="space-y-2.5">
                          <div className="relative">
                            <input
                              type={showInvOld ? 'text' : 'password'}
                              value={invOld}
                              onChange={e => { setInvOld(e.target.value); setInvMsg(null); }}
                              placeholder="Current inventory password"
                              className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono"
                              required
                            />
                            <button type="button" tabIndex={-1} onClick={() => setShowInvOld(p => !p)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                              {showInvOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showInvNew ? 'text' : 'password'}
                              value={invNew}
                              onChange={e => { setInvNew(e.target.value); setInvMsg(null); }}
                              placeholder="New inventory password"
                              className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono"
                              required
                            />
                            <button type="button" tabIndex={-1} onClick={() => setShowInvNew(p => !p)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                              {showInvNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <input
                            type={showInvNew ? 'text' : 'password'}
                            value={invConfirm}
                            onChange={e => { setInvConfirm(e.target.value); setInvMsg(null); }}
                            placeholder="Confirm new inventory password"
                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono"
                            required
                          />
                          {invMsg && (
                            <p className={`text-xs flex items-center gap-1 font-sans ${invMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
                              {invMsg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                              {invMsg.text}
                            </p>
                          )}
                          <button type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm">
                            Update Inventory Password
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    /* Login History & Devices Tab Content */
                    <div className="space-y-6">
                  {/* Top Bar for History */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-sans font-bold text-sm text-foreground">Logged-in Devices & Staff History</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Real-time session audit log with remote logout controls.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={fetchLoginLogs}
                        disabled={loadingLogs}
                        className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Refresh session logs"
                      >
                        <RefreshCw className={`h-4 w-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => setShowClearConfirmModal(true)}
                        className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Clear log history"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Active Devices Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans">
                        Currently Active Sessions ({loginLogs.filter(l => l.status === 'active').length})
                      </h4>
                    </div>

                    {loginLogs.filter(l => l.status === 'active').length === 0 ? (
                      <div className="bg-muted/30 border border-border rounded-xl p-4 text-center text-xs text-muted-foreground font-sans">
                        No active device sessions registered.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {loginLogs.filter(l => l.status === 'active').map(session => {
                          const currentTabId = typeof window !== 'undefined' ? sessionStorage.getItem('cafe_tab_session_id') : null;
                          const isCurrentWindow = currentTabId && (session.id === currentTabId || session.sessionId === currentTabId);

                          // Parse device name & screen resolution
                          const rawDevice = session.device_info || 'Windows PC · Chrome';
                          const resMatch = rawDevice.match(/^(.*?)\s*(\(\d+[×x]\d+\))?$/);
                          const deviceTitle = resMatch ? resMatch[1].trim() : rawDevice;
                          const resolution = resMatch && resMatch[2] ? resMatch[2].trim() : '';
                          const isMobile = rawDevice.toLowerCase().includes('phone') || rawDevice.toLowerCase().includes('android') || rawDevice.toLowerCase().includes('iphone');
                          const shortSessId = (session.id || session._id || 'sess').substring(0, 8);

                          return (
                            <div key={session.id} className={`bg-card border ${isCurrentWindow ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-300' : 'border-green-300'} rounded-2xl p-4 shadow-sm space-y-3 relative overflow-hidden`}>
                              <div className={`absolute top-0 left-0 right-0 h-1.5 ${isCurrentWindow ? 'bg-blue-500' : 'bg-green-500'}`} />

                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${isCurrentWindow ? 'bg-blue-100/80 border-blue-200 text-blue-700' : 'bg-green-100/80 border-green-200 text-green-700'}`}>
                                    {isMobile ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                                  </div>
                                  <div className="space-y-1">
                                    <div>
                                      <p className="text-xs font-bold font-sans text-foreground leading-tight">{deviceTitle}</p>
                                      {resolution && (
                                        <p className="text-[11px] font-bold font-sans text-foreground/80">{resolution}</p>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                      <div className="bg-amber-100/60 border border-amber-200/80 rounded-md px-2 py-1 flex items-center gap-1.5 text-[10px] font-sans text-amber-900 leading-tight">
                                        <span className="text-blue-500 text-[11px]">🌐</span>
                                        <div className="flex flex-col">
                                          <span className="font-bold text-[9.5px]">{session.ip_address || 'Local Staff Device'}</span>
                                        </div>
                                      </div>
                                      <span className="text-[10px] text-muted-foreground font-mono">
                                        #sess_{shortSessId}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  {isCurrentWindow ? (
                                    <div className="bg-blue-100/90 border border-blue-300 text-blue-800 px-3 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-wider text-center leading-tight shadow-sm">
                                      <div>THIS WINDOW</div>
                                      <div className="text-[8px] opacity-80">(YOU)</div>
                                    </div>
                                  ) : (
                                    <span className="text-[9px] font-black text-green-800 bg-green-100 border border-green-300 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-ping" />
                                      ACTIVE NOW
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2.5 border-t border-border/60 text-[10px] text-muted-foreground font-sans">
                                <div className="flex flex-col gap-0.5">
                                  <span>Logged in: <strong className="text-foreground">{new Date(session.login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                                  {session.last_seen_at && (
                                    <span className="text-[9.5px] text-muted-foreground">
                                      Last active: {Math.max(0, Math.floor((Date.now() - new Date(session.last_seen_at).getTime()) / 1000))}s ago
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => setSessionToForceLogout({ id: session.id, device: session.device_info })}
                                  className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold hover:bg-red-50 px-2.5 py-1.5 rounded-xl border border-red-200/80 transition-colors cursor-pointer text-[10px] font-sans shadow-2xs"
                                >
                                  <LogOut className="h-3 w-3" />
                                  Force Logout
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Complete History Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      Session Audit History Log
                    </h4>

                    <div className="border border-border rounded-xl overflow-hidden bg-background">
                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs font-sans">
                          <thead className="bg-muted/50 border-b border-border sticky top-0 font-bold uppercase text-[10px] text-muted-foreground tracking-wider">
                            <tr>
                              <th className="p-3">Device / OS</th>
                              <th className="p-3">Login Time</th>
                              <th className="p-3">Logout Time</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-center">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {loginLogs.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                                  No session log history available.
                                </td>
                              </tr>
                            ) : (
                              loginLogs.map(log => {
                                const rawDevice = log.device_info || 'Windows PC · Chrome';
                                const resMatch = rawDevice.match(/^(.*?)\s*(\(\d+[×x]\d+\))?$/);
                                const deviceTitle = resMatch ? resMatch[1].trim() : rawDevice;
                                const resolution = resMatch && resMatch[2] ? resMatch[2].trim() : '';

                                return (
                                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="p-3 font-medium text-foreground">
                                      <div className="flex items-start gap-2">
                                        <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                        <div>
                                          <p className="font-bold text-xs leading-tight">{deviceTitle}</p>
                                          {resolution && (
                                            <p className="font-bold text-xs text-foreground/90">{resolution}</p>
                                          )}
                                          <p className="text-[10px] text-muted-foreground font-sans mt-0.5">{log.ip_address || 'Local Staff Device'}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-3 text-muted-foreground font-mono text-[11px]">
                                      {new Date(log.login_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td className="p-3 text-muted-foreground font-mono text-[11px]">
                                      {log.logout_at
                                        ? new Date(log.logout_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : log.status === 'active' ? '— (Active Now)' : 'Expired'}
                                    </td>
                                    <td className="p-3">
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                        log.status === 'active' ? 'bg-green-100 text-green-700 border border-green-300' :
                                        log.status === 'force_logged_out' ? 'bg-red-100 text-red-700 border border-red-300' :
                                        log.status === 'logged_out' ? 'bg-slate-100 text-slate-700 border border-slate-300' :
                                        'bg-amber-100 text-amber-700 border border-amber-300'
                                      }`}>
                                        {log.status === 'force_logged_out' ? 'FORCED LOGOUT' : log.status}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">
                                      <button
                                        onClick={() => setLogToDelete({ id: log.id, device: log.device_info })}
                                        className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                        title="Delete single session log"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )}

      {/* ── Custom Modal: Force Logout Confirmation ─────────────────────── */}
      {sessionToForceLogout && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSessionToForceLogout(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 border border-red-200 text-red-600 shrink-0">
                <LogOut className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">Force Logout Device?</h3>
                <p className="text-xs text-muted-foreground font-sans">Remote session termination</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Are you sure you want to remotely disconnect <strong className="text-foreground font-semibold">{sessionToForceLogout.device}</strong>? The device will be logged out automatically.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSessionToForceLogout(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = sessionToForceLogout.id;
                  setSessionToForceLogout(null);
                  await handleForceLogout(targetId);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer font-sans"
              >
                Force Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Modal: Clear All History Confirmation ────────────────── */}
      {showClearConfirmModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowClearConfirmModal(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 border border-red-200 text-red-600 shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">Clear Audit History?</h3>
                <p className="text-xs text-muted-foreground font-sans">Delete historical login logs</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Are you sure you want to delete all historical login logs? This action cannot be undone.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowClearConfirmModal(false);
                  await handleClearLogs();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer font-sans"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Modal: Single Log Entry Deletion ─────────────────────── */}
      {logToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setLogToDelete(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 border border-red-200 text-red-600 shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">Delete Log Entry?</h3>
                <p className="text-xs text-muted-foreground font-sans">Remove single session audit record</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Are you sure you want to delete the audit record for <strong className="text-foreground font-semibold">{logToDelete.device}</strong>?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = logToDelete.id;
                  setLogToDelete(null);
                  await db.deleteLoginLog(targetId);
                  await fetchLoginLogs();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer font-sans"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


