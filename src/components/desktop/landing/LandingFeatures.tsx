import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, GraduationCap, BarChart3, Trophy, Apple } from 'lucide-react';

interface LandingFeaturesProps {
  onGetApp: () => void;
}

const features = [
  {
    icon: <Cpu className="w-6 h-6 text-blue-600" />,
    title: 'AI-Powered Lessons',
    description: 'Personalized learning with AI that adapts to your curiosity and pace.',
  },
  {
    icon: <GraduationCap className="w-6 h-6 text-blue-600" />,
    title: 'Interactive & Fun',
    description: 'Engaging real-world quests, challenges, and instant gamified rewards.',
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
    title: 'Track Progress',
    description: 'Real-time analytics and skill trees to help you grow every single day.',
  },
  {
    icon: <Trophy className="w-6 h-6 text-blue-600" />,
    title: 'Stay Motivated',
    description: 'Earn points, climb student leaderboards and unlock rare achievements.',
  },
];

export const LandingFeatures: React.FC<LandingFeaturesProps> = ({ onGetApp }) => {
  return (
    <section id="features" className="py-20 lg:py-32 bg-[#E2F0E5] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
        {/* Left Content */}
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-4">
            Smart Learning, Anytime
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            Everything You Need to <br />
            <span className="text-blue-600">Learn Smarter</span>
          </h2>
          <p className="text-slate-600 mb-12 max-w-lg text-lg">
            Chikoo brings AI, interactive lessons, and real-time insights together - all in one powerful app.
          </p>

          {/* Grid of features */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 mb-12">
            {features.map((feature, idx) => (
              <div key={idx} className="flex flex-col items-start text-left">
                <div className="w-14 h-14 rounded-2xl border-2 border-blue-50 bg-white flex items-center justify-center shadow-sm shadow-blue-100/50 mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 w-full">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* App Store Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onGetApp}
              className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
            >
              <Apple className="w-7 h-7 fill-white" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-slate-300 leading-none mb-1">Download on the</span>
                <span className="text-base font-bold leading-none">App Store</span>
              </div>
            </button>
            <button
              onClick={onGetApp}
              className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 2.5v19l15-9.5-15-9.5z" />
              </svg>
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-slate-300 leading-none mb-1">GET IT ON</span>
                <span className="text-base font-bold leading-none">Google Play</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Content (Phones) */}
        <div className="relative h-[480px] sm:h-[580px] flex items-center justify-center lg:justify-end">
          <div className="relative w-full max-w-[580px] h-[480px]">
            {/* Phone 1 (Left) */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 0 }}
              className="absolute left-[2%] top-[15%] w-[35%] aspect-[1/2] rounded-[2rem] overflow-hidden shadow-xl z-10"
            >
              <img src="/entry 1.png" alt="App Screen" className="w-full h-full object-cover" />
            </motion.div>

            {/* Phone 2 (Center Left) */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: 1 }}
              className="absolute left-[22%] top-[5%] w-[38%] aspect-[1/2] rounded-[2.5rem] overflow-hidden shadow-2xl z-20 ring-4 ring-white"
            >
              <img src="/entery 2.png" alt="App Screen" className="w-full h-full object-cover" />
            </motion.div>

            {/* Phone 3 (Center Right) */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 7, repeat: Infinity, delay: 2 }}
              className="absolute left-[47%] top-[0%] w-[38%] aspect-[1/2] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/20 z-30 ring-4 ring-white"
            >
              <img src="/entry 3.png" alt="App Screen" className="w-full h-full object-cover" />
            </motion.div>

            {/* Phone 4 (Right) */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
              className="absolute left-[70%] top-[15%] w-[35%] aspect-[1/2] rounded-[2rem] overflow-hidden shadow-xl z-10"
            >
              <img src="/entry 4.png" alt="App Screen" className="w-full h-full object-cover" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
