import { motion } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';
import { isLowEndDevice } from '../../lib/devicePerformance';

interface ChikooInteractionWrapperProps {
  children: React.ReactNode;
  isChecked?: boolean;
  isCorrect?: boolean;
  className?: string;
}

// Sparkle element helper for gaming vibe
function FloatingSparkle({ className, delay, size = 16, lowEnd = false }: { className: string; delay: number; size?: number; lowEnd?: boolean }) {
  if (lowEnd) {
    return (
      <div className={`absolute text-amber-300/40 pointer-events-none ${className}`}>
        <Sparkles size={size} className="fill-amber-300/30" />
      </div>
    );
  }

  return (
    <motion.div
      className={`absolute text-amber-300 pointer-events-none opacity-50 ${className}`}
      initial={{ scale: 0.5, opacity: 0.2, y: 0 }}
      animate={{
        scale: [0.8, 1.3, 0.8],
        opacity: [0.3, 0.8, 0.3],
        y: [-12, 12, -12],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 4 + Math.random() * 2,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut",
      }}
    >
      <Sparkles size={size} className="fill-amber-300" />
    </motion.div>
  );
}

// Background Star helper for game sky depth
function FloatingStar({ className, delay, size = 12, lowEnd = false }: { className: string; delay: number; size?: number; lowEnd?: boolean }) {
  if (lowEnd) {
    return (
      <div className={`absolute text-indigo-300/40 pointer-events-none ${className}`}>
        <Star size={size} className="fill-indigo-200/20" />
      </div>
    );
  }

  return (
    <motion.div
      className={`absolute text-indigo-300/60 pointer-events-none ${className}`}
      initial={{ scale: 0.8, opacity: 0.1 }}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.2, 0.6, 0.2],
        rotate: [0, 45, 0],
      }}
      transition={{
        duration: 5 + Math.random() * 2,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut",
      }}
    >
      <Star size={size} className="fill-indigo-200/30" />
    </motion.div>
  );
}

export function ChikooInteractionWrapper({
  children,
  className = "",
}: ChikooInteractionWrapperProps) {
  const isLowEnd = isLowEndDevice();

  return (
    <div className={`relative w-full rounded-[2.5rem] overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-[#0c0f24] via-[#151233] to-[#251845] border-3 border-indigo-500/35 shadow-[0_15px_40px_rgba(0,0,0,0.45)] flex flex-col justify-between transition-all duration-200 gpu-layer ${className}`}>
      
      {/* IMMERSIVE NINTENDO GAME BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft Radial Lighting / Glowing Blobs (Lightweight or omitted on low-end) */}
        {!isLowEnd && (
          <>
            <div className="bg-indigo-600/20 blur-[60px] rounded-full w-80 h-80 absolute -top-10 -left-10 animate-pulse" />
            <div className="bg-fuchsia-600/15 blur-[80px] rounded-full w-96 h-96 absolute -bottom-20 -right-20 animate-pulse" />
            <div className="bg-cyan-500/10 blur-[50px] rounded-full w-72 h-72 absolute top-1/3 left-1/4" />
          </>
        )}

        {/* Floating game dust and stars */}
        <FloatingSparkle className="top-8 left-12" delay={0.2} size={16} lowEnd={isLowEnd} />
        <FloatingSparkle className="top-1/4 right-10" delay={1.4} size={14} lowEnd={isLowEnd} />
        {!isLowEnd && <FloatingSparkle className="bottom-24 left-20" delay={0.8} size={18} />}
        
        <FloatingStar className="top-16 right-1/3" delay={0.5} size={12} lowEnd={isLowEnd} />
        {!isLowEnd && <FloatingStar className="bottom-12 right-16" delay={2.7} size={14} />}

        {/* Nintendo Switch style diagonal stripe accent */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-white/5 to-transparent rotate-12 -mr-10 -mt-10 pointer-events-none" />
      </div>

      {/* RENDER INTERACTION DIRECTLY ON TOP OF GAME CANVAS */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
}
