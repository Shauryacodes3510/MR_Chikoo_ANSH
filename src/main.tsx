import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Diagnostic: Intercept React duplicate key warnings safely
if (import.meta.env.DEV) {
  const originalConsoleError = console.error.bind(console);
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered two children with the same key")
    ) {
      (window as any).__CHIKOO_DUPLICATE_KEY__ = {
        message: args[0],
        key: args[1],
        allArgs: args,
        stack: new Error().stack,
        timestamp: performance.now(),
        route: window.location.href
      };
      debugger;
    }
    originalConsoleError(...args);
  };
}

// Safely suppress harmless Vite HMR WebSocket notices in embedded environment
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason?.message || String(event?.reason || '');
    if (
      reason.includes('WebSocket closed without opened') ||
      reason.includes('failed to connect to websocket') ||
      reason.includes('WebSocket')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    if (
      msg.includes('WebSocket closed without opened') ||
      msg.includes('failed to connect to websocket')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

// Register the offline service worker only in production, unregister in development
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  if ((import.meta as any).env?.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
        console.log('[Service Worker] Unregistered in development mode:', registration);
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[Service Worker] Registered successfully with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[Service Worker] Registration failed:', error);
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
