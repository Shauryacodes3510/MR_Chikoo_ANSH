import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthProvider';

interface SessionContextType {
  showOnboarding: boolean;
  setShowOnboarding: (val: boolean) => void;
  showWelcomeCinematic: boolean;
  setShowWelcomeCinematic: (val: boolean) => void;
  completeOnboarding: (username: string, title: string, motto: string, avatarId: string) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { sessionUser } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcomeCinematic, setShowWelcomeCinematic] = useState(false);

  useEffect(() => {
    setShowOnboarding(false);
  }, [sessionUser]);

  const completeOnboarding = (username: string, title: string, motto: string, avatarId: string) => {
    if (!sessionUser) return;
    localStorage.setItem(`CHIKOO_ONBOARDING_COMPLETED_${sessionUser.toLowerCase()}`, 'true');
    localStorage.setItem(`CHIKOO_USER_MOTTO_${sessionUser.toLowerCase()}`, motto);
    localStorage.setItem(`CHIKOO_USER_TITLE_${sessionUser.toLowerCase()}`, title);
    setShowOnboarding(false);
  };

  return (
    <SessionContext.Provider value={{ showOnboarding, setShowOnboarding, showWelcomeCinematic, setShowWelcomeCinematic, completeOnboarding }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
