'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Coffee, History, Users, Clock, TrendingUp, QrCode, LogOut, Percent } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { DateTimeDisplay } from '@/components/DateTimeDisplay';

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

export default function TableBoardPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingTable, setOpeningTable] = useState<string | null>(null);
  const [selectedTableForQr, setSelectedTableForQr] = useState<TableData | null>(null);
  const [prevTotalItems, setPrevTotalItems] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const playOrderSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Chime note 1: D5
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.4);

      // Chime note 2: A5 (slightly delayed)
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.00, ctx.currentTime);
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.6);
      }, 120);
    } catch (e) {
      console.error('Failed to play audio chime:', e);
    }
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
      await db.sync();
      
      const todayDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      const status = await db.getSystemStatus(todayDate);
      setIsLocked(status.isLocked);

      const data = await db.getTables();
      setTables(data as TableData[]);

      // Calculate current total items across all active orders
      const currentTotal = data.reduce((sum, t) => sum + (t.activeOrder?.itemsCount || 0), 0);

      // If we had a previous count and it has increased, play the chime!
      setPrevTotalItems(prev => {
        if (prev !== null && currentTotal > prev) {
          playOrderSound();
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
    // Refresh every 8 seconds to show live status
    const interval = setInterval(fetchTables, 8000);

    // Listen to local storage changes to trigger real-time audio alerts for mock mode
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cafe_blossom_new_order_placed') {
        playOrderSound();
        fetchTables();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // BroadcastChannel: instant cross-tab notification on same device
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('cafe_blossom_orders');
      channel.onmessage = () => {
        playOrderSound();
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

  const handleTableClick = async (table: TableData) => {
    if (openingTable) return;

    if (isLocked) {
      alert("System is Locked. Please Open the Day from Inventory -> Day Close System to take orders.");
      return;
    }

    if (table.activeOrder) {
      // Already has an order — go straight to it
      router.push(`/tables/${table.id}`);
    } else {
      // Free table — create a new order then go
      setOpeningTable(table.id);
      try {
        await db.createOrder(table.id);
        router.push(`/tables/${table.id}`);
      } catch (err) {
        console.error('Error creating order:', err);
        setOpeningTable(null);
      }
    }
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
            <div className="border-l border-primary-foreground/20 pl-2 sm:pl-3 ml-1 sm:ml-2">
              <DateTimeDisplay />
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="bg-primary/5 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-6 font-sans text-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-secondary inline-block"></span>
            <span className="text-muted-foreground">{occupiedCount} Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 inline-block"></span>
            <span className="text-muted-foreground">{freeCount} Free</span>
          </div>
          <button onClick={fetchTables} className="ml-auto text-xs text-primary underline cursor-pointer font-sans">
            Refresh
          </button>
        </div>
      </div>

      {/* Table Grid */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {tables.map((table) => {
              const isOccupied = table.status === 'occupied';
              const isOpening = openingTable === table.id;
              const isBilled = table.activeOrder?.status === 'billed';
              const isDiningTable = table.table_number <= 8;

              return (
                <div
                  key={table.id}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border-2 p-3 sm:p-5 text-center shadow-sm transition-all duration-200
                    ${isOccupied
                      ? isBilled
                        ? 'border-accent bg-accent/10'
                        : 'border-secondary bg-secondary/10'
                      : 'border-border bg-card'
                    }
                    ${openingTable && openingTable !== table.id ? 'opacity-50' : ''}
                  `}
                >
                  {/* QR Code icon — only for dining tables 1-8 */}
                  {isDiningTable && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedTableForQr(table); }}
                      className="absolute top-2 left-2 p-1 rounded-md text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer z-10"
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
                    className="flex flex-col items-center justify-center w-full cursor-pointer active:scale-95 transition-transform disabled:cursor-not-allowed"
                  >
                    {/* Table Number / Avatar */}
                    <div className={`h-11 w-11 sm:h-14 sm:w-14 rounded-full flex items-center justify-center mb-2 sm:mb-3 font-serif font-black text-xl sm:text-2xl
                      ${isOccupied
                        ? isBilled
                          ? 'bg-accent/30 text-accent-foreground'
                          : 'bg-secondary/20 text-secondary'
                        : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {table.table_number === 9 ? 'Z' : table.table_number === 10 ? 'P' : table.table_number}
                    </div>

                    <p className="font-serif font-bold text-base text-foreground leading-tight">
                      {table.table_number === 9 ? 'Zomato' : table.table_number === 10 ? 'Parcel' : `Table ${table.table_number}`}
                    </p>

                    {isOpening ? (
                      <p className="text-xs text-muted-foreground mt-1.5 font-sans animate-pulse">Opening...</p>
                    ) : isOccupied && table.activeOrder ? (
                      <div className="mt-1.5 space-y-0.5">
                        <p className="text-xs font-semibold text-secondary font-sans">
                          {isBilled ? '🧾 Bill Ready' : `${table.activeOrder.itemsCount} item${table.activeOrder.itemsCount !== 1 ? 's' : ''}`}
                        </p>
                        <p className="text-sm font-black text-primary font-mono">₹{table.activeOrder.totalAmount}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1.5 font-sans">Tap to open</p>
                    )}
                  </button>

                  {/* Status dot */}
                  <div className={`absolute top-3 right-3 h-2 w-2 rounded-full
                    ${isOccupied ? (isBilled ? 'bg-accent' : 'bg-secondary animate-pulse') : 'bg-green-500'}`}
                  />
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8 font-sans">
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

    </div>
  );
}


