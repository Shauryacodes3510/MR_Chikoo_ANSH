import { useState, useCallback, useEffect } from 'react';

export function useNavigation() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return { currentPath, navigateTo };
}
