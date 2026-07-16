'use client';

import React, { useEffect, useState, use, useRef, useCallback } from 'react';
import { db } from '@/lib/db';
import { MenuItem, OrderItem } from '@/types';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus, Trash2, Receipt, MessageCircle, RefreshCw, Percent, Printer, Truck, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Modal } from '@/components/Modal';
import { DateTimeDisplay } from '@/components/DateTimeDisplay';

type OrderItemWithMenu = OrderItem & { menu_items?: MenuItem };

type ActiveOrder = {
  id: string;
  table_id: string;
  status: 'open' | 'billed' | 'closed';
  customer_phone: string | null;
  created_at: string;
  items: OrderItemWithMenu[];
};

// Map category names to local food images
const getCategoryImage = (categoryName: string | undefined): string => {
  if (!categoryName) return '';
  const n = categoryName.toLowerCase();
  if (n.includes('fries')) return '/food_fries.jpg';
  if (n.includes('burger')) return '/food_burger.jpg';
  if (n.includes('sandwich')) return '/food_sandwich.jpg';
  if (n.includes('pasta')) return '/food_pasta.jpg';
  if (n.includes('cold coffee')) return '/food_cold_coffee.jpg';
  if (n.includes('hot coffee')) return '/food_hot_coffee.jpg';
  // Milkshake & Mocktail — curated Unsplash photos
  if (n.includes('shake') || n.includes('milk')) return 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=120&q=80';
  if (n.includes('mocktail') || n.includes('cocktail')) return 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=120&q=80';
  return '';
};

// Map individual item names to specific images
const getItemImage = (itemName: string | undefined, categoryName: string | undefined): string => {
  if (!itemName) return getCategoryImage(categoryName);
  const name = itemName.toLowerCase();
  
  // Fries mapping
  if (name.includes('plain salted fries') || name.includes('salted fries')) return '/food_salted_fries.jpg';
  if (name.includes('peri peri masala fries') || name.includes('peri peri fries')) return '/food_periperi_fries.jpg';
  if (name.includes('cheese fries')) return '/food_cheese_fries.jpg';
  
  // Burgers mapping
  if (name.includes('tandoori') && name.includes('burger')) return '/food_tandoori_burger.jpg';
  if (name.includes('paneer') && name.includes('burger')) return '/food_paneer_burger.jpg';
  if (name.includes('corn') && name.includes('burger')) return '/food_corn_burger.jpg';
  if (name.includes('chicken') && name.includes('burger')) return '/food_chicken_burger.jpg';
  if (name.includes('veg') && name.includes('burger')) return '/food_veg_burger.jpg';
  
  // Grilled Sandwiches mapping
  if (name.includes('tandoori chicken') && name.includes('sandwich')) return '/food_tandoori_chicken_sandwich.jpg';
  if (name.includes('paneer') && name.includes('sandwich')) return '/food_paneer_sandwich.jpg';
  if (name.includes('bombay') && name.includes('sandwich')) return '/food_bombay_sandwich.jpg';
  if (name.includes('corn') && name.includes('sandwich')) return '/food_corn_sandwich.jpg';
  if (name.includes('veg cheese') && name.includes('sandwich')) return '/food_veg_cheese_sandwich.jpg';
  if (name.includes('veg') && name.includes('sandwich')) return '/food_veg_sandwich.jpg';
  
  // Pasta mapping
  if (name.includes('white sauce') && name.includes('pasta')) return '/food_white_sauce_pasta.jpg';
  if (name.includes('red sauce') && name.includes('pasta')) return '/food_red_sauce_pasta.jpg';
  if (name.includes('mix sauce') && name.includes('pasta')) return '/food_mix_sauce_pasta.jpg';
  
  // Cold Coffee mapping
  if (name.includes('oreo') && name.includes('coffee')) return '/food_oreo_cold_coffee.jpg';
  if (name.includes('kitkat') && name.includes('coffee')) return '/food_kitkat_cold_coffee.jpg';
  if (name.includes('brownie') && name.includes('coffee')) return '/food_brownie_cold_coffee.jpg';
  if (name.includes('cad b')) return '/food_cad_b.jpg';
  if (name.includes('cold coffee') || name.includes('thick cold coffee')) return '/food_classic_cold_coffee.jpg';
  
  return getCategoryImage(categoryName);
};

export default function OrderEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tableId } = use(params);
  const router = useRouter();

  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; sort_order: number }[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [runningOffer, setRunningOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | 'split'>('cash');
  const [cashAmountPaid, setCashAmountPaid] = useState<number>(0);
  const [onlineAmountPaid, setOnlineAmountPaid] = useState<number>(0);
  const [isParcel, setIsParcel] = useState(false);
  const [extraCharges, setExtraCharges] = useState<{amount: number, label: string}[]>([{amount: 0, label: ''}]);
  const [deliveryInfo, setDeliveryInfo] = useState<{ address: string; phone: string; placedAt: string } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, type: 'alert' | 'confirm', onConfirm?: () => void}>({isOpen: false, title: '', message: '', type: 'alert'});
  const showAlert = (title: string, message: string) => setModalConfig({isOpen: true, title, message, type: 'alert'});
  const closeModal = () => setModalConfig(prev => ({...prev, isOpen: false}));

  const PARCEL_CHARGE = 10;

  // Mouse drag-to-scroll for category tabs
  const tabsRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragMoved = useRef(false);

  const handleTabsMouseDown = (e: React.MouseEvent) => {
    if (!tabsRef.current) return;
    isDown.current = true;
    dragMoved.current = false;
    startX.current = e.pageX - tabsRef.current.offsetLeft;
    scrollLeft.current = tabsRef.current.scrollLeft;
  };

  const handleTabsMouseLeave = () => {
    isDown.current = false;
  };

  const handleTabsMouseUp = () => {
    isDown.current = false;
  };

  const handleTabsMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !tabsRef.current) return;
    const x = e.pageX - tabsRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Scroll speed multiplier
    if (Math.abs(walk) > 5) {
      dragMoved.current = true;
      e.preventDefault();
      tabsRef.current.scrollLeft = scrollLeft.current - walk;
    }
  };

  const handleCategoryClick = (catId: string, e: React.MouseEvent) => {
    if (dragMoved.current) {
      e.preventDefault();
      return;
    }
    setActiveCategory(catId);
  };

  const getTableLabel = (num: number | null) => {
    if (num === 9) return 'Zomato';
    if (num === 10) return 'Parcel';
    return num ? `Table ${num}` : '';
  };


  // ── load everything ─────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    try {
      await db.sync();
      const todayDate = new Date().toLocaleDateString('en-CA');
      const [tableData, cats, items, activeOrder, offer, status] = await Promise.all([
        db.getTable(tableId),
        db.getCategories(),
        db.getMenuItems(),
        db.getActiveOrder(tableId),
        db.getOffer(),
        db.getSystemStatus(todayDate),
      ]);
      
      setIsLocked(status.isLocked);

      setTableNumber(tableData?.table_number ?? null);

      // Build categories + items matching the customer menu exactly
      let finalCats = [...cats];
      let finalItems = [...items];

      if (offer && offer.is_active) {
        const offersCat = { id: 'cat-offers', name: 'Offers 🔥', sort_order: 0 };
        finalCats = [offersCat, ...finalCats];
        finalItems = [{
          id: 'running-offer',
          category_id: 'cat-offers',
          name: offer.title,
          description: offer.description,
          price: offer.price,
          is_veg: true,
          is_available: true,
          sort_order: -100
        } as MenuItem, ...finalItems];
        setRunningOffer(offer);
      } else {
        setRunningOffer(null);
      }

      setCategories(finalCats);
      if (finalCats.length > 0 && !activeCategory) setActiveCategory(finalCats[0].id);
      setMenuItems(finalItems);
      setOrder(activeOrder as ActiveOrder | null);

      if (!silent && tableData?.table_number === 10) {
        setIsParcel(true);
      }

      if (activeOrder?.customer_phone) setPhone(activeOrder.customer_phone);
      if (activeOrder?.items) {
        const n: Record<string, string> = {};
        activeOrder.items.forEach((i: OrderItemWithMenu) => { n[i.id] = i.notes ?? ''; });
        setNotes(n);
      }

      // Load delivery info from localStorage if this is a delivery order
      if (activeOrder) {
        const deliveryRaw = localStorage.getItem(`cafe_blossom_delivery_${activeOrder.id}`);
        if (deliveryRaw) {
          setDeliveryInfo(JSON.parse(deliveryRaw));
        } else {
          setDeliveryInfo(null);
        }
      }

      // Restore discount, parcel, and extra charges if the order has already been billed
      if (activeOrder && activeOrder.status === 'billed') {
        const bill = await db.getBillByOrderId(activeOrder.id);
        if (bill) {
          setDiscount(bill.discount || 0);
          setDiscountType('flat');
          if (bill.extra_charge) {
            setExtraCharges([{ amount: bill.extra_charge, label: bill.extra_charge_label || '' }]);
          } else {
            setExtraCharges([{ amount: 0, label: '' }]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    load();

    // Auto-refresh every 8 seconds so staff sees customer-placed items instantly
    const pollInterval = setInterval(() => {
      // Only silently refresh when not in the middle of a billing operation
      load(true);
    }, 8000);

    // Also listen for BroadcastChannel messages (same-origin cross-tab)
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('cafe_blossom_orders');
      channel.onmessage = () => { load(true); };
    } catch {
      // BroadcastChannel not supported — silent fallback to polling
    }

    return () => {
      clearInterval(pollInterval);
      channel?.close();
    };
  }, [tableId, load]);

  // ── helpers ──────────────────────────────────────────────────────
  const orderTotal = (order?.items ?? []).reduce((s, i) => s + i.quantity * i.price_at_order, 0);
  const discountAmount = discountType === 'percent'
    ? Math.round(orderTotal * discount / 100)
    : discount;
  const parcelCharge = isParcel ? PARCEL_CHARGE : 0;
  const extraChargeAmount = extraCharges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const combinedExtraChargeLabel = extraCharges.filter(c => Number(c.amount) > 0).map(c => c.label.trim() || 'Extra Charge').join(', ');
  const finalTotal = Math.max(0, orderTotal - discountAmount + parcelCharge + extraChargeAmount);

  // Sync payment amounts with final total whenever it changes
  useEffect(() => {
    if (paymentMethod === 'cash') {
      setCashAmountPaid(finalTotal);
      setOnlineAmountPaid(0);
    } else if (paymentMethod === 'online') {
      setCashAmountPaid(0);
      setOnlineAmountPaid(finalTotal);
    } else if (paymentMethod === 'split') {
      setCashAmountPaid(Math.round(finalTotal / 2));
      setOnlineAmountPaid(finalTotal - Math.round(finalTotal / 2));
    }
  }, [finalTotal, paymentMethod]);

  const qtyFor = (menuItemId: string) =>
    order?.items.find(oi => oi.menu_item_id === menuItemId)?.quantity ?? 0;

  const orderItemFor = (menuItemId: string) =>
    order?.items.find(oi => oi.menu_item_id === menuItemId);

  const catItems = menuItems.filter(m => m.category_id === activeCategory && (m.is_available !== false));

  // ── actions ──────────────────────────────────────────────────────
  const addItem = async (item: MenuItem) => {
    if (!order || busy) return;
    setBusy(true);
    try {
      await db.addOrderItem(order.id, item.id, 1, null, item.price);
      const updated = await db.getActiveOrder(tableId);
      setOrder(updated as ActiveOrder);
    } finally { setBusy(false); }
  };

  const changeQty = async (oi: OrderItemWithMenu, newQty: number) => {
    if (busy) return;
    setBusy(true);
    try {
      await db.updateOrderItem(oi.id, newQty, oi.notes);
      const updated = await db.getActiveOrder(tableId);
      setOrder(updated as ActiveOrder);
    } finally { setBusy(false); }
  };

  const saveNote = async (oi: OrderItemWithMenu, text: string) => {
    setNotes(p => ({ ...p, [oi.id]: text }));
    try {
      await db.updateOrderItem(oi.id, oi.quantity, text || null);
      const updated = await db.getActiveOrder(tableId);
      setOrder(updated as ActiveOrder);
    } catch (err) { console.error(err); }
  };

  const generateBill = async () => {
    if (!order || busy) return;
    setBusy(true);
    try {
      await db.generateBill(
        order.id,
        phone || null,
        name || null,
        discountAmount,
        parcelCharge,
        extraChargeAmount,
        combinedExtraChargeLabel || null
      );
      const updated = await db.getActiveOrder(tableId);
      setOrder(updated as ActiveOrder);
    } finally { setBusy(false); }
  };

  const unlockOrder = async () => {
    if (!order) return;
    setBusy(true);
    try {
      await db.unlockOrder(order.id);
      const updated = await db.getActiveOrder(tableId);
      setOrder(updated as ActiveOrder);
    } finally { setBusy(false); }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setBusy(true);
    try {
      await db.cancelOrder(order.id);
      router.push('/admin');
    } catch (err) {
      console.error(err);
      showAlert('Error', 'Failed to cancel order');
      setBusy(false);
      setShowCancelConfirm(false);
    }
  };

  const buildBillText = () => {
    if (!order || !tableNumber) return '';
    const now = new Date();
    const date = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const W = 34;
    const line = '\u2501'.repeat(W);
    const dashes = '\u2504'.repeat(W);

    let text = '';
    text += `${line}\n`;
    text += `    🌸  *CAFE BLOSSOM*\n`;
    text += `         Ishwarpur\n`;
    text += `${line}\n`;
    text += `📅 ${date}  ⏰ ${time}\n`;
    const displayTable = tableNumber === 9 ? 'Zomato' : tableNumber === 10 ? 'Parcel' : `${tableNumber}`;
    text += `🌿 Table: ${displayTable}${isParcel && tableNumber !== 10 ? '  📦 PARCEL' : ''}\n`;
    text += `${dashes}\n`;
    text += `*ITEM${' '.repeat(W - 14)}QTY    AMT*\n`;
    text += `${dashes}\n`;

    order.items.forEach(item => {
      const name = item.menu_items?.name ?? 'Item';
      const qty = `${item.quantity}`;
      const amt = `₹${item.quantity * item.price_at_order}`;
      const nameW = W - qty.length - amt.length - 4;
      const truncName = name.length > nameW ? name.slice(0, nameW - 1) + '…' : name;
      const pad = Math.max(1, W - truncName.length - qty.length - amt.length - 2);
      text += `${truncName}${' '.repeat(Math.max(1, pad - qty.length))}${qty}  ${amt}\n`;
    });

    text += `${dashes}\n`;
    text += `Subtotal${' '.repeat(W - 8 - `₹${orderTotal}`.length)}₹${orderTotal}\n`;

    if (discountAmount > 0) {
      const discLabel = discountType === 'percent' ? `Discount (${discount}%)` : 'Discount';
      text += `${discLabel}${' '.repeat(W - discLabel.length - `-₹${discountAmount}`.length)}-₹${discountAmount}\n`;
    }

    if (parcelCharge > 0) {
      text += `Parcel Charge${' '.repeat(W - 13 - `₹${parcelCharge}`.length)}₹${parcelCharge}\n`;
    }

    if (extraChargeAmount > 0) {
      const extraLabel = combinedExtraChargeLabel || 'Extra Charge';
      text += `${extraLabel}${' '.repeat(W - extraLabel.length - `₹${extraChargeAmount}`.length)}₹${extraChargeAmount}\n`;
    }
    text += `${line}\n`;
    text += `*TOTAL${' '.repeat(W - 6 - `₹${finalTotal}`.length)}₹${finalTotal}*\n`;
    text += `${line}\n`;
    
    let payText = '';
    if (paymentMethod === 'cash') {
      payText = 'Paid via: CASH';
    } else if (paymentMethod === 'online') {
      payText = 'Paid via: ONLINE';
    } else {
      payText = `SPLIT: Cash ₹${cashAmountPaid} / Online ₹${onlineAmountPaid}`;
    }
    text += `${payText}\n`;
    text += `${line}\n\n`;
    text += `✨ Thank you for dining with us!\n`;
    text += `🌿 We hope to see you again soon.\n\n`;
    text += `_Cafe Blossom — Where Every Sip Blooms_ 🌸`;
    return text;
  };

  const sendWhatsApp = async () => {
    if (!order) return;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { showAlert('Invalid Phone', 'Enter a valid 10-digit phone number'); return; }
    const full = digits.length === 10 ? '91' + digits : digits;
    const url = `https://wa.me/${full}?text=${encodeURIComponent(buildBillText())}`;
    window.open(url, '_blank');
    setBusy(true);
    try {
      await db.closeTable(order.id, paymentMethod, cashAmountPaid, onlineAmountPaid, true, phone || null, name || null);
      router.push('/admin');
    } finally { setBusy(false); }
  };

  const closeTableWithoutWhatsApp = () => {
    if (!order || busy) return;
    setShowCloseConfirm(true);
  };

  const handleCloseTable = async () => {
    if (!order || busy) return;
    setBusy(true);
    try {
      await db.closeTable(order.id, paymentMethod, cashAmountPaid, onlineAmountPaid, false, phone || null, name || null);
      router.push('/admin');
    } catch (err) {
      console.error(err);
      showAlert('Error', 'Failed to close table');
      setBusy(false);
      setShowCloseConfirm(false);
    }
  };

  const printBill = () => {
    if (!order || !tableNumber) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const cleanText = buildBillText()
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/_(.*?)_/g, '$1');
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - Table ${tableNumber}</title>
            <style>
              body {
                font-family: monospace;
                padding: 10px;
                white-space: pre-wrap;
                font-size: 14px;
                line-height: 1.4;
                width: 280px;
                margin: 0 auto;
                color: #000;
              }
              @media print {
                body {
                  width: 100%;
                  padding: 0;
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>\${cleanText}</body>
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

  // ── render ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isBilled = order?.status === 'billed';
  const orderItems = order?.items ?? [];

  return (
    <div className={`bg-background flex flex-col min-h-screen ${isBilled ? '' : 'lg:h-screen lg:overflow-hidden'}`}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="p-1 hover:bg-primary-foreground/10 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-serif text-xl font-bold">{getTableLabel(tableNumber)}</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-70 font-sans">
              {isBilled ? 'Bill Generated — Ready to Send' : order ? 'Open Order' : 'No Order'}
            </p>
          </div>
          {/* Delivery badge in header */}
          {deliveryInfo && (
            <div className="flex items-center gap-1 bg-blue-500 text-white px-2.5 py-1 rounded-lg">
              <Truck className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wide">Delivery</span>
            </div>
          )}
          {isLocked && (
            <div className="flex items-center gap-1 bg-red-600 text-white px-2.5 py-1 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wide">Locked</span>
            </div>
          )}
          {/* Cart total in header */}
          <div className="flex items-center gap-4">
            {order && !isBilled && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={busy}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer shadow-sm hidden sm:block"
              >
                Cancel Order
              </button>
            )}
            {order && !isBilled && (
              <div className="text-right">
                <p className="text-xs opacity-70 font-sans">{orderItems.length} item{orderItems.length !== 1 ? 's' : ''}</p>
                <p className="font-mono font-bold text-base">₹{finalTotal}</p>
              </div>
            )}
            {order && !isBilled && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={busy}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer shadow-sm sm:hidden"
                title="Cancel Order"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <div className="border-l border-primary-foreground/20 pl-3 ml-2">
              <DateTimeDisplay />
            </div>
          </div>
        </div>
      </header>

      {/* ── BILLED STATE ────────────────────────────────────────── */}
      {isBilled ? (
        <div className="flex-1 mx-auto max-w-5xl w-full px-4 py-6 grid lg:grid-cols-2 gap-6">
          {/* Receipt Preview */}
          <div className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground">Receipt Preview</h2>
            <div
              className="bg-white border-2 border-dashed border-border rounded-xl p-5 font-mono text-sm leading-relaxed text-slate-800 whitespace-pre overflow-x-auto cursor-pointer select-all"
              title="Click to select all text"
            >
              {buildBillText()}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={unlockOrder}
                disabled={busy}
                className="flex items-center gap-1.5 text-sm text-secondary font-medium font-sans cursor-pointer hover:opacity-80"
              >
                <RefreshCw className="h-4 w-4" />
                Unlock & Edit Order
              </button>
              <button
                onClick={printBill}
                disabled={busy}
                className="flex items-center gap-1.5 text-sm text-primary font-medium font-sans cursor-pointer hover:opacity-80"
              >
                <Printer className="h-4 w-4" />
                Print Bill (Thermal)
              </button>
            </div>
          </div>

          {/* WhatsApp Send */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-5 shadow-sm">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">Send & Close Table</h2>
              <p className="text-sm text-muted-foreground font-sans mt-1">
                Enter the guest's WhatsApp number. This opens WhatsApp with the bill pre-filled.
              </p>
            </div>

            {/* Bill Summary */}
            <div className="bg-muted/40 rounded-lg p-4 font-sans space-y-2 text-sm border border-border/50">
              {orderItems.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-foreground">{item.menu_items?.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}</span>
                  <span className="font-mono text-primary font-bold">₹{item.quantity * item.price_at_order}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 mt-2 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">₹{orderTotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>Discount{discountType === 'percent' ? ` (${discount}%)` : ''}</span>
                  <span className="font-mono">-₹{discountAmount}</span>
                </div>
              )}
              {parcelCharge > 0 && (
                <div className="flex justify-between text-sm text-orange-700">
                  <span>📦 Parcel Charge</span>
                  <span className="font-mono">+₹{parcelCharge}</span>
                </div>
              )}
              {extraChargeAmount > 0 && (
                <div className="flex justify-between text-sm text-slate-700">
                  <span>✨ {combinedExtraChargeLabel || 'Extra Charge'}</span>
                  <span className="font-mono">+₹{extraChargeAmount}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 mt-1 font-bold text-base">
                <span>Total</span>
                <span className="font-mono text-primary">₹{finalTotal}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-1 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMethod === 'cash'
                      ? 'bg-green-50 border-green-400 text-green-900 ring-1 ring-green-400'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span className="text-base">💵</span>
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`py-2 px-1 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMethod === 'online'
                      ? 'bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-400'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span className="text-base">🌐</span>
                  <span>Online</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('split')}
                  className={`py-2 px-1 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMethod === 'split'
                      ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span className="text-base">🥞</span>
                  <span>Split</span>
                </button>
              </div>

              {/* Split Amount Inputs */}
              {paymentMethod === 'split' && (
                <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-muted/30 border border-border/50 rounded-lg">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 font-sans">
                      Cash Portion (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={finalTotal}
                      value={cashAmountPaid}
                      onChange={e => {
                        const val = Math.min(finalTotal, Math.max(0, Number(e.target.value)));
                        setCashAmountPaid(val);
                        setOnlineAmountPaid(finalTotal - val);
                      }}
                      className="w-full px-2.5 py-1.5 text-sm font-mono bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 font-sans">
                      Online Portion (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={finalTotal}
                      value={onlineAmountPaid}
                      onChange={e => {
                        const val = Math.min(finalTotal, Math.max(0, Number(e.target.value)));
                        setOnlineAmountPaid(val);
                        setCashAmountPaid(finalTotal - val);
                      }}
                      className="w-full px-2.5 py-1.5 text-sm font-mono bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Guest Info Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 font-sans">
                  Guest Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 text-sm font-sans bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 font-sans">
                  Guest WhatsApp Number <span className="text-muted-foreground opacity-70 normal-case">(Required for WhatsApp)</span>
                </label>
                <div className="flex rounded-lg border border-border overflow-hidden focus-within:ring-1 focus-within:ring-primary">
                  <span className="bg-muted px-3 py-2 text-sm text-muted-foreground font-sans border-r border-border flex items-center">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    maxLength={10}
                    className="flex-1 px-3 py-2 text-sm font-sans bg-background text-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={sendWhatsApp}
                disabled={busy || !phone || phone.length < 10}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-3.5 text-sm font-bold font-sans uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
              >
                <MessageCircle className="h-5 w-5" />
                Send via WhatsApp & Close Table
              </button>

              <button
                onClick={closeTableWithoutWhatsApp}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary hover:opacity-90 disabled:opacity-50 text-white px-4 py-3.5 text-sm font-bold font-sans uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
              >
                Close Table (Save Payment)
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── OPEN ORDER STATE ──────────────────────────────────────── */
        <div className="flex-1 flex flex-col lg:flex-row mx-auto max-w-5xl w-full lg:min-h-0">

          {/* LEFT — Menu Panel */}
          <div className="flex-1 flex flex-col min-w-0 lg:min-h-0">
            {/* Category tabs */}
            <div className="sticky top-[60px] z-30 bg-background border-b border-border select-none">
              <div
                ref={tabsRef}
                onMouseDown={handleTabsMouseDown}
                onMouseLeave={handleTabsMouseLeave}
                onMouseUp={handleTabsMouseUp}
                onMouseMove={handleTabsMouseMove}
                className="flex overflow-x-auto gap-1.5 px-4 py-2.5 scrollbar-none cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
              >
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={(e) => handleCategoryClick(cat.id, e)}
                    style={{ flexShrink: 0 }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap font-sans transition-all cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {catItems.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12 font-sans">No items in this category.</p>
              ) : (
                catItems.map(item => {
                  const qty = qtyFor(item.id);
                  const oi = orderItemFor(item.id);

                  const categoryName = categories.find(c => c.id === item.category_id)?.name;
                  const imgSrc = getItemImage(item.name, categoryName);

                  return (
                    <div key={item.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2.5 shadow-sm">
                      {/* Food image thumbnail */}
                      {imgSrc && (
                        <div className="shrink-0 h-14 w-14 rounded-lg overflow-hidden bg-muted border border-border/50">
                          {imgSrc.startsWith('http') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imgSrc} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <Image src={imgSrc} alt={item.name} width={56} height={56} className="h-full w-full object-cover" />
                          )}
                        </div>
                      )}

                      {/* Veg indicator + Item info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className={`shrink-0 h-3.5 w-3.5 border-2 rounded-sm flex items-center justify-center ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`} />
                          </div>
                          <p className="font-serif font-bold text-foreground text-sm leading-tight truncate">{item.name}</p>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground font-sans truncate">{item.description}</p>
                        )}
                      </div>

                      {/* Price */}
                      <span className="font-mono font-bold text-primary text-sm shrink-0">₹{item.price}</span>

                      {/* Add / Qty controls */}
                      {qty === 0 ? (
                        <button
                          onClick={() => addItem(item)}
                          disabled={busy || isLocked}
                          className="shrink-0 flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold font-sans hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" /> ADD
                        </button>
                      ) : oi ? (
                        <div className="shrink-0 flex items-center gap-1.5">
                          <button
                            onClick={() => changeQty(oi, qty - 1)}
                            disabled={busy || isLocked}
                            className="h-7 w-7 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-5 text-center font-mono font-bold text-sm">{qty}</span>
                          <button
                            onClick={() => changeQty(oi, qty + 1)}
                            disabled={busy || isLocked}
                            className="h-7 w-7 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT — Order Summary Panel */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-card flex flex-col lg:min-h-0">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-serif text-lg font-bold text-foreground">Order Summary</h2>
            </div>

            {/* Home Delivery Banner — shown if this is a delivery order */}
            {deliveryInfo && (
              <div className="mx-3 mt-3 flex flex-col gap-1.5 bg-blue-50 border-2 border-blue-300 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600 shrink-0" />
                  <p className="text-xs font-bold text-blue-900 font-sans uppercase tracking-wide">🚚 Home Delivery Order</p>
                </div>
                <div className="flex items-start gap-1.5 text-xs text-blue-800 font-sans">
                  <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>{deliveryInfo.address}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-800 font-sans">
                  <Phone className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>{deliveryInfo.phone}</span>
                </div>
              </div>
            )}

            {orderItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground font-sans">Nothing added yet.<br/>Tap ADD on any item.</p>
              </div>
            ) : (
              <>
                {/* Items scroll */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-[50vh] lg:max-h-none">
                  {orderItems.map(oi => (
                    <div key={oi.id} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground font-sans truncate">
                            {oi.menu_items?.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            ₹{oi.price_at_order} × {oi.quantity} = ₹{oi.quantity * oi.price_at_order}
                          </p>
                        </div>
                        <button
                          onClick={() => changeQty(oi, 0)}
                          disabled={isLocked}
                          className="text-muted-foreground/50 hover:text-secondary transition-colors cursor-pointer p-1 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {/* Note input */}
                      <input
                        type="text"
                        value={notes[oi.id] ?? ''}
                        disabled={isLocked}
                        onChange={e => setNotes(p => ({ ...p, [oi.id]: e.target.value }))}
                        onBlur={e => saveNote(oi, e.target.value)}
                        placeholder="Instruction (e.g. less spicy)"
                        className="w-full text-xs font-sans bg-background border border-border/60 rounded-lg px-2.5 py-1.5 text-muted-foreground placeholder-muted-foreground/40 focus:border-primary focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Total, Discount & Generate Bill */}
                <div className="px-4 py-4 border-t border-border space-y-3">
                  <div className="flex justify-between items-center font-sans">
                    <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
                    <span className="text-lg font-bold text-foreground font-mono">₹{orderTotal}</span>
                  </div>

                  {/* Discount controls */}
                  <div className="bg-muted/40 rounded-lg p-3 space-y-2 border border-border/50">
                    <div className="flex items-center gap-2">
                      <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">Discount</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex rounded-lg border border-border overflow-hidden flex-1">
                        <input
                          type="number"
                          min={0}
                          value={discount || ''}
                          disabled={isLocked}
                          onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                          placeholder="0"
                          className="w-full px-3 py-1.5 text-sm font-mono bg-background text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="flex rounded-lg border border-border overflow-hidden">
                        <button
                          onClick={() => setDiscountType('flat')}
                          disabled={isLocked}
                          className={`px-3 py-1.5 text-xs font-bold font-sans transition-colors cursor-pointer ${
                            discountType === 'flat'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          ₹
                        </button>
                        <button
                          onClick={() => setDiscountType('percent')}
                          disabled={isLocked}
                          className={`px-3 py-1.5 text-xs font-bold font-sans transition-colors cursor-pointer ${
                            discountType === 'percent'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          %
                        </button>
                      </div>
                    </div>
                    {discountAmount > 0 && (
                      <p className="text-xs text-green-700 font-sans font-medium">
                        Saving ₹{discountAmount} for the customer
                      </p>
                    )}
                  </div>

                  {/* Extra Charge controls */}
                  <div className="bg-muted/40 rounded-lg p-3 space-y-2 border border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">Extra Charge</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExtraCharges([...extraCharges, {amount: 0, label: ''}])}
                        disabled={isLocked}
                        className="text-xs font-bold text-primary hover:underline font-sans cursor-pointer disabled:opacity-50"
                      >
                        + Add More
                      </button>
                    </div>
                    {extraCharges.map((charge, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <div className="flex rounded-lg border border-border overflow-hidden w-24 shrink-0">
                          <input
                            type="number"
                            min={0}
                            value={charge.amount || ''}
                            disabled={isLocked}
                            onChange={e => {
                              const newCharges = [...extraCharges];
                              newCharges[idx].amount = Math.max(0, Number(e.target.value));
                              setExtraCharges(newCharges);
                            }}
                            placeholder="Amt (₹)"
                            className="w-full px-2 py-1.5 text-sm font-mono bg-background text-foreground focus:outline-none"
                          />
                        </div>
                        <div className="flex rounded-lg border border-border overflow-hidden flex-1">
                          <input
                            type="text"
                            value={charge.label}
                            disabled={isLocked}
                            onChange={e => {
                              const newCharges = [...extraCharges];
                              newCharges[idx].label = e.target.value;
                              setExtraCharges(newCharges);
                            }}
                            placeholder="Label (e.g. Service)"
                            className="w-full px-3 py-1.5 text-sm font-sans bg-background text-foreground focus:outline-none"
                          />
                        </div>
                        {extraCharges.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newCharges = [...extraCharges];
                              newCharges.splice(idx, 1);
                              setExtraCharges(newCharges);
                            }}
                            disabled={isLocked}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Parcel toggle */}
                  <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📦</span>
                      <div>
                        <p className="text-xs font-semibold text-orange-900 font-sans">Parcel Order</p>
                        <p className="text-[10px] text-orange-700 font-sans">Adds ₹10 packaging charge</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsParcel(p => !p)}
                      disabled={isLocked}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                        isParcel ? 'bg-orange-500' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          isParcel ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {parcelCharge > 0 && (
                    <div className="flex justify-between items-center font-sans">
                      <span className="text-xs text-orange-700 font-medium">📦 Parcel Charge</span>
                      <span className="text-sm font-mono font-bold text-orange-700">+₹{parcelCharge}</span>
                    </div>
                  )}

                  {extraChargeAmount > 0 && (
                    <div className="flex justify-between items-center font-sans">
                      <span className="text-xs text-slate-700 font-medium">✨ {combinedExtraChargeLabel || 'Extra Charge'}</span>
                      <span className="text-sm font-mono font-bold text-slate-700">+₹{extraChargeAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center font-sans">
                    <span className="text-sm font-bold text-foreground">Final Total</span>
                    <span className="text-2xl font-black text-primary font-mono">₹{finalTotal}</span>
                  </div>
                  <button
                    onClick={generateBill}
                    disabled={busy || orderItems.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-3.5 text-sm font-bold font-sans uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
                  >
                    <Receipt className="h-5 w-5" />
                    Generate Bill
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Cancel Order Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-sm p-6 border border-border animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-serif font-bold text-foreground mb-2">Cancel Order?</h3>
            <p className="text-sm text-muted-foreground mb-6 font-sans">
              Are you sure you want to cancel this order? All items will be removed and the table will be marked as unoccupied. This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={busy}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-bold font-sans text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={busy}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold font-sans hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Table Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-sm p-6 border border-border animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-serif font-bold text-foreground mb-2">Close Table?</h3>
            <p className="text-sm text-muted-foreground mb-6 font-sans">
              Are you sure you want to close this table and save the payment details? This will finalize the bill and free the table.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowCloseConfirm(false)}
                disabled={busy}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-bold font-sans text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={handleCloseTable}
                disabled={busy}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold font-sans hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                Confirm Close
              </button>
            </div>
          </div>
        </div>
      )}

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
