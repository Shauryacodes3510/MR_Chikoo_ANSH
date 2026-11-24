import React, { useRef, useEffect } from 'react';
import { VehicleMotionState } from '../types/arena.types';

interface RaceTrackCanvasProps {
  currentSpeed: number;
  playerState: VehicleMotionState;
  isOverdrive: boolean;
  playerProgress: number;
  opponentProgress: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export function RaceTrackCanvas({
  playerState,
  isOverdrive
}: RaceTrackCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    playerState,
    isOverdrive,
    angle: 0
  });

  useEffect(() => {
    stateRef.current.playerState = playerState;
    stateRef.current.isOverdrive = isOverdrive;
  }, [playerState, isOverdrive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Stars & Floating Orbs
    const numStars = 80;
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random(),
      y: Math.random(),
      radius: Math.random() * 1.8 + 0.6,
      alpha: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() * 0.04 + 0.01
    }));

    const particles: Particle[] = [];

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const { playerState, isOverdrive } = stateRef.current;
      stateRef.current.angle += dt * 0.5;

      const centerX = width * 0.5;
      const centerY = height * 0.45;

      // 1. COSMIC ARENA NEBULA BACKGROUND
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#040614');
      bgGrad.addColorStop(0.5, '#0b102b');
      bgGrad.addColorStop(1, '#080a1c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Radial Cosmic Energy Glow
      const energyGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        20,
        centerX,
        centerY,
        width * 0.7
      );
      energyGlow.addColorStop(0, isOverdrive ? 'rgba(236, 72, 153, 0.28)' : 'rgba(56, 189, 248, 0.2)');
      energyGlow.addColorStop(0.5, 'rgba(129, 140, 248, 0.12)');
      energyGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = energyGlow;
      ctx.fillRect(0, 0, width, height);

      // Stars
      for (const s of stars) {
        s.alpha += Math.sin(now * s.twinkle) * 0.015;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.2, Math.min(1, s.alpha))})`;
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. 3D FLOATING HEXAGON BATTLE ARENA STAGE
      ctx.save();
      const stageY = height * 0.52;
      const stageW = width * 0.88;
      const stageH = height * 0.18;

      // Stage Base Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.ellipse(centerX, stageY + stageH * 0.6, stageW * 0.48, stageH * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main Hexagonal Battle Platform Outer Ring
      ctx.save();
      ctx.strokeStyle = isOverdrive ? '#f43f5e' : '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = isOverdrive ? '#ec4899' : '#0284c7';
      ctx.shadowBlur = 16;

      ctx.beginPath();
      ctx.ellipse(centerX, stageY, stageW * 0.46, stageH, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Platform Fill
      const platformGrad = ctx.createRadialGradient(
        centerX, stageY, 10,
        centerX, stageY, stageW * 0.45
      );
      platformGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
      platformGrad.addColorStop(0.7, 'rgba(30, 41, 59, 0.75)');
      platformGrad.addColorStop(1, 'rgba(10, 15, 30, 0.9)');
      ctx.fillStyle = platformGrad;
      ctx.fill();
      ctx.restore();

      // Platform Grid Pattern (Crosshatch Rays)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 1.2;
      for (let i = -4; i <= 4; i++) {
        const offset = i * (stageW * 0.08);
        ctx.beginPath();
        ctx.moveTo(centerX + offset * 0.3, stageY - stageH * 0.8);
        ctx.lineTo(centerX + offset, stageY + stageH * 0.8);
        ctx.stroke();
      }

      // Center Duel Emblem Ring
      ctx.strokeStyle = isOverdrive ? 'rgba(236, 72, 153, 0.6)' : 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(centerX, stageY, stageW * 0.18, stageH * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      // 3. ENERGY BEAM & IMPACT PARTICLES
      if (playerState === 'boost' || playerState === 'hyper' || isOverdrive) {
        if (particles.length < 50) {
          particles.push({
            x: centerX + (Math.random() - 0.5) * (width * 0.4),
            y: stageY + (Math.random() - 0.5) * (height * 0.1),
            vx: (Math.random() - 0.5) * 80,
            vy: -Math.random() * 120 - 40,
            size: Math.random() * 4 + 2,
            color: isOverdrive ? '#f43f5e' : '#38bdf8',
            alpha: 1,
            life: 0,
            maxLife: 0.6
          });
        }
      }

      // Render & Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life += dt;
        if (pt.life >= pt.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.alpha = 1 - (pt.life / pt.maxLife);

        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * pt.alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ touchAction: 'none' }}
    />
  );
}
