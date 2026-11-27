import React from 'react';
import { motion } from 'framer-motion';

interface LandingNavbarProps {
  onExplore: () => void;
  onGetApp: () => void;
  isAuthenticated?: boolean;
}

const navLinks = [
  { name: 'Home', href: '#home' },
  { name: 'Features', href: '#features' },
  { name: 'Why Chikoo', href: '#social-proof' },
  { name: 'Download', href: '#get-chikoo' },
];

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onExplore,
  onGetApp,
  isAuthenticated = false,
}) => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 py-4 px-6 md:px-12 bg-white/85 backdrop-blur-md border-b border-slate-200/70"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2.5 group">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <img
              src="/favicon.svg"
              alt="Chikoo Logo"
              className="w-10 h-10 object-contain transition-transform group-hover:scale-105"
            />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#1E3A8A]">
            Chikoo
          </span>
        </a>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExplore}
            className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all active:scale-95 cursor-pointer"
          >
            {isAuthenticated ? 'Open App' : 'Explore'}
          </button>
          <button
            onClick={onGetApp}
            className="px-6 py-2.5 rounded-full bg-[#3B82F6] text-white font-semibold text-sm hover:bg-[#1D4ED8] transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 cursor-pointer"
          >
            Get App
          </button>
        </div>
      </div>
    </motion.header>
  );
};
