import { createContext, useContext, useState, ReactNode } from 'react';

type ViewType = 'home' | 'leaderboard' | 'quests' | 'profile' | 'challenges' | 'practice' | 'rewards_store' | 'knowledge-arena' | 'arena';

interface NavigationContextType {
  view: ViewType;
  setView: (view: ViewType) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewType>('home');

  return (
    <NavigationContext.Provider value={{ view, setView }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationContext() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
}
