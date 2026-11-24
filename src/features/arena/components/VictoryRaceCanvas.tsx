import React, { useEffect, useRef } from 'react';

interface VictoryRaceCanvasProps {
  isWinner: boolean;
  rivalName: string;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  color: string;
  alpha: number;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export function VictoryRaceCanvas({ isWinner, rivalName }: VictoryRaceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animId = 0;
    let width = 480;
    let height = 260;

    // Load local Chikoo avatar cleanly with safe fallback
    let chikooImg: HTMLImageElement | null = null;
    let chikooLoaded = false;
    const img = new Image();
    img.src = '/avatar.webp';
    img.onload = () => {
      chikooImg = img;
      chikooLoaded = true;
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      width = Math.max(240, rect.width);
      height = Math.max(180, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Starfield
    const stars = Array.from({ length: 36 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.34,
      r: 0.7 + Math.random() * 1.4,
      alpha: 0.35 + Math.random() * 0.55,
      twinkle: 1.5 + Math.random() * 2.5,
    }));

    // Celebration confetti (for winner)
    const confettiColors = ['#fbbf24', '#38bdf8', '#34d399', '#f472b6', '#ffffff'];
    const confetti: ConfettiParticle[] = isWinner
      ? Array.from({ length: 38 }, () => ({
          x: Math.random(),
          y: Math.random() * 0.85,
          vx: (Math.random() - 0.5) * 0.08,
          vy: 0.14 + Math.random() * 0.18,
          size: 3 + Math.random() * 4,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 4,
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          alpha: 0.75 + Math.random() * 0.25,
        }))
      : [];

    const sparks: SparkParticle[] = [];
    let trackOffset = 0;
    let archOffset = 0.35;
    let elapsed = 0;
    let lastTime = performance.now();

    const drawKart = (
      x: number,
      y: number,
      scale: number,
      primaryColor: string,
      strokeColor: string,
      flameColor: string,
      flameScale: number,
      isPlayerKart: boolean
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Underglow reflection
      const glow = ctx.createRadialGradient(0, 14, 4, 0, 14, 44);
      glow.addColorStop(0, isPlayerKart ? 'rgba(56, 189, 248, 0.45)' : 'rgba(168, 85, 247, 0.4)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(0, 14, 44, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Twin exhaust flames
      const flameH = (14 + Math.sin(elapsed * 28 + (isPlayerKart ? 0 : 2)) * 4) * flameScale;
      ctx.fillStyle = flameColor;
      ctx.beginPath();
      ctx.moveTo(-18, 14);
      ctx.lineTo(-13, 14 + flameH);
      ctx.lineTo(-8, 14);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(8, 14);
      ctx.lineTo(13, 14 + flameH);
      ctx.lineTo(18, 14);
      ctx.closePath();
      ctx.fill();

      // Hoverkart chassis
      ctx.beginPath();
      ctx.moveTo(-34, 6);
      ctx.lineTo(-18, -6);
      ctx.lineTo(18, -6);
      ctx.lineTo(34, 6);
      ctx.lineTo(26, 15);
      ctx.lineTo(-26, 15);
      ctx.closePath();
      ctx.fillStyle = primaryColor;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();

      // Pilot head / cockpit
      if (isPlayerKart) {
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
          ctx.strokeStyle = isWinner ? '#fbbf24' : '#38bdf8';
          ctx.stroke();
        } else {
          // Clean vector pilot fallback
          ctx.beginPath();
          ctx.arc(0, -16, 16, 0, Math.PI * 2);
          ctx.fillStyle = '#0ea5e9';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#e0f2fe';
          ctx.stroke();
        }

        // Winner crown above Chikoo
        if (isWinner) {
          ctx.save();
          ctx.translate(0, -45);
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(-10, 6);
          ctx.lineTo(-12, -3);
          ctx.lineTo(-5, 2);
          ctx.lineTo(0, -6);
          ctx.lineTo(5, 2);
          ctx.lineTo(12, -3);
          ctx.lineTo(10, 6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      } else {
        // Rival cyber cockpit
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(-16, -24, 32, 18, 5);
        ctx.fill();
        ctx.stroke();

        // Visor glow
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(-10, -17, 20, 3.5);
      }

      ctx.restore();
    };

    const renderFrame = (dt: number) => {
      elapsed += dt;
      trackOffset += dt * 3.8;
      archOffset += dt * 0.45;

      const w = width;
      const h = height;
      const cx = w * 0.5;
      const horizonY = h * 0.34;
      const trackTopW = w * 0.2;
      const trackBottomW = w * 0.92;

      // 1. Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#070b1e');
      skyGrad.addColorStop(1, '#172047');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizonY + 2);

      // Soft horizon glow
      const horizonGlow = ctx.createRadialGradient(cx, horizonY, 10, cx, horizonY, w * 0.55);
      horizonGlow.addColorStop(0, isWinner ? 'rgba(56, 189, 248, 0.25)' : 'rgba(139, 92, 246, 0.2)');
      horizonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, 0, w, horizonY + 12);

      // Twinkling stars
      for (const s of stars) {
        const a = Math.max(0.15, Math.min(0.95, s.alpha + Math.sin(elapsed * s.twinkle) * 0.25));
        ctx.fillStyle = `rgba(226, 232, 240, ${a})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant ringed planet (subtle landmark matching the race scene)
      const px = w * 0.8;
      const py = horizonY * 0.45;
      const pr = Math.min(w * 0.055, 20);
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(px, py, pr * 2, pr * 0.42, -0.15, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Ground outside track
      ctx.fillStyle = '#0b1026';
      ctx.fillRect(0, horizonY, w, h - horizonY);

      // 3. Perspective Scrolling Highway Segments
      const numSegments = 14;
      const normOffset = trackOffset % 1;

      for (let i = 0; i < numSegments; i++) {
        const segFar = (i - normOffset) / numSegments;
        const segNear = (i + 1 - normOffset) / numSegments;
        if (segNear < 0 || segFar > 1) continue;

        const pFar = Math.pow(Math.max(0, segFar), 2.2);
        const pNear = Math.pow(Math.min(1, segNear), 2.2);

        const yFar = horizonY + (h - horizonY) * pFar;
        const yNear = horizonY + (h - horizonY) * pNear;
        const wFar = trackTopW + (trackBottomW - trackTopW) * pFar;
        const wNear = trackTopW + (trackBottomW - trackTopW) * pNear;

        const isLight = i % 2 === 0;
        ctx.fillStyle = isLight ? '#182142' : '#121936';
        ctx.beginPath();
        ctx.moveTo(cx - wFar / 2, yFar);
        ctx.lineTo(cx + wFar / 2, yFar);
        ctx.lineTo(cx + wNear / 2, yNear);
        ctx.lineTo(cx - wNear / 2, yNear);
        ctx.closePath();
        ctx.fill();

        // Subtle lane rails
        const curbFar = Math.max(2, pFar * 10);
        const curbNear = Math.max(3, pNear * 10);

        ctx.fillStyle = isLight ? 'rgba(56, 189, 248, 0.85)' : 'rgba(248, 250, 252, 0.8)';
        ctx.beginPath();
        ctx.moveTo(cx - wFar / 2 - curbFar, yFar);
        ctx.lineTo(cx - wFar / 2, yFar);
        ctx.lineTo(cx - wNear / 2, yNear);
        ctx.lineTo(cx - wNear / 2 - curbNear, yNear);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = isLight ? 'rgba(192, 132, 252, 0.85)' : 'rgba(251, 191, 36, 0.8)';
        ctx.beginPath();
        ctx.moveTo(cx + wFar / 2, yFar);
        ctx.lineTo(cx + wFar / 2 + curbFar, yFar);
        ctx.lineTo(cx + wNear / 2 + curbNear, yNear);
        ctx.lineTo(cx + wNear / 2, yNear);
        ctx.closePath();
        ctx.fill();
      }

      // Center dashed lane divider
      for (let i = 0; i < 12; i++) {
        const prog = (i - normOffset * 0.7) / 12;
        if (prog < 0 || prog > 1) continue;
        const p1 = Math.pow(prog, 2.2);
        const p2 = Math.pow(Math.min(1, prog + 0.045), 2.2);
        const y1 = horizonY + (h - horizonY) * p1;
        const y2 = horizonY + (h - horizonY) * p2;
        ctx.strokeStyle = `rgba(125, 211, 252, ${Math.min(0.85, p1 * 1.1)})`;
        ctx.lineWidth = Math.max(1.2, p1 * 4);
        ctx.beginPath();
        ctx.moveTo(cx, y1);
        ctx.lineTo(cx, y2);
        ctx.stroke();
      }

      // 4. Sweeping Checkered Finish Arch
      const archProg = (archOffset % 1.8) / 1.8;
      if (archProg > 0.06 && archProg < 0.86) {
        const ap = Math.pow(archProg, 2.1);
        const archY = horizonY + (h - horizonY) * ap;
        const archW = (trackTopW + (trackBottomW - trackTopW) * ap) * 1.12;
        const archH = h * 0.44 * ap;
        const bannerH = Math.max(4, archH * 0.22);
        const alpha = Math.min(1, ap * 1.4);

        ctx.save();
        ctx.globalAlpha = alpha;

        // Pillars
        ctx.strokeStyle = isWinner ? '#fbbf24' : '#38bdf8';
        ctx.lineWidth = Math.max(2, ap * 5);
        ctx.beginPath();
        ctx.moveTo(cx - archW / 2, archY);
        ctx.lineTo(cx - archW / 2, archY - archH);
        ctx.moveTo(cx + archW / 2, archY);
        ctx.lineTo(cx + archW / 2, archY - archH);
        ctx.stroke();

        // Checkered Finish Banner
        const cols = 10;
        const rows = 2;
        const cellW = archW / cols;
        const cellH = bannerH / rows;
        const startX = cx - archW / 2;
        const startY = archY - archH;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#f8fafc' : '#0f172a';
            ctx.fillRect(startX + c * cellW, startY + r * cellH, cellW + 0.5, cellH + 0.5);
          }
        }
        ctx.restore();
      }

      // 5. Dynamic Racers (Chikoo & Rival)
      const baseScale = Math.min(1.05, Math.max(0.75, w / 420));
      const baseY = h * 0.72;
      const chikooX = cx - trackBottomW * 0.21;
      const rivalX = cx + trackBottomW * 0.21;

      const chikooBob = Math.sin(elapsed * 5.5) * 3.5;
      const rivalBob = Math.sin(elapsed * 5.2 + 1.4) * 3.0;

      const chikooY = baseY + (isWinner ? -16 : 10) + chikooBob;
      const rivalY = baseY + (isWinner ? 14 : -14) + rivalBob;

      // Exhaust sparks for leading kart
      if (!prefersReducedMotion && sparks.length < 30 && Math.random() < 0.65) {
        const leadX = isWinner ? chikooX : rivalX;
        const leadY = isWinner ? chikooY : rivalY;
        sparks.push({
          x: leadX + (Math.random() - 0.5) * 26,
          y: leadY + 14 * baseScale,
          vx: (Math.random() - 0.5) * 35,
          vy: 55 + Math.random() * 75,
          life: 0,
          maxLife: 0.45 + Math.random() * 0.25,
          color: isWinner ? '#38bdf8' : '#c084fc',
          size: 1.8 + Math.random() * 2,
        });
      }

      // Update & draw sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.life += dt;
        if (sp.life >= sp.maxLife) {
          sparks.splice(i, 1);
          continue;
        }
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        const alpha = 1 - sp.life / sp.maxLife;
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw trailing racer first, then leading racer for clean depth ordering
      if (isWinner) {
        drawKart(rivalX, rivalY, baseScale * 0.92, '#4c1d95', '#a855f7', '#f43f5e', 0.85, false);
        drawKart(chikooX, chikooY, baseScale * 1.04, '#0284c7', '#38bdf8', '#fbbf24', 1.25, true);
      } else {
        drawKart(chikooX, chikooY, baseScale * 0.94, '#0284c7', '#38bdf8', '#38bdf8', 0.95, true);
        drawKart(rivalX, rivalY, baseScale * 1.02, '#4c1d95', '#c084fc', '#f43f5e', 1.15, false);
      }

      // 6. Celebration Confetti (Winner)
      if (isWinner) {
        for (const p of confetti) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rotation += p.vRot * dt;
          if (p.y > 1.05) {
            p.y = -0.05;
            p.x = Math.random();
          }
          if (p.x < -0.05) p.x = 1.05;
          if (p.x > 1.05) p.x = -0.05;

          ctx.save();
          ctx.translate(p.x * w, p.y * h);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.55);
          ctx.restore();
        }
      }
    };

    if (prefersReducedMotion) {
      renderFrame(0.016);
    } else {
      const loop = (now: number) => {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        renderFrame(dt);
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [isWinner]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={
        isWinner
          ? `Victory lap animation showing you finishing ahead of ${rivalName}`
          : `Finish line race animation against ${rivalName}`
      }
      className="w-full h-full block select-none"
    />
  );
}
