import { motion } from 'framer-motion';

interface Chest3DProps {
  isOpen: boolean;
  size?: 'sm' | 'lg';
}

export default function Chest3D({ isOpen, size = 'lg' }: Chest3DProps) {
  if (size === 'sm') {
    return (
      <div className="relative w-14 h-12 flex items-center justify-center pointer-events-none select-none">
        {/* Subtle glow behind chest */}
        <div className={`absolute inset-0 rounded-full blur-md transition-all duration-500 ${
          isOpen ? 'bg-purple-500/25 scale-110' : 'bg-transparent scale-75'
        }`} />

        {/* Outer 3D perspective wrapper */}
        <motion.div
          animate={{
            y: isOpen ? [-0.5, 0.5, -0.5] : [-1, 1, -1],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative w-12 h-10 flex flex-col justify-end"
          style={{ transformStyle: 'preserve-3d', perspective: '600px' }}
        >
          {/* Under shadow */}
          <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-8 h-1 bg-black/40 rounded-full blur-[1px] pointer-events-none" />

          {/* Small Levitating core */}
          {isOpen && (
            <motion.div
              initial={{ y: 2, opacity: 0, scale: 0.3 }}
              animate={{ y: -13, opacity: 1, scale: 1 }}
              transition={{
                y: { type: "spring", stiffness: 100, damping: 10 },
                scale: { type: "spring", stiffness: 120, damping: 8 }
              }}
              className="absolute left-1/2 -translate-x-1/2 top-1 w-3.5 h-3.5 rounded bg-gradient-to-br from-cyan-400 to-indigo-500 border border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.6)] z-25 flex items-center justify-center"
            >
              <div className="w-1 h-1 bg-white rounded-full animate-ping" />
            </motion.div>
          )}

          {/* Lid (Top piece) */}
          <motion.div
            animate={isOpen 
              ? { rotateX: -95, y: -6, z: 4, scaleY: 0.95 } 
              : { rotateX: 0, y: 0, z: 0, scaleY: 1 }
            }
            transition={{ 
              type: "spring", 
              stiffness: 120, 
              damping: 12
            }}
            style={{ originY: "100%", transformStyle: "preserve-3d" }}
            className="w-10 h-5 rounded-t-lg mx-auto relative shadow-sm z-30 bg-gradient-to-b from-amber-600 to-amber-700 border-t border-amber-500 border-x border-amber-800"
          >
            {/* Wooden slats template */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:8px_100%] opacity-30 rounded-t-lg" />
            
            {/* Metal bands - scaled down */}
            <div className="absolute left-1.5 top-0 bottom-0 w-1 bg-gradient-to-r from-yellow-300 to-yellow-500 border-x border-amber-950/40" />
            <div className="absolute right-1.5 top-0 bottom-0 w-1 bg-gradient-to-r from-yellow-300 to-yellow-500 border-x border-amber-950/40" />
            
            {/* Hanging Lock latch - scaled down */}
            <motion.div
              animate={isOpen ? { rotateX: 55 } : { rotateX: 0 }}
              style={{ originY: 0 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-[-2px] w-2.5 h-2 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-b border border-amber-950 z-35"
            />
          </motion.div>

          {/* Base (Bottom piece) */}
          <div className="w-10 h-5 bg-gradient-to-b from-amber-700 to-amber-900 rounded-b-sm mx-auto relative border-b border-amber-950 shadow-md z-20 -mt-[1px]">
            {/* Slat pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:8px_100%] opacity-30 rounded-b-sm" />
            
            {/* Metal bands */}
            <div className="absolute left-1.5 top-0 bottom-0 w-1 bg-gradient-to-r from-yellow-400 to-yellow-600 border-x border-amber-950/40" />
            <div className="absolute right-1.5 top-0 bottom-0 w-1 bg-gradient-to-r from-yellow-400 to-yellow-600 border-x border-amber-950/40" />

            {/* Inner glow inside drawer */}
            <div className="absolute inset-[0.5px] bg-indigo-950/30 rounded-sm overflow-hidden pointer-events-none z-15">
              {isOpen && (
                <div className="absolute inset-0 bg-cyan-400/35 blur-[1px]" />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-36 h-32 mx-auto flex items-center justify-center pointer-events-none select-none my-2">
      
      {/* 1. SPECTACULAR BACKLIGHTS & SPOTLIGHT SYSTEM */}
      {/* Ambient background blur circles */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-indigo-500/10 to-transparent rounded-full blur-3xl scale-125 pointer-events-none z-0" />
      
      {/* Rotating conic light sweep rays behind chest when open */}
      {isOpen && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          className="absolute -inset-16 pointer-events-none z-0"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(168, 85, 247, 0.22) 40deg, transparent 80deg, transparent 180deg, rgba(6, 182, 212, 0.22) 220deg, transparent 260deg, transparent 360deg)',
            maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
            mixBlendMode: 'screen'
          }}
        />
      )}

      {/* Upward spotlight cone projection */}
      <motion.div 
        initial={{ opacity: 0, height: 0, scaleX: 0.6 }}
        animate={isOpen 
          ? { opacity: [0, 0.85, 0.7, 0.85], height: 160, scaleX: 1.15 } 
          : { opacity: 0.2, height: 80, scaleX: 0.85 }
        }
        transition={{ 
          duration: 1.2, 
          ease: "easeOut",
          opacity: { repeat: Infinity, duration: 4, ease: "easeInOut" }
        }}
        className="absolute bottom-6 w-32 bg-gradient-to-t from-purple-500/25 via-cyan-500/10 to-transparent blur-md pointer-events-none z-0 origin-bottom"
        style={{
          clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
          mixBlendMode: 'screen'
        }}
      />

      {/* 2. THREE-DIMENSIONAL CHEST CONTAINER */}
      <motion.div
        animate={{
          y: isOpen ? [-2, 2, -2] : [-4, 4, -4],
          rotateY: isOpen ? [-3, 3, -3] : [-6, 6, -6],
          rotateX: isOpen ? [-1, 2, -1] : [-2, 3, -2],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative w-24 h-24 flex flex-col justify-end z-10" 
        style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}
      >
        {/* Soft shadow underneath that responds to depth */}
        <motion.div 
          animate={isOpen ? { scale: 0.9, opacity: 0.45 } : { scale: 1.05, opacity: 0.7 }}
          className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-16 h-3 bg-black/60 rounded-full blur-xs z-5"
        />

        {/* 3. LEVITATING DECRYPTED RELIC GEM / CORE (Rises when open) */}
        {isOpen && (
          <motion.div
            initial={{ y: 8, opacity: 0, scale: 0.2, rotate: 0 }}
            animate={{ 
              y: -35, 
              opacity: [0, 1, 1], 
              scale: 1, 
              rotate: 360,
            }}
            transition={{
              y: { type: "spring", stiffness: 90, damping: 11, delay: 0.25 },
              opacity: { duration: 0.4, delay: 0.25 },
              scale: { type: "spring", stiffness: 120, damping: 9, delay: 0.25 },
              rotate: { repeat: Infinity, duration: 8, ease: "linear" }
            }}
            className="absolute left-1/2 -translate-x-1/2 top-4 w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 border border-cyan-300 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.6)] z-25"
          >
            {/* Pulsing inner core */}
            <div className="absolute inset-0 bg-cyan-400/25 rounded-xl blur-[2px] animate-pulse" />
            <span className="relative z-10 text-[8px] font-sans font-black text-white tracking-widest leading-none drop-shadow-md">
              CORE
            </span>
            {/* Spinning particle halo */}
            <div className="absolute -inset-1 border border-dashed border-cyan-200/50 rounded-xl animate-[spin_12s_linear_infinite]" />
          </motion.div>
        )}

        {/* 4. CHEST LID (Pivots up and back in real 3D space) */}
        <motion.div
          animate={isOpen 
            ? { rotateX: -115, y: -18, z: 12, scaleY: 0.96 } 
            : { rotateX: 0, y: 0, z: 0, scaleY: 1 }
          }
          transition={{ 
            type: "spring", 
            stiffness: 140, 
            damping: 14, 
            mass: 1.1 
          }}
          style={{ originY: "100%", transformStyle: "preserve-3d" }}
          className="w-20 h-10 rounded-t-xl mx-auto relative shadow-md z-30 bg-gradient-to-b from-amber-600 to-amber-800 border-t border-amber-500 border-x border-amber-900"
        >
          {/* Wood slat horizontal texture ridges */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.12)_1px,transparent_1px)] bg-[size:16px_100%] opacity-40 rounded-t-xl" />
          <div className="absolute inset-y-1.5 inset-x-0 bg-black/10 border-y border-black/5" />

          {/* Golden protective corner brackets & rivets */}
          <div className="absolute left-2.5 top-0 bottom-0 w-3 bg-gradient-to-r from-yellow-300 via-yellow-450 to-yellow-500 border-x border-amber-950/40">
            <div className="absolute top-1 left-0 right-0 h-1 bg-amber-900/40 rounded-full" />
            <div className="absolute bottom-1 left-0 right-0 h-1 bg-amber-900/40 rounded-full" />
          </div>
          <div className="absolute right-2.5 top-0 bottom-0 w-3 bg-gradient-to-r from-yellow-300 via-yellow-450 to-yellow-500 border-x border-amber-950/40">
            <div className="absolute top-1 left-0 right-0 h-1 bg-amber-900/40 rounded-full" />
            <div className="absolute bottom-1 left-0 right-0 h-1 bg-amber-900/40 rounded-full" />
          </div>

          {/* Gravity-Dangling Clasp Lock plate (hangs down, swings realistically when opened) */}
          <motion.div
            animate={isOpen 
              ? { rotateX: 65, rotateZ: [0, -5, 5, 0], scale: 0.9 } 
              : { rotateX: 0, rotateZ: 0, scale: 1 }
            }
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 10, 
              delay: 0.05,
              rotateZ: { type: "tween", duration: 0.6, ease: "easeInOut" }
            }}
            style={{ originY: 0 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-[-5px] w-6 h-5 bg-gradient-to-b from-yellow-300 via-yellow-550 to-yellow-650 rounded-b border border-amber-950 flex flex-col items-center justify-center z-35 shadow-lg"
          >
            <div className="w-1.5 h-1.5 bg-slate-900 rounded-full border border-yellow-300/35" />
            <div className="w-0.5 h-1 bg-slate-900 rounded-t-sm" />
          </motion.div>
        </motion.div>

        {/* 5. CHEST BASE (Heavy bottom module with hollow glowing interior) */}
        <div 
          className="w-20 h-10 bg-gradient-to-b from-amber-800 to-amber-950 rounded-b-lg mx-auto relative border-b-2 border-amber-950 shadow-2xl z-20 -mt-[1.5px]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Wood slat details */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:16px_100%] opacity-40 rounded-b-lg" />
          
          {/* Matching golden bands */}
          <div className="absolute left-2.5 top-0 bottom-0 w-3 bg-gradient-to-r from-yellow-400 via-yellow-550 to-yellow-600 border-x border-amber-950/50" />
          <div className="absolute right-2.5 top-0 bottom-0 w-3 bg-gradient-to-r from-yellow-400 via-yellow-550 to-yellow-600 border-x border-amber-950/50" />
          
          {/* Padlock receiver shield latch (hides the lock when open) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-4 h-4 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-b-md border border-amber-950/50 flex items-center justify-center shadow-inner z-22">
            {isOpen ? (
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" style={{ backgroundColor: '#10b981' }} />
            ) : (
              <div className="w-1 h-1 bg-slate-950 rounded-full" />
            )}
          </div>

          {/* Deep digital glow from inside the drawer */}
          <div className="absolute inset-[1px] bg-indigo-950/30 rounded-md overflow-hidden pointer-events-none z-15">
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-gradient-to-t from-cyan-400/40 via-purple-500/20 to-transparent blur-xs"
              />
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
}
