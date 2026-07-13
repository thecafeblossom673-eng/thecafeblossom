'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Coffee } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const { error } = await login(password);
      if (error) {
        setErrorMsg(error.message || 'Invalid passcode');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background animate-fade-in">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <Coffee className="h-8 w-8" />
          </div>
          <h2 className="text-center font-script text-6xl text-primary font-medium tracking-wide">
            Cafe Blossom
          </h2>
          <p className="mt-1 text-center text-sm font-sans tracking-widest uppercase text-muted-foreground">
            Staff Portal — Ishvarpur
          </p>
        </div>

        <div className="bg-card border border-border shadow-sm rounded-lg p-8 sm:p-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="rounded-md bg-secondary/10 p-4 border border-secondary/20">
                <div className="text-sm font-medium text-secondary text-center">
                  {errorMsg}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-sans text-center">
                System Passcode
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-border bg-background px-3 py-2.5 text-foreground shadow-sm placeholder-muted-foreground/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm font-sans text-center tracking-widest text-lg"
                placeholder="••••••••"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 transition-colors font-sans tracking-wide uppercase cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Access Portal'}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground font-sans">
            Note: Ask the administrator if you do not know the system passcode.
          </p>
        </div>
      </div>
    </div>
  );
}
