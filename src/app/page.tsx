'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Coffee, BookOpen, UserCheck, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DateTimeDisplay } from '@/components/DateTimeDisplay';

export default function CustomerLandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPage, setMenuPage] = useState(1);

  const openMenu = (page: number) => {
    setMenuPage(page);
    setMenuOpen(true);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between text-foreground font-sans overflow-x-hidden">
      {/* Background Image with Dark Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url('/cafe_interior.jpg')` }}
      />
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[1.5px] z-0" />

      {/* Top Floating Logo Area */}
      <header className="relative z-10 w-full px-6 py-4 flex justify-between items-center max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-accent bg-white p-0.5 shadow-sm">
            <Image src="/cafe_logo.png" alt="Cafe Blossom Logo" width={40} height={40} className="object-cover h-full w-full rounded-full" />
          </div>
          <span className="font-serif text-xl font-bold tracking-wider text-white">Cafe Blossom</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-white">
            <DateTimeDisplay />
          </div>
          <Link 
            href="/admin" 
            className="flex items-center gap-1.5 text-xs text-white/70 hover:text-accent font-medium uppercase tracking-wider transition-colors border border-white/20 hover:border-accent/40 rounded-full px-3.5 py-2 bg-black/30 backdrop-blur-sm"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Staff Access</span>
          </Link>
        </div>
      </header>

      {/* Center Hero Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 sm:p-12 text-center shadow-2xl flex flex-col items-center">
          {/* Large Logo Badge */}
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-accent bg-white p-1 mb-6 shadow-lg">
            <Image src="/cafe_logo.png" alt="Cafe Blossom Logo" width={112} height={112} className="object-cover h-full w-full rounded-full" />
          </div>

          <h1 className="font-script text-6xl text-accent font-medium leading-none mb-1">
            Cafe Blossom
          </h1>
          <p className="text-[11px] font-sans tracking-[0.25em] uppercase text-white/75 font-semibold mb-4">
            Ishvarpur
          </p>

          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-accent to-transparent mb-6" />

          <p className="font-serif italic text-lg sm:text-xl text-white/90 leading-relaxed mb-8 max-w-sm">
            "We provide a resting space with coffee and flowers..."
          </p>

          {/* Call-to-actions */}
          <div className="w-full space-y-4">
            <Link
              href="/order"
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-95 text-base font-bold font-sans uppercase tracking-wider transition-all cursor-pointer py-4 shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <Coffee className="h-5 w-5" />
              Order Food from Table
            </Link>

            <button
              onClick={() => openMenu(1)}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-base font-bold font-sans uppercase tracking-wider transition-all cursor-pointer py-4 hover:scale-[1.02] active:scale-[0.98]"
            >
              <BookOpen className="h-5 w-5" />
              View Digital Menu
            </button>
          </div>
        </div>
      </main>

      {/* Footer Area */}
      <footer className="relative z-10 w-full text-center py-6 text-xs text-white/40 font-sans tracking-wide">
        <p>© {new Date().getFullYear()} Cafe Blossom · Ishvarpur. All rights reserved.</p>
        <p className="text-[10px] mt-1 opacity-60">Call us: 7038411001 · Visit on Instagram @cafe_blossom</p>
      </footer>

      {/* Lightbox / Modal for Digital Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          {/* Close button */}
          <button 
            onClick={() => setMenuOpen(false)}
            className="absolute top-4 right-4 z-55 bg-black/60 border border-white/20 hover:border-white/50 text-white rounded-full p-2.5 transition-colors cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Lightbox Container */}
          <div className="relative w-full max-w-2xl aspect-[3/4.5] max-h-[80vh] flex flex-col justify-center items-center">
            {/* Image display */}
            <div className="relative w-full flex-1 overflow-hidden rounded-xl bg-card border border-white/10 shadow-2xl flex items-center justify-center">
              <Image 
                src={menuPage === 1 ? '/menu_page1.png' : '/menu_page2.png'} 
                alt={`Menu Page ${menuPage}`} 
                fill 
                className="object-contain" 
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
            </div>

            {/* Navigation buttons */}
            <div className="w-full flex justify-between items-center px-4 py-3 bg-black/80 backdrop-blur-sm border-t border-white/10 rounded-b-xl z-20 mt-2">
              <button
                disabled={menuPage === 1}
                onClick={() => setMenuPage(1)}
                className="flex items-center gap-1.5 bg-white/10 border border-white/10 hover:border-white/30 text-white font-sans text-xs font-bold rounded-lg px-4 py-2 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Page 1
              </button>

              <div className="text-white font-mono text-xs font-bold">
                {menuPage} / 2
              </div>

              <button
                disabled={menuPage === 2}
                onClick={() => setMenuPage(2)}
                className="flex items-center gap-1.5 bg-white/10 border border-white/10 hover:border-white/30 text-white font-sans text-xs font-bold rounded-lg px-4 py-2 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              >
                Page 2
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
