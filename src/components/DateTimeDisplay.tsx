'use client';

import React, { useState, useEffect } from 'react';

export function DateTimeDisplay() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return null;

  return (
    <div className="flex flex-col items-end justify-center font-sans">
      <span className="text-xs font-bold tracking-wide">
        {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
      </span>
      <span className="text-[10px] uppercase tracking-widest opacity-80 font-mono mt-0.5">
        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
}
