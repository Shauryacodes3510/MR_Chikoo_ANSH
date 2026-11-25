import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArenaPhase, ArenaQuestion, ArenaResult, RivalProfile } from '../types/arena.types';
import ArenaMatchmaking from '../components/ArenaMatchmaking';
import ArenaBattle from '../components/ArenaBattle';
import { RaceCountdownOverlay } from '../components/RaceCountdownOverlay';
import { RacePodiumModal } from '../components/RacePodiumModal';
import { 
  DEFAULT_ARENA_QUESTIONS, 
  RIVAL_PROFILES 
} from '../constants/arena.constants';
import { getBattlePools, getBattleStats, saveBattleStats } from '../../../lib/practiceStoreNew';
import { soundManager } from '../../../lib/sounds';
import { useNavigationContext } from '../../student/context/NavigationContext';
import { progressService } from '../../../lib/progressService';
import { 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Zap, 
  Crown
} from 'lucide-react';

const ARENA_BACKGROUND_URL = 'https://i.postimg.cc/nzwyxgYK/chikoo-arena.webp';
const START_RACE_BUTTON_IMAGE_URL = 'https://i.postimg.cc/SsRYvYxv/image-removebg-preview-(4).webp';

interface LeaderboardRacer {
  rank: number;
  name: string;
  avatar: string;
  cups: number;
  isPlayer?: boolean;
}

export default function ArenaPage({ onBack }: { onBack?: () => void }) {
  const [phase, setPhase] = useState<ArenaPhase>('lobby');
  const [questions, setQuestions] = useState<ArenaQuestion[]>(DEFAULT_ARENA_QUESTIONS);
  const [selectedRival] = useState<RivalProfile>(RIVAL_PROFILES[0]);
  const [isAudioMuted, setIsAudioMuted] = useState(!soundManager.isMusicEnabled());
  const [battleResult, setBattleResult] = useState<ArenaResult | null>(null);
  const [playerTrophies, setPlayerTrophies] = useState<number>(0);
  const [bgLoaded, setBgLoaded] = useState<boolean>(false);

  let navContext: any = null;
  try {
    navContext = useNavigationContext();
  } catch {
    // fallback if context not provided
  }

  const handleBack = () => {
    soundManager.play('click');
    soundManager.stopBattleMusic();
    if (onBack) {
      onBack();
    } else if (navContext && navContext.setView) {
      navContext.setView('home');
    }
  };

  // Preload and verify background image & button image
  useEffect(() => {
    const bgImg = new Image();
    bgImg.src = ARENA_BACKGROUND_URL;
    bgImg.onload = () => {
      console.log('[ARENA-BG] loaded', ARENA_BACKGROUND_URL);
      setBgLoaded(true);
    };
    bgImg.onerror = (err) => {
      console.error('[ARENA-BG] failed', ARENA_BACKGROUND_URL, err);
    };

    const btnImg = new Image();
    btnImg.src = START_RACE_BUTTON_IMAGE_URL;
  }, []);

  useEffect(() => {
    try {
      const stats = getBattleStats();
      if (stats && typeof stats.trophies === 'number') {
        setPlayerTrophies(stats.trophies);
      }
        const pools = getBattlePools();
      let rawList: ArenaQuestion[] = DEFAULT_ARENA_QUESTIONS;

      if (pools && pools.length > 0 && pools[0].questions && pools[0].questions.length > 0) {
        rawList = pools[0].questions.map((q: any, i: number) => ({
          id: q.id || `pool_q_${i}`,
          category: q.category || 'AI SPEEDWAY',
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer || q.options[0]
        }));
      }

      // Shuffle options and questions so Option 1 is never predictable!
      const preparedQuestions = rawList
        .map(q => ({
          ...q,
          options: [...q.options].sort(() => Math.random() - 0.5)
        }))
        .sort(() => Math.random() - 0.5);

      setQuestions(preparedQuestions);
    } catch {
      const fallback = DEFAULT_ARENA_QUESTIONS
        .map(q => ({
          ...q,
          options: [...q.options].sort(() => Math.random() - 0.5)
        }))
        .sort(() => Math.random() - 0.5);
      setQuestions(fallback);
    }
  }, []);

  const toggleSound = () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    soundManager.setMusicEnabled(!nextState);
    if (!nextState) {
      soundManager.play('click');
      soundManager.playBattleMusic();
    } else {
      soundManager.stopBattleMusic();
    }
  };

  const handleStartMatchmaking = () => {
    soundManager.play('charge');
    soundManager.play('turbo_boost');

    // Fresh shuffle for the new race
    setQuestions(prev => 
      prev
        .map(q => ({
          ...q,
          options: [...q.options].sort(() => Math.random() - 0.5)
        }))
        .sort(() => Math.random() - 0.5)
    );

    setPhase('matchmaking');
  };

  const handleMatchFound = () => {
    setPhase('countdown');
  };

  const handleCountdownComplete = () => {
    setPhase('battle');
  };

    const handleBattleFinished = (result: ArenaResult) => {
    setBattleResult(result);
    setPhase('finished');

    try {
      const stats = getBattleStats();
      const isWin = result.winnerId === 'player' || result.playerScore >= result.opponentScore;
      if (isWin) {
        const currentTrophies = typeof stats?.trophies === 'number' ? stats.trophies : (playerTrophies || 0);
        const nextTrophies = currentTrophies + (result.trophiesEarned || 30);
        setPlayerTrophies(nextTrophies);
        saveBattleStats({
          ...stats,
          wins: (stats?.wins || 0) + 1,
          streak: (stats?.streak || 0) + 1,
          trophies: nextTrophies,
          coins: (stats?.coins || 0) + (result.cookiesEarned || 0),
          xpEarned: (stats?.xpEarned || 0) + (result.xpEarned || 0)
        });

        // Direct client updates for trophies/xp/gems are blocked by live DB triggers (Task P7).
        // Record battle session via verified RPC:
        if (result.cookiesEarned > 0) {
          progressService.recordPracticeSession(result.cookiesEarned, `arena_${Date.now()}`);
        }
      } else {
        saveBattleStats({
          ...stats,
          losses: (stats?.losses || 0) + 1,
          streak: 0,
          coins: (stats?.coins || 0) + (result.cookiesEarned || 0),
          xpEarned: (stats?.xpEarned || 0) + (result.xpEarned || 0)
        });
      }
    } catch (e) {
      console.warn('Failed to update battle stats:', e);
    }
  };

  const leaderboardRacers: LeaderboardRacer[] = [
    {
      rank: 1,
      name: 'Chikoo',
      avatar: 'https://i.postimg.cc/26s9wx65/fd6286db-33fd-4145-9a55-4ca196446b6d-removebg-preview.png',
      cups: playerTrophies,
      isPlayer: true
    },
    {
      rank: 2,
      name: 'Nova',
      avatar: '🤖',
      cups: 1280
    },
    {
      rank: 3,
      name: 'Pixel',
      avatar: '⚡',
      cups: 1150
    },
    {
      rank: 4,
      name: 'Zeno',
      avatar: '🚀',
      cups: 980
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full h-full min-h-[100dvh] flex flex-col text-white overflow-hidden select-none font-sans"
    >
      
      {/* 1. FULL-SCREEN DEDICATED RACING BACKGROUND (HERO ARTWORK AT Z-0) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={ARENA_BACKGROUND_URL}
          alt="Chikoo Battle Arena"
          className="w-full h-full object-cover object-center select-none"
          referrerPolicy="no-referrer"
          onLoad={() => {
            console.log('[ARENA-BG] loaded', ARENA_BACKGROUND_URL);
            setBgLoaded(true);
          }}
          onError={(err) => {
            console.error('[ARENA-BG] failed', ARENA_BACKGROUND_URL, err);
          }}
        />
        {/* Soft, measured contrast vignette (does NOT darken the racers) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45 pointer-events-none" />
      </div>

      {/* 2. SUBTLE ATMOSPHERIC GLOW PARTICLES (LAYER Z-1) */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* 3. MINIMAL TRANSPARENT TOP BAR HUD (LAYER Z-20) */}
      {phase === 'lobby' && (
        <header className="relative z-20 w-full px-3.5 sm:px-6 pt-3 sm:pt-4 pb-1 flex items-center justify-between max-w-5xl mx-auto bg-transparent">
          
          {/* Left: Minimal Transparent Back Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="p-2 sm:p-2.5 rounded-[16px] text-white transition-all cursor-pointer shadow-none flex items-center justify-center hover:bg-white/10 shrink-0"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}
            aria-label="Back to Base"
          >
            <ArrowLeft size={16} className="text-white" />
          </motion.button>

          {/* Right: Transparent Pill showing Cups/Trophies + Mute Control */}
          <div className="flex items-center gap-2 shrink-0">
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-amber-300 shadow-none tracking-wide select-none"
              style={{
                background: 'transparent',
                border: '1px solid rgba(251, 191, 36, 0.4)'
              }}
            >
              <Trophy size={13} className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]" />
              <span className="font-mono tabular-nums">{playerTrophies.toLocaleString()} CUPS</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSound}
              className="p-2 sm:p-2.5 rounded-[16px] text-white transition-all cursor-pointer shadow-none flex items-center justify-center hover:bg-white/10"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}
              aria-label={isAudioMuted ? 'Unmute' : 'Mute'}
            >
              {isAudioMuted ? <VolumeX size={15} className="text-slate-400" /> : <Volume2 size={15} className="text-cyan-300" />}
            </motion.button>
          </div>
        </header>
      )}

      {/* 4. LOBBY VIEW (LIGHTWEIGHT GAME HUD OVERLAY AT Z-20) */}
      {phase === 'lobby' && (
        <main className="relative z-20 flex-1 flex flex-col justify-between px-3.5 sm:px-6 max-w-5xl mx-auto w-full pt-2 pb-6 sm:pb-8">
          
          {/* CENTER TOP: BATTLE ARENA TITLE TEXT STICKER (2X BIGGER SIZE & CENTERED) */}
          <div className="w-full flex justify-center items-center pt-1 sm:pt-3 pointer-events-none select-none">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex justify-center items-center"
            >
              <img
                src="https://i.postimg.cc/C1V3xkWh/878309c0-6d4b-4e5a-96b5-f58a64e398e8.webp"
                alt="Battle Arena"
                className="h-28 sm:h-40 md:h-48 w-auto max-w-[95vw] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)] filter"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>

          {/* CENTER HERO AREA: Completely clear so Chikoo and the racers dominate the screen */}
          <div className="flex-1 min-h-[60px] sm:min-h-[120px]" />

          {/* BOTTOM SECTION: LEADERBOARD HUD + INFO PILL + START AI RACE CTA */}
          <div className="w-full flex flex-col items-center gap-2 sm:gap-3 max-w-md sm:max-w-xl mx-auto pb-2 sm:pb-4">
            
            {/* REPOSITIONED COMPACT GLASSMORPHISM LEADERBOARD HUD (ABOVE START BUTTON) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="relative overflow-hidden w-full rounded-[20px] p-2.5 sm:p-3 shadow-xl select-none"
              style={{
                background: 'rgba(10, 20, 50, 0.55)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
              }}
            >
              {/* Subtle Glass Shimmer */}
              <div 
                className="absolute inset-0 -translate-x-full animate-shimmer pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)'
                }}
              />

              {/* Leaderboard Header */}
              <div className="relative z-10 flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 px-1">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-200">
                  <Crown size={12} className="text-amber-400" />
                  <span>TOP DUELISTS</span>
                </div>
                <span className="text-[9px] font-mono font-bold text-sky-300 tracking-wider">
                  SEASON 1
                </span>
              </div>

              {/* 4-Item Horizontal Grid of Racers */}
              <div className="relative z-10 grid grid-cols-4 gap-1.5">
                {leaderboardRacers.map((racer) => (
                  <div
                    key={racer.name}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all text-center ${
                      racer.isPlayer
                        ? 'bg-sky-500/25 border border-sky-400/60 shadow-[0_0_10px_rgba(56,189,248,0.3)] ring-1 ring-sky-300/40'
                        : 'bg-slate-900/40 border border-white/5'
                    }`}
                  >
                    {/* Rank & Avatar */}
                    <div className="relative mb-1">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden flex items-center justify-center bg-slate-800/90 border border-white/15 mx-auto">
                        {racer.avatar.startsWith('http') ? (
                          <img
                            src={racer.avatar}
                            alt={racer.name}
                            referrerPolicy="no-referrer"
                            className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                          />
                        ) : (
                          <span className="text-sm">{racer.avatar}</span>
                        )}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 font-mono text-[8px] font-black px-1 rounded-full ${
                        racer.rank === 1 ? 'bg-amber-400 text-slate-950' : racer.rank === 2 ? 'bg-slate-300 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}>
                        #{racer.rank}
                      </span>
                    </div>

                    {/* Name */}
                    <span className={`text-[10px] sm:text-[11px] font-extrabold truncate w-full ${
                      racer.isPlayer ? 'text-white' : 'text-slate-200'
                    }`}>
                      {racer.name}
                    </span>

                    {/* Cups */}
                    <span className="font-mono text-[9px] sm:text-[10px] font-black text-amber-300 flex items-center justify-center gap-0.5 mt-0.5">
                      <span className="tabular-nums">{racer.cups.toLocaleString()}</span>
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* PRIMARY ACTION CTA: Relocated slightly lower down on screen */}
            <motion.button
              whileHover={{ scale: 1.05, filter: 'drop-shadow(0 12px 36px rgba(245, 158, 11, 0.8))' }}
              whileTap={{ scale: 0.94 }}
              onClick={handleStartMatchmaking}
              className="relative p-0 border-0 bg-transparent cursor-pointer flex items-center justify-center outline-none select-none focus:outline-none transition-all mt-2 sm:mt-4 mb-2 pt-1"
              aria-label="Start AI Race"
            >
              <img
                src={START_RACE_BUTTON_IMAGE_URL}
                alt="Start AI Race"
                className="w-auto h-28 sm:h-36 md:h-40 max-w-[95vw] object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.7)] select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </motion.button>

          </div>

        </main>
      )}

      {/* 5. MATCHMAKING (LAYER Z-30) */}
      {phase === 'matchmaking' && (
        <div className="relative z-30 w-full flex-1 flex flex-col min-h-[100dvh]">
          <ArenaMatchmaking
            rival={selectedRival}
            onMatchFound={handleMatchFound}
            onCancel={() => setPhase('lobby')}
          />
        </div>
      )}

      {/* 6. COUNTDOWN (LAYER Z-30) */}
      {phase === 'countdown' && (
        <div className="relative z-30 w-full flex-1 flex flex-col min-h-[100dvh]">
          <RaceCountdownOverlay
            rival={selectedRival}
            onComplete={handleCountdownComplete}
          />
        </div>
      )}

      {/* 7. ACTIVE REAL-TIME RACING BATTLE (LAYER Z-30) */}
      {phase === 'battle' && (
        <div className="absolute inset-0 z-30 w-full h-full overflow-hidden">
          <ArenaBattle
            questions={questions}
            rival={selectedRival}
            boosterBonus={25}
            onFinished={handleBattleFinished}
          />
        </div>
      )}

      {/* 8. PODIUM RECAP & REWARDS (LAYER Z-30) */}
      {phase === 'finished' && battleResult && (
        <div className="relative z-30 w-full flex-1 flex flex-col min-h-[100dvh]">
          <RacePodiumModal
            result={battleResult}
            rival={selectedRival}
            onPlayAgain={() => {
              setPhase('matchmaking');
            }}
            onBack={handleBack}
          />
        </div>
      )}

    </motion.div>
  );
}

