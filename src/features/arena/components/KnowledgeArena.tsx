import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Zap } from 'lucide-react';

/**
 * COMPONENT: KnowledgeArena
 * Style Specification: Futuristic dark navy #03071C, neon cyan/violet accents, 1px glowing borders.
 */
const KnowledgeArena = ({ onlineCount = 247, energy = 80, battleStats = { wins: 0, trophies: 0, streak: 0 }, onClick }) => {
  return (
    <div className="space-y-4 pt-1 font-sans cursor-pointer" onClick={onClick}>
      {/* 1. Header Section */}
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
        <h3 className="text-xs sm:text-sm font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
          <Swords size={13} className="text-cyan-400 animate-pulse" />
          <span>Knowledge Arena</span>
        </h3>
        {/* Live Online Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/50 border border-slate-700">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
          </span>
          <span className="text-[8.5px] font-mono font-black text-cyan-300 uppercase tracking-wider">
            {onlineCount} Online
          </span>
        </div>
      </div>

      {/* 2. Main Futuristic Container */}
      <div className="bg-[#03071C] border border-cyan-500/30 text-white rounded-xl p-6 space-y-4 relative overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.1)] text-left">
        
        {/* Futuristic Grid Overlay */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_1px,#ffffff05_1px,#ffffff05_2px)] pointer-events-none" />

        {/* Content Wrapper */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <span>⚔️ ARENA CHALLENGE</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs">
                Test your AI logic in active speed-run duels with other students!
              </p>
            </div>
            
            {/* Energy Badge */}
            <div className="bg-slate-900 border border-cyan-500/30 text-cyan-400 px-2 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 shrink-0 font-mono">
              <Zap size={9} className="fill-current text-cyan-400 animate-pulse" />
              <span>{energy}% Energy</span>
            </div>
          </div>

          {/* Metrics Stats Row */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-black uppercase border-t border-cyan-500/20 pt-3">
            <div className="flex items-center gap-4">
              <div>WINS: <span className="text-white font-extrabold">{battleStats.wins}</span></div>
              <div className="w-[1px] h-3 bg-cyan-500/20" />
              <div>RATING: <span className="text-violet-400 font-extrabold">⭐ {battleStats.trophies}</span></div>
              <div className="w-[1px] h-3 bg-cyan-500/20" />
              <div>STREAK: <span className="text-rose-400 font-extrabold">🔥 {battleStats.streak}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeArena;
