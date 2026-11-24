import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Sparkles } from 'lucide-react';
import { MAX_ENERGY } from '../../constants';

interface EnergyIndicatorProps {
  energyUnits: number;
  nextChargingIn?: number | null;
  className?: string;
  showZap?: boolean;
  onRefill?: () => void;
  isRegenerating?: boolean;
}

export default function EnergyIndicator({ 
  energyUnits, 
  nextChargingIn, 
  className = "", 
  showZap = true,
  onRefill,
  isRegenerating = false
}: EnergyIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatTime = (ms: number) => {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const percentage = (energyUnits / MAX_ENERGY) * 100;
  const isRecharging = energyUnits < MAX_ENERGY;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      onClick={() => setIsOpen(!isOpen)}
      className={`relative select-none ${className}`}
    >
      <div className="flex items-center gap-1 shrink-0">
        {/* Glowing Energy Core / Zap Icon */}
        <div className="relative flex items-center justify-center">
          <AnimatePresence>
            {(isRegenerating || isRecharging) && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: isRegenerating ? [1, 1.4, 1] : [1, 1.2, 1],
                  opacity: isRegenerating ? [0.2, 0.6, 0.2] : [0.1, 0.4, 0.1]
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-amber-400 rounded-full blur-md -z-10"
              />
            )}
          </AnimatePresence>

          <Zap 
            size={12} 
            className={`fill-current ${
              energyUnits === 0 
                ? 'text-rose-500 animate-pulse' 
                : energyUnits <= 5 
                ? 'text-orange-500 animate-pulse' 
                : 'text-amber-500'
            }`} 
          />
        </div>

        {/* Energy Text Fraction */}
        <span className="font-display font-extrabold text-slate-850 text-xs">
          {energyUnits}/{MAX_ENERGY}
        </span>
      </div>

      {/* Interactive Tooltip Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            className="absolute top-full right-0 mt-3 w-52 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl z-50 flex flex-col gap-3 border border-white/10"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400 fill-amber-400 animate-pulse" />
                <span className="font-display font-black text-xs">Energy Core</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400 font-bold">
                {energyUnits}/{MAX_ENERGY} Units
              </span>
            </div>

            {/* Shimmering Progress Bar */}
            <div className="relative w-full h-2.5 rounded-full bg-white/10 p-[2px] overflow-hidden">
              <motion.div 
                className="h-full rounded-full relative overflow-hidden"
                initial={false}
                animate={{ 
                  width: `${percentage}%`,
                  backgroundColor: energyUnits <= 5 ? '#EF4444' : '#F59E0B',
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              >
                {isRecharging && (
                  <motion.div 
                    className="absolute inset-0 w-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                    }}
                    animate={{
                      left: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                )}
              </motion.div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-medium">Core Status:</span>
                <span className={`text-[10px] font-black uppercase tracking-wider ${energyUnits === MAX_ENERGY ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {energyUnits === MAX_ENERGY ? 'Fully Charged' : 'Charging...'}
                </span>
              </div>

              {isRecharging && nextChargingIn !== undefined && nextChargingIn !== null && (
                <div className="flex items-center justify-between bg-white/5 p-1.5 rounded-lg border border-white/5">
                  <span className="text-slate-400 text-[9px] flex items-center gap-1">
                    <Clock size={10} /> Next Unit in:
                  </span>
                  <span className="font-mono text-amber-300 text-xs font-bold">
                    {formatTime(nextChargingIn)}
                  </span>
                </div>
              )}
            </div>

            {onRefill && energyUnits < MAX_ENERGY && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRefill();
                  setIsOpen(false);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-[10px] font-black uppercase py-2 rounded-xl transition-all shadow-[0_3px_0_#b45309] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={11} className="text-amber-100 animate-pulse" />
                Instant Refill (500 Cookies)
              </button>
            )}

            <div className="text-[9px] text-slate-400 text-center leading-relaxed font-medium">
              Energy is used to complete study lessons. Recharges 1 unit every hour or refill instantly!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
