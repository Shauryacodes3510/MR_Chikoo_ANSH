import React from 'react';
import { motion } from 'framer-motion';

export default function SpaceBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full min-h-screen bg-[#050510] overflow-hidden">
      {/* Stars & Nebula Background */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506318137071-a8e063b4bae0?w=1200')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1a0b2e] via-transparent to-[#0a192f]" />
      </div>
      
      {/* Particles Overlay */}
      <div className="absolute inset-0 z-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{ x: Math.random() * 100 + 'vw', y: Math.random() * 100 + 'vh' }}
            animate={{ opacity: [0, 0.8, 0], scale: [0, 1, 0] }}
            transition={{ duration: Math.random() * 5 + 3, repeat: Infinity, delay: Math.random() * 5 }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
