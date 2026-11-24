import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import TopStatusBar from './TopStatusBar';
import { World, UserWorldProgress } from '../lib/supabase';

interface HeaderProps {
  xp: number;
  gems: number;
  rank?: number;
  charging: number; // This is now energy unit count (0-25)
  nextChargingIn: number | null;
  onRefillRequest?: () => void;
  isRegenerating?: boolean;
  avatarId?: string;
  onProfileClick?: () => void;
  streak?: number;
  isPracticeView?: boolean;
  activeRankName?: string;
  activeRankEmoji?: string;
  hideRank?: boolean;
  // World selection properties
  worlds?: World[];
  selectedWorldId?: string;
  userWorldProgress?: UserWorldProgress[];
  onSelectWorld?: (worldId: string) => void;
  // Offline & network status properties
  isOffline?: boolean;
  isSlowConnection?: boolean;
  justReconnected?: boolean;
}

function Header({ 
  gems,
  charging: energyUnits, 
  onRefillRequest,
  onProfileClick,
  streak = 0,
  worlds,
  selectedWorldId,
  userWorldProgress,
  onSelectWorld,
  isOffline = false,
  isSlowConnection = false,
  justReconnected = false
}: HeaderProps) {
  const showBanner = isOffline || isSlowConnection || justReconnected;

  return (
    <div className="absolute top-0 left-0 w-full z-[200] pointer-events-none">
      <div className="pointer-events-auto">
        <TopStatusBar 
          streak={streak}
          gems={gems}
          energy={energyUnits}
          onRefillRequest={onRefillRequest}
          onProfileClick={onProfileClick}
          worlds={worlds}
          selectedWorldId={selectedWorldId}
          userWorldProgress={userWorldProgress}
          onSelectWorld={onSelectWorld}
          isOffline={isOffline}
          isSlowConnection={isSlowConnection}
        />
      </div>

      {/* Subtle, non-intrusive Floating Network Status Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.94 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex justify-center mt-1 pointer-events-auto select-none px-4"
          >
            <div 
              className={`px-3 py-1 rounded-full backdrop-blur-md shadow-xs border flex items-center gap-1.5 text-[10.5px] font-black tracking-wide transition-all ${
                justReconnected
                  ? 'bg-emerald-500/90 dark:bg-emerald-600/90 text-white border-emerald-400 shadow-[0_2px_8px_rgba(16,185,129,0.25)]'
                  : isOffline
                  ? 'bg-slate-900/85 dark:bg-slate-800/90 text-slate-100 border-slate-700/60 shadow-[0_2px_8px_rgba(0,0,0,0.2)]'
                  : 'bg-amber-500/90 dark:bg-amber-600/90 text-white border-amber-400 shadow-[0_2px_8px_rgba(245,158,11,0.25)]'
              }`}
            >
              {justReconnected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>Back online</span>
                </>
              ) : isOffline ? (
                <>
                  <WifiOff size={12} className="stroke-[2.5] text-amber-400 shrink-0" />
                  <span>Working offline</span>
                </>
              ) : (
                <>
                  <Wifi size={12} className="stroke-[2.5] text-amber-200 animate-pulse shrink-0" />
                  <span>Slow internet • Working offline</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(Header);
