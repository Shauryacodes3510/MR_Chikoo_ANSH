import React from 'react';
import { motion } from 'framer-motion';
import { Apple, ArrowRight } from 'lucide-react';

interface LandingBottomCTAProps {
  onExplore: () => void;
  onGetApp: () => void;
}

export const LandingBottomCTA: React.FC<LandingBottomCTAProps> = ({ onExplore, onGetApp }) => {
  return (
    <section id="get-chikoo" className="relative bg-[#1A3673] overflow-hidden pt-20">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg viewBox="0 0 1440 320" className="absolute top-0 w-full" preserveAspectRatio="none">
          <path
            fill="#ffffff"
            fillOpacity="1"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          ></path>
        </svg>
      </div>

      {/* Floating stars */}
      <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-white/30 rounded-full animate-ping"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-12 relative z-10">
        {/* Left Content */}
        <div className="pb-20 lg:pb-32 flex flex-col justify-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight"
          >
            Start Your AI Learning <br /> Journey Today!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-blue-100 mb-8 max-w-md text-lg leading-relaxed"
          >
            Join thousands of students learning smarter with Chikoo - your AI study buddy.
          </motion.p>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <button
              onClick={onExplore}
              className="px-8 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-base flex items-center gap-2 shadow-lg hover:shadow-blue-500/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Start Web App
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* App Store Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-4"
          >
            <button
              onClick={onGetApp}
              className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition-all hover:scale-105 active:scale-95 border border-white/10 shadow-xl cursor-pointer"
            >
              <Apple className="w-7 h-7 fill-white" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-gray-300 leading-none mb-1">Download on the</span>
                <span className="text-base font-bold leading-none">App Store</span>
              </div>
            </button>
            <button
              onClick={onGetApp}
              className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition-all hover:scale-105 active:scale-95 border border-white/10 shadow-xl cursor-pointer"
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 2.5v19l15-9.5-15-9.5z" />
              </svg>
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-gray-300 leading-none mb-1">GET IT ON</span>
                <span className="text-base font-bold leading-none">Google Play</span>
              </div>
            </button>
          </motion.div>
        </div>

        {/* Right Side Image */}
        <div className="relative h-full min-h-[380px] flex items-center justify-center lg:justify-end pb-10 lg:pb-0">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.3 }}
            className="relative w-[90%] max-w-sm aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl ring-8 ring-white/10"
          >
            <img
              src="/download chikoo.png"
              alt="Download Chikoo"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
