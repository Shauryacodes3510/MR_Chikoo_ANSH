import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download, Star } from 'lucide-react';

interface LandingHeroProps {
  onExplore: () => void;
  onGetApp: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onExplore, onGetApp }) => {
  return (
    <section id="home" className="relative pt-32 pb-32 lg:pt-48 lg:pb-48 overflow-hidden bg-[#9FE1FF]">
      {/* Cloud SVG decorations */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        {/* Top Left Cloud */}
        <svg
          className="absolute top-[10%] left-[-5%] w-[300px] h-[150px] opacity-25"
          viewBox="0 0 24 24"
          fill="#ffffff"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1465 20.1989 10.2144 17.8967 10.0219C17.3888 6.62103 14.4751 4 11 4C7.13401 4 4 7.13401 4 11C4 11.2335 4.01138 11.464 4.03362 11.6907C2.28588 12.3396 1 14.0205 1 16C1 18.2091 2.79086 20 5 20H17.5V19Z" />
        </svg>
        {/* Top Right Cloud */}
        <svg
          className="absolute top-[5%] right-[5%] w-[400px] h-[200px] opacity-25"
          viewBox="0 0 24 24"
          fill="#ffffff"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1465 20.1989 10.2144 17.8967 10.0219C17.3888 6.62103 14.4751 4 11 4C7.13401 4 4 7.13401 4 11C4 11.2335 4.01138 11.464 4.03362 11.6907C2.28588 12.3396 1 14.0205 1 16C1 18.2091 2.79086 20 5 20H17.5V19Z" />
        </svg>

        {/* Cityscape Silhouette */}
        <div className="absolute bottom-0 left-0 w-full h-[30%] opacity-15 bg-repeat-x flex items-end">
          <div className="w-32 h-[80%] bg-white mx-2 rounded-t-lg"></div>
          <div className="w-48 h-[60%] bg-white mx-2 rounded-t-lg"></div>
          <div className="w-24 h-[90%] bg-white mx-2 rounded-t-lg"></div>
          <div className="w-56 h-[70%] bg-white mx-2 rounded-t-lg"></div>
          <div className="w-40 h-[100%] bg-white mx-2 rounded-t-lg"></div>
          <div className="w-32 h-[60%] bg-white mx-2 rounded-t-lg"></div>
          <div className="w-64 h-[80%] bg-white mx-2 rounded-t-lg"></div>
        </div>
      </div>

      {/* Wavy bottom divider */}
      <div className="absolute bottom-[-1px] left-0 w-full z-20 overflow-hidden leading-none pointer-events-none">
        <svg
          className="relative block w-full h-[50px] lg:h-[120px]"
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,126.68,198.71,121.7,243.68,118.3,284.22,96.34,321.39,56.44Z"
            fill="#E2F0E5"
          ></path>
        </svg>
      </div>

      {/* Chikoo bag on left curve */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute bottom-[-70px] lg:bottom-[-120px] left-[0%] lg:left-[7%] w-[180px] lg:w-[260px] z-30 origin-bottom pointer-events-none"
      >
        <img
          src="/chikoo bag.png"
          alt="Chikoo Character"
          className="w-full h-auto object-bottom drop-shadow-md"
        />
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-col items-start"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/90 backdrop-blur-sm border border-blue-100 mb-8 shadow-sm">
            <span className="text-xs font-bold tracking-wide text-blue-700 uppercase">
              AI-Powered Learning Platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6">
            Master AI <br />
            with <span className="text-[#1D4ED8]">Chikoo</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg lg:text-xl text-slate-700 mb-10 max-w-lg leading-relaxed font-medium">
            The AI teaching platform for students that makes learning interactive, fast and full of fun!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-12 w-full sm:w-auto">
            <button
              onClick={onExplore}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#3B82F6] text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#1D4ED8] transition-all hover:shadow-xl hover:shadow-blue-500/30 active:scale-95 group cursor-pointer"
            >
              Start Learning Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onGetApp}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-800 font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-50 transition-all border border-slate-200 hover:border-slate-300 shadow-sm active:scale-95 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Download className="w-4 h-4 text-blue-600" />
              </div>
              Get App
            </button>
          </div>

          {/* Social Proof / Reviews */}
          <div className="flex items-center gap-6">
            {/* Avatars */}
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-11 h-11 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=chikooStudent${i + 15}`}
                    alt="Student Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <span className="font-extrabold text-slate-900 text-sm">4.9/5</span>
              </div>
              <p className="text-xs text-slate-700 font-semibold">
                Loved by 10,000+ students & schools
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Content (Mascot) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="relative h-[480px] lg:h-[650px] flex items-center justify-center"
        >
          {/* Floating Mascot */}
          <motion.div
            animate={{ y: [-15, 15, -15] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10 w-full max-w-[480px] aspect-square flex items-center justify-center"
          >
            <img
              src="/main.png"
              alt="Chikoo Mascot"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </motion.div>

          {/* Pedestal */}
          <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[80%] max-w-[400px] aspect-[3/1] bg-gradient-to-b from-blue-100 to-transparent rounded-[100%] blur-md -z-10"></div>
          <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[70%] max-w-[350px] h-[30px] rounded-[100%] border-4 border-blue-200 bg-white shadow-xl -z-10"></div>
          <div className="absolute bottom-[3%] left-1/2 -translate-x-1/2 w-[75%] max-w-[400px] h-[30px] rounded-[100%] border-2 border-blue-100 bg-blue-100/50 -z-20"></div>
        </motion.div>
      </div>
    </section>
  );
};
