import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  isBright?: boolean;
}

interface CosmicMote {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  phase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
  color: string;
}

export const SpaceBackgroundCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let motes: CosmicMote[] = [];
    let shootingStar: ShootingStar | null = null;
    let lastShootingStarTime = Date.now();
    let nextShootingStarInterval = 4000 + Math.random() * 5000;

    const starColors = [
      '#FFFFFF',
      '#F8FAFC',
      '#E2E8F0',
      '#BAE6FD',
      '#C7D2FE',
    ];

    const initCanvas = () => {
      const parent = canvas.parentElement;
      width = parent?.clientWidth || window.innerWidth;
      height = parent?.clientHeight || window.innerHeight;
      
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Generate subtle stars
      stars = [];
      const starCount = Math.floor((width * height) / 4800) + 65;
      for (let i = 0; i < starCount; i++) {
        const isBright = Math.random() < 0.12;
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: isBright ? 1.5 + Math.random() * 1.2 : 0.6 + Math.random() * 0.9,
          baseAlpha: isBright ? 0.6 + Math.random() * 0.35 : 0.2 + Math.random() * 0.45,
          alpha: 0.4,
          twinkleSpeed: 0.015 + Math.random() * 0.025,
          twinklePhase: Math.random() * Math.PI * 2,
          color: starColors[Math.floor(Math.random() * starColors.length)],
          isBright,
        });
      }

      // Generate drifting cosmic particles (subtle starlight dust)
      motes = [];
      const moteCount = 20;
      for (let i = 0; i < moteCount; i++) {
        motes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 1.0 + Math.random() * 1.8,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -0.1 - Math.random() * 0.2,
          color: Math.random() > 0.5 ? 'rgba(186, 230, 253, ' : 'rgba(199, 210, 254, ',
          alpha: 0.12 + Math.random() * 0.18,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const spawnShootingStar = () => {
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.25;
      shootingStar = {
        x: Math.random() * width * 0.8,
        y: Math.random() * height * 0.3,
        length: 75 + Math.random() * 60,
        speed: 12 + Math.random() * 6,
        angle,
        opacity: 0.85,
        active: true,
        color: '#FFFFFF',
      };
    };

    initCanvas();
    window.addEventListener('resize', initCanvas);

    let time = 0;
    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      // Very soft cyan / violet atmospheric cosmic glow for deep midnight navy space
      const grad1 = ctx.createRadialGradient(
        width * 0.3,
        height * 0.2,
        20,
        width * 0.3,
        height * 0.2,
        width * 0.75
      );
      grad1.addColorStop(0, 'rgba(6, 182, 212, 0.05)'); // subtle cyan glow
      grad1.addColorStop(0.5, 'rgba(14, 165, 233, 0.02)');
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(
        width * 0.75,
        height * 0.65,
        30,
        width * 0.75,
        height * 0.65,
        width * 0.75
      );
      grad2.addColorStop(0, 'rgba(139, 92, 246, 0.04)'); // very soft violet glow
      grad2.addColorStop(0.5, 'rgba(99, 102, 241, 0.015)');
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Draw stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.twinklePhase += s.twinkleSpeed;
        const shimmer = 0.5 + Math.sin(s.twinklePhase) * 0.5;
        s.alpha = s.baseAlpha * (0.4 + shimmer * 0.6);

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Subtle 4-point cross diffraction for brightest stars
        if (s.isBright && s.alpha > 0.65) {
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 0.5;
          const spike = s.size * 1.8;
          ctx.beginPath();
          ctx.moveTo(s.x - spike, s.y);
          ctx.lineTo(s.x + spike, s.y);
          ctx.moveTo(s.x, s.y - spike);
          ctx.lineTo(s.x, s.y + spike);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw drifting motes (subtle space dust)
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.phase += 0.02;
        m.x += m.vx + Math.sin(m.phase) * 0.2;
        m.y += m.vy;

        if (m.y < -20) {
          m.y = height + 20;
          m.x = Math.random() * width;
        }
        if (m.x < -20) m.x = width + 20;
        if (m.x > width + 20) m.x = -20;

        ctx.save();
        ctx.fillStyle = `${m.color}${m.alpha})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Update and draw shooting star
      const now = Date.now();
      if (!shootingStar && now - lastShootingStarTime > nextShootingStarInterval) {
        spawnShootingStar();
        lastShootingStarTime = now;
        nextShootingStarInterval = 4000 + Math.random() * 6000;
      }

      if (shootingStar && shootingStar.active) {
        shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
        shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
        shootingStar.opacity -= 0.016;

        if (shootingStar.opacity <= 0 || shootingStar.x > width + 100 || shootingStar.y > height + 100) {
          shootingStar.active = false;
          shootingStar = null;
        } else {
          ctx.save();
          const tailX = shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length;
          const tailY = shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length;

          const streakGrad = ctx.createLinearGradient(
            tailX, tailY,
            shootingStar.x, shootingStar.y
          );
          streakGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          streakGrad.addColorStop(0.7, `${shootingStar.color}`);
          streakGrad.addColorStop(1, '#FFFFFF');

          ctx.strokeStyle = streakGrad;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.globalAlpha = Math.max(0, shootingStar.opacity);
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(shootingStar.x, shootingStar.y);
          ctx.stroke();

          // Head glow
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(shootingStar.x, shootingStar.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', initCanvas);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 pointer-events-none w-full h-full ${className}`} 
      style={{ zIndex: 0 }}
    />
  );
};
