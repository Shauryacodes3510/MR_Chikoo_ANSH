import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Sparkles, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function PWAInstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('chikoo_pwa_dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  if (!isInstallable || isInstalled || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    setInstalling(true);
    const installed = await promptInstall();
    setInstalling(false);
    if (installed) {
      setSuccess(true);
      setTimeout(() => setDismissed(true), 2500);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('chikoo_pwa_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[9999] max-w-sm mx-auto sm:mx-0"
      >
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)] text-white">
          {/* Subtle Glow Background */}
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <button
            onClick={handleDismiss}
            className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3.5 pr-5">
            <div className="relative shrink-0 w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-md">
              <img
                src="/avatar.webp"
                alt="Chikoo App"
                className="w-full h-full object-cover rounded-[10px]"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white">
                <Sparkles className="w-2.5 h-2.5" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white leading-snug flex items-center gap-1.5">
                Install Chikoo App
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Play offline, save progress faster, and launch in full screen.
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            <button
              onClick={handleInstall}
              disabled={installing || success}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all"
            >
              {success ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Installed!</span>
                </>
              ) : installing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Installing...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App (Free)</span>
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
