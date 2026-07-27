'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { db } from '@/lib/db';
import {
  ArrowLeft, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Tag, ChevronRight, Layers, Percent
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Modal } from '@/components/Modal';
import { DateTimeDisplay } from '@/components/DateTimeDisplay';
import { ViraTechWatermark } from '@/components/ViraTechWatermark';

export default function OffersListPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean; title: string; message: string; type: 'alert' | 'confirm'; onConfirm?: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'alert' });

  const showConfirm = (title: string, message: string, onConfirm: () => void) =>
    setModalConfig({ isOpen: true, title, message, type: 'confirm', onConfirm });
  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const loadOffers = async () => {
    setLoading(true);
    try {
      const data = await db.getOffers();
      setOffers(data || []);
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOffers(); }, []);

  const handleToggleActive = (offer: any) => {
    startTransition(async () => {
      await db.updateOffer(offer.id, { ...offer, is_active: !offer.is_active });
      await loadOffers();
    });
  };

  const handleDelete = (offer: any) => {
    showConfirm(
      'Delete Offer',
      `Are you sure you want to delete "${offer.title}"? This action cannot be undone.`,
      async () => {
        closeModal();
        await db.deleteOffer(offer.id);
        await loadOffers();
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-40 shadow-md">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="p-1 hover:bg-primary-foreground/10 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <Percent className="h-5 w-5" />
            <div>
              <h1 className="font-serif text-xl font-bold leading-none">Running Offers</h1>
              <p className="text-[10px] uppercase tracking-widest opacity-80 font-sans mt-0.5">Cafe Blossom · Menu Control</p>
            </div>
          </Link>
          <div className="ml-auto border-l border-primary-foreground/20 pl-3 flex items-center gap-2">
            <DateTimeDisplay />
            <ViraTechWatermark />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">All Offers</h2>
            <p className="text-sm text-muted-foreground font-sans mt-1">
              Manage promotional combo offers displayed on customer digital menus.
            </p>
          </div>
          <Link
            href="/offers/new"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold font-sans hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Offer
          </Link>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Layers className="h-8 w-8" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-foreground">No offers created yet</p>
              <p className="text-sm text-muted-foreground font-sans mt-1 max-w-sm">
                Create your first promotional offer to feature combo deals on customer digital menus.
              </p>
            </div>
            <Link
              href="/offers/new"
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold font-sans hover:bg-primary/90 transition-colors mt-2"
            >
              <Plus className="h-4 w-4" /> Create First Offer
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {offers.map(offer => (
              <div
                key={offer.id}
                className={`group relative bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${!offer.is_active ? 'opacity-65' : ''}`}
              >
                {/* Offer Banner Image */}
                <div className="relative h-44 w-full bg-muted overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={offer.image_url || '/offer_combo.jpg'}
                    alt={offer.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200" fill="%23f1f5f9"><rect width="400" height="200" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2394a3b8">No Image</text></svg>';
                    }}
                  />
                  {/* Badge Tag */}
                  {offer.badge && (
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-md bg-white/90 backdrop-blur-md px-2.5 py-1 shadow-sm">
                      <Tag className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-bold tracking-widest text-primary uppercase">{offer.badge}</span>
                    </div>
                  )}
                  {/* Active Status Pill */}
                  <div className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm ${offer.is_active ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-slate-200 text-slate-600 border border-slate-300'}`}>
                    {offer.is_active ? 'ACTIVE' : 'HIDDEN'}
                  </div>
                </div>

                {/* Offer Details */}
                <div className="p-4 space-y-2">
                  <h3 className="font-serif text-base font-bold text-foreground leading-tight">{offer.title}</h3>
                  <p className="text-xs text-muted-foreground font-sans line-clamp-2 leading-relaxed">{offer.description}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="font-mono font-black text-lg text-primary">₹{offer.price}</span>
                    {offer.original_price && (
                      <span className="font-mono text-xs text-muted-foreground line-through">₹{offer.original_price}</span>
                    )}
                    {offer.original_price && offer.original_price > offer.price && (
                      <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                        {Math.round(((offer.original_price - offer.price) / offer.original_price) * 100)}% OFF
                      </span>
                    )}
                  </div>

                  {offer.included_items?.length > 0 && (
                    <p className="text-[10px] text-muted-foreground font-sans">
                      {offer.included_items.length} item{offer.included_items.length !== 1 ? 's' : ''} included
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="px-4 pb-4 pt-1 space-y-2 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(offer)}
                      disabled={isPending}
                      title={offer.is_active ? 'Hide from customer menu' : 'Show on customer menu'}
                      className={`flex items-center gap-1.5 text-xs font-sans font-semibold px-3 py-2 rounded-xl border transition-colors disabled:opacity-50 flex-1 justify-center cursor-pointer ${
                        offer.is_active
                          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {offer.is_active
                        ? <ToggleRight className="h-4 w-4 shrink-0" />
                        : <ToggleLeft className="h-4 w-4 shrink-0" />}
                      {offer.is_active ? 'Active' : 'Hidden'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(offer)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl border border-border hover:border-red-200 transition-colors cursor-pointer"
                      title="Delete offer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <Link
                    href={`/offers/${offer.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold font-sans py-2.5 rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Offer
                    <ChevronRight className="h-3 w-3 opacity-60" />
                  </Link>
                </div>
              </div>
            ))}

            {/* Dotted Add New Offer Card */}
            <Link
              href="/offers/new"
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl min-h-[280px] text-muted-foreground hover:text-primary hover:border-primary transition-all duration-200 hover:bg-primary/5 group p-6 text-center"
            >
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold font-sans text-foreground">Add New Offer</p>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">Create combo deal with items & discounts</p>
              </div>
            </Link>
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
