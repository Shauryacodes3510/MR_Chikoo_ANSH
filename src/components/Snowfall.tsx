import { useEffect, useRef, memo } from 'react';
import { biomeChannel } from '../lib/biomeChannel';
import { getParticleLimit, isLowEndDevice } from '../lib/devicePerformance';

interface BaseParticle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  baseOpacity: number;
}

interface SnowParticle extends BaseParticle {
  type: 'snow';
  angle: number;
  wobbleSpeed: number;
  wobbleRange: number;
  isSparkle: boolean;
  sparklePhase: number;
}

interface LeafParticle extends BaseParticle {
  type: 'leaf';
  angle: number;
  spin: number;
  wobbleSpeed: number;
  wobbleRange: number;
  color: string;
}

interface GoldParticle extends BaseParticle {
  type: 'gold';
  pulsePhase: number;
  pulseSpeed: number;
}

interface WindParticle extends BaseParticle {
  type: 'wind';
  length: number;
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  baseOpacity: number;
}

interface MistLayer {
  x: number;
  y: number;
  width: number;
  height: number;
  speedX: number;
  speedY: number;
  baseOpacity: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface WaterfallSpray {
  x: number;
  y: number;
  size: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface GlintParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  maxOpacity: number;
  speedX: number;
  speedY: number;
  life: number;
  maxLife: number;
}

interface AutumnLeafParticle extends BaseParticle {
  type: 'autumn_leaf';
  angle: number;
  spin: number;
  wobbleSpeed: number;
  wobbleRange: number;
  color: string;
  depthLayer: 'background' | 'middle' | 'foreground';
  glideFactor: number;
  swayPhase: number;
  isGustLeaf?: boolean;
  active?: boolean;
}

interface AutumnGoldDustParticle extends BaseParticle {
  type: 'autumn_gold_dust';
  pulsePhase: number;
  pulseSpeed: number;
}

interface TwinkleStarParticle extends BaseParticle {
  type: 'twinkle_star';
  twinkleSpeed: number;
  twinklePhase: number;
  maxOpacity: number;
  sparkleTimer?: number;
}

interface CosmicDustParticle extends BaseParticle {
  type: 'cosmic_dust';
  color: string;
  driftPhase: number;
  driftSpeed: number;
}

interface ShootingStarParticle {
  x: number;
  y: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
  active: boolean;
}

type Particle = 
  | SnowParticle 
  | LeafParticle 
  | GoldParticle 
  | WindParticle 
  | AutumnLeafParticle 
  | AutumnGoldDustParticle
  | TwinkleStarParticle
  | CosmicDustParticle;

interface SnowfallProps {
  biomeOpacities?: number[];
}

export function Snowfall({ biomeOpacities }: SnowfallProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const forestGlowRef = useRef<HTMLDivElement | null>(null);
  const mountainGlowRef = useRef<HTMLDivElement | null>(null);
  const spaceGlowRef = useRef<HTMLDivElement | null>(null);
  const opacitiesRef = useRef<number[]>(biomeOpacities || biomeChannel.getOpacities());

  // Keep opacities ref and glow element styles updated smoothly without component re-renders
  useEffect(() => {
    const applyOpacities = (ops: number[]) => {
      opacitiesRef.current = ops;
      const forest = ops[1] !== undefined ? ops[1] : 0;
      const mountain = ops[2] !== undefined ? ops[2] : 0;
      const space = ops[3] !== undefined ? ops[3] : 0;

      if (forestGlowRef.current) forestGlowRef.current.style.opacity = String(forest * 0.45);
      if (mountainGlowRef.current) mountainGlowRef.current.style.opacity = String(mountain * 0.32);
      if (spaceGlowRef.current) spaceGlowRef.current.style.opacity = String(space * 0.45);
    };

    if (biomeOpacities) {
      applyOpacities(biomeOpacities);
    } else {
      applyOpacities(biomeChannel.getOpacities());
    }

    const unsubscribe = biomeChannel.subscribe((ops) => {
      applyOpacities(ops);
    });

    return unsubscribe;
  }, [biomeOpacities]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let glints: GlintParticle[] = [];
    
    // Unit 4 Space Biome States
    let activeShootingStar: ShootingStarParticle | null = null;
    let lastShootingStarTime = Date.now();
    let nextShootingStarDelay = 35000 + Math.random() * 30000; // 35-65 seconds

    let time = 0;
    
    // Wind control
    let currentWind = 0;
    let targetWind = 0;
    let lastWindChange = Date.now();

    // Single Interactive Butterfly State
    const butterfly = {
      active: false,
      state: 'inactive' as 'inactive' | 'flying' | 'landing' | 'resting' | 'takeoff',
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      speedX: 0,
      speedY: 0,
      angle: 0,
      color: '#fb923c',
      size: 5,
      wingFlap: 0,
      pathPhase: 0,
      targetElement: null as HTMLElement | null,
      restTimer: 0,
      spawnTimer: 180, // initial delay frame count
    };

    // Unit 3 States
    let clouds: Cloud[] = [];
    let mistLayers: MistLayer[] = [];

    // Premium Autumn Mountain States
    let lastAutumnWindGustTime = Date.now();
    let autumnWindGustInterval = 8000 + Math.random() * 4000; // 8-12 seconds
    const autumnWindGustDuration = 2000; // 2 seconds
    let autumnWindGustActive = false;
    let autumnWindGustStartTime = 0;
    const waterfallSprays: WaterfallSpray[] = [
      { x: 0.15, y: 0.42, size: 30, pulsePhase: 0, pulseSpeed: 0.04 },
      { x: 0.14, y: 0.52, size: 45, pulsePhase: 1.2, pulseSpeed: 0.035 },
      { x: 0.16, y: 0.62, size: 55, pulsePhase: 2.5, pulseSpeed: 0.03 },
      { x: 0.15, y: 0.72, size: 65, pulsePhase: 3.8, pulseSpeed: 0.025 },
    ];

    const eagle = {
      active: false,
      x: 0,
      y: 0,
      speedX: 0,
      speedY: 0,
      size: 15,
      wingPhase: 0,
      spawnTimer: 450, // wait a bit before first eagle spawn
    };

    // Resize handler
    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const width = parent.clientWidth || 430;
      const height = parent.clientHeight || 844;
      
      canvas.width = width;
      canvas.height = height;

      // Initialize or adapt particle pools
      initParticles(width, height);
    };

    // Helper functions to create different types of particles
    const createSnowParticle = (width: number, height: number, isInitial = false): SnowParticle => {
      const rand = Math.random();
      let layer: 0 | 1 | 2 = 1;
      if (rand < 0.5) layer = 0;
      else if (rand < 0.85) layer = 1;
      else layer = 2;

      let size = 0;
      let speedY = 0;
      let baseOpacity = 0.8;

      if (layer === 0) {
        size = 1.5 + Math.random() * 1.5;
        speedY = 0.3 + Math.random() * 0.3;
        baseOpacity = 0.3 + Math.random() * 0.2;
      } else if (layer === 1) {
        size = 3.5 + Math.random() * 2.5;
        speedY = 0.6 + Math.random() * 0.5;
        baseOpacity = 0.5 + Math.random() * 0.2;
      } else {
        size = 6 + Math.random() * 3;
        speedY = 1.2 + Math.random() * 0.8;
        baseOpacity = 0.6 + Math.random() * 0.2;
      }

      const isSparkle = Math.random() < 0.08 && layer !== 2;

      return {
        type: 'snow',
        x: Math.random() * width,
        y: isInitial ? Math.random() * height : -15 - Math.random() * 20,
        size,
        speedY,
        speedX: (Math.random() - 0.5) * 0.15,
        angle: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.0015 + Math.random() * 0.0045, // slower wobble, longer interval
        wobbleRange: 0.2 + Math.random() * 0.4,
        isSparkle,
        sparklePhase: Math.random() * Math.PI * 2,
        opacity: baseOpacity,
        baseOpacity,
      };
    };

    const createLeafParticle = (width: number, height: number, isInitial = false): LeafParticle => {
      const greenColors = [
        '#2d7a4c', // Medium forest green
        '#82b082', // Soft sage green
        '#10b981', // Emerald green
        '#4ade80', // Bright spring green
        '#a3e635', // Golden green
      ];
      const color = greenColors[Math.floor(Math.random() * greenColors.length)];
      const size = 5 + Math.random() * 6; // 5-11px
      const speedY = 0.35 + Math.random() * 0.4; // Very slow drift
      const speedX = -0.15 - Math.random() * 0.25; // Drifting wind direction
      const baseOpacity = 0.4 + Math.random() * 0.3;

      return {
        type: 'leaf',
        x: Math.random() * width,
        y: isInitial ? Math.random() * height : -20 - Math.random() * 30,
        size,
        speedY,
        speedX,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.015,
        wobbleSpeed: 0.01 + Math.random() * 0.015,
        wobbleRange: 0.25 + Math.random() * 0.35,
        opacity: baseOpacity,
        baseOpacity,
        color,
      };
    };

    const createGoldParticle = (width: number, height: number, isInitial = false): GoldParticle => {
      const size = 1.2 + Math.random() * 2.5; // Small glowing light
      const speedY = 0.15 + Math.random() * 0.2; // Slow upward float
      const speedX = (Math.random() - 0.5) * 0.08;
      const baseOpacity = 0.2 + Math.random() * 0.4;

      return {
        type: 'gold',
        x: Math.random() * width,
        y: isInitial ? Math.random() * height : height + 10 + Math.random() * 20,
        size,
        speedY,
        speedX,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        opacity: baseOpacity,
        baseOpacity,
      };
    };

    const createGlint = (width: number, height: number): GlintParticle => {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: 8 + Math.random() * 14, // 8px to 22px wide soft glow
        opacity: 0,
        maxOpacity: 0.04 + Math.random() * 0.06, // Extremely subtle (4% to 10%)
        speedX: (Math.random() - 0.5) * 0.06,
        speedY: (Math.random() - 0.5) * 0.06,
        life: 0,
        maxLife: 240 + Math.random() * 240, // 4 to 8 seconds duration
      };
    };

    const createWindParticle = (width: number, height: number, isInitial = false): WindParticle => {
      const size = 1.0 + Math.random() * 1.5;
      const length = 15 + Math.random() * 25;
      const speedX = 0.8 + Math.random() * 1.2;
      const speedY = 0.2 + Math.random() * 0.35;
      const baseOpacity = 0.08 + Math.random() * 0.12;

      return {
        type: 'wind',
        x: Math.random() * width,
        y: isInitial ? Math.random() * height : -30 - Math.random() * 40,
        size,
        length,
        speedY,
        speedX,
        opacity: baseOpacity,
        baseOpacity,
      };
    };

    const createCloud = (width: number, height: number, isInitial = false): Cloud => {
      const cloudWidth = 180 + Math.random() * 150;
      const cloudHeight = cloudWidth * 0.45;
      const speed = 0.08 + Math.random() * 0.12;
      const baseOpacity = 0.08 + Math.random() * 0.09;
      return {
        x: isInitial ? Math.random() * (width + cloudWidth) - cloudWidth : -cloudWidth,
        y: Math.random() * (height * 0.5) + height * 0.05,
        width: cloudWidth,
        height: cloudHeight,
        speed,
        baseOpacity,
      };
    };

    const createMistLayer = (width: number, height: number, isInitial = false): MistLayer => {
      const w = width * 1.5;
      const h = 120 + Math.random() * 80;
      const speedX = 0.05 + Math.random() * 0.08;
      const speedY = (Math.random() - 0.5) * 0.03;
      const baseOpacity = 0.06 + Math.random() * 0.06;
      return {
        x: isInitial ? Math.random() * (width * 0.5) - width * 0.25 : -width * 0.25,
        y: height * 0.6 + Math.random() * (height * 0.25),
        width: w,
        height: h,
        speedX,
        speedY,
        baseOpacity,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.002 + Math.random() * 0.003,
      };
    };

    const createAutumnLeafParticle = (width: number, height: number, isInitial = false, isGustLeaf = false): AutumnLeafParticle => {
      const orangeColors = ['#e2583e', '#ea580c', '#d97706'];
      const yellowColors = ['#eab308', '#facc15', '#f59e0b'];
      const brownColors = ['#a16207', '#854d0e', '#78350f'];
      const greenColors = ['#556b2f', '#6b8e23', '#4d5d2f'];

      const randColorType = Math.random();
      let color = '';
      if (randColorType < 0.42) {
        color = orangeColors[Math.floor(Math.random() * orangeColors.length)];
      } else if (randColorType < 0.84) {
        color = yellowColors[Math.floor(Math.random() * yellowColors.length)];
      } else if (randColorType < 0.92) {
        color = brownColors[Math.floor(Math.random() * brownColors.length)];
      } else {
        color = greenColors[Math.floor(Math.random() * greenColors.length)];
      }

      const randLayer = Math.random();
      let depthLayer: 'background' | 'middle' | 'foreground' = 'middle';
      let size = 15;
      let speedY = 0.65;
      let speedX = -0.4;
      
      if (randLayer < 0.3) {
        depthLayer = 'background';
        size = 10 + Math.random() * 3;
        speedY = 0.3 + Math.random() * 0.2;
        speedX = -0.15 - Math.random() * 0.15;
      } else if (randLayer < 0.8) {
        depthLayer = 'middle';
        size = 14 + Math.random() * 4;
        speedY = 0.55 + Math.random() * 0.2;
        speedX = -0.3 - Math.random() * 0.2;
      } else {
        depthLayer = 'foreground';
        size = 19 + Math.random() * 3;
        speedY = 0.8 + Math.random() * 0.3;
        speedX = -0.5 - Math.random() * 0.25;
      }

      if (isGustLeaf) {
        speedX = -2.5 - Math.random() * 1.5;
        speedY = 1.0 + Math.random() * 0.8;
      }

      const baseOpacity = 0.7 + Math.random() * 0.2;

      return {
        type: 'autumn_leaf',
        x: isInitial 
          ? Math.random() * width 
          : (isGustLeaf ? width + 20 + Math.random() * 50 : Math.random() * width),
        y: isInitial 
          ? Math.random() * height 
          : (isGustLeaf ? Math.random() * (height * 0.4) - 20 : -20 - Math.random() * 30),
        size,
        speedY,
        speedX,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.015,
        wobbleSpeed: 0.01 + Math.random() * 0.015,
        wobbleRange: 0.25 + Math.random() * 0.35,
        opacity: baseOpacity,
        baseOpacity,
        color,
        depthLayer,
        glideFactor: 0.8 + Math.random() * 0.4,
        swayPhase: Math.random() * Math.PI * 2,
        isGustLeaf,
        active: !isGustLeaf,
      };
    };

    const createAutumnGoldDustParticle = (width: number, height: number, isInitial = false): AutumnGoldDustParticle => {
      const size = 2 + Math.random() * 3;
      const speedY = -0.15 - Math.random() * 0.15;
      const speedX = (Math.random() - 0.5) * 0.08;
      const baseOpacity = 0.15 + Math.random() * 0.1;

      return {
        type: 'autumn_gold_dust',
        x: Math.random() * width,
        y: isInitial ? Math.random() * height : height + 10 + Math.random() * 20,
        size,
        speedY,
        speedX,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.008 + Math.random() * 0.012,
        opacity: baseOpacity,
        baseOpacity,
      };
    };

    const createTwinkleStarParticle = (width: number, height: number, isInitial = false): TwinkleStarParticle => {
      const size = 1.0 + Math.random() * 1.5;
      const maxOpacity = 0.3 + Math.random() * 0.5;
      return {
        type: 'twinkle_star',
        x: Math.random() * width,
        y: Math.random() * height,
        size,
        speedY: 0,
        speedX: 0,
        opacity: maxOpacity * (0.2 + Math.random() * 0.8),
        baseOpacity: maxOpacity,
        maxOpacity,
        twinkleSpeed: 0.0015 + Math.random() * 0.0035, // slower twinkle, longer interval
        twinklePhase: Math.random() * Math.PI * 2,
        sparkleTimer: 0,
      };
    };

    const createCosmicDustParticle = (width: number, height: number, isInitial = false): CosmicDustParticle => {
      const size = 1.0 + Math.random() * 2.0;
      const speedY = (Math.random() - 0.5) * 0.08;
      const speedX = (Math.random() - 0.5) * 0.08;
      const baseOpacity = 0.15 + Math.random() * 0.25;
      const colors = [
        'rgba(255, 255, 255, ',   // White
        'rgba(34, 211, 238, ',   // Cyan
        'rgba(192, 132, 252, ',  // Purple
        'rgba(96, 165, 250, ',   // Blue
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        type: 'cosmic_dust',
        x: Math.random() * width,
        y: Math.random() * height,
        size,
        speedY,
        speedX,
        opacity: baseOpacity,
        baseOpacity,
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: 0.001 + Math.random() * 0.002, // slower drift, longer interval
        color,
      };
    };

    const initParticles = (width: number, height: number) => {
      particles = [];
      glints = [];
      clouds = [];
      mistLayers = [];

      const snowCount = getParticleLimit(14);
      const leafCount = getParticleLimit(4);
      const goldCount = getParticleLimit(6);
      const glintCount = getParticleLimit(3);
      const autumnLeafCount = getParticleLimit(3);
      const autumnGoldCount = getParticleLimit(6);
      const starCount = getParticleLimit(14);
      const cosmicDustCount = getParticleLimit(8);

      // Snow particles for Unit 1
      for (let i = 0; i < snowCount; i++) {
        particles.push(createSnowParticle(width, height, true));
      }
      // Leaf particles for Unit 2
      for (let i = 0; i < leafCount; i++) {
        particles.push(createLeafParticle(width, height, true));
      }
      // Golden light particles for Unit 2
      for (let i = 0; i < goldCount; i++) {
        particles.push(createGoldParticle(width, height, true));
      }
      // Soft leaf light reflection glints
      for (let i = 0; i < glintCount; i++) {
        glints.push(createGlint(width, height));
      }
      // Premium Autumn Leaves for Unit 3 (Autumn Mountain Trail)
      for (let i = 0; i < autumnLeafCount; i++) {
        particles.push(createAutumnLeafParticle(width, height, true, false));
      }
      // Additional Autumn Leaves for Wind Gusts (starts inactive)
      for (let i = 0; i < 2; i++) {
        particles.push(createAutumnLeafParticle(width, height, true, true));
      }
      // Autumn Gold Dust Particles for Sunlight simulation
      for (let i = 0; i < autumnGoldCount; i++) {
        particles.push(createAutumnGoldDustParticle(width, height, true));
      }
      // Twinkle Stars for Unit 4 (Space)
      for (let i = 0; i < starCount; i++) {
        particles.push(createTwinkleStarParticle(width, height, true));
      }
      // Cosmic Dust Particles for Unit 4 (Space)
      for (let i = 0; i < cosmicDustCount; i++) {
        particles.push(createCosmicDustParticle(width, height, true));
      }
    };

    // Draw single soft volumetric ray
    const drawSingleRay = (
      ox: number,
      oy: number,
      angle: number,
      widthAngle: number,
      alpha: number,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      const maxLen = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight) * 1.5;

      const a1 = angle - widthAngle / 2;
      const a2 = angle + widthAngle / 2;

      const x1 = ox + Math.cos(a1) * maxLen;
      const y1 = oy + Math.sin(a1) * maxLen;

      const x2 = ox + Math.cos(a2) * maxLen;
      const y2 = oy + Math.sin(a2) * maxLen;

      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();

      const grad = ctx.createLinearGradient(ox, oy, ox + Math.cos(angle) * maxLen * 0.65, oy + Math.sin(angle) * maxLen * 0.65);
      
      // Warm golden-white volumetric tint with soft edges
      grad.addColorStop(0, `rgba(255, 248, 225, ${alpha})`);
      grad.addColorStop(0.3, `rgba(255, 244, 210, ${alpha * 0.6})`);
      grad.addColorStop(0.7, `rgba(253, 224, 71, ${alpha * 0.12})`);
      grad.addColorStop(1, 'rgba(253, 224, 71, 0)');

      ctx.fillStyle = grad;
      ctx.fill();
    };

    // Main animation loop with smooth requestAnimationFrame & low-end throttling
    let lastFrameTime = 0;

    const tick = (timestamp: number = 0) => {
      // Pause completely if a lesson is active to preserve 100% CPU/GPU for the lesson
      if (typeof window !== 'undefined' && (window as any).__IS_LESSON_ACTIVE) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      if (prefersReducedMotion) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // Frame throttle for low-end hardware (~30 FPS max)
      const minInterval = isLowEndDevice() ? 32 : 16;
      if (lastFrameTime && (timestamp - lastFrameTime) < minInterval) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      // Smooth timestamp tracking
      const delta = lastFrameTime ? Math.min((timestamp - lastFrameTime) / 16.666, 2.5) : 1;
      lastFrameTime = timestamp;

      const width = canvas.width;
      const height = canvas.height;
      time += 1;

      ctx.clearRect(0, 0, width, height);

      // Get current biome opacities
      const opacities = opacitiesRef.current;
      const snowOpacity = opacities[0] !== undefined ? opacities[0] : 1;
      const forestOpacity = opacities[1] !== undefined ? opacities[1] : 0;
      const mountainOpacity = opacities[2] !== undefined ? opacities[2] : 0;
      const spaceOpacity = opacities[3] !== undefined ? opacities[3] : 0;

      // Draw Volumetric Sun Rays (Unit 2 Only)
      if (forestOpacity > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Extremely low base opacity to stay premium and non-obtrusive (max 0.06 overall)
        const baseAlpha = 0.065 * forestOpacity;
        const breathing = baseAlpha * (0.8 + 0.2 * Math.sin(time * 0.003));

        // Rays originate from upper-left, slightly outside the canvas
        const originX = -60;
        const originY = -60;

        // Wide Ray 1
        {
          const angleCenter = 0.70 + Math.sin(time * 0.0008) * 0.035;
          const beamWidth = 0.20 + Math.cos(time * 0.0012) * 0.02;
          drawSingleRay(originX, originY, angleCenter, beamWidth, breathing * 0.8, width, height);
        }

        // Wide Ray 2
        {
          const angleCenter = 1.00 + Math.cos(time * 0.0006) * 0.045;
          const beamWidth = 0.24 + Math.sin(time * 0.001) * 0.025;
          drawSingleRay(originX, originY, angleCenter, beamWidth, breathing * 0.9, width, height);
        }

        // Wide Ray 3
        {
          const angleCenter = 1.30 + Math.sin(time * 0.0004) * 0.03;
          const beamWidth = 0.28 + Math.cos(time * 0.0009) * 0.03;
          drawSingleRay(originX, originY, angleCenter, beamWidth, breathing * 0.65, width, height);
        }

        ctx.restore();
      }

      let gustIntensity = 0;

      // ---------------- UNIT 3 PREMIUM EARLY AUTUMN MOUNTAIN EFFECTS ----------------
      if (mountainOpacity > 0.01) {
        // A. Soft Sunlight Overlay (Top-left corner, warm amber tint, shifting brightness)
        const sunlightPulse = 0.035 + 0.012 * Math.sin(Date.now() / 2000); // Slight shift every 12-15 seconds
        const sunGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) * 0.85);
        sunGrad.addColorStop(0, `rgba(251, 191, 36, ${sunlightPulse * mountainOpacity})`); // amber
        sunGrad.addColorStop(0.5, `rgba(253, 224, 71, ${sunlightPulse * 0.45 * mountainOpacity})`); // warm yellow
        sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(width, height) * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // B. Wind Gust logic
        const autumnNow = Date.now();
        if (!autumnWindGustActive && (autumnNow - lastAutumnWindGustTime > autumnWindGustInterval)) {
          autumnWindGustActive = true;
          autumnWindGustStartTime = autumnNow;

          // Trigger fast sweeping leaves
          particles.forEach(p => {
            if (p.type === 'autumn_leaf' && p.isGustLeaf) {
              p.active = true;
              p.x = width + 20 + Math.random() * 50;
              p.y = Math.random() * (height * 0.4) - 20;
              p.speedX = -2.8 - Math.random() * 1.4; // sweep quickly
              p.speedY = 0.9 + Math.random() * 0.7;
              p.opacity = p.baseOpacity;
            }
          });
        }

        if (autumnWindGustActive) {
          const elapsed = autumnNow - autumnWindGustStartTime;
          if (elapsed > autumnWindGustDuration) {
            autumnWindGustActive = false;
            lastAutumnWindGustTime = autumnNow;
            autumnWindGustInterval = 8000 + Math.random() * 4000; // 8-12 seconds
          } else {
            const t = elapsed / autumnWindGustDuration;
            gustIntensity = Math.sin(t * Math.PI); // smooth ease-in ease-out
          }
        }
      }

      // ---------------- UNIT 4 PREMIUM SPACE BIOME EFFECTS ----------------
      if (spaceOpacity > 0.01) {
        // A. Nebula Breathing Effect
        const nebulaIntensity = 0.035 + 0.012 * Math.sin(time * 0.005); // subtle breathing

        const nebGrad1 = ctx.createRadialGradient(width * 0.75, height * 0.35, 0, width * 0.75, height * 0.35, Math.max(width, height) * 0.7);
        nebGrad1.addColorStop(0, `rgba(168, 85, 247, ${nebulaIntensity * spaceOpacity})`); // Cosmic purple breathing
        nebGrad1.addColorStop(0.5, `rgba(59, 130, 246, ${nebulaIntensity * 0.32 * spaceOpacity})`); // Cosmic blue halo
        nebGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = nebGrad1;
        ctx.beginPath();
        ctx.arc(width * 0.75, height * 0.35, Math.max(width, height) * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // B. Shooting Stars Spawner & Update
        const spaceNow = Date.now();
        if (!activeShootingStar && (spaceNow - lastShootingStarTime > nextShootingStarDelay)) {
          const startX = Math.random() * (width * 0.65);
          const startY = Math.random() * (height * 0.45);
          const distance = 160 + Math.random() * 140;
          const angle = Math.PI / 6 + Math.random() * (Math.PI / 12); // ~30-45 degrees down-right
          activeShootingStar = {
            x: startX,
            y: startY,
            startX,
            startY,
            endX: startX + Math.cos(angle) * distance,
            endY: startY + Math.sin(angle) * distance,
            progress: 0,
            speed: 0.016 + Math.random() * 0.007, // 0.8-1.2 seconds
            color: Math.random() > 0.5 ? 'rgba(34, 211, 238, 0.95)' : 'rgba(168, 85, 247, 0.95)',
            size: 1.2 + Math.random() * 0.8,
            active: true,
          };
          lastShootingStarTime = spaceNow;
          nextShootingStarDelay = 35000 + Math.random() * 30000; // 35-65 seconds
        }

        if (activeShootingStar && activeShootingStar.active) {
          activeShootingStar.progress += activeShootingStar.speed;
          if (activeShootingStar.progress >= 1) {
            activeShootingStar.active = false;
            activeShootingStar = null;
          } else {
            activeShootingStar.x = activeShootingStar.startX + (activeShootingStar.endX - activeShootingStar.startX) * activeShootingStar.progress;
            activeShootingStar.y = activeShootingStar.startY + (activeShootingStar.endY - activeShootingStar.startY) * activeShootingStar.progress;

            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            
            // Draw thin glowing trail
            const trailProgressX = activeShootingStar.startX + (activeShootingStar.endX - activeShootingStar.startX) * Math.max(0, activeShootingStar.progress - 0.28);
            const trailProgressY = activeShootingStar.startY + (activeShootingStar.endY - activeShootingStar.startY) * Math.max(0, activeShootingStar.progress - 0.28);
            
            const trailGrad = ctx.createLinearGradient(
              activeShootingStar.x, activeShootingStar.y,
              trailProgressX, trailProgressY
            );
            trailGrad.addColorStop(0, activeShootingStar.color);
            trailGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.strokeStyle = trailGrad;
            ctx.lineWidth = activeShootingStar.size;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(activeShootingStar.x, activeShootingStar.y);
            ctx.lineTo(trailProgressX, trailProgressY);
            ctx.stroke();

            // Draw head
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(activeShootingStar.x, activeShootingStar.y, activeShootingStar.size * 0.9, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }
      }

      // Gently transition wind direction/strength every 12 seconds
      const now = Date.now();
      if (now - lastWindChange > 12000) {
        targetWind = (Math.random() - 0.5) * 0.4;
        lastWindChange = now;
      }
      currentWind += (targetWind - currentWind) * 0.015;

      // 1. Draw and Update Background Glints (Unit 2 Warm light reflections through leaves)
      if (forestOpacity > 0.01) {
        glints.forEach(g => {
          g.life++;
          const progress = g.life / g.maxLife;
          // Smooth fade in and out curve
          g.opacity = g.maxOpacity * Math.sin(progress * Math.PI) * forestOpacity;
          
          // Slow drifting movement
          g.x += g.speedX;
          g.y += g.speedY;

          // Recycle dead glints
          if (g.life >= g.maxLife) {
            Object.assign(g, createGlint(width, height));
          }

          if (g.opacity <= 0.005) return;

          ctx.save();
          ctx.globalAlpha = g.opacity;

          // Soft circular reflection shimmer
          const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.size);
          grad.addColorStop(0, 'rgba(254, 243, 199, 0.9)'); // Soft warm amber-white center
          grad.addColorStop(0.35, 'rgba(253, 224, 71, 0.3)'); // Delicate yellow aura
          grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // 2. Draw and Update Particles (Snow, Leaves, Orbs)
      particles.forEach(p => {
        if (p.type === 'snow') {
          // Physics
          p.angle += p.wobbleSpeed;
          const drift = Math.sin(p.angle) * p.wobbleRange;
          p.x += p.speedX + drift + currentWind;
          p.y += p.speedY;

          // Recycle
          if (p.y > height + 20) {
            p.y = -15;
            p.x = Math.random() * width;
          }
          if (p.x < -20) p.x = width + 10;
          else if (p.x > width + 20) p.x = -10;

          // Calculate current opacity based on snow state
          let currentOpacity = p.baseOpacity * snowOpacity;
          
          if (p.y < 45) {
            const progress = Math.max(0, (p.y + 10) / 55);
            currentOpacity *= progress;
          } else if (p.y > height - 40) {
            const progress = Math.max(0, (height - p.y) / 40);
            currentOpacity *= progress;
          }

          if (p.isSparkle) {
            p.sparklePhase += 0.02; // slower shimmer, longer interval
            const shimmer = 0.5 + Math.sin(p.sparklePhase) * 0.5;
            currentOpacity *= shimmer;
          }

          if (currentOpacity <= 0.01) return;

          ctx.save();
          ctx.globalAlpha = currentOpacity;
          ctx.fillStyle = '#FFFFFF';

          if (p.isSparkle) {
            ctx.beginPath();
            const size = p.size;
            ctx.moveTo(p.x, p.y - size);
            ctx.lineTo(p.x + size * 0.4, p.y);
            ctx.lineTo(p.x, p.y + size);
            ctx.lineTo(p.x - size * 0.4, p.y);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

        } else if (p.type === 'leaf') {
          // Physics
          p.angle += p.spin;
          p.x += p.speedX + Math.sin(p.angle) * p.wobbleRange * 0.6 + currentWind * 0.4;
          p.y += p.speedY;

          // Recycle
          if (p.y > height + 20) {
            p.y = -15;
            p.x = Math.random() * width;
          }
          if (p.x < -20) p.x = width + 15;
          else if (p.x > width + 20) p.x = -15;

          // Opacity
          let currentOpacity = p.baseOpacity * forestOpacity;
          if (p.y < 45) {
            const progress = Math.max(0, (p.y + 10) / 55);
            currentOpacity *= progress;
          } else if (p.y > height - 40) {
            const progress = Math.max(0, (height - p.y) / 40);
            currentOpacity *= progress;
          }

          if (currentOpacity <= 0.01) return;

          ctx.save();
          ctx.globalAlpha = currentOpacity;
          ctx.fillStyle = p.color;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          // Premium curved leaf shape
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.quadraticCurveTo(p.size * 0.55, -p.size * 0.35, 0, p.size);
          ctx.quadraticCurveTo(-p.size * 0.55, -p.size * 0.35, 0, -p.size);
          ctx.closePath();
          ctx.fill();

          // Sub-vein stroke to make it look detailed
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(0, p.size * 0.85);
          ctx.stroke();

          ctx.restore();

        } else if (p.type === 'gold') {
          // Physics
          p.pulsePhase += p.pulseSpeed;
          p.x += p.speedX + Math.sin(p.pulsePhase * 0.4) * 0.12;
          p.y -= p.speedY; // Floating upwards softly

          // Recycle to bottom
          if (p.y < -15) {
            p.y = height + 15;
            p.x = Math.random() * width;
          }

          // Dynamic breathing glow
          let currentOpacity = p.baseOpacity * forestOpacity * (0.3 + Math.abs(Math.sin(p.pulsePhase)) * 0.7);
          if (p.y < 45) {
            const progress = Math.max(0, (p.y + 10) / 55);
            currentOpacity *= progress;
          } else if (p.y > height - 40) {
            const progress = Math.max(0, (height - p.y) / 40);
            currentOpacity *= progress;
          }

          if (currentOpacity <= 0.01) return;

          ctx.save();
          ctx.globalAlpha = currentOpacity;

          // Radial gradient for magic forest orb glow
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
          grad.addColorStop(0, 'rgba(253, 224, 71, 0.85)'); // Warm golden center
          grad.addColorStop(0.35, 'rgba(245, 158, 11, 0.3)'); // Soft amber ring
          grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        } else if (p.type === 'wind') {
          // Physics
          p.x += p.speedX + currentWind * 0.2;
          p.y += p.speedY;

          // Recycle
          if (p.y > height + 20) {
            p.y = -15;
            p.x = Math.random() * width;
          }
          if (p.x < -20) p.x = width + 15;
          else if (p.x > width + 20) p.x = -15;

          // Opacity
          let currentOpacity = p.baseOpacity * mountainOpacity;
          if (p.y < 45) {
            const progress = Math.max(0, (p.y + 10) / 55);
            currentOpacity *= progress;
          } else if (p.y > height - 40) {
            const progress = Math.max(0, (height - p.y) / 40);
            currentOpacity *= progress;
          }

          if (currentOpacity <= 0.01) return;

          ctx.save();
          ctx.globalAlpha = currentOpacity;
          ctx.strokeStyle = '#f1f5f9'; // soft white/grey wind streak
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.length * (p.speedX / (p.speedY || 1)) * 0.25, p.y - p.length * 0.25);
          ctx.stroke();
          ctx.restore();
        } else if (p.type === 'autumn_leaf') {
          if (!p.active) return;

          // Physics with dynamic wind gust acceleration
          p.swayPhase += p.wobbleSpeed;
          p.angle += p.spin;
          
          const sway = Math.sin(p.swayPhase) * p.wobbleRange * p.glideFactor;
          const currentSwayX = sway * 0.7;
          
          // Smooth easing gust force (pushes diagonally downward and left)
          // Existing leaves accelerate slightly during wind gust
          const gustXForce = gustIntensity * 1.5; 
          const gustYForce = gustIntensity * 0.3;

          p.x += (p.speedX - gustXForce) + currentSwayX;
          p.y += (p.speedY + gustYForce);

          // Recycle normal leaves
          if (!p.isGustLeaf) {
            if (p.y > height + 20) {
              p.y = -20;
              p.x = Math.random() * width;
              p.angle = Math.random() * Math.PI * 2;
            }
            if (p.x < -30) {
              p.x = width + 20;
            } else if (p.x > width + 30) {
              p.x = -20;
            }
          } else {
            // Deactivate gust leaves when they exit screen
            if (p.y > height + 20 || p.x < -30) {
              p.active = false;
            }
          }

          // Calculate current opacity based on mountain state
          let currentOpacity = p.baseOpacity * mountainOpacity;
          
          // Fade in/out near screen bounds to prevent sudden popping
          if (p.y < 45) {
            const progress = Math.max(0, (p.y + 10) / 55);
            currentOpacity *= progress;
          } else if (p.y > height - 40) {
            const progress = Math.max(0, (height - p.y) / 40);
            currentOpacity *= progress;
          }

          if (currentOpacity <= 0.01) return;

          ctx.save();
          ctx.globalAlpha = currentOpacity;

          ctx.fillStyle = p.color;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          // Premium curved leaf shape
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.quadraticCurveTo(p.size * 0.58, -p.size * 0.35, 0, p.size);
          ctx.quadraticCurveTo(-p.size * 0.58, -p.size * 0.35, 0, -p.size);
          ctx.closePath();
          ctx.fill();

          // Leaf sub-vein stroke for high detail
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = p.size * 0.08;
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(0, p.size * 0.8);
          ctx.stroke();

          ctx.restore();

        } else if (p.type === 'autumn_gold_dust') {
          // Physics
          p.pulsePhase += p.pulseSpeed;
          p.x += p.speedX + Math.sin(p.pulsePhase) * 0.06;
          p.y += p.speedY; // floats upwards slowly

          // Recycle
          if (p.y < -15) {
            p.y = height + 15;
            p.x = Math.random() * width;
          }

          // Calculate current opacity (subtle, warm golden-white)
          // Low base opacity 15-25%
          let currentOpacity = p.baseOpacity * mountainOpacity * (0.55 + 0.45 * Math.sin(p.pulsePhase));
          
          if (p.y < 45) {
            const progress = Math.max(0, (p.y + 10) / 55);
            currentOpacity *= progress;
          } else if (p.y > height - 40) {
            const progress = Math.max(0, (height - p.y) / 40);
            currentOpacity *= progress;
          }

          if (currentOpacity <= 0.01) return;

          ctx.save();
          ctx.globalAlpha = currentOpacity;
          
          // Soft golden circular light particle
          ctx.fillStyle = '#fef08a'; // light yellow-gold
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        } else if (p.type === 'twinkle_star') {
          // Physics/State update
          p.twinklePhase += p.twinkleSpeed;
          const breathe = Math.sin(p.twinklePhase);
          let currentOpacity = p.baseOpacity * (0.55 + breathe * 0.45) * spaceOpacity;

          // Sparkle flash
          if (p.sparkleTimer && p.sparkleTimer > 0) {
            p.sparkleTimer--;
            currentOpacity = Math.min(1.0, p.baseOpacity * 1.85) * spaceOpacity;
          } else if (spaceOpacity > 0.1 && Math.random() < 0.00008) { // rare sparkle, longer interval
            p.sparkleTimer = 10 + Math.floor(Math.random() * 8); // 10-18 frames
          }

          if (currentOpacity <= 0.01) return;

          ctx.save();
          ctx.globalAlpha = currentOpacity;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Delicate 4-point sparkle cross flair
          if (p.sparkleTimer && p.sparkleTimer > 0) {
            ctx.strokeStyle = 'rgba(165, 243, 252, 0.8)'; // cyan-200 glow
            ctx.lineWidth = 0.65;
            ctx.beginPath();
            ctx.moveTo(p.x - p.size * 2.5, p.y);
            ctx.lineTo(p.x + p.size * 2.5, p.y);
            ctx.moveTo(p.x, p.y - p.size * 2.5);
            ctx.lineTo(p.x, p.y + p.size * 2.5);
            ctx.stroke();
          }
          ctx.restore();

        } else if (p.type === 'cosmic_dust') {
          // Physics
          p.driftPhase += p.driftSpeed;
          p.x += p.speedX + Math.sin(p.driftPhase) * 0.04;
          p.y += p.speedY + Math.cos(p.driftPhase) * 0.04;

          // Wrap borders
          if (p.x < -15) p.x = width + 10;
          if (p.x > width + 15) p.x = -10;
          if (p.y < -15) p.y = height + 10;
          if (p.y > height + 15) p.y = -10;

          let currentOpacity = p.baseOpacity * spaceOpacity * (0.65 + Math.sin(p.driftPhase * 1.5) * 0.35);
          if (currentOpacity <= 0.01) return;

          ctx.save();
          ctx.globalAlpha = currentOpacity;
          ctx.fillStyle = p.color + '1)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Soft light aura
          if (p.size > 1.8) {
            ctx.fillStyle = p.color + '0.12)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      });

      // 3. Update & Draw Single Interactive Butterfly
      if (!butterfly.active) {
        // Only spawn when fully transitioned to the forest (forestOpacity is high)
        if (forestOpacity > 0.92) {
          butterfly.spawnTimer--;
          if (butterfly.spawnTimer <= 0) {
            // Attempt to choose a target from DOM
            const activeNodes = Array.from(document.querySelectorAll('.lesson-node-btn[data-biome-index="1"][data-lesson-active="true"]')) as HTMLElement[];
            const completedNodes = Array.from(document.querySelectorAll('.lesson-node-btn[data-biome-index="1"][data-lesson-completed="true"]')) as HTMLElement[];
            const unitDividers = Array.from(document.querySelectorAll('.unit-divider-card[data-unit-index="1"]')) as HTMLElement[];

            let selectedElement: HTMLElement | null = null;
            const rand = Math.random();

            if (rand < 0.40 && activeNodes.length > 0) {
              selectedElement = activeNodes[Math.floor(Math.random() * activeNodes.length)];
            } else if (rand < 0.70 && completedNodes.length > 0) {
              selectedElement = completedNodes[Math.floor(Math.random() * completedNodes.length)];
            } else if (rand < 0.85 && unitDividers.length > 0) {
              selectedElement = unitDividers[Math.floor(Math.random() * unitDividers.length)];
            }

            // Spawn the butterfly!
            butterfly.active = true;
            butterfly.targetElement = selectedElement;

            const fromLeft = Math.random() < 0.5;
            butterfly.x = fromLeft ? -20 : width + 20;
            butterfly.y = Math.random() * (height * 0.5) + height * 0.2;

            const colors = [
              '#fb923c', // Monarch orange
              '#facc15', // Gold yellow
              '#c084fc', // Light purple
              '#2dd4bf', // Soft turquoise
            ];
            butterfly.color = colors[Math.floor(Math.random() * colors.length)];
            butterfly.size = 4.2 + Math.random() * 1.8;
            butterfly.wingFlap = Math.random() * Math.PI * 2;
            butterfly.pathPhase = Math.random() * Math.PI * 2;

            if (selectedElement) {
              butterfly.state = 'flying';
            } else {
              // Just flyby
              butterfly.state = 'flying';
              butterfly.targetX = fromLeft ? width + 40 : -40;
              butterfly.targetY = Math.random() * (height * 0.6) + height * 0.15;
            }
          }
        }
      } else {
        // Butterfly is active! Identify current coordinates of target element (handles scrolling flawlessly)
        let tx = butterfly.targetX;
        let ty = butterfly.targetY;
        let elementValid = false;
        let elemWidth = 0;
        let elemHeight = 0;

        if (butterfly.targetElement) {
          if (document.body.contains(butterfly.targetElement)) {
            const canvasRect = canvas.getBoundingClientRect();
            const elemRect = butterfly.targetElement.getBoundingClientRect();
            
            // Check if element is within scroll viewport bounds of the canvas parent
            const isOffScreen = elemRect.bottom < canvasRect.top || elemRect.top > canvasRect.bottom;
            
            if (!isOffScreen) {
              elemWidth = elemRect.width;
              elemHeight = elemRect.height;
              tx = elemRect.left - canvasRect.left + elemWidth / 2;
              ty = elemRect.top - canvasRect.top + elemHeight / 2;
              elementValid = true;
            }
          }
        }

        butterfly.pathPhase += 0.045;

        // STATE MACHINE
        if (butterfly.state === 'flying') {
          butterfly.wingFlap += 0.26; // Fly flapping

          let targetX = tx;
          let targetY = ty;

          if (!butterfly.targetElement) {
            targetX = butterfly.targetX;
            targetY = butterfly.targetY;
          } else if (!elementValid) {
            // Target scrolled off or disappeared, abort and fly away!
            butterfly.targetElement = null;
            const leftSide = butterfly.x < width / 2;
            butterfly.targetX = leftSide ? width + 40 : -40;
            butterfly.targetY = Math.random() * (height * 0.5) + height * 0.25;
            targetX = butterfly.targetX;
            targetY = butterfly.targetY;
          }

          const dx = targetX - butterfly.x;
          const dy = targetY - butterfly.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (butterfly.targetElement && dist < 42) {
            butterfly.state = 'landing';
          } else if (!butterfly.targetElement && dist < 15) {
            // Completed flyby off-screen, reset
            butterfly.active = false;
            butterfly.state = 'inactive';
            // Random delay 15 to 30 seconds before next spawn
            butterfly.spawnTimer = 900 + Math.floor(Math.random() * 900);
          } else {
            // Organic flying curves with speed variation
            const angleToTarget = Math.atan2(dy, dx);
            const speed = (0.8 + Math.sin(butterfly.pathPhase * 1.4) * 0.35) * 1.5;
            const wobbleAngle = angleToTarget + Math.sin(butterfly.pathPhase) * 0.32;
            
            butterfly.speedX += (Math.cos(wobbleAngle) * speed - butterfly.speedX) * 0.055;
            butterfly.speedY += (Math.sin(wobbleAngle) * speed - butterfly.speedY) * 0.055;

            butterfly.x += butterfly.speedX;
            butterfly.y += butterfly.speedY;
            butterfly.angle = Math.atan2(butterfly.speedY, butterfly.speedX);
          }

        } else if (butterfly.state === 'landing') {
          butterfly.wingFlap += 0.15; // Flap slower as we near target

          if (!elementValid) {
            butterfly.state = 'takeoff';
            butterfly.restTimer = 55;
            butterfly.targetElement = null;
          } else {
            const dx = tx - butterfly.x;
            const dy = ty - butterfly.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 2.0) {
              butterfly.x = tx;
              butterfly.y = ty;
              butterfly.state = 'resting';
              // Settle and rest for 2 to 4 seconds
              butterfly.restTimer = 120 + Math.floor(Math.random() * 120);
              butterfly.speedX = 0;
              butterfly.speedY = 0;
            } else {
              // Smooth decelerating landing path
              butterfly.x += dx * 0.085;
              butterfly.y += dy * 0.085;
              butterfly.angle = Math.atan2(dy, dx);
            }
          }

        } else if (butterfly.state === 'resting') {
          // Resting wings breathing flap
          butterfly.wingFlap += 0.045;

          if (!elementValid) {
            butterfly.state = 'takeoff';
            butterfly.restTimer = 50;
            butterfly.targetElement = null;
          } else {
            // Stay locked onto moving DOM target (scrolling)
            // Sit slightly offset on top center of button/divider
            butterfly.x = tx;
            butterfly.y = ty - 4;

            // Subtle body breathing angle tilt
            const bodyWobble = Math.sin(butterfly.wingFlap) * 0.06;
            butterfly.angle = -Math.PI / 2 + bodyWobble;

            butterfly.restTimer--;
            if (butterfly.restTimer <= 0) {
              butterfly.state = 'takeoff';
              butterfly.restTimer = 50;
              butterfly.targetElement = null;
            }
          }

        } else if (butterfly.state === 'takeoff') {
          butterfly.wingFlap += 0.40; // Flap rapidly for takeoff acceleration

          // Take-off thrust
          butterfly.speedY = -1.1;
          butterfly.speedX = (Math.sin(butterfly.pathPhase) * 0.5) - 0.35;

          butterfly.x += butterfly.speedX;
          butterfly.y += butterfly.speedY;
          butterfly.angle = Math.atan2(butterfly.speedY, butterfly.speedX);

          butterfly.restTimer--;
          if (butterfly.restTimer <= 0) {
            // Take off and fly away off-screen
            butterfly.state = 'flying';
            const leftSide = butterfly.x < width / 2;
            butterfly.targetX = leftSide ? -40 : width + 40;
            butterfly.targetY = Math.random() * (height * 0.45) + height * 0.15;
          }
        }

        // DRAW BUTTERFLY & SHADOW
        if (forestOpacity > 0.01) {
          // Draw subtle shadow slightly offset
          ctx.save();
          const shadowOpacity = 0.12 * forestOpacity;
          ctx.globalAlpha = shadowOpacity;
          ctx.fillStyle = '#000000';

          let ox = 2.5;
          let oy = 5.5;
          let blur = butterfly.size * 0.4;

          if (butterfly.state === 'resting') {
            ox = 1.0;
            oy = 2.0;
            blur = butterfly.size * 0.15;
          } else if (butterfly.state === 'takeoff' || butterfly.state === 'landing') {
            ox = 3.5;
            oy = 7.5;
            blur = butterfly.size * 0.45;
          }

          ctx.translate(butterfly.x + ox, butterfly.y + oy);
          ctx.rotate(butterfly.angle);

          const flapFactor = 0.25 + Math.abs(Math.sin(butterfly.wingFlap)) * 0.75;

          ctx.beginPath();
          ctx.ellipse(-butterfly.size * 0.7 * flapFactor, -butterfly.size * 0.3, butterfly.size * 0.7 * flapFactor, butterfly.size * 0.9, -Math.PI / 6, 0, Math.PI * 2);
          ctx.ellipse(butterfly.size * 0.7 * flapFactor, -butterfly.size * 0.3, butterfly.size * 0.7 * flapFactor, butterfly.size * 0.9, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Draw actual butterfly
          ctx.save();
          ctx.globalAlpha = forestOpacity;
          ctx.translate(butterfly.x, butterfly.y);
          ctx.rotate(butterfly.angle);

          // Top Wings (Forewings)
          ctx.fillStyle = butterfly.color;
          ctx.beginPath();
          ctx.ellipse(-butterfly.size * 0.75 * flapFactor, -butterfly.size * 0.4, butterfly.size * 0.75 * flapFactor, butterfly.size, -Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.ellipse(butterfly.size * 0.75 * flapFactor, -butterfly.size * 0.4, butterfly.size * 0.75 * flapFactor, butterfly.size, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();

          // Wing pattern highlight (premium visual touch)
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = forestOpacity * 0.32;
          ctx.beginPath();
          ctx.ellipse(-butterfly.size * 0.4 * flapFactor, -butterfly.size * 0.5, butterfly.size * 0.3 * flapFactor, butterfly.size * 0.4, -Math.PI / 6, 0, Math.PI * 2);
          ctx.ellipse(butterfly.size * 0.4 * flapFactor, -butterfly.size * 0.5, butterfly.size * 0.3 * flapFactor, butterfly.size * 0.4, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();

          // Bottom Wings (Hindwings)
          ctx.fillStyle = butterfly.color;
          ctx.globalAlpha = forestOpacity * 0.75;
          ctx.beginPath();
          ctx.ellipse(-butterfly.size * 0.5 * flapFactor, butterfly.size * 0.3, butterfly.size * 0.5 * flapFactor, butterfly.size * 0.75, Math.PI * 0.08, 0, Math.PI * 2);
          ctx.ellipse(butterfly.size * 0.5 * flapFactor, butterfly.size * 0.3, butterfly.size * 0.5 * flapFactor, butterfly.size * 0.75, -Math.PI * 0.08, 0, Math.PI * 2);
          ctx.fill();

          // Body
          ctx.globalAlpha = forestOpacity;
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.ellipse(0, 0, butterfly.size * 0.15, butterfly.size * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();

          // Antennae
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(-0.5, -butterfly.size * 0.55);
          ctx.quadraticCurveTo(-butterfly.size * 0.35, -butterfly.size * 0.95, -butterfly.size * 0.45, -butterfly.size * 1.15);
          ctx.moveTo(0.5, -butterfly.size * 0.55);
          ctx.quadraticCurveTo(butterfly.size * 0.35, -butterfly.size * 0.95, butterfly.size * 0.45, -butterfly.size * 1.15);
          ctx.stroke();

          ctx.restore();
        }
      }

      if (document.visibilityState !== 'hidden') {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    const parent = canvas.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
    }
    handleResize();

    // Start animation loop
    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObserver.disconnect();
    };
  }, []);

  // Initial ambient lighting overlay values (subsequent updates handled via refs in biomeChannel subscription)
  const initialOps = biomeOpacities || biomeChannel.getOpacities();
  const forestOpacity = initialOps[1] !== undefined ? initialOps[1] : 0;
  const mountainOpacity = initialOps[2] !== undefined ? initialOps[2] : 0;
  const spaceOpacity = initialOps[3] !== undefined ? initialOps[3] : 0;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-[310] select-none gpu-accelerated">
      {/* Sunlight & warm green atmospheric glow (Unit 2) */}
      <div 
        ref={forestGlowRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000 ease-out gpu-accelerated"
        style={{
          opacity: forestOpacity * 0.45,
          background: `
            radial-gradient(circle at 35% 0%, rgba(253, 224, 71, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 75% 25%, rgba(52, 211, 153, 0.11) 0%, transparent 72%)
          `,
          mixBlendMode: 'screen',
        }}
      />

      {/* Cool blue-grey mountain daylight atmosphere (Unit 3) */}
      <div 
        ref={mountainGlowRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000 ease-out gpu-accelerated"
        style={{
          opacity: mountainOpacity * 0.32,
          background: `
            radial-gradient(circle at 50% 12%, rgba(224, 242, 254, 0.22) 0%, transparent 68%),
            radial-gradient(circle at 12% 88%, rgba(203, 213, 225, 0.12) 0%, transparent 62%)
          `,
          mixBlendMode: 'screen',
        }}
      />

      {/* Magical dark-purple/cyan space biome atmosphere (Unit 4) */}
      <div 
        ref={spaceGlowRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000 ease-out gpu-accelerated"
        style={{
          opacity: spaceOpacity * 0.45,
          background: `
            radial-gradient(circle at 75% 35%, rgba(168, 85, 247, 0.15) 0%, transparent 70%),
            radial-gradient(circle at 25% 65%, rgba(34, 211, 238, 0.12) 0%, transparent 75%)
          `,
          mixBlendMode: 'screen',
        }}
      />
      
      <canvas
        id="ambient-canvas"
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none select-none gpu-accelerated"
        style={{ mixBlendMode: 'screen', willChange: 'transform' }}
      />
    </div>
  );
}

export default memo(Snowfall);
