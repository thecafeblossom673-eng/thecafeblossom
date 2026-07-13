'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: { email: string } | null;
  loading: boolean;
  login: (password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Determine if this is an admin-only route
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/') ||
                       pathname.startsWith('/tables') || pathname.startsWith('/inventory') ||
                       pathname.startsWith('/history');

  useEffect(() => {
    const storedUser = localStorage.getItem('cafe_blossom_auth');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Logged-in user on /login → send to admin dashboard
        if (pathname === '/login') {
          router.push('/admin');
        }
      } catch (e) {
        localStorage.removeItem('cafe_blossom_auth');
        setUser(null);
        // Invalid session on an admin route → send to login
        if (isAdminRoute || pathname === '/login') {
          router.push('/login');
        }
      }
    } else {
      setUser(null);
      // No session on an admin route → gate with login
      if (isAdminRoute) {
        router.push('/login');
      }
    }
    setLoading(false);
  }, [pathname, router, isAdminRoute]);

  const login = async (password: string) => {
    if (password === 'cafe7707') {
      const loggedInUser = { email: 'staff@cafeblossom.com' };
      localStorage.setItem('cafe_blossom_auth', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      router.push('/admin');
      return { error: null };
    } else {
      return { error: new Error('Incorrect passcode. Please try again.') };
    }
  };

  const logout = async () => {
    localStorage.removeItem('cafe_blossom_auth');
    setUser(null);
    router.push('/login');
  };

  // Block admin routes while loading or if unauthenticated
  // Public routes (/, /order, /login) always show content
  const blockContent = loading && isAdminRoute;
  const showSpinner = blockContent || (isAdminRoute && !user && !loading && pathname !== '/login');

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {showSpinner ? (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
