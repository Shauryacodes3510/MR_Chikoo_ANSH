"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Cpu, GraduationCap, BarChart3, Trophy, Apple } from "lucide-react";

const features = [
  {
    icon: <Cpu className="w-6 h-6 text-chikoo-blue" />,
    title: "AI-Powered Lessons",
    description: "Personalized learning with AI that adapts to you.",
  },
  {
    icon: <GraduationCap className="w-6 h-6 text-chikoo-blue" />,
    title: "Interactive & Fun",
    description: "Engaging quizzes, challenges and rewards.",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-chikoo-blue" />,
    title: "Track Progress",
    description: "Real-time analytics to help you grow every day.",
  },
  {
    icon: <Trophy className="w-6 h-6 text-chikoo-blue" />,
    title: "Stay Motivated",
    description: "Earn points, climb leaderboards and unlock achievements.",
  },
];

export default function Features() {
  const handleDownloadApp = () => {
    const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = "https://play.google.com/store/apps/details?id=com.mrchikoo.learn.twa";
      return;
    }
    const link = document.createElement("a");
    link.href = "/chikoo.apk";
    link.download = "Chikoo-Learn-AI.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      window.open("https://play.google.com/store/apps/details?id=com.mrchikoo.learn.twa", "_blank");
    }, 600);
  };

  return (
    <section id="features" className="py-20 lg:py-32 bg-[#E2F0E5] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
        
        {/* Left Content */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col"
        >
          <span className="text-sm font-bold tracking-widest text-chikoo-blue uppercase mb-4">
            Smart Learning, Anytime
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-chikoo-dark mb-6 leading-tight">
            Everything You Need to <br />
            <span className="text-chikoo-blue">Learn Smarter</span>
          </h2>
          <p className="text-slate-500 mb-12 max-w-lg text-lg">
            Chikoo brings AI, interactive lessons, and real-time insights together - all in one powerful app.
          </p>

          {/* Grid of features */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 mb-12">
            {features.map((feature, idx) => (
              <div key={idx} className="flex flex-col items-start text-center sm:text-left">
                <div className="w-14 h-14 rounded-full border-2 border-blue-50 bg-white flex items-center justify-center shadow-sm shadow-blue-100/50 mb-4 mx-auto sm:mx-0">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-chikoo-dark mb-2 w-full">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* App Store Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleDownloadApp}
              className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
            >
              <Apple className="w-8 h-8 fill-white" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] leading-none mb-1">Download on the</span>
                <span className="text-lg font-semibold leading-none">App Store</span>
              </div>
            </button>
            <button
              onClick={handleDownloadApp}
              className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 2.5v19l15-9.5-15-9.5z" />
              </svg>
              <div className="flex flex-col items-start">
                <span className="text-[10px] leading-none mb-1">GET IT ON</span>
                <span className="text-lg font-semibold leading-none">Google Play</span>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Right Content (Phones) */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative h-[500px] sm:h-[600px] flex items-center justify-center lg:justify-end"
        >
          <div className="relative w-full max-w-[600px] h-[500px]">
            {/* Phone 1 (Left) */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 0 }}
              className="absolute left-[5%] top-[15%] w-[35%] aspect-[1/2] rounded-[2rem] overflow-hidden shadow-xl z-10"
            >
              <Image src="/entry 1.png" alt="App Screen" fill className="object-cover" />
            </motion.div>

            {/* Phone 2 (Center Left) */}
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: 1 }}
              className="absolute left-[25%] top-[5%] w-[38%] aspect-[1/2] rounded-[2.5rem] overflow-hidden shadow-2xl z-20 ring-4 ring-white"
            >
              <Image src="/entery 2.png" alt="App Screen" fill className="object-cover" />
            </motion.div>

            {/* Phone 3 (Center Right) */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 7, repeat: Infinity, delay: 2 }}
              className="absolute left-[50%] top-[0%] w-[38%] aspect-[1/2] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/20 z-30 ring-4 ring-white"
            >
              <Image src="/entry 3.png" alt="App Screen" fill className="object-cover" />
            </motion.div>

            {/* Phone 4 (Right) */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
              className="absolute left-[75%] top-[15%] w-[35%] aspect-[1/2] rounded-[2rem] overflow-hidden shadow-xl z-10"
            >
              <Image src="/entry 4.png" alt="App Screen" fill className="object-cover" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
