import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lightbulb, Star, Quote, Heart, Flame, Gift, Volume2, VolumeX, X, ShieldAlert, Bookmark, RotateCcw, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { soundManager } from '../../lib/sounds';
import EnergyIndicator from '../ui/EnergyIndicator';

interface StoryAudioControlProps {
  isPlaying: boolean;
  isLoading: boolean;
  hasAudio: boolean;
  onTogglePlay: () => void;
  onReplay: () => void;
  currentLang?: string;
  onLangChange?: (lang: string) => void;
  className?: string;
}

export const MinimalStoryAudioControl: React.FC<StoryAudioControlProps> = ({
  isPlaying,
  isLoading,
  hasAudio,
  onTogglePlay,
  onReplay,
  currentLang = 'en',
  onLangChange = () => {},
  className = ""
}) => {
  const languages = [
    { id: 'en', label: 'English' },
    { id: 'hinglish', label: 'Hinglish' },
    { id: 'mr', label: 'मराठी' }
  ];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 select-none bg-black/35 hover:bg-black/50 border border-white/10 text-white backdrop-blur-md shadow-md ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
        disabled={isLoading}
        className="p-1 rounded-full transition-transform active:scale-90 cursor-pointer flex items-center justify-center text-amber-300 hover:text-amber-200"
        title={isPlaying ? "Pause Narration" : "Play Narration"}
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin text-amber-300" />
        ) : isPlaying ? (
          <span className="relative flex items-center justify-center">
            <Volume2 size={15} className="text-amber-300 animate-pulse" />
          </span>
        ) : (
          <Volume2 size={15} />
        )}
      </button>

      <div className="w-[1px] h-3.5 bg-white/20" />

      <select
        value={currentLang}
        onChange={(e) => {
          e.stopPropagation();
          onLangChange(e.target.value);
        }}
        className="bg-transparent text-[11px] font-bold text-white border-none focus:outline-none cursor-pointer appearance-none px-1"
        onClick={(e) => e.stopPropagation()}
      >
        {languages.map((lang) => (
          <option key={lang.id} value={lang.id} className="text-black bg-white">
            {lang.label}
          </option>
        ))}
      </select>

      <div className="w-[1px] h-3.5 bg-white/20" />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onReplay();
        }}
        disabled={isLoading}
        className="p-1 rounded-full transition-transform active:scale-90 cursor-pointer text-white/70 hover:text-white"
        title="Replay Story Narration"
      >
        <RotateCcw size={13} />
      </button>
    </div>
  );
};

interface VisualLessonScreenProps {
  contentData: {
    id?: string;
    sceneType?: 'hero' | 'dialogue' | 'comic' | 'cinematic' | 'surprise' | string;
    mediaType?: 'image' | 'gif' | 'video' | string;
    mediaUrl?: string;
    badge?: string;
    heading?: string;
    subheading?: string;
    contentBody?: string;
    highlightBox?: string;
    quote?: string;
    quoteAuthor?: string;
    bottomMessage?: string;
  };
  onSelect: (option: boolean) => void;
  selectedOption: any;
  isChecked: boolean;
  onContinue?: () => void;
  progress?: number;
  currentIndex?: number;
  totalChallenges?: number;
  onClose?: () => void;
  onPrevious?: () => void;
  canGoPrevious?: boolean;
  onNext?: () => void;
  canGoNext?: boolean;
  energy?: number;
  nextEnergyIn?: number;
  audioIsPlaying?: boolean;
  audioIsLoading?: boolean;
  audioHasAudio?: boolean;
  onTogglePlay?: () => void;
  onReplay?: () => void;
  language?: string;
  onLanguageChange?: (lang: string) => void;
}

export default function VisualLessonScreen({
  contentData,
  onSelect,
  selectedOption,
  isChecked,
  onContinue,
  progress,
  currentIndex,
  totalChallenges,
  onClose,
  onPrevious,
  canGoPrevious = false,
  onNext,
  canGoNext = false,
  energy,
  nextEnergyIn,
  audioIsPlaying = false,
  audioIsLoading = false,
  audioHasAudio = false,
  onTogglePlay = () => {},
  onReplay = () => {},
  language = 'en',
  onLanguageChange = () => {}
}: VisualLessonScreenProps) {
  const {
    sceneType = 'hero',
    mediaType = 'image',
    mediaUrl,
    badge,
    heading,
    subheading,
    contentBody,
    highlightBox,
    quote,
    quoteAuthor,
    bottomMessage
  } = contentData || {};

  const isCelebrationInitial = (sceneType || '').toLowerCase().includes('celebration');
  const [isRevealed, setIsRevealed] = useState(isCelebrationInitial);
  const [bounceDialogue, setBounceDialogue] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => soundManager.isEnabled() && soundManager.isMusicEnabled());

  useEffect(() => {
    const unsubscribe = soundManager.subscribe(() => {
      setSoundEnabled(soundManager.isEnabled() && soundManager.isMusicEnabled());
    });
    return unsubscribe;
  }, []);
  const [visibleBubbleCount, setVisibleBubbleCount] = useState(1);
  const [visibleComicCount, setVisibleComicCount] = useState(1);

  // Auto-accept/read on mount so continuing is enabled automatically
  useEffect(() => {
    onSelect(true);
  }, [onSelect]);

  // Reset surprise reveal and dialogue steps when contentData changes (e.g. user navigates slides)
  useEffect(() => {
    const isCelebration = (sceneType || '').toLowerCase().includes('celebration');
    setIsRevealed(isCelebration);
    setVisibleBubbleCount(1);
    setVisibleComicCount(1);
  }, [contentData?.id]);

  // Play dialog bounce effect
  const triggerDialogueBounce = () => {
    setBounceDialogue(true);
    setTimeout(() => setBounceDialogue(false), 500);
  };

  const handleRevealSurprise = () => {
    setIsRevealed(true);
    soundManager.play('complete');
  };

  // Helper to parse contentBody into separate paragraphs/bullet lists
  const getParagraphs = (text?: string) => {
    if (!text) return [];
    return text.split(/\|\|\||\n/).map(p => p.trim()).filter(Boolean);
  };

  const paragraphs = getParagraphs(contentBody);

  // RENDER HERO SCENE (SPECTACULAR INTRO CARD)
  const renderHeroScene = () => {
    // Safe fallbacks for preview mode
    const displayProgress = typeof progress === 'number' ? progress : 45;
    const displayIndex = typeof currentIndex === 'number' ? currentIndex : 2;
    const displayTotal = typeof totalChallenges === 'number' ? totalChallenges : 5;
    const displayEnergy = typeof energy === 'number' ? energy : 25;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute inset-0 z-[450] bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none"
        id="hero_scene"
      >
        {/* Full-Screen Immersive Background Illustration */}
        <div className="absolute inset-0 z-0">
          <motion.img
            src={mediaUrl || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop"}
            alt={heading || "Hero Background"}
            referrerPolicy="no-referrer"
            animate={{ 
              scale: [1.02, 1.05, 1.02],
              rotate: [0.1, -0.1, 0.1]
            }}
            transition={{
              repeat: Infinity,
              duration: 20,
              ease: "linear"
            }}
            className="w-full h-full object-cover filter brightness-[0.85] contrast-[1.05]"
          />
          {/* Movie-grade Vignette overlay: deep smooth black gradient from bottom for perfect readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/30" />
        </div>

        {/* Floating Transparent Top HUD */}
        <div className="absolute top-0 inset-x-0 p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 z-50 bg-gradient-to-b from-black/50 to-transparent">
          {/* Back/Close & Previous Buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (onClose) onClose();
              }} 
              className="w-10 h-10 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center transition-all border border-white/10 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
              title="Close Lesson"
            >
              <X className="w-5 h-5" />
            </button>

            {onPrevious && (
              <button
                type="button"
                disabled={!canGoPrevious}
                onClick={onPrevious}
                className="w-10 h-10 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center transition-all border border-white/10 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md disabled:opacity-30 disabled:pointer-events-none"
                title="Previous Screen"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Floating Lesson Progress Bar */}
          <div className="flex-1 h-3.5 bg-white/15 backdrop-blur-md rounded-full overflow-hidden border border-white/10 shadow-inner max-w-xs sm:max-w-md">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]"
            />
          </div>

          {onNext && canGoNext && (
            <button
              type="button"
              onClick={onNext}
              className="w-10 h-10 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center transition-all border border-white/10 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
              title="Next Screen"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Indicators & Music Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-display font-black text-white/95 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {displayIndex + 1} / {displayTotal}
            </span>
            <EnergyIndicator 
              energyUnits={displayEnergy} 
              nextChargingIn={nextEnergyIn} 
              showZap={true} 
              className="scale-75 origin-right text-white select-none pointer-events-none" 
            />

            {/* Premium Sound/Music Toggle Button */}
            <button
              onClick={(e) => {
                const nextState = !(soundManager.isEnabled() && soundManager.isMusicEnabled());
                soundManager.setEnabled(nextState);
                soundManager.setMusicEnabled(nextState);
              }}
              className="w-10 h-10 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center transition-all border border-white/10 relative hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
              title="Toggle Audio Feedback"
            >
              {soundEnabled ? (
                <Volume2 className="w-4.5 h-4.5 text-amber-300" />
              ) : (
                <VolumeX className="w-4.5 h-4.5 text-white/60" />
              )}
              
              {/* Dynamic Equalizer sound waves */}
              {soundEnabled && (
                <div className="absolute bottom-1.5 flex items-end gap-[1.5px] h-2">
                  {[1, 2, 3].map((bar) => (
                    <motion.div
                      key={`hero-sound-bar-${bar}`}
                      animate={{ height: [3, 9, 3] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.5 + bar * 0.12,
                        ease: "easeInOut"
                      }}
                      className="w-[1.5px] bg-amber-300 rounded-full"
                    />
                  ))}
                </div>
              )}
            </button>
            <MinimalStoryAudioControl
              isPlaying={audioIsPlaying}
              isLoading={audioIsLoading}
              hasAudio={audioHasAudio}
              onTogglePlay={onTogglePlay}
              onReplay={onReplay}
              currentLang={language}
              onLangChange={onLanguageChange}
            />
          </div>
        </div>

        {/* Story Speech Bubble: Slides up from bottom */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 90, 
            damping: 15, 
            delay: 0.1 
          }}
          className="absolute bottom-0 inset-x-0 bg-white rounded-t-[2.5rem] border-t border-slate-100 shadow-[0_-16px_48px_rgba(0,0,0,0.3)] px-6 sm:px-10 pt-7 pb-10 z-20 flex flex-col space-y-4 text-left select-text"
        >

          <div className="flex items-center justify-between w-full">
            {badge ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-[10px] font-black uppercase text-violet-600 tracking-widest shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
                <span>{badge}</span>
              </span>
            ) : <div />}
          </div>

          <div className="space-y-2">
            {heading && (
              <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight leading-tight">
                {heading}
              </h3>
            )}

            {subheading && (
              <p className="text-sm sm:text-base font-black text-slate-500 tracking-wide uppercase">
                {subheading}
              </p>
            )}
          </div>

          {/* Subheading / Description body paragraphs */}
          {paragraphs.length > 0 && (
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
              {paragraphs.map((p, idx) => {
                const isBullet = p.startsWith('•') || p.startsWith('-') || p.startsWith('*');
                const bulletText = isBullet ? p.replace(/^[•\-\*]\s*/, '') : p;

                if (isBullet) {
                  return (
                    <div key={`hero-bullet-${idx}-${p.slice(0, 10)}`} className="flex items-start gap-2 pl-1">
                      <span className="text-violet-500 mt-1 select-none font-extrabold text-base">•</span>
                      <p className="text-base sm:text-lg md:text-xl font-bold text-slate-700 leading-relaxed">{bulletText}</p>
                    </div>
                  );
                }
                return (
                  <p key={`hero-para-${idx}-${p.slice(0, 10)}`} className="text-base sm:text-lg md:text-xl font-bold text-slate-700 leading-relaxed">
                    {p}
                  </p>
                );
              })}
            </div>
          )}

          {/* Highlight Key Insight Box */}
          {highlightBox && (
            <div className="bg-amber-50/80 rounded-2xl p-3.5 border border-amber-100/60 flex gap-2.5 items-start text-left">
              <Lightbulb className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">💡 KEY INSIGHT</span>
                <p className="text-sm sm:text-base font-bold text-slate-700 leading-relaxed">{highlightBox}</p>
              </div>
            </div>
          )}

          {/* Continue CTA Button with Soft Pulse Animation */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={{ scale: [1, 1.018, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            onClick={() => {
              if (onContinue) {
                onContinue();
              } else {
                onSelect(true);
              }
            }}
            className="w-full py-4 text-center bg-violet-600 hover:bg-violet-750 text-white font-display font-black text-base sm:text-lg uppercase tracking-wider rounded-[1.5rem] shadow-[0_5px_0_#4c1d95] active:translate-y-1 active:shadow-[0_2px_0_#4c1d95] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continue</span>
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            >
              ➔
            </motion.span>
          </motion.button>
        </motion.div>
      </motion.div>
    );
  };

  // RENDER DIALOGUE SCENE (CONVERSATION/SPEECH BUBBLES WITH MASCOT)
  const renderDialogueScene = () => {
    // 1. Parse dialogue messages in a robust manner (JSON or line-split paragraphs)
    const parseDialogueMessages = (): { speaker: string; message: string }[] => {
      const rawBody = contentBody || '';
      if (rawBody.trim().startsWith('[') && rawBody.trim().endsWith(']')) {
        try {
          const parsed = JSON.parse(rawBody);
          if (Array.isArray(parsed)) {
            return parsed.map((item: any) => ({
              speaker: item.speaker || quoteAuthor || 'Chikoo',
              message: item.message || String(item)
            }));
          }
        } catch (e) {
          // Fallback to text parsing
        }
      }

      const list: { speaker: string; message: string }[] = [];

      // Add quote as first message if present
      if (quote && quote.trim()) {
        list.push({
          speaker: quoteAuthor || 'Chikoo',
          message: quote.trim()
        });
      }

      // Add paragraphs
      if (paragraphs && paragraphs.length > 0) {
        paragraphs.forEach(p => {
          const colonIndex = p.indexOf(':');
          if (colonIndex > 0 && colonIndex < 25) {
            const potentialSpeaker = p.substring(0, colonIndex).trim();
            const potentialMsg = p.substring(colonIndex + 1).trim();
            if (potentialMsg) {
              list.push({
                speaker: potentialSpeaker,
                message: potentialMsg
              });
              return;
            }
          }
          list.push({
            speaker: quoteAuthor || 'Chikoo',
            message: p
          });
        });
      }

      // Fallbacks if empty
      if (list.length === 0) {
        if (heading) {
          list.push({
            speaker: 'Chikoo',
            message: heading
          });
        }
        if (subheading) {
          list.push({
            speaker: 'Chikoo',
            message: subheading
          });
        }
      }

      if (list.length === 0) {
        list.push({
          speaker: 'Chikoo',
          message: 'Hello! Tap anywhere to chat with me.'
        });
      }

      return list;
    };

    const messages = parseDialogueMessages();
    const displayProgress = typeof progress === 'number' ? progress : 45;
    const displayIndex = typeof currentIndex === 'number' ? currentIndex : 2;
    const displayTotal = typeof totalChallenges === 'number' ? totalChallenges : 5;
    const displayEnergy = typeof energy === 'number' ? energy : 25;
    const isDialogueFinished = visibleBubbleCount >= messages.length;

    const handleScreenTap = (e: React.MouseEvent) => {
      // Prevent interactive buttons/controls from triggering next bubble
      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
        return;
      }

      if (visibleBubbleCount < messages.length) {
        setVisibleBubbleCount(prev => prev + 1);
      } else {
        if (onContinue) {
          onContinue();
        } else {
          onSelect(true);
        }
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onClick={handleScreenTap}
        className="absolute inset-0 z-[450] bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none cursor-pointer"
        id="dialogue_scene"
      >
        {/* Full-Screen Immersive Background Image */}
        <div className="absolute inset-0 z-0">
          <motion.img
            src={mediaUrl || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop"}
            alt={heading || "Dialogue Scene Background"}
            referrerPolicy="no-referrer"
            animate={{ 
              scale: [1.02, 1.05, 1.02],
              rotate: [0.1, -0.1, 0.1]
            }}
            transition={{
              repeat: Infinity,
              duration: 20,
              ease: "linear"
            }}
            className="w-full h-full object-cover filter brightness-[0.8] contrast-[1.05]"
          />
          {/* Deep bottom vignette overlay for high contrast and bubble legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
        </div>

        {/* Floating Transparent Top HUD */}
        <div className="absolute top-0 inset-x-0 p-4 sm:p-5 flex items-center justify-between gap-4 z-50 bg-gradient-to-b from-black/50 to-transparent">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onClose) onClose();
            }} 
             className="w-10 h-10 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center transition-all border border-white/10 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 h-3.5 bg-white/15 backdrop-blur-md rounded-full overflow-hidden border border-white/10 shadow-inner max-w-xs sm:max-w-md">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-display font-black text-white/95 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {displayIndex + 1} / {displayTotal}
            </span>
            <EnergyIndicator 
              energyUnits={displayEnergy} 
              nextChargingIn={nextEnergyIn} 
              showZap={true} 
              className="scale-75 origin-right text-white select-none pointer-events-none" 
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                const nextState = !(soundManager.isEnabled() && soundManager.isMusicEnabled());
                soundManager.setEnabled(nextState);
                soundManager.setMusicEnabled(nextState);
              }}
              className="w-10 h-10 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center transition-all border border-white/10 relative hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
              title="Toggle Audio Feedback"
            >
              {soundEnabled ? (
                <Volume2 className="w-4.5 h-4.5 text-amber-300" />
              ) : (
                <VolumeX className="w-4.5 h-4.5 text-white/60" />
              )}
              
              {soundEnabled && (
                <div className="absolute bottom-1.5 flex items-end gap-[1.5px] h-2">
                  {[1, 2, 3].map((bar) => (
                    <motion.div
                      key={`dialogue-sound-bar-${bar}`}
                      animate={{ height: [3, 9, 3] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.5 + bar * 0.12,
                        ease: "easeInOut"
                      }}
                      className="w-[1.5px] bg-amber-300 rounded-full"
                    />
                  ))}
                </div>
              )}
            </button>
            <MinimalStoryAudioControl
              isPlaying={audioIsPlaying}
              isLoading={audioIsLoading}
              hasAudio={audioHasAudio}
              onTogglePlay={onTogglePlay}
              onReplay={onReplay}
              currentLang={language}
              onLangChange={onLanguageChange}
            />
          </div>
        </div>

        {/* Dialogue Chat Area Container (Lower half of screen) */}
        <div className="absolute inset-x-0 bottom-0 z-20 px-4 sm:px-8 pb-10 flex flex-col justify-end pointer-events-none max-h-[70vh]">
          {/* Bubbles Stack */}
          <div className="space-y-4 flex flex-col items-center w-full max-w-2xl sm:max-w-3xl mx-auto overflow-y-auto pb-4 scrollbar-none">
            <AnimatePresence>
              {messages.slice(0, visibleBubbleCount).map((msg, idx) => (
                <motion.div
                  key={`dialogue-msg-${idx}-${msg.speaker || ''}-${(msg.message || '').slice(0, 10)}`}
                  initial={{ opacity: 0, y: 15, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="w-full flex flex-col items-start space-y-1 pointer-events-auto select-text self-start"
                >
                  {/* Speaker Label */}
                  <div className="flex items-center justify-between w-full px-4">
                    <span className="text-sm sm:text-base font-black uppercase text-violet-300 tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      💬 {msg.speaker}
                    </span>
                  </div>

                  {/* Speech Bubble */}
                  <div className="bg-white text-slate-800 rounded-[28px] rounded-tl-sm px-6.5 py-5 sm:px-9 sm:py-6.5 md:px-11 md:py-8 shadow-[0_12px_32px_rgba(0,0,0,0.18)] border border-slate-100 relative group w-auto max-w-full">
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold leading-relaxed">
                      {msg.message}
                    </p>
                    
                    {/* Elegant speaker bubble tail */}
                    <div className="absolute -left-1.5 top-0 w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Tap Anywhere Prompt / Completed State Hint */}
          <div className="h-10 flex items-center justify-center mt-2 w-full">
            {!isDialogueFinished ? (
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="text-xs font-bold text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>👇 Tap anywhere to chat</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center w-full"
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  className="bg-amber-400 text-slate-950 font-display font-black text-xs uppercase tracking-widest px-5 py-2 rounded-full shadow-[0_4px_12px_rgba(251,191,36,0.35)] flex items-center gap-2 pointer-events-auto whitespace-nowrap"
                >
                  <span>👉 Tap anywhere to continue</span>
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    👆
                  </motion.span>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // RENDER COMIC STRIP SCENE (PLAYFUL STORYBOOK MULTI-PANEL VIEW)
  const renderComicStripScene = () => {
    // Robust parsing for panels (JSON or Paragraph-split strings)
    const parseComicPanels = () => {
      const rawBody = contentBody || '';
      if (rawBody.trim().startsWith('[') && rawBody.trim().endsWith(']')) {
        try {
          const parsed = JSON.parse(rawBody);
          if (Array.isArray(parsed)) {
            return parsed.slice(0, 3).map((item: any, idx: number) => {
              const defaults = [
                { type: 'thought', position: 'top-left', expression: '🤔' },
                { type: 'thought', position: 'top-right', expression: '😯' },
                { type: 'speech', position: 'bottom-right', expression: '😄' }
              ];
              const def = defaults[idx] || { type: 'speech', position: 'bottom-right', expression: '😄' };
              return {
                text: item.text || item.message || String(item),
                type: item.type || def.type,
                position: item.position || def.position,
                expression: item.expression || def.expression
              };
            });
          }
        } catch (e) {
          // Fallback
        }
      }

      // Parse by splitting with commas
      const items = rawBody.split(',').map(s => s.trim());
      const defaults = [
        { type: 'thought', position: 'top-left', expression: '🤔' },
        { type: 'thought', position: 'top-right', expression: '😯' },
        { type: 'speech', position: 'bottom-right', expression: '😄' }
      ];

      // Ensure we always have exactly 3 panels
      const panelsToReturn = [];
      for (let idx = 0; idx < 3; idx++) {
        const def = defaults[idx] || { type: 'speech', position: 'bottom-right', expression: '😄' };
        let text = items[idx] !== undefined ? items[idx] : '';

        let type = def.type;
        let position = def.position;
        let expression = def.expression;

        // Check prefixes if specified
        if (text.toLowerCase().startsWith('thought:')) {
          type = 'thought';
          text = text.substring('thought:'.length).trim();
        } else if (text.toLowerCase().startsWith('speech:')) {
          type = 'speech';
          text = text.substring('speech:'.length).trim();
        }

        // Check positions
        if (text.startsWith('[')) {
          const closingBracket = text.indexOf(']');
          if (closingBracket > 0) {
            const pos = text.substring(1, closingBracket).trim().toLowerCase();
            if (['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(pos)) {
               position = pos;
               text = text.substring(closingBracket + 1).trim();
            }
          }
        }

        // Check emoji prefix
        const emojiRegex = /^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}])/u;
        const match = text.match(emojiRegex);
        if (match) {
          expression = match[1];
          text = text.replace(emojiRegex, '').trim();
        }

        panelsToReturn.push({ text, type, position, expression });
      }

      return panelsToReturn;
    };

    const panels = parseComicPanels();

    // Parse image list
    const imagesList = mediaUrl ? mediaUrl.split(',').map(img => img.trim()) : [];
    
    // Panel images mapping
    const getPanelImg = (idx: number) => {
      if (imagesList[idx]) return imagesList[idx];
      if (imagesList[0]) return imagesList[0]; // fallback to first image
      
      const Fallbacks = [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop", 
        "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&auto=format&fit=crop", 
        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop"  
      ];
      return Fallbacks[idx];
    };

    const displayProgress = typeof progress === 'number' ? progress : 45;
    const displayIndex = typeof currentIndex === 'number' ? currentIndex : 2;
    const displayTotal = typeof totalChallenges === 'number' ? totalChallenges : 5;
    const displayEnergy = typeof energy === 'number' ? energy : 25;

    const handleScreenTap = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
        return;
      }
      if (visibleComicCount < panels.length) {
        setVisibleComicCount(prev => prev + 1);
      } else {
        if (onContinue) {
          onContinue();
        } else {
          onSelect(true);
        }
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onClick={handleScreenTap}
        className="absolute inset-0 z-[450] bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none cursor-pointer"
        id="comic_strip_scene"
      >
        {/* Floating Transparent Top HUD */}
        <div className="absolute top-0 inset-x-0 p-4 sm:p-5 flex items-center justify-between gap-4 z-50 bg-gradient-to-b from-black/50 to-transparent">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onClose) onClose();
            }} 
            className="w-10 h-10 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center transition-all border border-white/10 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 h-3.5 bg-white/15 backdrop-blur-md rounded-full overflow-hidden border border-white/10 shadow-inner max-w-xs sm:max-w-md">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-display font-black text-white/95 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {displayIndex + 1} / {displayTotal}
            </span>
            <EnergyIndicator 
              energyUnits={displayEnergy} 
              nextChargingIn={nextEnergyIn} 
              showZap={true} 
              className="scale-75 origin-right text-white select-none pointer-events-none" 
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                const nextState = !(soundManager.isEnabled() && soundManager.isMusicEnabled());
                soundManager.setEnabled(nextState);
                soundManager.setMusicEnabled(nextState);
              }}
              className="w-10 h-10 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center transition-all border border-white/10 relative hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
              title="Toggle Audio Feedback"
            >
              {soundEnabled ? (
                <Volume2 className="w-4.5 h-4.5 text-amber-300" />
              ) : (
                <VolumeX className="w-4.5 h-4.5 text-white/60" />
              )}
              
              {soundEnabled && (
                <div className="absolute bottom-1.5 flex items-end gap-[1.5px] h-2">
                  {[1, 2, 3].map((bar) => (
                    <motion.div
                      key={`comic-sound-bar-${bar}`}
                      animate={{ height: [3, 9, 3] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.5 + bar * 0.12,
                        ease: "easeInOut"
                      }}
                      className="w-[1.5px] bg-amber-300 rounded-full"
                    />
                  ))}
                </div>
              )}
            </button>
            <MinimalStoryAudioControl
              isPlaying={audioIsPlaying}
              isLoading={audioIsLoading}
              hasAudio={audioHasAudio}
              onTogglePlay={onTogglePlay}
              onReplay={onReplay}
              currentLang={language}
              onLangChange={onLanguageChange}
            />
          </div>
        </div>

        {/* 3 Staggered Stacked Comic Panels Container */}
        <div className="flex-1 flex flex-col justify-center gap-4 w-full max-w-lg sm:max-w-xl mx-auto pt-16 pb-12 px-4 z-10">
          {panels.slice(0, visibleComicCount).map((panel, idx) => {
            const panelImg = getPanelImg(idx);

            // Determine Bubble Position classes
            let bubblePositionClass = "top-2.5 left-2.5";
            let tailPositionSpeech = "-bottom-2 left-4 rotate-0";
            let tailPositionSpeechBorder = "-bottom-2.5 left-3.5 rotate-0";
            let tailPositionThought = "-bottom-2.5 left-5 flex-col";

            if (panel.position === 'top-right') {
              bubblePositionClass = "top-2.5 right-2.5";
              tailPositionSpeech = "-bottom-2 right-4 -scale-x-100";
              tailPositionSpeechBorder = "-bottom-2.5 right-3.5 -scale-x-100";
              tailPositionThought = "-bottom-2.5 right-5 flex-col";
            } else if (panel.position === 'bottom-left') {
              bubblePositionClass = "bottom-2.5 left-2.5";
              tailPositionSpeech = "-top-2 left-4 rotate-180";
              tailPositionSpeechBorder = "-top-2.5 left-3.5 rotate-180";
              tailPositionThought = "-top-2.5 left-5 flex-col-reverse";
            } else if (panel.position === 'bottom-right') {
              bubblePositionClass = "bottom-2.5 right-2.5";
              tailPositionSpeech = "-top-2 right-4 -scale-y-100";
              tailPositionSpeechBorder = "-top-2.5 right-3.5 -scale-y-100";
              tailPositionThought = "-top-2.5 right-5 flex-col-reverse";
            }

            return (
              <motion.div
                key={`comic-stacked-panel-${idx}-${panel.speaker || ''}`}
                initial={{ opacity: 0, y: 15, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: 0.05,
                  duration: 0.45,
                  ease: "easeOut"
                }}
                whileHover={{ scale: 1.015, rotate: idx % 2 === 0 ? 0.3 : -0.3 }}
                className="flex-1 min-h-[145px] sm:min-h-[170px] rounded-[22px] bg-slate-900 border-2 border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.45)] relative overflow-hidden flex items-center justify-center group"
              >
                {/* Panel Background Image */}
                <img
                  src={panelImg}
                  alt={`Comic panel ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop";
                  }}
                  className="absolute inset-0 w-full h-full object-cover filter brightness-[0.88] contrast-[1.05] transition-transform duration-700 group-hover:scale-102"
                />
                
                {/* Thin comic panel black boundary overlay inside */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/15 pointer-events-none" />

                {/* Comic Speech or Thought Bubble */}
                <div className={`absolute ${bubblePositionClass} max-w-[85%] sm:max-w-[75%] z-20`}>
                  <div className="bg-white text-slate-800 border-2 border-slate-950 rounded-[22px] px-5.5 py-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative w-fit">
                    
                    {/* Character Expression Sticker Badge on corner of bubble */}
                    <span className="absolute -top-3.5 -left-1.5 bg-amber-300 text-slate-950 text-xs border-2 border-slate-950 rounded-full w-5.5 h-5.5 flex items-center justify-center font-bold font-mono shadow-xs select-none pointer-events-none">
                      {panel.expression}
                    </span>

                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-black tracking-tight leading-snug text-slate-900 pr-0.5 select-text">
                      {panel.text}
                    </p>

                    {/* Bubble Tail */}
                    {panel.type === 'thought' ? (
                      <div className={`absolute ${tailPositionThought} flex gap-0.5 z-30`}>
                        <div className="w-1.5 h-1.5 bg-white border-2 border-slate-950 rounded-full" />
                        <div className="w-1 h-1 bg-white border border-slate-950 rounded-full" />
                      </div>
                    ) : (
                      <>
                        <div className={`absolute ${tailPositionSpeech} w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent z-10`} />
                        <div className={`absolute ${tailPositionSpeechBorder} w-0 h-0 border-t-[9px] border-t-slate-950 border-l-[9px] border-l-transparent -z-10`} />
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Interactive Tap to Continue Prompt */}
        <div className="absolute bottom-4 inset-x-0 z-30 flex justify-center pointer-events-none">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            className="bg-amber-400 text-slate-950 font-display font-black text-[11px] uppercase tracking-widest px-5 py-2.5 rounded-full shadow-[0_4px_12px_rgba(251,191,36,0.4)] flex items-center gap-2 pointer-events-auto cursor-pointer"
          >
            {visibleComicCount < panels.length ? (
              <span>👇 Tap anywhere for next panel ({visibleComicCount}/{panels.length})</span>
            ) : (
              <span>Tap to Continue ▶</span>
            )}
          </motion.div>
        </div>
      </motion.div>
    );
  };

  // RENDER CINEMATIC SCENE (THEATRICAL LETTERBOXING & OVERLAY SUBTITLES)
  const renderCinematicScene = () => {
    // Safe fallbacks for preview mode
    const displayProgress = typeof progress === 'number' ? progress : 45;
    const displayIndex = typeof currentIndex === 'number' ? currentIndex : 2;
    const displayTotal = typeof totalChallenges === 'number' ? totalChallenges : 5;

    const handleScreenTap = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
        return;
      }
      if (onContinue) {
        onContinue();
      } else {
        onSelect(true);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        onClick={handleScreenTap}
        className="absolute inset-0 z-[450] bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none cursor-pointer"
        id="cinematic_scene"
      >
        {/* Full Screen Artwork Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.img
            src={mediaUrl || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop"}
            alt={heading || "Cinematic Art"}
            referrerPolicy="no-referrer"
            initial={{ scale: 1.08 }}
            animate={{ 
              scale: [1.08, 1.00, 1.02, 1.00],
              x: [0, -3, 3, 0],
              y: [0, 2, -2, 0]
            }}
            transition={{
              scale: { duration: 0.8, ease: "easeOut" },
              x: { repeat: Infinity, duration: 22, ease: "easeInOut" },
              y: { repeat: Infinity, duration: 22, ease: "easeInOut" }
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop";
            }}
            className="w-full h-full object-cover filter brightness-[0.85] contrast-[1.05]"
          />
        </div>

        {/* Cinematic Gradient Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-10" 
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.75) 100%)'
          }}
        />

        {/* Floating Transparent Top HUD with glassmorphism */}
        <div className="absolute top-0 inset-x-0 p-4 sm:p-5 flex items-center justify-between gap-4 z-50 bg-gradient-to-b from-black/45 to-transparent">
          {/* Close/Back Circle Button */}
          {onClose && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }} 
              className="w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all border border-white/10 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Floating Lesson Progress Bar */}
          <div className="flex-1 h-2.5 bg-white/10 backdrop-blur-xs rounded-full overflow-hidden border border-white/5 shadow-inner max-w-xs sm:max-w-md">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
            />
          </div>

          {/* Indicators & Music Toggle */}
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-display font-black text-white/90 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {displayIndex + 1} / {displayTotal}
            </span>

            {/* Premium Sound/Music Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const nextState = !(soundManager.isEnabled() && soundManager.isMusicEnabled());
                soundManager.setEnabled(nextState);
                soundManager.setMusicEnabled(nextState);
              }}
              className="w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all border border-white/10 relative hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
              title="Toggle Audio Feedback"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-300" />
              ) : (
                <VolumeX className="w-4 h-4 text-white/60" />
              )}
              
              {soundEnabled && (
                <div className="absolute bottom-1 flex items-end gap-[1px] h-1.5">
                  {[1, 2, 3].map((bar) => (
                    <motion.div
                      key={`mystery-sound-bar-${bar}`}
                      animate={{ height: [2, 6, 2] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.5 + bar * 0.12,
                        ease: "easeInOut"
                      }}
                      className="w-[1px] bg-amber-300 rounded-full"
                    />
                  ))}
                </div>
              )}
            </button>
            <MinimalStoryAudioControl
              isPlaying={audioIsPlaying}
              isLoading={audioIsLoading}
              hasAudio={audioHasAudio}
              onTogglePlay={onTogglePlay}
              onReplay={onReplay}
              currentLang={language}
              onLangChange={onLanguageChange}
            />
          </div>
        </div>

        {/* Lower Third Story Texts */}
        <div className="absolute inset-x-0 bottom-0 z-20 pb-8 pt-20 px-6 sm:px-10 flex flex-col items-center justify-end text-center pointer-events-none">
          <div className="max-w-3xl mx-auto space-y-4 mb-8">
            {/* Title / Heading with Fade Up */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-[31.5px] sm:text-4xl md:text-5xl font-display font-black text-center text-white leading-tight tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
            >
              {heading || "A New Journey Begins"}
            </motion.h2>

            {/* Subtitle / Description body with Fade and Delay */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="text-[16.8px] sm:text-lg md:text-xl font-bold text-center text-white/95 max-w-2xl mx-auto leading-relaxed line-clamp-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            >
              {contentBody || "Every question we solve today will make Chikoo smarter."}
            </motion.p>
          </div>

          {/* Minimal Bottom Prompt with Fade and Delay */}
          <div className="space-y-3.5 w-full flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.75, 0.45, 0.75] }}
              transition={{
                delay: 0.35,
                opacity: {
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }
              }}
              className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white/70 flex items-center justify-center gap-1.5 cursor-pointer drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
            >
              <span>Tap to Continue</span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              >
                →
              </motion.span>
            </motion.div>

            {/* Animated Tiny Page Indicator Dot Grid */}
            <div className="flex items-center justify-center gap-1.5">
              {[0, 1, 2].map((i) => {
                const isActive = (displayIndex % 3) === i;
                return (
                  <motion.div
                    key={`mystery-dot-${i}`}
                    animate={isActive ? { scale: [1, 1.2, 1], opacity: 1 } : { scale: 1, opacity: 0.4 }}
                    transition={{ repeat: isActive ? Infinity : 0, duration: 2, ease: "easeInOut" }}
                    className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]' : 'bg-white/45'}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // RENDER SURPRISE SCENE (PLAYFUL MYSTERY REVELATION UNWRAP INTERACTION)
  const renderSurpriseScene = () => {
    return (
      <div className="w-full py-2 flex flex-col items-center text-center" id="surprise_scene">
        <AnimatePresence mode="wait">
          {!isRevealed ? (
            /* LOCKED MYSTERY WRAPPER */
            <motion.div
              key="locked"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-gradient-to-br from-indigo-600 to-violet-750 p-6 md:p-8 rounded-3xl text-white shadow-2xl border-4 border-amber-300 flex flex-col items-center justify-center space-y-6 relative overflow-hidden"
            >
              {/* Starburst rays rotation visual effect */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.15)_0,transparent_60%)] animate-pulse pointer-events-none" />

              <motion.div
                animate={{ rotate: [-2, 2, -2], y: [-3, 3, -3] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="bg-amber-300 p-5 rounded-full shadow-lg border-2 border-white text-indigo-900"
              >
                <Gift className="w-12 h-12 animate-bounce" />
              </motion.div>

              <div className="space-y-2">
                <span className="bg-amber-300 text-indigo-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider inline-block">
                  AIBO GIFT BOX
                </span>
                <h3 className="text-xl font-display font-black tracking-tight text-amber-100">
                  {heading || "You unlocked a Surprise Concept!"}
                </h3>
                <p className="text-xs font-semibold text-indigo-150 leading-relaxed max-w-xs mx-auto">
                  Click the unwrap button below to crack open the mystery, pop a sound trigger, and read the key secret!
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRevealSurprise}
                className="w-full py-3 bg-amber-300 hover:bg-amber-200 text-indigo-950 font-sans font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                🎁 Unwrap Surprise!
              </motion.button>
            </motion.div>
          ) : (
            /* REVEALED CELEBRATION PRESENTATION */
            <motion.div
              key="revealed"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className="w-full max-w-md bg-white border-4 border-amber-300 p-6 rounded-3xl shadow-2xl space-y-5 text-left relative overflow-hidden"
            >
              {/* Little float star elements */}
              <div className="absolute top-2 right-4 text-amber-400">
                <Star className="w-6 h-6 fill-amber-300" />
              </div>
              <div className="absolute top-12 left-4 text-indigo-400 opacity-60">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>

              {/* Celebration Heading Row */}
              <div className="flex justify-between items-center">
                <span className="bg-amber-100 text-amber-850 border border-amber-200 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  🎉 {badge || "SURPRISE REVEALED"}
                </span>
                <MinimalStoryAudioControl
                  isPlaying={audioIsPlaying}
                  isLoading={audioIsLoading}
                  hasAudio={audioHasAudio}
                  onTogglePlay={onTogglePlay}
                  onReplay={onReplay}
                  currentLang={language}
                  onLangChange={onLanguageChange}
                />
              </div>

              {heading && (
                <h3 className="text-xl md:text-2xl font-display font-black text-slate-900 tracking-tight leading-tight">
                  {heading}
                </h3>
              )}

              {/* Large highlighted media/visual if supplied */}
              {mediaUrl && (
                <div className="w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 h-44 flex items-center justify-center relative">
                  <img
                    src={mediaUrl}
                    alt="Surprise revelation"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-indigo-650 text-white rounded-full p-1.5 shadow">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}

              {/* Surprise Fact body content */}
              {paragraphs.length > 0 && (
                <div className="space-y-3 pt-2">
                  {paragraphs.map((p, idx) => (
                    <p key={`surprise-para-${idx}-${p.slice(0, 10)}`} className="text-base sm:text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              )}

              {/* Glorious Key Takeaway Insight box */}
              {highlightBox && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200/60 flex gap-3.5 items-start shadow-3xs">
                  <Flame className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-black uppercase text-amber-900 tracking-wider">🔥 HOT FACT SUMMARY</span>
                    <p className="text-sm sm:text-base font-bold text-slate-700 leading-relaxed">{highlightBox}</p>
                  </div>
                </div>
              )}

              {bottomMessage && (
                <div className="pt-3 border-t border-slate-100 text-center text-xs font-black text-indigo-600 tracking-wider">
                  🌟 {bottomMessage}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // RENDER TEXTBOOK PAGE (MODERN DIGITAL TEXTBOOK)
  const renderTextbookScene = () => {
    // Safe fallbacks for preview mode
    const displayProgress = typeof progress === 'number' ? progress : 45;
    const displayIndex = typeof currentIndex === 'number' ? currentIndex : 2;
    const displayTotal = typeof totalChallenges === 'number' ? totalChallenges : 5;

    // Helper to parse highlighted text
    const parseHighlights = (text: string) => {
      if (!text) return '';
      const parts = text.split(/(\*\*[^*]+\*\*)/);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const cleanText = part.slice(2, -2);
          return (
            <span 
              key={`tb-highlight-${index}-${cleanText.slice(0, 10)}`} 
              className="bg-yellow-200/90 text-slate-900 px-1.5 py-0.5 rounded font-extrabold inline shadow-3xs"
            >
              {cleanText}
            </span>
          );
        }
        return part;
      });
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 z-[450] bg-white text-slate-950 flex flex-col justify-between overflow-hidden select-text font-sans"
        id="textbook_scene"
      >
        {/* Top Header Navigation - clean, minimal, no heavy boxes */}
        <div className="shrink-0 bg-white px-6 py-4 flex items-center justify-between z-30 select-none border-b border-slate-100/50">
          {/* ← Back Button */}
          {onClose ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-all flex items-center gap-1 cursor-pointer"
            >
              ← Back
            </button>
          ) : (
            <span className="text-xs font-bold text-slate-400 select-none">📖 Textbook</span>
          )}

          {/* Chapter Badge - rounded blue badge */}
          <span className="bg-blue-50 border border-blue-100/80 text-blue-600 text-xs font-extrabold uppercase px-3.5 py-1 rounded-full tracking-wider shadow-3xs">
            {badge || "Chapter 1"}
          </span>

          <div className="flex items-center gap-1.5">
            <MinimalStoryAudioControl
              isPlaying={audioIsPlaying}
              isLoading={audioIsLoading}
              hasAudio={audioHasAudio}
              onTogglePlay={onTogglePlay}
              onReplay={onReplay}
            />

            {/* Bookmark Button */}
            <button 
              className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-all cursor-pointer"
            >
              <Bookmark className="w-4 h-4 fill-slate-200" />
            </button>
          </div>
        </div>

        {/* Scrollable Book Body Content */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-lg mx-auto px-6 py-8 space-y-8 pb-10">
            {/* Main Heading with Fade Up */}
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-[32px] sm:text-[38px] font-display font-extrabold text-aibo-blue-500 tracking-tight text-left leading-[1.15] mb-6 line-clamp-2"
            >
              {heading || "Artificial Intelligence (AI)"}
            </motion.h2>

            {/* Large illustration - full-width, rounded corners, no borders, no cards */}
            {mediaUrl && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full rounded-2xl overflow-hidden aspect-[16/10] bg-slate-50 flex items-center justify-center relative my-6"
              >
                <img
                  src={mediaUrl}
                  alt={heading || "Textbook Illustration"}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop";
                  }}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            )}

            {/* Paragraphs with Fade Up and markers */}
            {paragraphs.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-left"
              >
                {paragraphs.map((p, idx) => (
                  <p key={`tb-para-${idx}-${p.slice(0, 10)}`} className="text-[21px] sm:text-[23px] md:text-[25px] font-semibold text-slate-800 leading-relaxed font-sans">
                    {parseHighlights(p)}
                  </p>
                ))}
              </motion.div>
            )}

            {/* Fun Fact section - lightweight, soft yellow bg, subtle border, no shadow */}
            {highlightBox && (
              <motion.div 
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="bg-amber-50/40 border border-amber-100/60 rounded-2xl p-5 flex gap-3.5 items-start my-6 text-left shadow-none"
              >
                <Star className="w-5 h-5 text-amber-500 fill-amber-300 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-800">⭐ Fun Fact</span>
                  <p className="text-base sm:text-lg font-semibold text-slate-700 leading-relaxed">
                    {highlightBox}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Full-width Bottom Sticky Footer with Slide Up */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0 bg-white border-t border-slate-100 flex items-center justify-between z-30 select-none h-[64px] pl-6 overflow-hidden"
        >
          {/* Current Page Number indicator */}
          <div className="text-xs font-mono font-medium text-slate-400 flex items-center">
            <span className="text-slate-700 font-extrabold pr-1">
              {displayIndex + 1}
            </span>
            <span>of</span>
            <span className="pl-1">
              {displayTotal}
            </span>
          </div>

          {/* Next Page button */}
          <button
            onClick={() => {
              if (onContinue) {
                onContinue();
              } else {
                onSelect(true);
              }
            }}
            className="h-full min-w-[160px] px-10 bg-aibo-blue-500 hover:bg-aibo-blue-600 active:bg-aibo-blue-700 text-white font-sans font-extrabold text-sm uppercase tracking-wider rounded-tl-2xl border-none transition-all cursor-pointer flex items-center justify-center gap-2 shadow-none select-none"
          >
            <span>Next Page</span>
            <span>→</span>
          </button>
        </motion.div>
      </motion.div>
    );
  };

  // Switch layout selector based on specified Scene Type
  const renderSelectedScene = () => {
    const normalized = (sceneType || '').toLowerCase().trim();
    switch (normalized) {
      case 'dialogue':
      case 'dialogue_scene':
      case 'dialogue_strip_scene':
        return renderDialogueScene();
      case 'comic':
      case 'comic_story':
      case 'comic_strip':
        return renderComicStripScene();
      case 'cinematic':
      case 'cinematic_scene':
      case 'story_outro':
        return renderCinematicScene();
      case 'surprise':
      case 'celebration':
      case 'celebration_scene':
        return renderSurpriseScene();
      case 'textbook':
        return renderTextbookScene();
      case 'hero':
      case 'hero_scene':
      case 'story_intro':
      case 'story_scene':
      case 'content_screen':
      case 'visual_lesson_screen':
      default:
        return renderHeroScene();
    }
  };

  return renderSelectedScene();
}
