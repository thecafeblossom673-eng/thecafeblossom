'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getPasswords } from '@/lib/passwords';
import { db } from '@/lib/db';

interface AuthContextType {
  user: { email: string } | null;
  loading: boolean;
  login: (password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

const AUTH_KEY = 'cafe_blossom_auth';
const TAB_SESSION_KEY = 'cafe_tab_session_id';
const LAST_ACTIVITY_KEY = 'cafe_blossom_last_activity';

const SESSION_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours base limit
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes inactivity timeout

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getDeviceInfo(): string {
  if (typeof window === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent;
  let os = 'Windows PC';
  if (ua.includes('Win')) os = 'Windows PC';
  else if (ua.includes('Mac')) os = 'Mac Desktop';
  else if (ua.includes('Android')) os = 'Android Phone';
  else if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Linux')) os = 'Linux PC';

  let browser = 'Chrome';
  if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';

  const screenRes = `${window.screen.width}x${window.screen.height}`;
  return `${os} · ${browser} (${screenRes})`;
}

/** Record user activity timestamp in localStorage (throttled to every 2 seconds) */
function markActivity() {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const lastStr = localStorage.getItem(LAST_ACTIVITY_KEY);
  const last = lastStr ? parseInt(lastStr, 10) : 0;
  if (now - last > 2000) {
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
  }
}

/** Read & validate the stored session against inactivity, 3-hour limit, and stored credentials. */
function readSession(): { email: string; loginTime: number; sessionId?: string; lastActivityTime: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    const loginTime: number = parsed.loginTime ?? Date.now();
    const email: string = parsed.email ?? parsed.user?.email ?? null;
    const tabSessionId = sessionStorage.getItem(TAB_SESSION_KEY);
    const sessionId: string | undefined = tabSessionId || parsed.sessionId;
    const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
    const lastActivityTime: number = lastActivityStr ? parseInt(lastActivityStr, 10) : loginTime;

    if (!email) return null;

    const now = Date.now();
    const inactivityDuration = now - lastActivityTime;

    // Rule 1: Log out if user is inactive for 5 minutes (regardless of occupied tables)
    if (inactivityDuration >= INACTIVITY_TIMEOUT_MS) {
      localStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(TAB_SESSION_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      return null;
    }

    return { email, loginTime, sessionId, lastActivityTime };
  } catch {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(TAB_SESSION_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForceLogoutModal, setShowForceLogoutModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Determine if this is an admin-only route
  const isAdminRoute =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/tables') ||
    pathname.startsWith('/inventory') ||
    pathname.startsWith('/history');

  // ── Logout Callback ───────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const tabSessionId = sessionStorage.getItem(TAB_SESSION_KEY);
    const session = readSession();
    const targetSessionId = tabSessionId || session?.sessionId;
    if (targetSessionId) {
      try {
        await db.recordLogoutSession(targetSessionId);
      } catch (e) {
        console.error('Failed to log logout session:', e);
      }
    }
    sessionStorage.removeItem(TAB_SESSION_KEY);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setUser(null);
    router.push('/login');
  }, [router]);

  // ── Route validation & tab session registration ─────────────────────────
  useEffect(() => {
    const session = readSession();

    if (session) {
      setUser({ email: session.email });

      // If tab has no distinct session ID yet, register a new active session
      const existingTabId = sessionStorage.getItem(TAB_SESSION_KEY);
      if (!existingTabId && isAdminRoute) {
        (async () => {
          try {
            const deviceInfo = getDeviceInfo();
            const createdId = await db.recordLoginSession(deviceInfo, 'Local Staff Device');
            if (createdId) {
              sessionStorage.setItem(TAB_SESSION_KEY, createdId);
            }
          } catch (err) {
            console.error('Failed to register tab session:', err);
          }
        })();
      } else if (existingTabId && isAdminRoute) {
        db.sendSessionHeartbeat(existingTabId).catch(console.error);
      }

      // Logged-in user visiting /login -> redirect to admin
      if (pathname === '/login') {
        router.push('/admin');
      }
    } else {
      setUser(null);
      if (isAdminRoute) {
        router.push('/login');
      }
    }

    setLoading(false);
  }, [pathname, router, isAdminRoute]);

  // ── User Activity Event Listeners (Mouse, Keyboard, Touch, Billing Interaction) ────
  useEffect(() => {
    if (!user) return;

    markActivity();

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'input'];
    const handleUserActivity = () => {
      markActivity();
    };

    events.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [user]);

  // ── Background Interval: Inactivity Check, Day Close Check & Remote Force Logout Heartbeat ──
  useEffect(() => {
    if (!user || !isAdminRoute) return;

    const checkStatus = async () => {
      const session = readSession();
      if (!session) {
        await logout();
        return;
      }

      // Check if current day is closed -> auto logout when day closes
      try {
        const todayDate = new Date().toLocaleDateString('en-CA');
        const systemStatus = await db.getSystemStatus(todayDate);
        if (systemStatus?.isClosed) {
          await logout();
          return;
        }
      } catch (err) {
        console.error('Day status verification error:', err);
      }

      // Remote force logout heartbeat check
      const tabSessionId = sessionStorage.getItem(TAB_SESSION_KEY);
      const targetSessionId = tabSessionId || session?.sessionId;
      if (!targetSessionId) return;

      try {
        const res = await db.sendSessionHeartbeat(targetSessionId);
        if (res?.forceLogout) {
          sessionStorage.removeItem(TAB_SESSION_KEY);
          localStorage.removeItem(AUTH_KEY);
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          setUser(null);
          setShowForceLogoutModal(true);
        }
      } catch (err) {
        console.error('Heartbeat check error:', err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // 10s check interval
    return () => clearInterval(interval);
  }, [user, isAdminRoute, logout]);

  // ── Login Action ──────────────────────────────────────────────────────────
  const login = async (password: string) => {
    const { staff } = getPasswords();
    if (password === staff) {
      let sessionId = '';
      try {
        const deviceInfo = getDeviceInfo();
        const createdId = await db.recordLoginSession(deviceInfo, 'Local Staff Device');
        if (createdId) {
          sessionId = createdId;
          sessionStorage.setItem(TAB_SESSION_KEY, createdId);
        }
      } catch (e) {
        console.error('Failed to log session:', e);
      }

      const now = Date.now();
      const sessionData = { email: 'staff@cafeblossom.com', loginTime: now, sessionId };
      localStorage.setItem(AUTH_KEY, JSON.stringify(sessionData));
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      setUser({ email: sessionData.email });
      router.push('/admin');
      return { error: null };
    }
    return { error: new Error('Incorrect passcode. Please try again.') };
  };

  // Block admin routes while loading or if unauthenticated
  const blockContent = loading && isAdminRoute;
  const showSpinner =
    blockContent || (isAdminRoute && !user && !loading && pathname !== '/login');

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {showSpinner ? (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        children
      )}

      {/* ── Custom Popup Modal: Remotely Terminated Session ────────────── */}
      {showForceLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-red-300 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-foreground">Session Terminated</h3>
              <p className="text-xs text-muted-foreground mt-1 font-sans leading-relaxed">
                Your active staff session was remotely ended by an Administrator.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForceLogoutModal(false);
                router.push('/login');
              }}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md font-sans"
            >
              Return to Login
            </button>
          </div>
        </div>
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

