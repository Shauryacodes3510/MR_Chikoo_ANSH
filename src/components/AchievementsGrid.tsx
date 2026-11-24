import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Lock, Star, Award, Zap, Compass, ChevronRight, X, Heart, Shield, HelpCircle, Eye } from 'lucide-react';
import { soundManager } from '../lib/sounds';
import { ALL_BADGES } from '../constants';
import ConfettiEffect from './ConfettiEffect';

interface AchievementsGridProps {
  earnedBadges: string[];
  onUnlockBadge?: (badgeId: string) => void;
  onAddXp?: (amount: number) => void;
}

// Map Badges to clean light themed styles
const BADGE_RARITIES: Record<string, {
  tier: string;
  border: string;
  bg: string;
  textColor: string;
  badgeBg: string;
}> = {
  'b1': { tier: 'Common', border: 'border-slate-200', bg: 'bg-slate-50', textColor: 'text-slate-700', badgeBg: 'bg-slate-100' },
  'b2': { tier: 'Common', border: 'border-slate-200', bg: 'bg-slate-50', textColor: 'text-slate-700', badgeBg: 'bg-slate-100' },
  'b3': { tier: 'Rare', border: 'border-sky-100', bg: 'bg-sky-50/50', textColor: 'text-sky-700', badgeBg: 'bg-sky-50' },
  'b4': { tier: 'Rare', border: 'border-sky-100', bg: 'bg-sky-50/50', textColor: 'text-sky-700', badgeBg: 'bg-sky-50' },
  'b5': { tier: 'Epic', border: 'border-purple-100', bg: 'bg-purple-50/50', textColor: 'text-purple-700', badgeBg: 'bg-purple-50' },
  'b6': { tier: 'Epic', border: 'border-purple-100', bg: 'bg-purple-50/50', textColor: 'text-purple-700', badgeBg: 'bg-purple-50' },
  'b7': { tier: 'Legendary', border: 'border-amber-200', bg: 'bg-amber-50/45', textColor: 'text-amber-700', badgeBg: 'bg-amber-50' },
  'b8': { tier: 'Mythic', border: 'border-rose-200', bg: 'bg-rose-50/45', textColor: 'text-rose-700', badgeBg: 'bg-rose-50' }
};

// Simple clean stickers list
const STICKERS = [
  { id: 's1', name: 'Neural Network', badgeId: 'b1', emoji: '🧠', desc: 'A beautiful visual of brain synapses firing together.', rarity: 'Common' },
  { id: 's2', name: 'Chikoo Robot Pup', badgeId: 'b2', emoji: '🤖', desc: 'Your smart autonomous digital dog friend.', rarity: 'Common' },
  { id: 's3', name: 'Quantum Gem', badgeId: 'b3', emoji: '💎', desc: 'A shiny crystal lattice of high-speed data calculations.', rarity: 'Rare' },
  { id: 's4', name: 'Ethics Guard', badgeId: 'b5', emoji: '🛡️', desc: 'A helper robot that keeps AI fair and helpful for all.', rarity: 'Epic' },
  { id: 's5', name: 'Privacy Key', badgeId: 'b6', emoji: '🔑', desc: 'An unbreakable mathematical key that secures personal data.', rarity: 'Epic' },
  { id: 's6', name: 'Starship Cruiser', badgeId: 'b8', emoji: '🛰️', desc: 'A space voyager propelled by smart AI software.', rarity: 'Mythic' }
];

export default function AchievementsGrid({ earnedBadges, onUnlockBadge, onAddXp }: AchievementsGridProps) {
  const [activeTab, setActiveTab] = useState<'badges' | 'stickers' | 'leagues'>('badges');
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [selectedSticker, setSelectedSticker] = useState<any | null>(null);
  const [ceremonyActive, setCeremonyActive] = useState(false);
  const [ceremonyStage, setCeremonyStage] = useState<'dormant' | 'spinning' | 'revealed'>('dormant');
  const [confettiActive, setConfettiActive] = useState(false);

  const startUnlockCeremony = (badge: any) => {
    soundManager.play('click');
    const isEarned = earnedBadges.includes(badge.id);

    if (isEarned) {
      setSelectedBadge(badge);
      setCeremonyActive(false);
    } else {
      setSelectedBadge(badge);
      setCeremonyActive(true);
      setCeremonyStage('dormant');
    }
  };

  const handleOrbShatter = () => {
    soundManager.play('click');
    setCeremonyStage('spinning');

    setTimeout(() => {
      soundManager.play('complete');
      setCeremonyStage('revealed');
      setConfettiActive(true);
      onUnlockBadge?.(selectedBadge.id);
      onAddXp?.(100);
    }, 1500);
  };

  return (
    <div className="space-y-6 text-slate-800 w-full text-left">
      <ConfettiEffect active={confettiActive} onComplete={() => setConfettiActive(false)} />

      {/* Tabs navigation - Clean gray pill styling */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 shadow-2xs">
        {(['badges', 'stickers', 'leagues'] as const).map((tab, tIdx) => (
          <button
            key={`achieve-tab-${tab}-${tIdx}`}
            onClick={() => {
              soundManager.play('click');
              setActiveTab(tab);
            }}
            className={`flex-1 py-2.5 rounded-xl font-display font-black text-[11px] uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === tab 
                ? 'bg-white border border-slate-200/40 text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            {tab === 'badges' && '🏅 Badges'}
            {tab === 'stickers' && '📖 Stickers'}
            {tab === 'leagues' && '🏆 Leagues'}
          </button>
        ))}
      </div>

      {/* Viewport content */}
      <AnimatePresence mode="wait">
        {activeTab === 'badges' && (
          <motion.div
            key="badges-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center px-1">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                  My Milestones
                </span>
                <h3 className="text-sm font-display font-black text-slate-800 mt-2">Unlocked Badges</h3>
              </div>
              <div className="text-right bg-white border border-slate-100 px-3 py-1.5 rounded-xl shadow-2xs">
                <p className="text-xs font-display font-black text-sky-600">
                  {earnedBadges.length} / {ALL_BADGES.length}
                </p>
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider">COMPLETED</p>
              </div>
            </div>

            {/* Grid of badges */}
            <div className="grid grid-cols-4 gap-3 bg-white p-4 border border-slate-100 rounded-3xl shadow-2xs">
              {ALL_BADGES.map((badge, bIdx) => {
                const isEarned = earnedBadges.includes(badge.id);
                const metadata = BADGE_RARITIES[badge.id] || BADGE_RARITIES.b1;
                const Icon = badge.icon;

                return (
                  <motion.div
                    key={`achieve-badge-${badge.id}-${bIdx}`}
                    whileHover={isEarned ? { scale: 1.1, rotate: [0, -2, 2, 0] } : { scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startUnlockCeremony(badge)}
                    className={`aspect-square rounded-2xl flex items-center justify-center cursor-pointer relative border transition-all duration-300 ${
                      isEarned 
                        ? `${metadata.bg} ${metadata.border} shadow-2xs` 
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    }`}
                  >
                    {isEarned ? (
                      <div className="relative">
                        <Icon className={`w-8 h-8 ${badge.color}`} />
                        <span className="absolute -top-3 -right-3 text-[10px]">✨</span>
                      </div>
                    ) : (
                      <div className="relative flex flex-col items-center">
                        <Lock className="w-5 h-5 text-slate-400" />
                        <span className="text-[7px] text-slate-400 font-black uppercase mt-1 tracking-wider">Locked</span>
                      </div>
                    )}

                    {isEarned && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-500 shadow-sm" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Quick Helper Banner */}
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-center">
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                💡 Tap on any locked milestone to complete or unlock its badge with your collected Cookies!
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'stickers' && (
          <motion.div
            key="stickers-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            <div className="px-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                Sticker Album
              </span>
              <h3 className="text-sm font-display font-black text-slate-800 mt-2">Earned Stickers</h3>
            </div>

            {/* Stickers album grid */}
            <div className="grid grid-cols-3 gap-3 bg-white p-4 border border-slate-100 rounded-3xl shadow-2xs">
              {STICKERS.map((st, sIdx) => {
                const isCollected = earnedBadges.includes(st.badgeId);

                return (
                  <motion.div
                    key={`achieve-sticker-${st.id}-${sIdx}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      soundManager.play('click');
                      setSelectedSticker(st);
                    }}
                    className={`aspect-[4/5] rounded-2xl flex flex-col items-center justify-between p-3 border relative transition-all duration-300 overflow-hidden ${
                      isCollected
                        ? 'bg-purple-50/20 border-purple-100/60 shadow-xs cursor-pointer'
                        : 'bg-slate-50 border-slate-100 opacity-50'
                    }`}
                  >
                    {!isCollected && (
                      <div className="absolute inset-0 bg-slate-50/80 flex items-center justify-center text-slate-400 text-2xl font-black">
                        ?
                      </div>
                    )}

                    <span className="text-[7.5px] font-mono font-black uppercase tracking-widest text-slate-400 self-start">
                      {st.rarity}
                    </span>

                    <div className="text-4xl my-2 select-none">
                      {st.emoji}
                    </div>

                    <div className="w-full text-center">
                      <p className="text-[9px] font-black text-slate-700 truncate leading-none">
                        {st.name}
                      </p>
                      <span className={`text-[7px] font-black uppercase mt-1 inline-block ${isCollected ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {isCollected ? '★ UNLOCKED' : '★ LOCKED'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'leagues' && (
          <motion.div
            key="leagues-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            <div className="px-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                League Road
              </span>
              <h3 className="text-sm font-display font-black text-slate-800 mt-2">School Leagues</h3>
            </div>

            {/* Light clean leagues progress road */}
            <div className="bg-white border border-slate-100 rounded-3xl p-4 space-y-3 shadow-2xs">
              {[
                { name: 'Bronze League', icon: '🪐', desc: 'Starting place for new learners.', active: true },
                { name: 'Silver League', icon: '🛰️', desc: 'Complete 3 lessons to enter.', active: false },
                { name: 'Gold League', icon: '☄️', desc: 'Get 80%+ score on your quizzes to enter.', active: false },
                { name: 'Master League', icon: '🌟', desc: 'Unlock the highest level badge to enter.', active: false }
              ].map((league, i) => (
                <div 
                  key={`achieve-league-${league.name}-${i}`} 
                  className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all ${
                    league.active 
                      ? 'bg-sky-50/50 border-sky-100 shadow-xs' 
                      : 'bg-slate-50/50 border-slate-100 opacity-60'
                  }`}
                >
                  <div className="text-2xl w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-slate-100 shadow-2xs">
                    {league.icon}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-slate-800">{league.name}</h4>
                    <p className="text-[9px] text-slate-500 font-medium leading-tight mt-0.5">{league.desc}</p>
                  </div>
                  {league.active && (
                    <span className="ml-auto text-[8px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                      ACTIVE
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unlock & Ceremony Modal for Locked Badges */}
      <AnimatePresence>
        {selectedBadge && ceremonyActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[500] flex items-center justify-center p-5 text-center select-none"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white border-2 border-amber-200 rounded-[2.5rem] p-6 text-center space-y-5 relative overflow-hidden text-slate-800 shadow-2xl"
            >
              {ceremonyStage === 'dormant' && (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold tracking-wider text-amber-800 bg-amber-100 px-3.5 py-1 rounded-full border border-amber-300 uppercase inline-block">
                      🔒 Locked Milestone
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 pt-2">{selectedBadge.name}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{selectedBadge.requirement}</p>
                  </div>

                  {/* Core lock orb with Chikoo encouraging speech bubble */}
                  <div className="my-6 relative flex flex-col items-center justify-center">
                    <motion.div 
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-24 h-24 bg-gradient-to-br from-amber-50 to-sky-50 rounded-full flex items-center justify-center border-4 border-amber-200 cursor-pointer shadow-md relative z-10"
                      onClick={handleOrbShatter}
                    >
                      <Lock className="w-9 h-9 text-amber-500" />
                    </motion.div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <button 
                      onClick={handleOrbShatter}
                      className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 active:scale-[0.98] text-white font-extrabold text-sm py-3.5 px-4 rounded-2xl transition-all shadow-[0_4px_0_#0284c7] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Unlock Badge Instantly</span>
                      <Sparkles size={16} className="fill-white" />
                    </button>
                    <button 
                      onClick={() => setSelectedBadge(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-extrabold uppercase tracking-wider cursor-pointer py-1"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}

              {ceremonyStage === 'spinning' && (
                <div className="py-10 space-y-4 flex flex-col items-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center border-4 border-amber-300 shadow-md"
                  >
                    <Sparkles className="w-10 h-10 text-amber-500" />
                  </motion.div>
                  <p className="text-xs font-black text-amber-600 animate-pulse uppercase tracking-wider">
                    Unlocking Milestone Badge...
                  </p>
                </div>
              )}

              {ceremonyStage === 'revealed' && (
                <>
                  {/* Playful Chikoo Cheer Header */}
                  <div className="flex items-center justify-center gap-2.5 mb-1">
                    <img
                      src="/heading_aibo.webp"
                      alt="Chikoo"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/avatar.webp'; }}
                      className="w-12 h-12 object-contain shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="bg-emerald-100 border border-emerald-300 rounded-xl px-3 py-1.5 text-left">
                      <p className="text-[11px] font-extrabold text-emerald-900 leading-tight">
                        "Woohoo! Genius move!"
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-wider text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full border border-emerald-300 uppercase inline-block">
                      ✨ BADGE UNLOCKED!
                    </span>
                    <h3 className="text-2xl font-extrabold text-slate-900 pt-1">{selectedBadge.name}</h3>
                  </div>

                  {/* Bouncing Badge Spotlight */}
                  <div className="my-5 relative flex items-center justify-center py-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-amber-300/40 via-yellow-200/30 to-amber-400/40 blur-lg pointer-events-none"
                    />
                    <motion.div 
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: [0, 1.25, 0.95, 1], rotate: [-20, 10, -5, 0] }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="w-24 h-24 bg-gradient-to-br from-amber-50 to-orange-50 border-4 border-amber-300 rounded-3xl flex items-center justify-center shadow-lg relative z-10"
                    >
                      {(() => {
                        const Icon = selectedBadge.icon;
                        return <Icon className={`w-12 h-12 ${selectedBadge.color} drop-shadow-sm`} />;
                      })()}
                    </motion.div>
                  </div>

                  {/* Concise Reward Badge */}
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-sm shadow-xs">
                    <span>Reward Earned:</span>
                    <span className="text-amber-700 font-black">+100 Cookies 🍪</span>
                  </div>

                  <div className="pt-3">
                    <button 
                      onClick={() => setSelectedBadge(null)}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98] text-white font-extrabold text-base py-3.5 rounded-2xl transition-all shadow-[0_4px_0_#047857] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>AWESOME!</span>
                      <Sparkles size={18} className="fill-white" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Inspection Card for Earned Badges */}
        {selectedBadge && !ceremonyActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[500] flex items-center justify-center p-5 text-center select-none"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="w-full max-w-sm bg-white border-2 border-sky-200 rounded-[2.5rem] p-6 text-center space-y-5 relative overflow-hidden text-slate-800 shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Playful Chikoo Greeting Header */}
              <div className="flex items-center justify-center gap-2.5">
                <img
                  src="/heading_aibo.webp"
                  alt="Chikoo"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/avatar.webp'; }}
                  className="w-12 h-12 object-contain shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="bg-sky-100 border border-sky-300 rounded-xl px-3 py-1.5 text-left">
                  <p className="text-[11px] font-extrabold text-sky-900 leading-tight">
                    "Look at this shiny badge!"
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black tracking-wider text-sky-800 bg-sky-100 border border-sky-300 px-3.5 py-1 rounded-full uppercase inline-block">
                  🏅 Unlocked Badge
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 pt-1">{selectedBadge.name}</h3>
                <p className="text-xs text-slate-500 font-semibold">{selectedBadge.requirement}</p>
              </div>

              <div className="my-4 relative flex items-center justify-center py-2">
                <motion.div 
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-24 h-24 bg-gradient-to-br from-sky-50 to-indigo-50 border-4 border-sky-200 rounded-3xl flex items-center justify-center shadow-md"
                >
                  {(() => {
                    const Icon = selectedBadge.icon;
                    return <Icon className={`w-12 h-12 ${selectedBadge.color} drop-shadow-sm`} />;
                  })()}
                </motion.div>
              </div>

              <div>
                <button 
                  onClick={() => setSelectedBadge(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 font-extrabold text-sm py-3.5 rounded-2xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Detailed sticker inspect view */}
        {selectedSticker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[500] flex items-center justify-center p-6 text-center"
            onClick={() => setSelectedSticker(null)}
          >
            {(() => {
              const isCollected = earnedBadges.includes(selectedSticker.badgeId);
              return (
                <motion.div 
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="w-full max-w-sm bg-white border border-slate-100 rounded-[2.5rem] p-6 text-center space-y-6 relative overflow-hidden text-slate-800 shadow-xl"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="space-y-1">
                    <span className="text-[9px] font-black tracking-wider text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full uppercase">
                      Sticker Album
                    </span>
                    <h3 className="text-xl font-display font-black text-slate-800 pt-3">{selectedSticker.name}</h3>
                    <span className="text-[8px] font-black text-sky-600 tracking-wider">RARITY: {selectedSticker.rarity.toUpperCase()}</span>
                  </div>

                  <div className="my-6 relative flex items-center justify-center py-2">
                    <motion.div 
                      animate={isCollected ? { y: [0, -8, 0], rotateY: 360 } : {}}
                      transition={{ rotateY: { duration: 1.5 }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
                      className="text-6xl select-none"
                    >
                      {selectedSticker.emoji}
                    </motion.div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-left">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">
                        Sticker Bio
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">
                        {isCollected ? selectedSticker.desc : "This sticker is locked. Earn its matching badge to add this beautiful sticker to your collection!"}
                      </p>
                    </div>

                    <button 
                      onClick={() => setSelectedSticker(null)}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs py-3 rounded-xl active:scale-95 transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
