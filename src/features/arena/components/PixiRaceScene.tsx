import React, { useRef, useEffect } from 'react';
import { VehicleMotionState, RivalProfile } from '../types/arena.types';

interface PixiRaceSceneProps {
  currentSpeed: number; // e.g., 140 - 650 km/h
  playerState: VehicleMotionState;
  isOverdrive: boolean;
  playerProgress: number; // 0 to 1
  opponentProgress: number; // 0 to 1
  position: 1 | 2; // 1 = player leading, 2 = rival leading
  gapMeters: number;
  rival: RivalProfile;
  currentLap: number;
  totalLaps: number;
  lastAnswerResult?: {
    isCorrect: boolean;
    speedDelta: number;
    boostLabel: string;
  } | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface SpeedStreak {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
  side: 'left' | 'right';
}

export function PixiRaceScene({
  currentSpeed,
  playerState,
  isOverdrive,
  playerProgress,
  opponentProgress,
  position,
  gapMeters,
  rival,
  currentLap,
  totalLaps,
  lastAnswerResult,
}: PixiRaceSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stateRef = useRef({
    currentSpeed,
    playerState,
    isOverdrive,
    playerProgress,
    opponentProgress,
    position,
    gapMeters,
    rival,
    currentLap,
    totalLaps,
    lastAnswerResult,
    trackOffset: 0,
    archOffset: 0,
    lapFlash: 0,
    boostFlash: 0,
    shakeAmount: 0,
    playerY: 0,
    rivalY: 0,
    initializedY: false,
  });

  useEffect(() => {
    const prev = stateRef.current;

    if (lastAnswerResult && lastAnswerResult !== prev.lastAnswerResult) {
      if (lastAnswerResult.isCorrect) {
        prev.boostFlash = 1.0;
      } else {
        prev.shakeAmount = 9;
      }
    }

    if (currentLap !== prev.currentLap && currentLap > 1) {
      prev.lapFlash = 0.85;
    }

    prev.currentSpeed = currentSpeed;
    prev.playerState = playerState;
    prev.isOverdrive = isOverdrive;
    prev.playerProgress = playerProgress;
    prev.opponentProgress = opponentProgress;
    prev.position = position;
    prev.gapMeters = gapMeters;
    prev.rival = rival;
    prev.currentLap = currentLap;
    prev.totalLaps = totalLaps;
    prev.lastAnswerResult = lastAnswerResult;
  }, [
    currentSpeed,
    playerState,
    isOverdrive,
    playerProgress,
    opponentProgress,
    position,
    gapMeters,
    rival,
    currentLap,
    totalLaps,
    lastAnswerResult,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animId = 0;
    let width = Math.max(280, container.clientWidth || 400);
    let height = Math.max(180, container.clientHeight || 220);

    // Non-blocking local avatar load so animation starts immediately on frame 1
    let chikooImg: HTMLImageElement | null = null;
    let chikooLoaded = false;
    const img = new Image();
    img.src = '/avatar.webp';
    img.onload = () => {
      chikooImg = img;
      chikooLoaded = true;
    };

    const resize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      width = Math.max(240, rect.width || container.clientWidth || 400);
      height = Math.max(160, rect.height || container.clientHeight || 220);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const stars = Array.from({ length: 42 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.28,
      radius: Math.random() * 1.5 + 0.6,
      alpha: Math.random() * 0.6 + 0.3,
      color:
        Math.random() > 0.4
          ? '#ffffff'
          : Math.random() > 0.5
          ? '#67e8f9'
          : '#fde047',
      twinkle: Math.random() * 2 + 1,
    }));

    const speedStreaks: SpeedStreak[] = Array.from({ length: 18 }, () => ({
      x: Math.random(),
      y: Math.random(),
      length: Math.random() * 65 + 30,
      speed: Math.random() * 0.9 + 0.5,
      alpha: Math.random() * 0.5 + 0.25,
      side: Math.random() > 0.5 ? 'left' : 'right',
    }));

    const particles: Particle[] = [];
    const maxParticles = 50;

    let elapsedSec = 0;
    let lastTime = performance.now();

    const drawFrame = (dt: number) => {
      elapsedSec += dt;
      const st = stateRef.current;
      const w = width;
      const h = height;
      const cx = w * 0.5;

      // Decay flashes and camera shake
      if (st.boostFlash > 0) st.boostFlash = Math.max(0, st.boostFlash - dt * 2.6);
      if (st.lapFlash > 0) st.lapFlash = Math.max(0, st.lapFlash - dt * 2.0);

      let shakeX = 0;
      let shakeY = 0;
      if (st.shakeAmount > 0) {
        st.shakeAmount = Math.max(0, st.shakeAmount - dt * 26);
        shakeX = (Math.random() - 0.5) * st.shakeAmount;
        shakeY = (Math.random() - 0.5) * st.shakeAmount;
      }

      const speedFactor = Math.max(1.1, st.currentSpeed / 120);
      st.trackOffset += dt * speedFactor * 4.4;
      st.archOffset += dt * speedFactor * 0.8;

      const horizonY = h * 0.26;
      const trackTopW = w * 0.22;
      const trackBottomW = w * 0.92;

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // 1. COSMIC SKY
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#0a0e27');
      skyGrad.addColorStop(1, '#1a2352');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-12, -12, w + 24, horizonY + 14);

      // Horizon nebula glow
      const horizonGlow = ctx.createRadialGradient(cx, horizonY, 10, cx, horizonY, w * 0.55);
      horizonGlow.addColorStop(
        0,
        st.isOverdrive ? 'rgba(217, 70, 239, 0.32)' : 'rgba(56, 189, 248, 0.28)'
      );
      horizonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, 0, w, horizonY + 16);

      // Twinkling stars
      for (const s of stars) {
        const alpha = Math.max(0.2, Math.min(1, s.alpha + Math.sin(elapsedSec * s.twinkle) * 0.25));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Distant ringed planet
      const planetX = w * 0.8;
      const planetY = horizonY * 0.48;
      const planetR = Math.min(w * 0.055, 22);
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.65)';
      ctx.beginPath();
      ctx.arc(planetX - 3, planetY - 3, planetR * 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(192, 132, 252, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(planetX, planetY, planetR * 2.1, planetR * 0.42, -0.14, 0, Math.PI * 2);
      ctx.stroke();

      // 2. GROUND OUTSIDE HIGHWAY
      ctx.fillStyle = '#0c1129';
      ctx.fillRect(-12, horizonY, w + 24, h - horizonY + 16);

      // 3. 3D PERSPECTIVE SCROLLING HIGHWAY
      const numSegments = 16;
      const normOffset = st.trackOffset % 1;

      for (let i = 0; i < numSegments; i++) {
        const segFar = (i - normOffset) / numSegments;
        const segNear = (i + 1 - normOffset) / numSegments;
        if (segNear < 0 || segFar > 1) continue;

        const pFar = Math.pow(Math.max(0, segFar), 2.25);
        const pNear = Math.pow(Math.min(1, segNear), 2.25);

        const yFar = horizonY + (h - horizonY) * pFar;
        const yNear = horizonY + (h - horizonY) * pNear;

        const wFar = trackTopW + (trackBottomW - trackTopW) * pFar;
        const wNear = trackTopW + (trackBottomW - trackTopW) * pNear;

        const isLight = i % 2 === 0;
        ctx.fillStyle = isLight ? '#1c254a' : '#141b38';
        ctx.beginPath();
        ctx.moveTo(cx - wFar / 2, yFar);
        ctx.lineTo(cx + wFar / 2, yFar);
        ctx.lineTo(cx + wNear / 2, yNear);
        ctx.lineTo(cx - wNear / 2, yNear);
        ctx.closePath();
        ctx.fill();

        // Subtle lane tinting
        ctx.fillStyle = 'rgba(2, 132, 199, 0.09)';
        ctx.beginPath();
        ctx.moveTo(cx - wFar / 2, yFar);
        ctx.lineTo(cx, yFar);
        ctx.lineTo(cx, yNear);
        ctx.lineTo(cx - wNear / 2, yNear);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(124, 58, 237, 0.09)';
        ctx.beginPath();
        ctx.moveTo(cx, yFar);
        ctx.lineTo(cx + wFar / 2, yFar);
        ctx.lineTo(cx + wNear / 2, yNear);
        ctx.lineTo(cx, yNear);
        ctx.closePath();
        ctx.fill();

        // Side curbs
        const curbFar = Math.max(2, pFar * 12);
        const curbNear = Math.max(3, pNear * 12);

        ctx.fillStyle = isLight ? '#22d3ee' : '#f8fafc';
        ctx.globalAlpha = Math.min(1, pNear * 1.25);
        ctx.beginPath();
        ctx.moveTo(cx - wFar / 2 - curbFar, yFar);
        ctx.lineTo(cx - wFar / 2, yFar);
        ctx.lineTo(cx - wNear / 2, yNear);
        ctx.lineTo(cx - wNear / 2 - curbNear, yNear);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = isLight ? '#c084fc' : '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(cx + wFar / 2, yFar);
        ctx.lineTo(cx + wFar / 2 + curbFar, yFar);
        ctx.lineTo(cx + wNear / 2 + curbNear, yNear);
        ctx.lineTo(cx + wNear / 2, yNear);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Glowing edge rails
      ctx.lineWidth = 3;
      ctx.strokeStyle = st.isOverdrive ? '#f43f5e' : '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(cx - trackTopW / 2, horizonY);
      ctx.lineTo(cx - trackBottomW / 2, h);
      ctx.stroke();

      ctx.strokeStyle = st.isOverdrive ? '#d946ef' : '#a855f7';
      ctx.beginPath();
      ctx.moveTo(cx + trackTopW / 2, horizonY);
      ctx.lineTo(cx + trackBottomW / 2, h);
      ctx.stroke();

      // Center dashed lane divider
      for (let i = 0; i < 14; i++) {
        const prog = (i - normOffset * 0.7) / 14;
        if (prog < 0 || prog > 1) continue;
        const p1 = Math.pow(prog, 2.25);
        const p2 = Math.pow(Math.min(1, prog + 0.042), 2.25);
        const y1 = horizonY + (h - horizonY) * p1;
        const y2 = horizonY + (h - horizonY) * p2;

        ctx.strokeStyle = `rgba(103, 232, 249, ${Math.min(1, p1 * 1.15)})`;
        ctx.lineWidth = Math.max(1.5, p1 * 4.5);
        ctx.beginPath();
        ctx.moveTo(cx, y1);
        ctx.lineTo(cx, y2);
        ctx.stroke();
      }

      // Boost chevrons on road
      for (let i = 0; i <= numSegments; i++) {
        const prog = (i - normOffset) / numSegments;
        if (prog < 0 || prog > 1) continue;
        const p = Math.pow(prog, 2.25);
        if (i % 3 === 0 && p > 0.16) {
          const sliceY = horizonY + (h - horizonY) * p;
          const sliceW = trackTopW + (trackBottomW - trackTopW) * p;
          const arrowW = sliceW * 0.14;
          const arrowH = 11 * p;

          ctx.strokeStyle = st.isOverdrive
            ? `rgba(253, 224, 71, ${p * 0.85})`
            : `rgba(34, 211, 238, ${p * 0.8})`;
          ctx.lineWidth = Math.max(1.6, p * 3.5);
          ctx.beginPath();
          ctx.moveTo(cx - arrowW, sliceY + arrowH);
          ctx.lineTo(cx, sliceY);
          ctx.lineTo(cx + arrowW, sliceY + arrowH);
          ctx.stroke();
        }
      }

      // 4. OVERHEAD ENERGY CHECKPOINT ARCH
      const archProg = (st.archOffset % 3.4) / 3.4;
      if (archProg > 0.05 && archProg < 0.92) {
        const ap = Math.pow(archProg, 2.2);
        const archY = horizonY + (h - horizonY) * ap;
        const archW = (trackTopW + (trackBottomW - trackTopW) * ap) * 1.14;
        const archH = h * 0.42 * ap;
        const archColor = st.isOverdrive ? '#f43f5e' : '#38bdf8';

        ctx.save();
        ctx.globalAlpha = Math.min(0.9, ap * 1.1);
        ctx.strokeStyle = archColor;
        ctx.lineWidth = Math.max(2, ap * 6);
        ctx.beginPath();
        ctx.moveTo(cx - archW / 2, archY);
        ctx.lineTo(cx - archW / 2, archY - archH);
        ctx.lineTo(cx + archW / 2, archY - archH);
        ctx.lineTo(cx + archW / 2, archY);
        ctx.stroke();

        ctx.fillStyle = st.isOverdrive
          ? 'rgba(244, 63, 94, 0.2)'
          : 'rgba(56, 189, 248, 0.18)';
        ctx.fillRect(cx - archW / 2, archY - archH, archW, archH * 0.24);
        ctx.restore();
      }

      // 5. DYNAMIC RACERS (CHIKOO & RIVAL)
      const isPlayerAhead = st.position === 1;
      const isBoosting = st.playerState === 'boost' || st.playerState === 'hyper';
      const isStalling = st.playerState === 'stall';

      const kartScale = Math.min(1.05, Math.max(0.72, Math.min(w / 400, h / 210)));
      const playerLaneX = cx - trackBottomW * 0.22;
      const rivalLaneX = cx + trackBottomW * 0.22;
      const baseRacerY = h * 0.68;

      const chikooBob = isStalling
        ? Math.sin(elapsedSec * 22) * 3.5
        : isBoosting
        ? Math.sin(elapsedSec * 16) * 2.5
        : Math.sin(elapsedSec * 6) * 3;
      const rivalBob = Math.sin(elapsedSec * 6.5 + 1.2) * 3;

      const playerTargetY = baseRacerY + (isPlayerAhead ? -16 : 12) + chikooBob;
      const rivalTargetY = baseRacerY + (isPlayerAhead ? 12 : -16) + rivalBob;

      if (!st.initializedY) {
        st.playerY = playerTargetY;
        st.rivalY = rivalTargetY;
        st.initializedY = true;
      } else {
        st.playerY += (playerTargetY - st.playerY) * Math.min(1, dt * 9);
        st.rivalY += (rivalTargetY - st.rivalY) * Math.min(1, dt * 9);
      }

      // Helper to draw Chikoo Hoverkart
      const drawChikoo = () => {
        ctx.save();
        ctx.translate(playerLaneX, st.playerY);
        const tilt =
          (isPlayerAhead ? -0.02 : 0.02) + (isStalling ? (Math.random() - 0.5) * 0.06 : 0);
        ctx.rotate(tilt);
        ctx.scale(kartScale, kartScale);

        // Underglow
        const glow = ctx.createRadialGradient(0, 15, 4, 0, 15, 44);
        glow.addColorStop(0, st.isOverdrive ? 'rgba(244, 63, 94, 0.55)' : 'rgba(56, 189, 248, 0.5)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(0, 15, 44, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Thruster flames
        const flameH = isBoosting
          ? 28 + Math.random() * 10
          : isStalling
          ? 4
          : 15 + Math.random() * 6;
        ctx.fillStyle = st.isOverdrive ? '#f43f5e' : isBoosting ? '#fbbf24' : '#22d3ee';

        ctx.beginPath();
        ctx.moveTo(-20, 16);
        ctx.lineTo(-15, 16 + flameH);
        ctx.lineTo(-10, 16);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(10, 16);
        ctx.lineTo(15, 16 + flameH);
        ctx.lineTo(20, 16);
        ctx.closePath();
        ctx.fill();

        // Kart chassis
        ctx.beginPath();
        ctx.moveTo(-36, 7);
        ctx.lineTo(-19, -5);
        ctx.lineTo(19, -5);
        ctx.lineTo(36, 7);
        ctx.lineTo(28, 17);
        ctx.lineTo(-28, 17);
        ctx.closePath();
        ctx.fillStyle = '#0284c7';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = st.isOverdrive ? '#f43f5e' : '#38bdf8';
        ctx.stroke();

        // Chikoo pilot portrait
        if (chikooLoaded && chikooImg) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, -18, 22, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(chikooImg, -22, -40, 44, 44);
          ctx.restore();

          ctx.beginPath();
          ctx.arc(0, -18, 22, 0, Math.PI * 2);
          ctx.lineWidth = 2;
          ctx.strokeStyle = st.isOverdrive ? '#f43f5e' : '#7dd3fc';
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(0, -16, 16, 0, Math.PI * 2);
          ctx.fillStyle = '#0ea5e9';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#e0f2fe';
          ctx.stroke();
        }

        ctx.restore();
      };

      // Helper to draw Rival Hoverkart
      const drawRival = () => {
        ctx.save();
        ctx.translate(rivalLaneX, st.rivalY);
        ctx.rotate(isPlayerAhead ? 0.02 : -0.02);
        ctx.scale(kartScale, kartScale);

        // Underglow
        const glow = ctx.createRadialGradient(0, 15, 4, 0, 15, 42);
        glow.addColorStop(0, 'rgba(168, 85, 247, 0.5)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(0, 15, 42, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Thrusters
        const rivalFlameH = isPlayerAhead ? 12 + Math.random() * 5 : 22 + Math.random() * 8;
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(-18, 15);
        ctx.lineTo(-13, 15 + rivalFlameH);
        ctx.lineTo(-8, 15);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(8, 15);
        ctx.lineTo(13, 15 + rivalFlameH);
        ctx.lineTo(18, 15);
        ctx.closePath();
        ctx.fill();

        // Chassis
        ctx.beginPath();
        ctx.moveTo(-34, 6);
        ctx.lineTo(-17, -4);
        ctx.lineTo(17, -4);
        ctx.lineTo(34, 6);
        ctx.lineTo(26, 16);
        ctx.lineTo(-26, 16);
        ctx.closePath();
        ctx.fillStyle = '#4c1d95';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#c084fc';
        ctx.stroke();

        // Cyber visor cockpit
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(-17, -25, 34, 19, 5);
        ctx.fill();
        ctx.stroke();

        // Laser eye line
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(-11, -17, 22, 3.5);

        ctx.restore();
      };

      // Draw back kart first so leader stays visually crisp
      if (isPlayerAhead) {
        drawRival();
        drawChikoo();
      } else {
        drawChikoo();
        drawRival();
      }

      // 6. SPEED STREAKS
      if (st.currentSpeed > 240 || isBoosting || st.isOverdrive) {
        const streakIntensity = st.isOverdrive ? 0.9 : isBoosting ? 0.75 : 0.45;
        ctx.lineWidth = 1.5;
        for (const streak of speedStreaks) {
          streak.y += streak.speed * (st.currentSpeed / 190) * dt;
          if (streak.y > 1) {
            streak.y = 0;
            streak.x = Math.random();
          }
          const sx = (streak.side === 'left' ? streak.x * 0.22 : 0.78 + streak.x * 0.22) * w;
          const sy = streak.y * h;
          const slen = streak.length * (st.currentSpeed / 220);

          ctx.strokeStyle = st.isOverdrive
            ? `rgba(244, 63, 94, ${streak.alpha * streakIntensity})`
            : `rgba(56, 189, 248, ${streak.alpha * streakIntensity})`;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx, Math.max(0, sy - slen));
          ctx.stroke();
        }
      }

      // 7. SPARKS & EXHAUST PARTICLES
      if (!prefersReducedMotion && particles.length < maxParticles) {
        const shouldEmit = isBoosting || st.isOverdrive || isStalling || Math.random() < 0.45;
        if (shouldEmit) {
          particles.push({
            x: playerLaneX + (Math.random() - 0.5) * 24 * kartScale,
            y: st.playerY + 16 * kartScale,
            vx: (Math.random() - 0.5) * 55,
            vy: isStalling ? -(Math.random() * 65 + 25) : Math.random() * 130 + 60,
            life: 0,
            maxLife: isStalling ? 0.5 : 0.34,
            color: isStalling
              ? '#ef4444'
              : st.isOverdrive
              ? '#f43f5e'
              : isBoosting
              ? '#fbbf24'
              : '#22d3ee',
            size: Math.random() * 2.5 + 1.5,
          });
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life += dt;
        if (pt.life >= pt.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        const alpha = 1 - pt.life / pt.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 8. ANSWER FEEDBACK FLASHES
      if (st.boostFlash > 0) {
        ctx.fillStyle = `rgba(56, 189, 248, ${st.boostFlash * 0.2})`;
        ctx.fillRect(0, 0, w, h);
      }
      if (st.lapFlash > 0) {
        ctx.fillStyle = `rgba(251, 191, 36, ${st.lapFlash * 0.22})`;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.restore();
    };

    if (prefersReducedMotion) {
      drawFrame(0.016);
    } else {
      const loop = (now: number) => {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        drawFrame(dt);
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[180px] relative overflow-hidden select-none bg-[#0a0e27]"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Live Battle Arena race against ${rival.name}`}
        className="w-full h-full block"
      />
    </div>
  );
}

export default PixiRaceScene;
