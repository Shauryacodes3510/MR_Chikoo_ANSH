import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pause, 
  Play, 
  Loader2, 
  ChevronRight,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { soundManager } from '../lib/sounds';

// ==========================================
// 1. Types & Interfaces
// ==========================================
interface ChikooExplanationOverlayProps {
  isOpen: boolean;
  isCorrect?: boolean;
  challenge: any;
  selectedOption?: any;
  onClose: () => void;
  onTryAgain: () => void;
  lessonId?: string;
}

interface AnimatedChikooProps {
  currentExpression: 'still' | 'talk1' | 'talk2' | 'sarcastic' | 'wink' | 'hand_on_head1' | 'hand_on_head2' | 'shock';
  isPlaying: boolean;
}

interface ExplanationHeaderProps {
  onClose: () => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  isLoadingAudio: boolean;
}

interface LanguageDropdownProps {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  isLoadingAudio: boolean;
}

interface TranscriptViewProps {
  spokenText: string;
  currentTime: number;
  duration: number;
  hasStartedPlaying: boolean;
}

interface AudioControllerProps {
  isPlaying: boolean;
  onPlayToggle: () => void;
  currentTime: number;
  duration: number;
  hasFinishedPlaying: boolean;
}

interface ExplanationOverlayProps {
  hasStartedPlaying: boolean;
  isLoadingAudio: boolean;
  audioReady: boolean;
  audioError: string | null;
  onPlayToggle: () => void;
  duration: number;
  hasCachedAudio: boolean;
  cachedAudioDuration: number;
  spokenText: string;
  currentTime: number;
  isPlaying: boolean;
  hasFinishedPlaying: boolean;
  onGotIt: () => void;
  isCorrect: boolean;
}

// ==========================================
// 2. Sub-Component: AnimatedChikoo
// ==========================================
export const AnimatedChikoo = memo(({ currentExpression, isPlaying }: AnimatedChikooProps) => {
  return (
    <div id="chikoo-illustration-container" className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center overflow-hidden">
      <motion.div
        id="chikoo-breathing-wrapper"
        animate={{
          y: [0, -10, 0], 
          rotate: [-0.5, 0.5, -0.5], 
          scale: [1, 1.012, 1], 
        }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ willChange: 'transform' }}
        className="relative w-full h-full flex items-center justify-center pointer-events-none"
      >
        <img
          id="chikoo-pose-gif"
          src="https://i.postimg.cc/HkPxprQf/ezgif-com-gif-maker-(2).gif"
          alt="Chikoo Space Explorer Animation"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/heading_aibo.webp'; }}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-contain md:object-cover opacity-90 z-10"
        />
      </motion.div>

      {/* Subtle audio visual overlay when playing */}
      {isPlaying && (
        <motion.div 
          id="audio-pulse-glow"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-t from-sky-500/10 via-transparent to-transparent pointer-events-none z-20"
        />
      )}
    </div>
  );
});
AnimatedChikoo.displayName = 'AnimatedChikoo';

// ==========================================
// 3. Sub-Component: LanguageDropdown
// ==========================================
export const LanguageDropdown = memo(({ 
  selectedLanguage, 
  onLanguageChange, 
  isDropdownOpen, 
  setIsDropdownOpen,
  isLoadingAudio
}: LanguageDropdownProps) => {
  return (
    <div id="language-dropdown-wrapper" className="relative">
      <button
        id="btn-language-selector"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 text-slate-200 hover:text-white rounded-xl text-sm font-extrabold cursor-pointer transition-all duration-200 active:scale-95"
      >
        <span>
          {selectedLanguage === 'english' ? 'English' : selectedLanguage === 'marathi' ? 'मराठी (Marathi)' : 'Hinglish'}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {isDropdownOpen && (
        <>
          {/* Click outside backdrop */}
          <div id="dropdown-backdrop" className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
          <div id="dropdown-options" className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-xl py-1 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              id="lang-option-english"
              disabled={isLoadingAudio}
              onClick={() => {
                onLanguageChange('english');
                setIsDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between transition-colors ${
                selectedLanguage === 'english' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>🇬🇧 English</span>
              {selectedLanguage === 'english' && <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
            </button>
            <button
              id="lang-option-hinglish"
              disabled={isLoadingAudio}
              onClick={() => {
                onLanguageChange('hinglish');
                setIsDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between transition-colors ${
                selectedLanguage === 'hinglish' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>🇮🇳 Hinglish</span>
              {selectedLanguage === 'hinglish' && <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
            </button>
            <button
              id="lang-option-marathi"
              disabled={isLoadingAudio}
              onClick={() => {
                onLanguageChange('marathi');
                setIsDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between transition-colors ${
                selectedLanguage === 'marathi' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>🚩 मराठी (Marathi)</span>
              {selectedLanguage === 'marathi' && <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
            </button>
          </div>
        </>
      )}
    </div>
  );
});
LanguageDropdown.displayName = 'LanguageDropdown';

// ==========================================
// 4. Sub-Component: ExplanationHeader
// ==========================================
export const ExplanationHeader = memo(({ 
  onClose, 
  selectedLanguage, 
  onLanguageChange, 
  isLoadingAudio 
}: ExplanationHeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div id="explanation-navbar" className="absolute top-0 left-0 right-0 z-[700] bg-slate-950/20 px-6 py-4 flex items-center justify-between border-b border-white/5">
      {/* Simple Back button */}
      <button 
        id="btn-explanation-back"
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer text-sm font-bold"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span>Back</span>
      </button>

      {/* Premium Language Dropdown */}
      <LanguageDropdown 
        selectedLanguage={selectedLanguage}
        onLanguageChange={onLanguageChange}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        isLoadingAudio={isLoadingAudio}
      />
    </div>
  );
});
ExplanationHeader.displayName = 'ExplanationHeader';

// ==========================================
// 5. Sub-Component: TranscriptView
// ==========================================
export const TranscriptView = memo(({ 
  spokenText, 
  currentTime, 
  duration, 
  hasStartedPlaying
}: TranscriptViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentenceRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Split text into complete sentences
  const sentenceRegex = /[^.?!।\n]+[.?!।\n]*/g;
  const rawSentences = spokenText.match(sentenceRegex) || [spokenText];
  const sentences = rawSentences.map(s => s.trim()).filter(s => s.length > 0);

  // Map words count per sentence to calculate cumulative word index boundaries
  const sentenceWords = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
  const totalWords = sentenceWords.reduce((sum, w) => sum + w, 0);

  // Determine active sentence index
  let activeSentenceIndex = -1;
  if (hasStartedPlaying && totalWords > 0 && duration > 0) {
    const currentWordIdx = Math.min(totalWords - 1, Math.floor((currentTime / duration) * totalWords));
    let runningSum = 0;
    for (let i = 0; i < sentences.length; i++) {
      runningSum += sentenceWords[i];
      if (currentWordIdx < runningSum) {
        activeSentenceIndex = i;
        break;
      }
    }
  }

  // Smooth auto scroll to the active sentence block
  useEffect(() => {
    if (activeSentenceIndex !== -1 && sentenceRefs.current[activeSentenceIndex]) {
      sentenceRefs.current[activeSentenceIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [activeSentenceIndex]);

  return (
    <div id="transcript-canvas" className="w-full text-center min-h-[90px] max-h-[140px] overflow-y-auto flex items-center justify-center px-4 py-2 scrollbar-hide">
      <div ref={containerRef} className="flex flex-col gap-3 justify-center text-center w-full max-w-md h-full py-1">
        {sentences.map((sentence, idx) => {
          const isActive = idx === activeSentenceIndex;
          const isPast = idx < activeSentenceIndex;
          const isReadyToPlay = !hasStartedPlaying;

          return (
            <motion.div
              key={`sentence-${idx}-${sentence.slice(0, 15)}`}
              ref={el => { sentenceRefs.current[idx] = el; }}
              initial={{ opacity: 0.3, y: 10 }}
              animate={{ 
                opacity: isActive ? 1 : isPast || isReadyToPlay ? 0.8 : 0.3, 
                scale: isActive ? 1.05 : 1,
                y: 0 
              }}
              transition={{ duration: 0.25 }}
              className={`transition-all duration-300 py-1 leading-snug tracking-wide ${
                isActive 
                  ? "font-black text-sky-400 text-lg tracking-tight drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" 
                  : isPast || isReadyToPlay
                    ? "font-bold text-slate-100 text-base"
                    : "font-semibold text-slate-500 text-base"
              }`}
            >
              {sentence}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
TranscriptView.displayName = 'TranscriptView';

// ==========================================
// 6. Sub-Component: AudioController
// ==========================================
export const AudioController = memo(({ 
  isPlaying, 
  onPlayToggle, 
  currentTime, 
  duration, 
  hasFinishedPlaying 
}: AudioControllerProps) => {
  return (
    <div id="audio-controls-bar" className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-full shadow-md backdrop-blur-sm mx-auto">
      <button
        id="btn-play-pause-toggle"
        onClick={onPlayToggle}
        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-sky-400 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
      >
        {isPlaying ? <Pause size={14} className="fill-sky-400 text-sky-400" /> : <Play size={14} className="fill-sky-400 text-sky-400 ml-0.5" />}
      </button>

      <div id="playback-timeline-bar" className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          id="playback-timeline-progress"
          initial={{ width: 0 }}
          animate={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          transition={{ duration: 0.1 }}
          className="h-full bg-sky-400 rounded-full"
        />
      </div>

      <span id="audio-time-remaining" className="text-[10px] font-mono font-bold text-slate-300 min-w-[32px]">
        {Math.max(0, Math.ceil(duration - currentTime))}s left
      </span>

      {hasFinishedPlaying && (
        <button
          id="btn-audio-replay"
          onClick={onPlayToggle}
          className="w-6 h-6 rounded-full bg-white/5 text-slate-300 hover:bg-white/10 flex items-center justify-center active:scale-95 transition-all cursor-pointer border border-white/10"
          title="Replay"
        >
          <RotateCcw size={10} />
        </button>
      )}
    </div>
  );
});
AudioController.displayName = 'AudioController';

// ==========================================
// 7. Sub-Component: ExplanationOverlay
// ==========================================
export const ExplanationOverlay = memo(({
  hasStartedPlaying,
  isLoadingAudio,
  audioReady,
  audioError,
  onPlayToggle,
  duration,
  hasCachedAudio,
  cachedAudioDuration,
  spokenText,
  currentTime,
  isPlaying,
  hasFinishedPlaying,
  onGotIt,
  isCorrect
}: ExplanationOverlayProps) => {
  return (
    <div 
      id="explanation-gradient-overlay" 
      className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black via-black/90 to-transparent px-8 pt-16 pb-8 flex flex-col justify-end space-y-4 min-h-[25%] max-h-[42%] overflow-hidden"
    >
      {audioError ? (
        /* ERROR STATE */
        <div id="play-error-prompt" className="flex flex-col items-center space-y-4 w-full max-w-md mx-auto text-center pb-2">
          <span className="text-3xl">⚠️</span>
          <div className="space-y-0.5">
            <h3 className="text-xl font-black text-rose-400 tracking-tight">Explanation Unavailable</h3>
            <p className="text-[11px] font-semibold text-slate-300">{audioError}</p>
          </div>
          <button
            id="btn-explanation-dismiss-err"
            onClick={onGotIt}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-md shadow-[0_4px_0_#b91c1c] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Close Explanation</span>
          </button>
        </div>
      ) : isLoadingAudio ? (
        /* INITIAL LOADING/PRE-LOADING STATE */
        <div id="play-loading-prompt" className="flex flex-col items-center space-y-4 w-full max-w-md mx-auto text-center pb-2">
          <Loader2 className="animate-spin text-sky-400" size={36} />
          <div className="space-y-0.5">
            <h3 className="text-xl font-black text-white tracking-tight animate-pulse">Loading Explanation...</h3>
            <p className="text-[11px] font-semibold text-slate-300">Syncing pre-recorded audio and text files.</p>
          </div>
        </div>
      ) : !hasStartedPlaying ? (
        /* HERO PLAY BUTTON INITIAL STATE */
        <div id="play-intro-prompt" className="flex flex-col items-center space-y-4 w-full max-w-md mx-auto text-center pb-2">
          <span className="text-3xl animate-bounce">🎙️</span>
          <div className="space-y-0.5">
            <h3 className="text-xl font-black text-white tracking-tight">Listen to Chikoo</h3>
            <p className="text-[11px] font-semibold text-slate-300">
              {hasCachedAudio ? `🎧 Saved voice audio is ready (${cachedAudioDuration.toFixed(0)}s)` : "Chikoo has prepared a quick visual explanation!"}
            </p>
          </div>
          
          <button
            id="btn-trigger-play-init"
            onClick={onPlayToggle}
            disabled={!audioReady}
            className="w-full py-3 px-6 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-black text-md flex items-center justify-center gap-3 shadow-lg active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={20} className="fill-white stroke-[2.5px]" />
            <span>Play Explanation</span>
            <span className="bg-sky-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-sky-100">
              {duration.toFixed(0)}s
            </span>
          </button>
        </div>
      ) : (
        /* ACTIVE PROGRESSIVE TRANSCRIPT WITH SYNCED SUBTITLES */
        <div id="active-playback-stage" className="w-full max-w-lg mx-auto space-y-4 flex flex-col items-center">
          
          {/* Speaking voice waveform animation */}
          <div id="waveform-animation-box" className="h-3 flex items-center justify-center gap-1">
            <AnimatePresence>
              {isPlaying ? (
                <motion.div 
                  id="waveform-bars-layout"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bar) => {
                    const randomDuration = 0.5 + Math.random() * 0.7;
                    return (
                      <motion.div
                        id={`wave-bar-${bar}`}
                        key={bar}
                        animate={{ 
                          scaleY: [0.25, 1.2, 0.25],
                        }}
                        transition={{ 
                          duration: randomDuration, 
                          repeat: Infinity, 
                          ease: "easeInOut" 
                        }}
                        className="w-0.75 bg-sky-400 rounded-full origin-center"
                        style={{ height: 14, willChange: 'transform' }}
                      />
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div 
                  id="text-voice-paused"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className="text-[10px] font-bold tracking-wider text-slate-400 uppercase"
                >
                  Voice Paused
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Subtitle / Sentence Transcript container */}
          <TranscriptView 
            spokenText={spokenText}
            currentTime={currentTime}
            duration={duration}
            hasStartedPlaying={hasStartedPlaying}
          />

          {/* Audio controller progress bar and state controls */}
          <AudioController 
            isPlaying={isPlaying}
            onPlayToggle={onPlayToggle}
            currentTime={currentTime}
            duration={duration}
            hasFinishedPlaying={hasFinishedPlaying}
          />
        </div>
      )}

      {/* Action State Button Section */}
      <div id="overlay-ctas-panel" className="w-full max-w-md mx-auto">
        <AnimatePresence>
          {hasFinishedPlaying && (
            <motion.div
              id="cta-try-again-wrapper"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-3 text-center"
            >
              <div id="learning-practice-hint" className="flex items-center justify-center gap-2 text-emerald-400 font-extrabold text-xs bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-xl w-fit mx-auto">
                <CheckCircle2 size={13} className="fill-emerald-950 text-emerald-400 stroke-[2.5px]" />
                <span>{isCorrect ? "You have mastered this concept!" : "Let's put this into practice!"}</span>
              </div>

              <button
                id="btn-explanation-dismiss"
                onClick={onGotIt}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-md shadow-[0_4px_0_#10b981] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isCorrect ? "Got It" : "Try Again"}</span>
                <ChevronRight size={16} className="stroke-[3.5px]" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
ExplanationOverlay.displayName = 'ExplanationOverlay';

// ==========================================
// 8. Main Exported Screen Component: ChikooExplanationOverlay
// ==========================================
const ChikooExplanationOverlay = memo(({ 
  isOpen, 
  isCorrect = false,
  challenge, 
  selectedOption, 
  onClose, 
  onTryAgain,
  lessonId
}: ChikooExplanationOverlayProps) => {
  
  // Audio playback and progress states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [hasFinishedPlaying, setHasFinishedPlaying] = useState(false);

  // Dynamic audio narrations loaded from database (/api/screen-audio)
  const [dbNarrations, setDbNarrations] = useState<Record<string, any>>({});

  // Multilingual states
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hinglish' | 'marathi' | string>('hinglish');

  // Time and duration trackers
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15);

  // Animation states
  const [currentExpression, setCurrentExpression] = useState<'still' | 'talk1' | 'talk2' | 'sarcastic' | 'wink' | 'hand_on_head1' | 'hand_on_head2' | 'shock'>('still');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Challenge variables
  const rawExplanation = challenge?.explanation;

  // Get text/audio based on selected language
  const getExplanationDataForLanguage = (lang: string) => {
    const rawLang = (lang || '').toLowerCase().trim();
    const dbRecord = dbNarrations[rawLang] || 
      (rawLang === 'english' ? (dbNarrations['en'] || dbNarrations['english']) :
       rawLang === 'marathi' ? (dbNarrations['mr'] || dbNarrations['marathi']) :
       (dbNarrations['hinglish'] || dbNarrations['hi']));

    if (rawLang === 'english' || rawLang === 'en') {
      const text = (typeof rawExplanation === 'object' ? (rawExplanation?.english?.text || rawExplanation?.text) : '') || 
        (typeof rawExplanation === 'string' ? rawExplanation : '') || 
        challenge?.audioNarrations?.english?.text || 
        challenge?.audioNarrations?.en?.text || 
        dbRecord?.text || "";
      const audioUrl = (typeof rawExplanation === 'object' ? (rawExplanation?.english?.audioUrl || rawExplanation?.audioUrl) : '') || 
        challenge?.audioNarrations?.english?.url || 
        challenge?.audioNarrations?.en?.url || 
        dbRecord?.url || "";
      const audioDuration = (typeof rawExplanation === 'object' && rawExplanation?.english?.audioDuration) || 
        (challenge?.audioNarrations?.english?.durationMs ? Math.round(challenge.audioNarrations.english.durationMs / 1000) : 
        dbRecord?.durationMs ? Math.round(dbRecord.durationMs / 1000) : 15);
      return {
        text,
        audioUrl,
        audioDuration,
        hasData: !!text
      };
    }

    if (rawLang === 'marathi' || rawLang === 'mr') {
      const text = challenge?.explanation_marathi_speech_script || 
        challenge?.explanation_marathi || 
        challenge?.explanation_marathi_concept || 
        (typeof rawExplanation === 'object' ? rawExplanation?.marathi?.text : '') || 
        challenge?.audioNarrations?.marathi?.text || 
        challenge?.audioNarrations?.mr?.text || 
        dbRecord?.text || "";
      const audioUrl = challenge?.explanation_marathi_audio_url || 
        (typeof rawExplanation === 'object' ? rawExplanation?.marathi?.audioUrl : '') || 
        challenge?.explanation_marathi_audioUrl || 
        challenge?.audioNarrations?.marathi?.url || 
        challenge?.audioNarrations?.mr?.url || 
        dbRecord?.url || "";
      const audioDuration = challenge?.explanation_marathi_audio_duration || 
        (typeof rawExplanation === 'object' && rawExplanation?.marathi?.audioDuration) || 
        challenge?.explanation_marathi_audioDuration || 
        (dbRecord?.durationMs ? Math.round(dbRecord.durationMs / 1000) : 15);
      return {
        text,
        audioUrl,
        audioDuration,
        hasData: !!text
      };
    }

    // Hinglish (Standard)
    const text = challenge?.explanation_speech_script || 
      (typeof rawExplanation === 'object' ? (rawExplanation?.hinglish?.text || rawExplanation?.text) : '') || 
      (typeof rawExplanation === 'string' ? rawExplanation : "") || 
      challenge?.explanation_concept || 
      challenge?.audioNarrations?.hinglish?.text || 
      challenge?.audioNarrations?.hi?.text || 
      dbRecord?.text || "";
    const audioUrl = (typeof rawExplanation === 'object' ? (rawExplanation?.hinglish?.audioUrl || rawExplanation?.audioUrl) : '') || 
      challenge?.explanation_audio_url || 
      challenge?.audioUrl || 
      challenge?.audioNarrations?.hinglish?.url || 
      challenge?.audioNarrations?.hi?.url || 
      dbRecord?.url || "";
    const audioDuration = (typeof rawExplanation === 'object' && (rawExplanation?.hinglish?.audioDuration || rawExplanation?.audioDuration)) || 
      challenge?.explanation_audio_duration || 
      challenge?.audioDuration || 
      (dbRecord?.durationMs ? Math.round(dbRecord.durationMs / 1000) : 15);
    return {
      text,
      audioUrl,
      audioDuration,
      hasData: !!text
    };
  };

  const currentLangData = getExplanationDataForLanguage(selectedLanguage);
  const hasCachedAudio = currentLangData.audioUrl !== "";
  const cachedAudioDuration = currentLangData.audioDuration;

  // Resolve spoken text based on selected language
  const spokenText = currentLangData.text;
  const words = spokenText ? spokenText.split(/\s+/) : [];

  // Progressive word index timing tracking
  const activeWordIndex = hasStartedPlaying 
    ? Math.min(words.length - 1, Math.floor((currentTime / duration) * words.length))
    : -1;

  // Refs for tracking states inside animation effect loops
  const isPlayingRef = useRef(isPlaying);
  const activeWordIndexRef = useRef(activeWordIndex);
  const wordsRef = useRef(words);
  const selectedOptionRef = useRef(selectedOption);
  const hasFinishedPlayingRef = useRef(hasFinishedPlaying);
  const hasStartedPlayingRef = useRef(hasStartedPlaying);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { activeWordIndexRef.current = activeWordIndex; }, [activeWordIndex]);
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { selectedOptionRef.current = selectedOption; }, [selectedOption]);
  useEffect(() => { hasFinishedPlayingRef.current = hasFinishedPlaying; }, [hasFinishedPlaying]);
  useEffect(() => { hasStartedPlayingRef.current = hasStartedPlaying; }, [hasStartedPlaying]);

  // Speaking mouth flaps and contextual postures animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (hasFinishedPlaying) {
        setCurrentExpression('wink');
      } else if (hasStartedPlaying) {
        setCurrentExpression('still');
      } else if (selectedOption) {
        setCurrentExpression('hand_on_head1');
      } else {
        setCurrentExpression('still');
      }
      return;
    }

    let currentPhase: 'talking' | 'gesturing' = 'talking';
    let ticksInCurrentPhase = 0;
    
    let targetTalkingTicks = Math.floor(Math.random() * 5) + 6; 
    let targetGestureTicks = Math.floor(Math.random() * 3) + 3; 
    
    let chosenGesture: typeof currentExpression = 'hand_on_head1';

    const getDynamicContext = (): typeof currentExpression => {
      const idx = activeWordIndexRef.current;
      const wordsList = wordsRef.current;
      if (idx < 0 || idx >= wordsList.length) {
        return 'still';
      }

      const startIdx = Math.max(0, idx - 2);
      const endIdx = Math.min(wordsList.length, idx + 4);
      const contextText = wordsList.slice(startIdx, endIdx).join(" ").toLowerCase();

      // Shock/Surprise triggers
      if (
        contextText.includes('!') || 
        contextText.includes('gosh') || 
        contextText.includes('shock') || 
        contextText.includes('crushed') || 
        contextText.includes('wait') || 
        contextText.includes('😂') ||
        contextText.includes('fail') ||
        contextText.includes('wrong') ||
        contextText.includes('oops') ||
        contextText.includes('crazy') ||
        contextText.includes('what') ||
        contextText.includes('surprise') ||
        contextText.includes('अरे देवा') ||
        contextText.includes('बापरे') ||
        contextText.includes('थांबा') ||
        contextText.includes('काय') ||
        contextText.includes('धक्का') ||
        contextText.includes('चुकीच')
      ) {
        return 'shock';
      }

      // Sarcastic / Teasing / Banter
      if (
        contextText.includes('savage') || 
        contextText.includes('roast') || 
        contextText.includes('vibe') || 
        contextText.includes('bro') || 
        contextText.includes('chill') || 
        contextText.includes('seriously') || 
        contextText.includes('funny') ||
        contextText.includes('मजाक') ||
        contextText.includes('मित्रा') ||
        contextText.includes('भावा')
      ) {
        return 'sarcastic';
      }

      return 'still';
    };

    const updateExpressionFrame = () => {
      if (!isPlayingRef.current) return;

      ticksInCurrentPhase++;

      if (currentPhase === 'talking') {
        if (ticksInCurrentPhase >= targetTalkingTicks) {
          currentPhase = 'gesturing';
          ticksInCurrentPhase = 0;
          targetGestureTicks = Math.floor(Math.random() * 3) + 3;
          chosenGesture = Math.random() > 0.5 ? 'hand_on_head1' : 'hand_on_head2';
        } else {
          const postureContext = getDynamicContext();
          if (postureContext !== 'still') {
            setCurrentExpression(postureContext);
          } else {
            setCurrentExpression(prev => (prev === 'talk1' ? 'talk2' : 'talk1'));
          }
        }
      } else {
        if (ticksInCurrentPhase >= targetGestureTicks) {
          currentPhase = 'talking';
          ticksInCurrentPhase = 0;
          targetTalkingTicks = Math.floor(Math.random() * 5) + 6;
          setCurrentExpression('talk1');
        } else {
          setCurrentExpression(chosenGesture);
        }
      }

      timerRef.current = setTimeout(updateExpressionFrame, 160);
    };

    updateExpressionFrame();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Sync animation frames to track precise audio current time
  const trackAudioProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
      if (!audioRef.current.paused && !audioRef.current.ended) {
        animationFrameRef.current = requestAnimationFrame(trackAudioProgress);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setHasFinishedPlaying(true);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setCurrentTime(duration);
    soundManager.play('complete');
  };

  // Pre-load audio hook to synchronize loading text and voice together
  useEffect(() => {
    if (!isOpen || !challenge) {
      stopAudio();
      return;
    }

    // Default or stored language preference
    const savedLang = localStorage.getItem('chikoo_language_preference') || 'hinglish';
    setSelectedLanguage(savedLang);
  }, [isOpen, challenge]);

  useEffect(() => {
    if (!isOpen || !challenge) {
      stopAudio();
      return;
    }

    let isCancelled = false;
    stopAudio();
    setIsLoadingAudio(true);
    setAudioReady(false);
    setAudioError(null);

    const loadExplanationAudio = async () => {
      let currentData = getExplanationDataForLanguage(selectedLanguage);

      // If audio URL or text is missing from challenge object, query /api/screen-audio
      if (!currentData.audioUrl || !currentData.text) {
        try {
          const effectiveLessonId = lessonId || challenge.lessonId || challenge.lesson_id;
          const params = new URLSearchParams({ screenId: challenge.id });
          if (effectiveLessonId) params.set('lessonId', effectiveLessonId);

          const res = await fetch(`/api/screen-audio?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.audioNarrations && !isCancelled) {
              setDbNarrations(prev => ({ ...prev, ...json.audioNarrations }));
              
              const rawLang = selectedLanguage.toLowerCase().trim();
              const matched = json.audioNarrations[rawLang] || 
                (rawLang === 'english' ? (json.audioNarrations['en'] || json.audioNarrations['english']) :
                 rawLang === 'marathi' ? (json.audioNarrations['mr'] || json.audioNarrations['marathi']) :
                 (json.audioNarrations['hinglish'] || json.audioNarrations['hi']));

              if (matched?.url) {
                currentData = {
                  text: currentData.text || matched.text || '',
                  audioUrl: matched.url,
                  audioDuration: matched.durationMs ? Math.round(matched.durationMs / 1000) : 15,
                  hasData: true
                };
              }
            }
          }
        } catch (fetchErr) {
          console.warn("Failed to fetch screen audio from server:", fetchErr);
        }
      }

      if (isCancelled) return;

      if (!currentData.text && !challenge.explanation) {
        setAudioError("Explanation text is not pre-recorded in the database.");
        setIsLoadingAudio(false);
        return;
      }

      if (!currentData.audioUrl) {
        setAudioError("Explanation voice is not pre-recorded in the database.");
        setIsLoadingAudio(false);
        return;
      }

      console.log(`Pre-loading audio for ${selectedLanguage}:`, currentData.audioUrl);
      const audio = new Audio(currentData.audioUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        if (isCancelled) return;
        const audioDuration = audio.duration || currentData.audioDuration || 15;
        setDuration(audioDuration);
      };

      const handleReady = () => {
        if (isCancelled) return;
        console.log(`Audio for ${selectedLanguage} is ready to play`);
        const audioDuration = audio.duration || currentData.audioDuration || 15;
        setDuration(audioDuration);
        setAudioReady(true);
        setIsLoadingAudio(false);
      };

      const handleLoadError = (e: any) => {
        if (isCancelled) return;
        console.error(`Audio loading failed for ${selectedLanguage}:`, e);
        setAudioError("Failed to load pre-recorded audio from database.");
        setIsLoadingAudio(false);
      };

      audio.addEventListener('canplay', handleReady);
      audio.addEventListener('canplaythrough', handleReady);
      audio.addEventListener('loadeddata', handleReady);
      audio.addEventListener('error', handleLoadError);
      audio.onended = handleAudioEnded;

      audio.load();
      if (audio.readyState >= 2) {
        handleReady();
      }
    };

    loadExplanationAudio();

    return () => {
      isCancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, [isOpen, challenge?.id, selectedLanguage, lessonId]);

  const handlePlayToggle = async () => {
    if (!audioReady || !audioRef.current) {
      console.warn("Play toggled before audio was ready.");
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    // Play/Resume/Replay
    if (hasFinishedPlaying) {
      setHasFinishedPlaying(false);
      setCurrentTime(0);
      audioRef.current.currentTime = 0;
    }

    setIsPlaying(true);
    setHasStartedPlaying(true);
    audioRef.current.play()
      .then(() => {
        animationFrameRef.current = requestAnimationFrame(trackAudioProgress);
      })
      .catch(err => {
        console.error("Audio playback failed:", err);
        setIsPlaying(false);
      });
  };

  const handleLanguageChange = (lang: string) => {
    if (isLoadingAudio) return; // Prevent switching while loading is in progress

    stopAudio();
    setHasStartedPlaying(false);
    setHasFinishedPlaying(false);
    setCurrentTime(0);

    localStorage.setItem('chikoo_language_preference', lang);
    setSelectedLanguage(lang);
  };

  const handleGotIt = () => {
    stopAudio();
    soundManager.play('click');
    onTryAgain();
  };

  const handleClose = () => {
    stopAudio();
    soundManager.play('click');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="explanation-fullscreen-stage"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[600] flex flex-col bg-slate-950 overflow-hidden font-sans select-none"
      >
        {/* Full-screen Character Illustration */}
        <AnimatedChikoo 
          currentExpression={currentExpression}
          isPlaying={isPlaying}
        />

        {/* Floating Transparent Header */}
        <ExplanationHeader 
          onClose={handleClose}
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          isLoadingAudio={isLoadingAudio}
        />

        {/* Bottom Immersive floating gradient overlay */}
        <ExplanationOverlay 
          hasStartedPlaying={hasStartedPlaying}
          isLoadingAudio={isLoadingAudio}
          audioReady={audioReady}
          audioError={audioError}
          onPlayToggle={handlePlayToggle}
          duration={duration}
          hasCachedAudio={hasCachedAudio}
          cachedAudioDuration={cachedAudioDuration}
          spokenText={spokenText}
          currentTime={currentTime}
          isPlaying={isPlaying}
          hasFinishedPlaying={hasFinishedPlaying}
          onGotIt={handleGotIt}
          isCorrect={isCorrect}
        />
      </motion.div>
    </AnimatePresence>
  );
});
ChikooExplanationOverlay.displayName = 'ChikooExplanationOverlay';
export default ChikooExplanationOverlay;
