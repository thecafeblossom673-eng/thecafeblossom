'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { MenuItem } from '@/lib/supabase';
import { Coffee, ArrowLeft, Plus, Minus, ShoppingBag, X, CheckCircle, AlertTriangle, Truck, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Map category names to local food default images
const getCategoryImage = (categoryName: string | undefined): string => {
  if (!categoryName) return '';
  const n = categoryName.toLowerCase();
  if (n.includes('offer')) return '/offer_combo.jpg';
  if (n.includes('fries')) return '/food_fries.jpg';
  if (n.includes('burger')) return '/food_burger.jpg';
  if (n.includes('sandwich')) return '/food_sandwich.jpg';
  if (n.includes('pasta')) return '/food_pasta.jpg';
  if (n.includes('cold coffee')) return '/food_cold_coffee.jpg';
  if (n.includes('hot coffee')) return '/food_hot_coffee.jpg';
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

function OrderMenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [tableLockedByQR, setTableLockedByQR] = useState(false);
  const [runningOffer, setRunningOffer] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Cart state: Record of itemId -> { quantity, notes }
  const [cart, setCart] = useState<Record<string, { quantity: number; notes: string }>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [lastPlacedSummary, setLastPlacedSummary] = useState<{ items: any[]; total: number; isDelivery?: boolean; deliveryAddress?: string } | null>(null);

  // Home delivery state
  const [isHomeDelivery, setIsHomeDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');

  // Table selection modal
  const [showTableModal, setShowTableModal] = useState(false);

  // Category drag scroll refs
  const tabsRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragMoved = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        await db.sync();
        const [allTables, cats, items, offer] = await Promise.all([
          db.getTables(),
          db.getCategories(),
          db.getMenuItems(),
          db.getOffer(),
        ]);
        setTables(allTables);
        setRunningOffer(offer);

        let finalCats = [...cats];
        let finalItems = [...items];

        if (offer && offer.is_active) {
          const offersCat = { id: 'cat-offers', name: 'Offers 🔥', sort_order: 0 };
          finalCats.unshift(offersCat);
          finalItems.unshift({
            id: 'running-offer',
            category_id: 'cat-offers',
            name: offer.title,
            description: offer.description,
            price: offer.price,
            is_veg: true,
            is_available: true,
            sort_order: -100
          } as MenuItem);
        }

        setCategories(finalCats);
        setMenuItems(finalItems);

        if (finalCats.length > 0) {
          setActiveCategory(finalCats[0].id);
        }

        // Determine table from URL parameter (QR code scan)
        const tableParam = searchParams.get('table');
        if (tableParam) {
          const tNum = parseInt(tableParam, 10);
          const matchedTable = allTables.find(t => t.table_number === tNum);
          if (matchedTable && tNum <= 8) {
            setTableNumber(tNum);
            setTableId(matchedTable.id);
            setTableLockedByQR(true); // Lock — came from QR scan
          } else {
            setShowTableModal(true);
          }
        } else {
          setShowTableModal(true);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [searchParams]);

  const handleSelectTable = (tableNum: number) => {
    const matchedTable = tables.find(t => t.table_number === tableNum);
    if (matchedTable) {
      setTableNumber(tableNum);
      setTableId(matchedTable.id);
      setShowTableModal(false);
      router.replace(`/order?table=${tableNum}`);
    }
  };

  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: prev[itemId]
        ? { ...prev[itemId], quantity: prev[itemId].quantity + 1 }
        : { quantity: 1, notes: '' }
    }));
  };

  const updateCartQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } else {
      setCart(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], quantity: qty }
      }));
    }
  };

  const updateCartNote = (itemId: string, note: string) => {
    setCart(prev => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: { ...prev[itemId], notes: note }
      };
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((sum, [itemId, cartItem]) => {
      const item = menuItems.find(mi => mi.id === itemId);
      return sum + (item?.price || 0) * cartItem.quantity;
    }, 0);
  };

  const getCartItemsCount = () => {
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  };

  const playLocalSuccessSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      playNote(523.25, 0, 0.3);      // C5
      playNote(659.25, 0.08, 0.35);  // E5
      playNote(783.99, 0.16, 0.45);  // G5
    } catch (e) {
      console.error('Failed to play local success chime:', e);
    }
  };

  const placeOrder = async () => {
    if (!tableId || Object.keys(cart).length === 0 || placingOrder) return;
    // Validate delivery fields if home delivery is selected
    if (isHomeDelivery) {
      if (!deliveryAddress.trim()) {
        alert('Please enter your delivery address.');
        return;
      }
      if (deliveryPhone.replace(/\D/g, '').length < 10) {
        alert('Please enter a valid 10-digit phone number for delivery.');
        return;
      }
    }
    setPlacingOrder(true);
    try {
      // 1. Get or create active order for this table
      let activeOrder = await db.getActiveOrder(tableId);
      if (!activeOrder || activeOrder.status === 'closed') {
        activeOrder = await db.createOrder(tableId);
      }

      // 2. Loop through cart items and add them
      for (const [itemId, cartItem] of Object.entries(cart)) {
        const item = menuItems.find(mi => mi.id === itemId);
        if (item) {
          await db.addOrderItem(
            activeOrder.id,
            itemId,
            cartItem.quantity,
            cartItem.notes || null,
            item.price
          );
        }
      }

      // 3. Play sound locally
      playLocalSuccessSound();

      // 4. Save delivery info to localStorage so admin can read it
      if (isHomeDelivery) {
        const deliveryData = {
          address: deliveryAddress.trim(),
          phone: deliveryPhone.trim(),
          orderId: activeOrder.id,
          tableNumber,
          placedAt: new Date().toISOString(),
        };
        localStorage.setItem(
          `cafe_blossom_delivery_${activeOrder.id}`,
          JSON.stringify(deliveryData)
        );
        // Also set a global flag for the admin poll
        localStorage.setItem('cafe_blossom_new_delivery_order', JSON.stringify(deliveryData));
      }

      // 5. Save summary details
      const summaryItems = Object.entries(cart).map(([itemId, cartItem]) => {
        const item = menuItems.find(mi => mi.id === itemId);
        return {
          name: item?.name || 'Item',
          quantity: cartItem.quantity,
          price: item?.price || 0,
          notes: cartItem.notes
        };
      });
      setLastPlacedSummary({
        items: summaryItems,
        total: getCartTotal(),
        isDelivery: isHomeDelivery,
        deliveryAddress: isHomeDelivery ? deliveryAddress.trim() : undefined,
      });

      // 6. Notify admin portal and staff pages instantly
      localStorage.setItem('cafe_blossom_new_order_placed', Date.now().toString());
      // BroadcastChannel works cross-tab on same origin (same device)
      try {
        const bc = new BroadcastChannel('cafe_blossom_orders');
        bc.postMessage({ type: 'new_order', tableId, timestamp: Date.now() });
        bc.close();
      } catch {
        // BroadcastChannel not supported — localStorage fallback is enough
      }

      // 7. Reset state
      setCart({});
      setCartOpen(false);
      setIsHomeDelivery(false);
      setDeliveryAddress('');
      setDeliveryPhone('');
      setOrderSuccess(true);
    } catch (e) {
      console.error('Order placement failed:', e);
      alert('Failed to place order. Please try again or notify staff.');
    } finally {
      setPlacingOrder(false);
    }
  };

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
    const walk = (x - startX.current) * 1.5;
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (showTableModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 text-center shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-3">
            <Coffee className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-xl font-bold text-foreground mb-1">Select Table</h3>
          <p className="text-xs text-muted-foreground font-sans mb-4">Please select your table number to view menu and order.</p>
          <div className="grid grid-cols-4 gap-2.5">
            {Array.from({ length: 8 }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => handleSelectTable(num)}
                className="h-12 rounded-xl border border-border bg-background hover:bg-primary/5 hover:border-primary text-foreground font-bold font-sans transition-all cursor-pointer flex items-center justify-center"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-8">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 text-center shadow-md flex flex-col items-center">
          <CheckCircle className="h-16 w-16 text-green-600 mb-4 animate-bounce" />
          <h2 className="font-serif text-2xl font-bold text-foreground leading-tight">Order Placed Successfully!</h2>
          <p className="text-xs text-muted-foreground font-sans mt-1.5 max-w-xs">
            We have received your order. Our staff is preparing it fresh! Sit back and relax.
          </p>

          {/* Delivery confirmation banner */}
          {lastPlacedSummary?.isDelivery && (
            <div className="w-full mt-4 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
              <Truck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-900 font-sans">Home Delivery Requested 🚚</p>
                <p className="text-xs text-blue-700 font-sans mt-0.5">{lastPlacedSummary.deliveryAddress}</p>
                <p className="text-[10px] text-blue-500 font-sans mt-1">Our staff will contact you to confirm delivery details.</p>
              </div>
            </div>
          )}

          {lastPlacedSummary && (
            <div className="w-full bg-muted/30 border border-border/50 rounded-xl p-4 mt-4 text-left font-sans text-xs space-y-2">
              <p className="font-bold text-foreground text-xs uppercase tracking-wider mb-2 border-b border-border/60 pb-1.5">Order Summary</p>
              {lastPlacedSummary.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <span className="font-semibold text-foreground">{item.name} × {item.quantity}</span>
                    {item.notes && <p className="text-[10px] text-muted-foreground italic">Note: {item.notes}</p>}
                  </div>
                  <span className="font-mono text-muted-foreground shrink-0">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="flex justify-between items-center border-t border-border/60 pt-2 mt-2 font-bold text-sm">
                <span className="text-foreground">Total</span>
                <span className="font-mono text-primary">₹{lastPlacedSummary.total}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setOrderSuccess(false)}
            className="w-full mt-6 rounded-xl bg-primary text-primary-foreground hover:opacity-95 font-bold font-sans uppercase tracking-wider py-3.5 transition-colors cursor-pointer shadow-sm"
          >
            Add More Items
          </button>
          
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-primary transition-colors underline font-sans mt-4"
          >
            Back to Welcome Page
          </Link>
        </div>
      </div>
    );
  }

  const catItems = menuItems.filter(item => item.category_id === activeCategory && item.is_available);
  const cartItemsCount = getCartItemsCount();
  const cartTotal = getCartTotal();

  return (
    <div 
      className="min-h-screen flex flex-col relative pb-20 bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/menu_bg.png')" }}
    >
      {/* Warm backdrop tint overlay */}
      <div className="absolute inset-0 bg-amber-900/10 backdrop-blur-[0.5px] pointer-events-none z-0" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary/95 backdrop-blur-md text-primary-foreground shadow-md">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="p-1 hover:bg-primary-foreground/10 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 text-center">
            <h1 className="font-serif text-lg font-bold">Cafe Blossom</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-80 font-sans">
              Table {tableNumber} · Digital Menu
            </p>
          </div>
          {/* Show table badge if locked by QR, or Change button if staff/manual */}
          {tableLockedByQR ? (
            <div className="flex items-center gap-1 bg-primary-foreground/10 border border-primary-foreground/20 px-2.5 py-1 rounded-md">
              <span className="text-[9px] font-bold font-sans uppercase tracking-wide opacity-80">🔒 Table {tableNumber}</span>
            </div>
          ) : (
            <button
              onClick={() => setShowTableModal(true)}
              className="bg-primary-foreground/15 hover:bg-primary-foreground/25 px-2.5 py-1 rounded-md text-[10px] font-bold font-sans uppercase tracking-wide transition-colors cursor-pointer"
            >
              Change
            </button>
          )}
        </div>
      </header>

      {/* Main categories navigation row */}
      <div className="sticky top-[52px] z-30 bg-white/80 backdrop-blur-md border-b border-border/40 select-none">
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
                  : 'bg-white/90 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu items listing */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-2xl mx-auto w-full z-10">
        {/* Special Running Offer Hero Banner */}
        {runningOffer && runningOffer.is_active && (
          <div className="relative rounded-2xl overflow-hidden border border-white/80 shadow-lg bg-white/95 mb-5">
            <div className="relative h-44 w-full">
              <Image 
                src={runningOffer.image_url || '/offer_combo.jpg'} 
                alt={runningOffer.title} 
                fill 
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
              {/* Soft overlay gradient to make text readable */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              
              {/* Badges on top */}
              <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md animate-pulse">
                {runningOffer.badge || "COMBO OFFER"}
              </div>
            </div>
            
            {/* Offer details & CTA */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-serif font-black text-lg text-slate-900 leading-tight">
                  {runningOffer.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-sans leading-relaxed">
                  {runningOffer.description}
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-black text-xl text-primary">₹{runningOffer.price}</span>
                  <span className="text-[10px] text-muted-foreground line-through font-mono">₹240</span>
                </div>
                
                {/* Add to Cart button */}
                {(() => {
                  const offerQty = cart['running-offer']?.quantity || 0;
                  return offerQty === 0 ? (
                    <button
                      onClick={() => addToCart('running-offer')}
                      className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4.5 py-2.5 rounded-xl text-xs font-black font-sans uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow"
                    >
                      <Plus className="h-4 w-4" /> Add Combo
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQty('running-offer', offerQty - 1)}
                        className="h-8 w-8 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted active:scale-90 transition-colors cursor-pointer"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center font-mono font-black text-sm text-foreground">{offerQty}</span>
                      <button
                        onClick={() => updateCartQty('running-offer', offerQty + 1)}
                        className="h-8 w-8 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted active:scale-90 transition-colors cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {catItems.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12 font-sans bg-white/80 rounded-xl">No items available in this category.</p>
        ) : (
          catItems.map(item => {
            const cartQty = cart[item.id]?.quantity || 0;
            const categoryName = categories.find(c => c.id === item.category_id)?.name;
            const imgSrc = getItemImage(item.name, categoryName);

            return (
              <div key={item.id} className="flex items-center gap-3.5 bg-white/94 backdrop-blur-md border border-white/90 rounded-xl p-3 shadow-md hover:border-primary/30 transition-all">
                {/* Food thumbnail */}
                {imgSrc && (
                  <div className="shrink-0 h-16 w-16 rounded-xl overflow-hidden bg-muted border border-border/50 relative">
                    <Image src={imgSrc} alt={item.name} fill className="object-cover" sizes="64px" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className={`shrink-0 h-3.5 w-3.5 border-2 rounded-sm flex items-center justify-center ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`} />
                    </div>
                    <p className="font-serif font-bold text-slate-900 text-sm leading-tight truncate">{item.name}</p>
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-600 font-sans line-clamp-1 leading-normal mb-1">{item.description}</p>
                  )}
                  <span className="font-mono font-bold text-rose-700 text-sm">₹{item.price}</span>
                </div>

                {/* Cart Action Buttons */}
                {cartQty === 0 ? (
                  <button
                    onClick={() => addToCart(item.id)}
                    className="shrink-0 flex items-center gap-1 bg-primary text-primary-foreground px-3.5 py-2 rounded-lg text-xs font-bold font-sans hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> ADD
                  </button>
                ) : (
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => updateCartQty(item.id, cartQty - 1)}
                      className="h-7 w-7 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted active:scale-90 transition-colors cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-5 text-center font-mono font-bold text-sm text-slate-900">{cartQty}</span>
                    <button
                      onClick={() => updateCartQty(item.id, cartQty + 1)}
                      className="h-7 w-7 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted active:scale-90 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border p-3 flex justify-center shadow-lg animate-slide-up">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full max-w-lg justify-between items-center bg-primary text-primary-foreground px-5 py-3.5 rounded-xl text-sm font-bold font-sans uppercase tracking-wider hover:opacity-95 shadow-md active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4.5 w-4.5" />
              <span>{cartItemsCount} item{cartItemsCount !== 1 ? 's' : ''} added</span>
            </div>
            <span className="font-mono text-sm tracking-normal font-black">View Cart · ₹{cartTotal} &rarr;</span>
          </button>
        </div>
      )}

      {/* Cart bottom sheet modal */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="absolute inset-0 z-0" onClick={() => setCartOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-card border-t sm:border border-border rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85vh] z-10 animate-slide-up">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-border/80 mb-3">
              <div className="flex items-center gap-2 text-foreground font-serif font-bold text-lg">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <span>Your Order (Table {tableNumber})</span>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="text-muted-foreground/60 hover:text-foreground transition-colors p-1 bg-muted/50 rounded-full cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Cart Items list */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
              {Object.entries(cart).map(([itemId, cartItem]) => {
                const item = menuItems.find(mi => mi.id === itemId);
                if (!item) return null;

                return (
                  <div key={itemId} className="space-y-1.5 border-b border-border/40 pb-3">
                    <div className="flex justify-between items-center gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground font-sans truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">₹{item.price} each</p>
                      </div>

                      {/* controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateCartQty(itemId, cartItem.quantity - 1)}
                          className="h-6 w-6 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center font-mono font-bold text-sm text-foreground">{cartItem.quantity}</span>
                        <button
                          onClick={() => updateCartQty(itemId, cartItem.quantity + 1)}
                          className="h-6 w-6 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Instruction / Note */}
                    <input
                      type="text"
                      value={cartItem.notes}
                      onChange={e => updateCartNote(itemId, e.target.value)}
                      placeholder="Note (e.g., extra spicy, no ice)"
                      className="w-full text-xs font-sans bg-background border border-border/60 rounded-lg px-2.5 py-1.5 text-foreground placeholder-muted-foreground/45 focus:border-primary focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>

            {/* Totals & Submit */}
            <div className="border-t border-border pt-4 mt-3 space-y-3">
              <div className="flex justify-between items-center font-sans font-bold text-foreground text-sm">
                <span>Estimated Subtotal</span>
                <span className="font-mono text-base text-primary">₹{cartTotal}</span>
              </div>

              {/* Home Delivery toggle — only visible when total >= ₹200 */}
              {cartTotal >= 200 && (
                <div className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                  isHomeDelivery
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-border bg-muted/30'
                }`}>
                  {/* Toggle header */}
                  <button
                    type="button"
                    onClick={() => setIsHomeDelivery(p => !p)}
                    className="w-full flex items-center justify-between px-3.5 py-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Truck className={`h-4.5 w-4.5 ${isHomeDelivery ? 'text-blue-600' : 'text-muted-foreground'}`} />
                      <div className="text-left">
                        <p className={`text-sm font-bold font-sans ${isHomeDelivery ? 'text-blue-900' : 'text-foreground'}`}>
                          Home Delivery
                        </p>
                        <p className={`text-[10px] font-sans ${isHomeDelivery ? 'text-blue-600' : 'text-muted-foreground'}`}>
                          Available on orders ₹200+
                        </p>
                      </div>
                    </div>
                    {/* Toggle pill */}
                    <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                      isHomeDelivery ? 'bg-blue-500' : 'bg-muted-foreground/30'
                    }`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                        isHomeDelivery ? 'left-5' : 'left-1'
                      }`} />
                    </div>
                  </button>

                  {/* Delivery address & phone fields */}
                  {isHomeDelivery && (
                    <div className="px-3.5 pb-3.5 space-y-2.5 border-t border-blue-200">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 font-sans pt-2.5">
                        Delivery Details
                      </p>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-blue-500 shrink-0 mt-2" />
                        <textarea
                          rows={2}
                          value={deliveryAddress}
                          onChange={e => setDeliveryAddress(e.target.value)}
                          placeholder="Full delivery address (house no., street, landmark...)"
                          className="flex-1 text-xs font-sans bg-white border border-blue-200 rounded-lg px-2.5 py-2 text-foreground placeholder-muted-foreground/50 focus:border-blue-400 focus:outline-none resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-500 shrink-0" />
                        <input
                          type="tel"
                          value={deliveryPhone}
                          onChange={e => setDeliveryPhone(e.target.value)}
                          placeholder="Phone number for delivery"
                          className="flex-1 text-xs font-sans bg-white border border-blue-200 rounded-lg px-2.5 py-2 text-foreground placeholder-muted-foreground/50 focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-950 font-sans text-[11px] leading-relaxed">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
                <p>Placing this order sends it straight to the kitchen. You can add more items later. Payment is completed when you check out.</p>
              </div>

              <button
                onClick={placeOrder}
                disabled={placingOrder || cartItemsCount === 0}
                className="w-full rounded-xl bg-primary text-primary-foreground hover:opacity-95 disabled:opacity-50 text-sm font-bold font-sans uppercase tracking-wider py-4 transition-all shadow-md cursor-pointer"
              >
                {placingOrder ? 'Sending Order...' : isHomeDelivery ? '🚚 Place Delivery Order' : 'Confirm & Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerOrderPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <OrderMenuContent />
    </Suspense>
  );
}
