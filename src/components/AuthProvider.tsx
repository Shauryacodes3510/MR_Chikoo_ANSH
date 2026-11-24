import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured, clearUserSessionData } from '../lib/supabase';
import { progressService } from '../lib/progressService';
import { schoolService } from '../lib/schoolService';

interface AuthContextType {
  sessionUser: string | null;
  authUserId: string | null;
  setSessionUser: (user: string | null) => void;
  isRestoringSession: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
      const screenDim = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown';
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';

      console.log(`[DATA_INIT] platform / device: ${isMobile ? 'mobile' : 'desktop'} | screen: ${screenDim} | ua: ${userAgent}`);

      // STRICT RULE: Local cached email MUST NOT be treated as an authenticated Supabase session.
      // Cache may pre-hydrate UI display data only, but never establish authentication.

      // Mobile-resilient failsafe timer: guarantee isRestoringSession is released within 6000ms
      const failsafeTimer = setTimeout(() => {
        if (active) {
          console.warn("[Auth Trace] Auth restoration failsafe fired after 6000ms - releasing loading state");
          setIsRestoringSession(false);
        }
      }, 6000);

      if (isSupabaseConfigured && supabase) {
        try {
          console.log("[Auth Trace] Restoring session via Supabase auth check...");
          // 1. Fast local read: getSession reads immediately from client storage without blocking network
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          const session = sessionData?.session;

          console.log(`[DATA_INIT] session exists: ${!!session}`);
          console.log(`[DATA_INIT] user.id (session.user.id): ${session?.user?.id || 'null'}`);

          if (!active) {
            clearTimeout(failsafeTimer);
            return;
          }

          if (sessionError || !session || !session.user || !session.user.id) {
            console.log("[Auth Trace] No active Supabase session or user.id found - unauthenticated.");
            setSessionUser(null);
            setAuthUserId(null);
            clearTimeout(failsafeTimer);
            setIsRestoringSession(false);
            return;
          }

          // 2. Verified real Supabase session with session.user.id exists
          const cleanEmail = session.user.email?.toLowerCase().trim() || null;
          if (cleanEmail && session.user.id) {
            console.log("[Auth Trace] Active verified session discovered for user:", cleanEmail, "id:", session.user.id);
            setSessionUser(cleanEmail);
            setAuthUserId(session.user.id);
          }
          clearTimeout(failsafeTimer);
          setIsRestoringSession(false);

          // 3. Background token validation: verify token isn't revoked by server
          try {
            const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((resolve) =>
              setTimeout(() => resolve({ data: { user: null }, error: new Error('VALIDATION_TIMEOUT') }), 3500)
            );
            const { data: userData, error: userError } = await Promise.race([
              supabase.auth.getUser(),
              timeoutPromise
            ]);

            if (!active) return;

            if (userError && userError.message !== 'VALIDATION_TIMEOUT') {
              const errMsg = (userError.message || '').toLowerCase();
              const errStatus = (userError as any).status;
              const isPermanentRevocation = errStatus === 401 || errStatus === 403 || errMsg.includes('invalid') || errMsg.includes('not found');
              if (isPermanentRevocation) {
                console.warn("[Auth Trace] Backend token validation revoked:", userError.message);
                clearUserSessionData();
                progressService.clear();
                setSessionUser(null);
                setAuthUserId(null);
              } else {
                console.warn("[Auth Trace] Non-fatal backend validation warning (network/latency), preserving session:", userError.message);
              }
            } else if (userData?.user?.email && userData?.user?.id) {
              const verifiedEmail = userData.user.email.toLowerCase().trim();
              setSessionUser(verifiedEmail);
              setAuthUserId(userData.user.id);
            }
          } catch (valErr) {
            console.warn("[Auth Trace] Non-blocking backend validation error:", valErr);
          }
        } catch (e) {
          console.warn("Failed restoring Supabase session:", e);
          if (active) {
            clearTimeout(failsafeTimer);
            setSessionUser(null);
            setAuthUserId(null);
            setIsRestoringSession(false);
          }
        }
      } else {
        // When Supabase is not configured, local cached email MUST NOT grant authentication.
        console.log(`[DATA_INIT] session exists (local fallback): false (Supabase not configured)`);
        console.log(`[DATA_INIT] user.id: null`);
        if (active) {
          clearTimeout(failsafeTimer);
          setSessionUser(null);
          setAuthUserId(null);
          setIsRestoringSession(false);
        }
      }
    }

    restoreSession();

    // Listen to Supabase auth events
    let subscription: any = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`[DATA_INIT] auth state change: ${event} | session exists: ${!!session} | user.id: ${session?.user?.id || 'null'}`);

        if (!active) return;

        if (event === 'SIGNED_OUT') {
          console.log("[Auth Trace] User explicitly signed out. Invalidating local session state.");
          clearUserSessionData();
          progressService.clear();
          setSessionUser(null);
          setAuthUserId(null);
          setIsRestoringSession(false);
          return;
        }

        if (session?.user?.email) {
          const cleanEmail = session.user.email.toLowerCase().trim();
          setSessionUser(cleanEmail);
          setAuthUserId(session.user.id);
        } else if (!session && event !== 'INITIAL_SESSION') {
          // If session became null after initialization without explicit sign out
          setSessionUser(null);
          setAuthUserId(null);
        }
        setIsRestoringSession(false);
      });
      subscription = data?.subscription;
    }

    return () => {
      active = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out of Supabase:', err);
      }
    }
    clearUserSessionData();
    progressService.clear();
    schoolService.clearCache();
    setSessionUser(null);
    setAuthUserId(null);
  };

  return (
    <AuthContext.Provider value={{ sessionUser, authUserId, setSessionUser, isRestoringSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
