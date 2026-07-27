import React from 'react';

export function ViraTechWatermark() {
  return (
    <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity select-none">
      <div className="h-5 w-[1px] bg-current opacity-20" />
      <div className="flex items-center gap-1 scale-[0.85] origin-left">
        <div className="flex flex-col items-center leading-none">
          <span
            className="text-xs font-bold tracking-tighter"
            style={{ fontFamily: 'Times New Roman, serif' }}
          >
            vira
          </span>
          <span className="text-[5px] tracking-[0.18em] uppercase font-sans opacity-80">
            Tech
          </span>
        </div>
        <div className="h-3 w-[1px] bg-current opacity-20" />
        <a
          href="mailto:viratech07@gmail.com"
          className="text-[6.5px] font-sans font-semibold hover:underline opacity-90 pointer-events-auto"
          tabIndex={-1}
        >
          viratech07@gmail.com
        </a>
      </div>
    </div>
  );
}
