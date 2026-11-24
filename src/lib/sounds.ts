const SOUNDS = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  incorrect: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  complete: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  pop: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  battle: 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3',
  tick: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
};

class SoundManager {
  private enabled: boolean = true;
  private musicEnabled: boolean = (() => {
    try {
      const saved = localStorage.getItem('chikoo_music_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  })();
  private audioCtx: AudioContext | null = null;
  private battleMusic: HTMLAudioElement | null = null;
  private tickAudio: HTMLAudioElement | null = null;
  private lessonMusic: HTMLAudioElement | null = null;
  private unit2Music: HTMLAudioElement | null = null;
  private unit2MusicActive: boolean = false;
  private unit2TargetVolume: number = 0.25;
  private unit3Music: HTMLAudioElement | null = null;
  private unit3MusicActive: boolean = false;
  private unit3TargetVolume: number = 0.20;
  private currentStorylineLessonActive: boolean = false;
  private inLessonMode: boolean = false;
  private activeLessonId: string | null = null;
  private fadeInterval: any = null;
  private audioCache: { [key: string]: HTMLAudioElement } = {};
  private listeners: Set<() => void> = new Set();
  private userInteractionBound: boolean = false;

  constructor() {
    // Audio assets are lazy-loaded on demand when entering lessons or activating biomes to minimize initial load time & bandwidth.
    this.setupVisibilityListener();
    this.bindProactiveUserUnlock();
  }

  /**
   * Lazily initialize audio files only when specifically needed (e.g. entering a lesson or module ambient mode).
   */
  public getLessonMusic(): HTMLAudioElement | null {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
    if (!this.lessonMusic) {
      try {
        this.lessonMusic = new Audio('/lesson_music.mp3');
        this.lessonMusic.loop = true;
        this.lessonMusic.volume = 0.12;
        this.lessonMusic.addEventListener('error', () => {
          if (this.lessonMusic) {
            const current = this.lessonMusic.src;
            if (!current.includes('/audio/lesson_music.mp3')) {
              this.lessonMusic.src = '/audio/lesson_music.mp3';
              this.lessonMusic.load();
              if (this.inLessonMode && this.currentStorylineLessonActive && this.isMusicEnabled()) {
                this.lessonMusic.play().catch(() => {});
              }
            } else if (!current.includes('/public/lesson_music.mp3')) {
              this.lessonMusic.src = '/public/lesson_music.mp3';
              this.lessonMusic.load();
              if (this.inLessonMode && this.currentStorylineLessonActive && this.isMusicEnabled()) {
                this.lessonMusic.play().catch(() => {});
              }
            }
          }
        });
      } catch (err) {
        console.warn('[SoundManager] Lesson music init notice:', err);
      }
    }
    return this.lessonMusic;
  }

  public getUnit1Music(): HTMLAudioElement | null {
    return null;
  }

  public getUnit2Music(): HTMLAudioElement | null {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
    if (!this.unit2Music) {
      try {
        this.unit2Music = new Audio('/morning.mp3');
        this.unit2Music.loop = true;
        this.unit2Music.volume = 0.25;
        this.unit2Music.addEventListener('error', () => {
          if (this.unit2Music && !this.unit2Music.src.includes('/public/morning.mp3')) {
            this.unit2Music.src = '/public/morning.mp3';
            this.unit2Music.load();
            if (this.unit2MusicActive && this.isMusicEnabled()) {
              this.unit2Music.play().catch(() => {});
            }
          }
        });
      } catch (err) {
        console.warn('[SoundManager] Unit 2 music init notice:', err);
      }
    }
    return this.unit2Music;
  }

  public getUnit3Music(): HTMLAudioElement | null {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
    if (!this.unit3Music) {
      try {
        this.unit3Music = new Audio('/autumn.mp3');
        this.unit3Music.loop = true;
        this.unit3Music.volume = 0.20;
        this.unit3Music.addEventListener('error', () => {
          if (this.unit3Music && !this.unit3Music.src.includes('/public/autumn.mp3')) {
            this.unit3Music.src = '/public/autumn.mp3';
            this.unit3Music.load();
            if (this.unit3MusicActive && this.isMusicEnabled()) {
              this.unit3Music.play().catch(() => {});
            }
          }
        });
      } catch (err) {
        console.warn('[SoundManager] Unit 3 music init notice:', err);
      }
    }
    return this.unit3Music;
  }

  public getTickAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
    if (!this.tickAudio) {
      try {
        this.tickAudio = new Audio(SOUNDS.tick);
        this.tickAudio.volume = 0.35;
      } catch (err) {
        console.warn('[SoundManager] Tick audio init notice:', err);
      }
    }
    return this.tickAudio;
  }

  public getBattleMusic(): HTMLAudioElement | null {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
    if (!this.battleMusic) {
      try {
        this.battleMusic = new Audio(SOUNDS.battle);
        this.battleMusic.loop = true;
        this.battleMusic.volume = 0.25;
      } catch (err) {
        console.warn('[SoundManager] Battle music init notice:', err);
      }
    }
    return this.battleMusic;
  }

  /**
   * Preload audio files only if explicitly requested.
   */
  public preloadAudioAssets() {
    this.getLessonMusic();
    this.getUnit2Music();
    this.getUnit3Music();
    this.getTickAudio();
    this.getBattleMusic();
  }

  public preload() {
    this.preloadAudioAssets();
  }

  /**
   * Proactively unlock Web Audio and HTMLAudioElement playback upon the very first user interaction.
   */
  private bindProactiveUserUnlock() {
    if (typeof window === 'undefined') return;

    const proactiveUnlock = () => {
      this.initAudioContext();
      if (this.lessonMusic && this.inLessonMode && this.currentStorylineLessonActive && this.isMusicEnabled() && this.lessonMusic.paused) {
        this.lessonMusic.play().catch(() => {});
      }
      if (this.unit2Music && this.unit2MusicActive && this.isMusicEnabled() && this.unit2Music.paused) {
        this.unit2Music.play().catch(() => {});
      }
      if (this.unit3Music && this.unit3MusicActive && this.isMusicEnabled() && this.unit3Music.paused) {
        this.unit3Music.play().catch(() => {});
      }
      window.removeEventListener('pointerdown', proactiveUnlock, true);
      window.removeEventListener('click', proactiveUnlock, true);
      window.removeEventListener('touchstart', proactiveUnlock, true);
      window.removeEventListener('keydown', proactiveUnlock, true);
    };

    window.addEventListener('pointerdown', proactiveUnlock, { capture: true, once: true, passive: true });
    window.addEventListener('click', proactiveUnlock, { capture: true, once: true, passive: true });
    window.addEventListener('touchstart', proactiveUnlock, { capture: true, once: true, passive: true });
    window.addEventListener('keydown', proactiveUnlock, { capture: true, once: true, passive: true });
  }

  private setupVisibilityListener() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.lessonMusic && !this.lessonMusic.paused) {
          this.lessonMusic.pause();
        }
        if (this.unit2Music && !this.unit2Music.paused) {
          this.unit2Music.pause();
        }
        if (this.unit3Music && !this.unit3Music.paused) {
          this.unit3Music.pause();
        }
      } else {
        if (this.inLessonMode && this.currentStorylineLessonActive && this.isMusicEnabled() && this.lessonMusic && this.lessonMusic.paused) {
          this.resumeLessonMusic();
        }
        if (this.unit2MusicActive && this.isMusicEnabled() && this.unit2Music && this.unit2Music.paused) {
          this.unit2Music.play().catch(() => {});
        }
        if (this.unit3MusicActive && this.isMusicEnabled() && this.unit3Music && this.unit3Music.paused) {
          this.unit3Music.play().catch(() => {});
        }
      }
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(fn => {
      try { fn(); } catch {}
    });
  }

  setInLessonMode(inLesson: boolean) {
    this.inLessonMode = inLesson;
    if (!inLesson) {
      this.currentStorylineLessonActive = false;
    } else {
      // Pause Unit 2 & Unit 3 ambient music while inside a lesson session
      if (this.unit2Music && !this.unit2Music.paused) {
        this.unit2Music.pause();
      }
      if (this.unit3Music && !this.unit3Music.paused) {
        this.unit3Music.pause();
      }
    }
  }

  isInLessonMode(): boolean {
    return this.inLessonMode;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBattleMusic();
      this.stopTick();
      this.pauseLessonMusic();
      if (this.unit2Music && !this.unit2Music.paused) {
        this.unit2Music.pause();
      }
      if (this.unit3Music && !this.unit3Music.paused) {
        this.unit3Music.pause();
      }
    } else {
      if (this.musicEnabled && this.inLessonMode && this.currentStorylineLessonActive) {
        this.resumeLessonMusic();
      }
      if (this.musicEnabled && this.unit2MusicActive && this.unit2Music && this.unit2Music.paused) {
        this.unit2Music.play().catch(() => {});
      }
      if (this.musicEnabled && this.unit3MusicActive && this.unit3Music && this.unit3Music.paused) {
        this.unit3Music.play().catch(() => {});
      }
    }
    this.notifyListeners();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    try {
      localStorage.setItem('chikoo_music_enabled', String(enabled));
    } catch {}

    if (!enabled) {
      this.pauseLessonMusic();
      if (this.unit2Music && !this.unit2Music.paused) {
        this.unit2Music.pause();
      }
      if (this.unit3Music && !this.unit3Music.paused) {
        this.unit3Music.pause();
      }
    } else {
      if (this.enabled && this.inLessonMode && this.currentStorylineLessonActive) {
        this.resumeLessonMusic();
      }
      if (this.enabled && this.unit2MusicActive && this.unit2Music && this.unit2Music.paused) {
        this.unit2Music.play().catch(() => {});
      }
      if (this.enabled && this.unit3MusicActive && this.unit3Music && this.unit3Music.paused) {
        this.unit3Music.play().catch(() => {});
      }
    }
    this.notifyListeners();
  }

  isMusicEnabled(): boolean {
    return this.enabled && this.musicEnabled;
  }

  /**
   * Updates Unit 2 ambient music ('morning.mp3') state and volume in loop when user is on Unit 2.
   * Smoothly scales volume according to unit 2 visibility opacity (0 to 1).
   */
  updateUnit2Ambient(isActive: boolean, opacity: number = 1) {
    const effectiveOpacity = Math.max(0, Math.min(1, opacity));
    const shouldPlay = isActive && effectiveOpacity > 0.03 && !this.inLessonMode;
    this.unit2MusicActive = shouldPlay;

    if (!shouldPlay) {
      if (this.unit2Music && !this.unit2Music.paused) {
        this.unit2Music.pause();
      }
      return;
    }

    const music = this.getUnit2Music();
    const targetVol = Math.max(0.03, Math.min(0.35, effectiveOpacity * 0.28));
    this.unit2TargetVolume = targetVol;

    if (this.isMusicEnabled() && music) {
      music.volume = targetVol;
      if (music.paused) {
        const playPromise = music.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.log("[SoundManager] Unit 2 music playback deferred until user interaction:", err?.message || err);
            this.bindUserInteractionUnlock();
          });
        }
      }
    } else if (!this.isMusicEnabled() && music) {
      if (!music.paused) {
        music.pause();
      }
    }
  }

  startUnit2Music(volume: number = 0.25) {
    this.updateUnit2Ambient(true, volume / 0.28);
  }

  stopUnit2Music() {
    this.updateUnit2Ambient(false, 0);
  }

  /**
   * Updates Unit 3 ambient music ('autumn.mp3') state and volume in loop when user is on Unit 3.
   * Smoothly scales volume according to unit 3 visibility opacity (0 to 1).
   */
  updateUnit3Ambient(isActive: boolean, opacity: number = 1) {
    const effectiveOpacity = Math.max(0, Math.min(1, opacity));
    const shouldPlay = isActive && effectiveOpacity > 0.03 && !this.inLessonMode;
    this.unit3MusicActive = shouldPlay;

    if (!shouldPlay) {
      if (this.unit3Music && !this.unit3Music.paused) {
        this.unit3Music.pause();
      }
      return;
    }

    const music = this.getUnit3Music();
    const targetVol = Math.max(0.03, Math.min(0.35, effectiveOpacity * 0.28));
    this.unit3TargetVolume = targetVol;

    if (this.isMusicEnabled() && music) {
      music.volume = targetVol;
      if (music.paused) {
        const playPromise = music.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.log("[SoundManager] Unit 3 music playback deferred until user interaction:", err?.message || err);
            this.bindUserInteractionUnlock();
          });
        }
      }
    } else if (!this.isMusicEnabled() && music) {
      if (!music.paused) {
        music.pause();
      }
    }
  }

  startUnit3Music(volume: number = 0.20) {
    this.updateUnit3Ambient(true, volume / 0.28);
  }

  stopUnit3Music() {
    this.updateUnit3Ambient(false, 0);
  }

  /**
   * Binds capture-phase user interaction listeners to unlock audio playback if autoplay was restricted.
   */
  private bindUserInteractionUnlock() {
    if (this.userInteractionBound || typeof window === 'undefined') return;
    this.userInteractionBound = true;

    const unlock = () => {
      this.initAudioContext();
      if (this.inLessonMode && this.currentStorylineLessonActive && this.isMusicEnabled() && this.lessonMusic && this.lessonMusic.paused) {
        this.lessonMusic.play().catch(() => {});
      }
      if (this.unit2MusicActive && this.isMusicEnabled() && this.unit2Music && this.unit2Music.paused) {
        this.unit2Music.play().catch(() => {});
      }
      if (this.unit3MusicActive && this.isMusicEnabled() && this.unit3Music && this.unit3Music.paused) {
        this.unit3Music.play().catch(() => {});
      }
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('click', unlock, true);
      window.removeEventListener('touchstart', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      this.userInteractionBound = false;
    };

    window.addEventListener('pointerdown', unlock, { capture: true, once: true, passive: true });
    window.addEventListener('click', unlock, { capture: true, once: true, passive: true });
    window.addEventListener('touchstart', unlock, { capture: true, once: true, passive: true });
    window.addEventListener('keydown', unlock, { capture: true, once: true, passive: true });
  }

  startLessonMusic(lessonId?: string) {
    this.currentStorylineLessonActive = true;
    this.inLessonMode = true;

    const music = this.getLessonMusic();

    // Reset playback position ONLY when starting a brand new or different lesson
    if (lessonId && this.activeLessonId !== lessonId) {
      this.activeLessonId = lessonId;
      if (music) {
        music.currentTime = 0;
      }
    } else if (lessonId && !this.activeLessonId) {
      this.activeLessonId = lessonId;
    }

    if (this.isMusicEnabled() && music) {
      if (this.fadeInterval) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }

      music.volume = 0.12; // Low background volume (~12%)
      if (music.paused) {
        const playPromise = music.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.log("[SoundManager] Autoplay deferred until user interaction:", err?.message || err);
            this.bindUserInteractionUnlock();
          });
        }
      }
    } else if (!this.isMusicEnabled() && music) {
      if (!music.paused) {
        music.pause();
      }
    }
  }

  resumeLessonMusic() {
    if (!this.isMusicEnabled() || !this.inLessonMode || !this.currentStorylineLessonActive) return;

    const music = this.getLessonMusic();

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (music && music.paused) {
      music.volume = 0.12;
      const playPromise = music.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          this.bindUserInteractionUnlock();
        });
      }
    }
  }

  pauseLessonMusic() {
    if (!this.lessonMusic) return;

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    // Pause without resetting currentTime so unmuting resumes at exact timestamp
    if (!this.lessonMusic.paused) {
      this.lessonMusic.pause();
    }
  }

  stopLessonMusic(fade: boolean = true) {
    this.currentStorylineLessonActive = false;
    this.inLessonMode = false;
    this.activeLessonId = null;

    if (!this.lessonMusic) return;

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (fade && !this.lessonMusic.paused) {
      const startVol = this.lessonMusic.volume || 0.12;
      const steps = 8;
      const duration = 350; // ms fade out
      const stepTime = duration / steps;
      let currentStep = 0;

      this.fadeInterval = setInterval(() => {
        currentStep++;
        if (this.lessonMusic) {
          const newVol = Math.max(0, startVol * (1 - currentStep / steps));
          this.lessonMusic.volume = newVol;
        }
        if (currentStep >= steps) {
          if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
          }
          if (this.lessonMusic) {
            this.lessonMusic.pause();
            this.lessonMusic.currentTime = 0;
            this.lessonMusic.volume = 0.12;
          }
        }
      }, stepTime);
    } else {
      this.lessonMusic.pause();
      this.lessonMusic.currentTime = 0;
      this.lessonMusic.volume = 0.12;
    }
  }

  playTick(startTime: number = 0) {
    if (!this.enabled) return;
    try {
      this.stopTick(); // Always clear previous instance before playing
      
      if (!this.tickAudio) {
        this.tickAudio = new Audio(SOUNDS.tick);
        this.tickAudio.volume = 0.35;
      }
      
      const audio = this.tickAudio;
      
      if (startTime > 0) {
        const setTime = () => {
          try {
            audio.currentTime = startTime;
          } catch (err) {
            console.log("Error seeking tick audio inside listener:", err);
          }
          audio.removeEventListener('canplay', setTime);
          audio.removeEventListener('loadedmetadata', setTime);
        };
        audio.addEventListener('canplay', setTime);
        audio.addEventListener('loadedmetadata', setTime);
      } else {
        audio.currentTime = 0;
      }
      
      audio.play().catch(err => {
        console.log("Failed to play custom tick.mp3 sound, falling back to synth:", err);
        this.playSynth('tick_fallback');
      });
    } catch (e) {
      console.log("Error playing custom tick.mp3 sound, falling back to synth:", e);
      this.playSynth('tick_fallback');
    }
  }

  stopTick() {
    try {
      if (this.tickAudio) {
        this.tickAudio.pause();
        this.tickAudio.currentTime = 0;
      }
    } catch (e) {
      console.log("Failed to stop tick music:", e);
    }
  }

  playBattleMusic() {
    if (!this.enabled) return;
    try {
      if (!this.battleMusic) {
        this.battleMusic = new Audio(SOUNDS.battle);
        this.battleMusic.loop = true;
        this.battleMusic.volume = 0.25;
      }
      this.battleMusic.play().catch(err => {
        console.log("Failed to play battle music automatically:", err);
      });
    } catch (e) {
      console.log("Battle music error:", e);
    }
  }

  stopBattleMusic() {
    try {
      if (this.battleMusic) {
        this.battleMusic.pause();
        this.battleMusic.currentTime = 0;
      }
    } catch (e) {
      console.log("Failed to stop battle music:", e);
    }
  }

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // High-fidelity procedurally generated synth sounds for offline/robust performance
  playSynth(type: 'click' | 'correct' | 'incorrect' | 'complete' | 'pop' | 'tick' | 'clash' | 'thunder' | 'cheer' | 'charge' | 'flash' | 'tick_fallback' | 'cms_tick' | 'race_countdown' | 'race_go' | 'turbo_boost' | 'stall_buzz' | 'whoosh') {
    try {
      this.initAudioContext();
      if (!this.audioCtx || !this.enabled) return;

      // Suppress tap/click sound effects completely during storyline/lesson interactions
      if (this.inLessonMode || this.currentStorylineLessonActive) {
        if (type === 'click' || type === 'pop') {
          return;
        }
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      switch (type) {
        case 'tick': {
          // Bypassed, handled as an HTMLAudioElement in play()
          break;
        }
        case 'cms_tick': {
          // A premium futuristic dual-tone ticking pulse with high resonance
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(1200, now);
          osc1.frequency.exponentialRampToValueAtTime(400, now + 0.04);

          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(800, now);
          osc2.frequency.exponentialRampToValueAtTime(200, now + 0.04);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.05);
          osc2.stop(now + 0.05);
          break;
        }
        case 'tick_fallback': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          // Create a crisp, soft high-pitch clock tick
          osc.frequency.setValueAtTime(950, now);
          osc.frequency.exponentialRampToValueAtTime(100, now + 0.02);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.03);
          break;
        }
        case 'click': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.06);
          break;
        }
        case 'pop': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(450, now + 0.1);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.11);
          break;
        }
        case 'correct': {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(523.25, now); // C5
          osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
          
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1046.50, now + 0.1); // C6
          
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          
          osc1.start(now);
          osc1.stop(now + 0.35);
          osc2.start(now + 0.1);
          osc2.stop(now + 0.35);
          break;
        }
        case 'incorrect': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.linearRampToValueAtTime(90, now + 0.35);
          
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.36);
          break;
        }
        case 'complete': {
          // Epic chord! Major triad with sliding high note
          const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
          notes.forEach((f, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now);
            osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + 0.6);
            osc.connect(gain);
            osc.start(now + i * 0.05);
            osc.stop(now + 0.8);
          });
          gain.connect(ctx.destination);
          break;
        }
        case 'clash': {
          // Metallic sword crash sound effect using frequency modulated oscillators
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc1.type = 'sawtooth';
          osc1.frequency.setValueAtTime(2000, now);
          osc1.frequency.exponentialRampToValueAtTime(120, now + 0.4);

          osc2.type = 'sawtooth';
          osc2.frequency.setValueAtTime(2350, now);
          osc2.frequency.exponentialRampToValueAtTime(180, now + 0.4);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1500, now);
          filter.Q.setValueAtTime(2.0, now);

          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.5);
          osc2.stop(now + 0.5);
          break;
        }
        case 'thunder': {
          // Low frequency rumble using noise-like fast oscillator sweeps
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(80, now);
          osc.frequency.linearRampToValueAtTime(30, now + 1.2);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(100, now);

          gain.gain.setValueAtTime(0.3, now);
          gain.gain.linearRampToValueAtTime(0.1, now + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 1.3);
          break;
        }
        case 'charge': {
          // Sci-fi power-up sweep
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 1.5);

          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.2, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 1.6);
          break;
        }
        case 'flash': {
          // Exploding shockwave sound with linear volume decay
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(350, now);
          osc.frequency.exponentialRampToValueAtTime(10, now + 0.7);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, now);

          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.7);
          break;
        }
        case 'cheer': {
          // Crowd swish
          const osc = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(550, now + 0.5);

          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(554, now);
          osc2.frequency.exponentialRampToValueAtTime(660, now + 0.5);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

          osc.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc2.start(now);
          osc.stop(now + 0.8);
          osc2.stop(now + 0.8);
          break;
        }
        case 'race_countdown': {
          // Sharp energetic racing countdown beep (3-2-1)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now); // A4 beep
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }
        case 'race_go': {
          // High-pitch triumphal GO beep (High A5 chime + harmonic flare)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(880, now); // A5
          osc1.frequency.exponentialRampToValueAtTime(1108.73, now + 0.35); // C#6
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(1760, now); // A6
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.55);
          osc2.stop(now + 0.55);
          break;
        }
        case 'turbo_boost': {
          // Sci-Fi jet turbo ignition whoosh
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(1600, now + 0.45);
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(400, now);
          filter.frequency.exponentialRampToValueAtTime(2400, now + 0.45);
          filter.Q.setValueAtTime(3.0, now);
          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.28, now + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.65);
          break;
        }
        case 'stall_buzz': {
          // Electric stutter / glitch sputter
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(95, now);
          osc.frequency.setValueAtTime(140, now + 0.08);
          osc.frequency.setValueAtTime(60, now + 0.16);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.36);
          break;
        }
        case 'whoosh': {
          // Passing speed whoosh
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.32);
          break;
        }
      }
    } catch (e) {
      console.log('Procedural audio error blocked safely:', e);
    }
  }

  play(soundName: keyof typeof SOUNDS | 'tick' | 'clash' | 'thunder' | 'cheer' | 'charge' | 'flash' | 'cms_tick' | 'race_countdown' | 'race_go' | 'turbo_boost' | 'stall_buzz' | 'whoosh') {
    if (!this.enabled) return;

    // Suppress tap/click sound effects completely during storyline/lesson interactions
    if (this.inLessonMode || this.currentStorylineLessonActive) {
      if (this.isMusicEnabled() && this.lessonMusic && this.lessonMusic.paused) {
        this.lessonMusic.play().catch(() => {});
      }
      if (soundName === 'click' || soundName === 'pop') {
        return;
      }
    }
    
    // Play custom tick.mp3 for the ticking sounds safely without overlapping
    if (soundName === 'tick') {
      this.playTick();
      return;
    }

    // Always call procedural synth engine for unified, zero-latency, offline-first performance
    this.playSynth(soundName as any);
  }
}

export const soundManager = new SoundManager();

export const enterFullscreen = () => {
  try {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen();
    } else if ((docEl as any).webkitRequestFullscreen) {
      (docEl as any).webkitRequestFullscreen();
    } else if ((docEl as any).mozRequestFullScreen) {
      (docEl as any).mozRequestFullScreen();
    } else if ((docEl as any).msRequestFullscreen) {
      (docEl as any).msRequestFullscreen();
    }
  } catch (error) {
    console.warn("Fullscreen request failed safely:", error);
  }
};

export const exitFullscreen = () => {
  try {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  } catch (error) {
    console.warn("Fullscreen exit failed safely:", error);
  }
};

export const isStorylineLesson = (lesson: any): boolean => {
  if (!lesson) return false;

  // Boss guardian battles have their own dedicated battle music (Neon Orbit)
  if (lesson.isBonus || lesson.isBoss || lesson.id?.startsWith('guardian_')) {
    return false;
  }

  // Recharge quests and pure speed drills are fast timed arcade modes, not storyline lessons
  if (lesson.id === 'recharge_quest' || lesson.id?.startsWith('practice_') || lesson.id?.startsWith('prac_')) {
    return false;
  }

  // 1. Check direct properties
  if (lesson.isStory === true) return true;
  if (lesson.category === 'story' || lesson.category === 'visual_story') return true;

  // 2. Storyline/Visual Story challenge types
  const STORYLINE_TYPES = new Set([
    'visual_lesson_screen',
    'content_screen',
    'comic_story',
    'student_story',
    'before_after_story',
    'image_explainer',
    'gif_explainer',
    'meme_screen',
    'fun_fact',
    'visual_analogy',
    'ai_around_you',
    'interactive_reveal',
    'why_should_i_care',
    'scenario_quest',
    'student_mission',
    'before_after_ai',
    'before_after_exp'
  ]);

  if (Array.isArray(lesson.challenges) && lesson.challenges.length > 0) {
    if (lesson.challenges.some((c: any) => c && STORYLINE_TYPES.has(c.type))) {
      return true;
    }
  }

  // Standard learning path / unit curriculum storyline lessons
  if (lesson.id && (lesson.id.startsWith('l1_') || lesson.id.startsWith('l2_') || lesson.id.startsWith('l3_') || lesson.id.startsWith('l4_') || lesson.id.startsWith('l5_') || lesson.id.startsWith('l6_') || lesson.id.startsWith('unit_') || !lesson.isChallenge)) {
    return true;
  }

  return false;
};

