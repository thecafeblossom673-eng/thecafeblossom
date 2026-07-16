'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { ArrowLeft, Percent, Smartphone, Image as ImageIcon, CheckCircle, HelpCircle, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Modal } from '@/components/Modal';
import { DateTimeDisplay } from '@/components/DateTimeDisplay';

type IncludedItem = {
  menu_item_id: string;
  name: string;
  original_price: number;
};

export default function OffersPage() {
  const [loading, setLoading] = useState(true);
  const [savingOffer, setSavingOffer] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, type: 'alert' | 'confirm', onConfirm?: () => void}>({isOpen: false, title: '', message: '', type: 'alert'});
  const showAlert = (title: string, message: string) => setModalConfig({isOpen: true, title, message, type: 'alert'});
  const closeModal = () => setModalConfig(prev => ({...prev, isOpen: false}));
  
  // Available standard menu items
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Form State
  const [offerActive, setOfferActive] = useState(true);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerBadge, setOfferBadge] = useState('');
  const [offerPrice, setOfferPrice] = useState(149);
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [offerImageUrl, setOfferImageUrl] = useState('/offer_combo.jpg');
  
  const [discountInput, setDiscountInput] = useState<string>('');
  
  // Included items state
  const [includedItems, setIncludedItems] = useState<IncludedItem[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [offer, items, cats] = await Promise.all([
        db.getOffer(),
        db.getMenuItems(),
        db.getCategories()
      ]);
      
      setMenuItems(items);
      setCategories(cats);
      
      if (offer) {
        setOfferActive(offer.is_active);
        setOfferTitle(offer.title);
        setOfferDescription(offer.description);
        setOfferBadge(offer.badge);
        setOfferPrice(offer.price);
        setOriginalPrice(offer.original_price || '');
        setOfferImageUrl(offer.image_url);
        setIncludedItems(offer.included_items || []);
        
        if (offer.original_price && offer.original_price > offer.price) {
          setDiscountInput(Math.round(((offer.original_price - offer.price) / offer.original_price) * 100).toString());
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddIncludedItem = () => {
    if (!selectedMenuItemId) return;
    
    const menuItem = menuItems.find(i => i.id === selectedMenuItemId);
    if (!menuItem) return;
    
    setIncludedItems(prev => [
      ...prev,
      {
        menu_item_id: menuItem.id,
        name: menuItem.name,
        original_price: menuItem.price
      }
    ]);
    
    // Auto-calculate the total original price when adding items
    const currentTotal = includedItems.reduce((sum, item) => sum + item.original_price, 0);
    const newTotal = currentTotal + menuItem.price;
    setOriginalPrice(newTotal);
    
    if (newTotal > offerPrice) {
      setDiscountInput(Math.round(((newTotal - offerPrice) / newTotal) * 100).toString());
    }
    
    setSelectedMenuItemId('');
  };

  const handleRemoveIncludedItem = (index: number) => {
    setIncludedItems(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUpdateIncludedItem = (index: number, field: keyof IncludedItem, value: any) => {
    setIncludedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const saveOfferDetails = async () => {
    setSavingOffer(true);
    setSuccessMsg('');
    try {
      await db.saveOffer({
        is_active: offerActive,
        title: offerTitle,
        description: offerDescription,
        badge: offerBadge,
        price: Number(offerPrice),
        original_price: originalPrice ? Number(originalPrice) : undefined,
        image_url: offerImageUrl,
        included_items: includedItems
      });
      setSuccessMsg('Offer successfully updated and pushed to digital menus!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving offer details:', err);
      showAlert('Error', 'Failed to save offer.');
    } finally {
      setSavingOffer(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-40 shadow-md">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="p-1 hover:bg-primary-foreground/10 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <Percent className="h-5 w-5" />
            <div>
              <h1 className="font-serif text-xl font-bold leading-tight">Running Offer</h1>
              <p className="text-[10px] uppercase tracking-widest opacity-70 font-sans">Cafe Blossom · Menu Control</p>
            </div>
          </Link>
          <div className="ml-auto border-l border-primary-foreground/20 pl-3">
            <DateTimeDisplay />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <main className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left Column: Form Setup */}
          <div className="space-y-6 pb-20">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">Offer Setup</h2>
              <p className="text-sm text-muted-foreground font-sans mt-1">
                Design the combo meal that customers see first when they scan the QR code.
              </p>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 p-3 rounded-xl font-sans text-sm font-medium animate-in fade-in slide-in-from-top-4">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {successMsg}
              </div>
            )}

            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">
              {/* Active Toggle */}
              <div className="flex items-center justify-between bg-muted/40 border border-border rounded-xl px-4 py-4">
                <div>
                  <p className="text-sm font-bold text-foreground font-sans">Show Banner on Menu</p>
                  <p className="text-xs text-muted-foreground font-sans">Toggle visibility for customers</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOfferActive(p => !p)}
                  className={`relative w-14 h-8 rounded-full transition-colors duration-200 cursor-pointer ${
                    offerActive ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all duration-200 ${
                    offerActive ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-sans">
                    Offer Title
                  </label>
                  <input
                    type="text"
                    value={offerTitle}
                    onChange={(e) => setOfferTitle(e.target.value)}
                    placeholder="e.g. Burger & Coffee Combo"
                    className="w-full px-4 py-2.5 text-sm font-sans bg-background text-foreground border border-border rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-sans">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={offerBadge}
                    onChange={(e) => setOfferBadge(e.target.value)}
                    placeholder="e.g. SPECIAL COMBO, 40% OFF"
                    className="w-full px-4 py-2.5 text-sm font-sans bg-background text-foreground border border-border rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-sans">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  placeholder="Describe the overall combo..."
                  className="w-full px-4 py-2.5 text-sm font-sans bg-background text-foreground border border-border rounded-xl focus:border-primary focus:outline-none resize-none"
                />
              </div>

              {/* --- INCLUDED ITEMS SECTION --- */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-foreground font-sans">
                    Included Items
                  </label>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    {includedItems.length} {includedItems.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>
                
                {/* List of included items */}
                {includedItems.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {includedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-muted/30 p-2 rounded-xl border border-border/50">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateIncludedItem(idx, 'name', e.target.value)}
                          className="flex-1 bg-white border border-border px-3 py-1.5 rounded-lg text-sm font-sans focus:outline-none focus:border-primary"
                          placeholder="Item Name"
                        />
                        <div className="relative w-24">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">₹</span>
                          <input
                            type="number"
                            value={item.original_price}
                            onChange={(e) => handleUpdateIncludedItem(idx, 'original_price', Number(e.target.value))}
                            className="w-full bg-white border border-border pl-6 pr-2 py-1.5 rounded-lg text-sm font-mono focus:outline-none focus:border-primary"
                            placeholder="Price"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveIncludedItem(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add new item selector */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMenuItemId}
                    onChange={(e) => setSelectedMenuItemId(e.target.value)}
                    className="flex-1 bg-background border border-border px-3 py-2 rounded-xl text-sm font-sans focus:outline-none focus:border-primary"
                  >
                    <option value="">Select standard menu item...</option>
                    {categories.map(cat => (
                      <optgroup key={cat.id} label={cat.name}>
                        {menuItems
                          .filter(mi => mi.category_id === cat.id)
                          .map(mi => (
                            <option key={mi.id} value={mi.id}>
                              {mi.name} — ₹{mi.price}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedMenuItemId}
                    onClick={handleAddIncludedItem}
                    className="bg-secondary text-secondary-foreground p-2 rounded-xl disabled:opacity-50 hover:bg-secondary/90 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-sans">
                    <span>Discounted Price (₹)</span>
                  </label>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setOfferPrice(val);
                      if (originalPrice && val > 0 && Number(originalPrice) > val) {
                        setDiscountInput(Math.round(((Number(originalPrice) - val) / Number(originalPrice)) * 100).toString());
                      } else {
                        setDiscountInput('');
                      }
                    }}
                    placeholder="149"
                    className="w-full px-4 py-2.5 text-sm font-bold font-mono text-primary bg-background border border-border rounded-xl focus:border-primary focus:outline-none"
                  />
                  
                  {/* Discount Percentage Calculator */}
                  <div className="mt-2 flex items-center gap-2 bg-muted/30 p-2 rounded-lg border border-border/50">
                    <span className="text-xs font-semibold text-muted-foreground ml-1 font-sans">Apply %</span>
                    <input
                      type="number"
                      placeholder="e.g. 15"
                      value={discountInput}
                      className="w-16 px-2 py-1 text-sm font-mono bg-white border border-border rounded-md focus:border-primary focus:outline-none"
                      onChange={(e) => {
                        setDiscountInput(e.target.value);
                        const percent = Number(e.target.value);
                        if (originalPrice && percent >= 0 && percent <= 100) {
                          setOfferPrice(Math.round(Number(originalPrice) * (1 - percent / 100)));
                        }
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      Auto-calculate price
                    </span>
                  </div>
                </div>
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-sans">
                    <span>Original Price (₹)</span>
                    <span className="text-[9px] opacity-60 normal-case tracking-normal">Optional</span>
                  </label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setOriginalPrice(val);
                      if (val && offerPrice && Number(val) > offerPrice) {
                        setDiscountInput(Math.round(((Number(val) - offerPrice) / Number(val)) * 100).toString());
                      } else {
                        setDiscountInput('');
                      }
                    }}
                    placeholder="299"
                    className="w-full px-4 py-2.5 text-sm font-mono text-muted-foreground line-through bg-background border border-border rounded-xl focus:border-primary focus:outline-none"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Calculated from items automatically, but you can override.</p>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-sans">
                  Image Path / URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <input
                    type="text"
                    value={offerImageUrl}
                    onChange={(e) => setOfferImageUrl(e.target.value)}
                    placeholder="e.g. /offer_combo.jpg"
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-sans bg-background text-foreground border border-border rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 mt-2">
                <button
                  type="button"
                  disabled={savingOffer}
                  onClick={saveOfferDetails}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold font-sans hover:bg-primary/90 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingOffer ? 'Saving and Publishing...' : 'Save & Publish Offer'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Preview */}
          <div className="space-y-6 lg:sticky lg:top-24 self-start">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-foreground">Live Preview</h2>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider font-sans">
                <Smartphone className="h-3.5 w-3.5" />
                Customer View
              </div>
            </div>

            <div className={`transition-opacity duration-300 ${!offerActive ? 'opacity-40 grayscale' : ''}`}>
              {!offerActive && (
                <div className="absolute z-10 bg-black/80 text-white font-sans text-sm font-bold px-4 py-2 rounded-full transform -translate-y-1/2 -translate-x-1/2 top-1/2 left-1/2 shadow-xl whitespace-nowrap">
                  Currently Hidden
                </div>
              )}
              
              <div className="relative overflow-hidden rounded-[2rem] border-8 border-slate-900 bg-background shadow-2xl mx-auto max-w-sm aspect-[9/19] flex flex-col pointer-events-none select-none scale-95 origin-top">
                {/* Mock Phone Status Bar */}
                <div className="h-7 w-full bg-slate-900 flex justify-center items-center rounded-t-xl shrink-0">
                  <div className="w-1/3 h-4 bg-black rounded-b-xl"></div>
                </div>
                
                {/* Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                  {/* Mock Menu Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <HelpCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg leading-none">Cafe Blossom</h3>
                      <p className="text-[10px] uppercase tracking-widest font-sans text-muted-foreground mt-1">Menu</p>
                    </div>
                  </div>

                  {/* LIVE OFFER CARD PREVIEW */}
                  <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-border">
                    {/* Image Area */}
                    <div className="relative h-40 w-full bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={offerImageUrl} 
                        alt="Offer Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 400 300" fill="%23f1f5f9"><rect width="400" height="300" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%2394a3b8">Invalid Image URL</text></svg>';
                        }}
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-white/90 backdrop-blur-md px-2 py-1 shadow-sm">
                        <span className="text-[10px] font-bold tracking-widest text-primary uppercase">{offerBadge || 'BADGE TEXT'}</span>
                      </div>
                    </div>
                    
                    {/* Content Area */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-serif text-lg font-bold leading-tight">{offerTitle || 'Offer Title'}</h3>
                        <p className="text-xs text-muted-foreground font-sans mt-1 line-clamp-2">
                          {offerDescription || 'Detailed description of the items included in this special combo offer.'}
                        </p>
                      </div>
                      
                      {/* INCLUDED ITEMS LIST PREVIEW */}
                      {includedItems.length > 0 && (
                        <div className="pt-2 pb-1 space-y-1.5 border-t border-dashed border-border/60">
                          {includedItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] font-sans">
                              <span className="flex items-center gap-1.5 text-slate-700">
                                <span className="h-1 w-1 bg-primary rounded-full"></span>
                                {item.name}
                              </span>
                              <span className="font-mono text-muted-foreground line-through opacity-70">
                                ₹{item.original_price}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-end justify-between pt-3 border-t border-border/40">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xl text-primary">₹{offerPrice || 0}</span>
                          {originalPrice && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm text-muted-foreground line-through">₹{originalPrice}</span>
                              <span className="text-[9px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                {Math.round(((Number(originalPrice) - Number(offerPrice)) / Number(originalPrice)) * 100)}% OFF
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <HelpCircle className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mock Standard Item */}
                  {includedItems.length === 0 && (
                    <div className="flex gap-4 p-4 rounded-2xl bg-white shadow-sm border border-border opacity-50">
                      <div className="flex-1">
                        <h4 className="font-serif font-bold">Standard Item</h4>
                        <p className="text-xs text-muted-foreground font-sans mt-1">Normal menu item description</p>
                        <p className="font-mono font-black text-primary mt-2">₹99</p>
                      </div>
                      <div className="h-20 w-20 rounded-xl bg-muted shrink-0"></div>
                    </div>
                  )}
                  
                </div>
              </div>
            </div>
            
          </div>
        </main>
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
