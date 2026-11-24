import React, { useState, memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from '../lib/translation/TranslationContext';
import { LanguageInfo } from '../lib/translation/languages';

interface LanguageSelectorProps {
  variant?: 'hud' | 'compact' | 'pill' | 'button' | 'embedded';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = memo(({
  variant = 'hud',
  className = ''
}) => {
  const { 
    language, 
    setLanguage, 
    languages, 
    currentLanguageInfo
  } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectLanguage = (code: string) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`} data-no-translate="true">
      {/* Trigger Button Variants */}
      {variant === 'embedded' && (
        <motion.button
          id="global-language-selector-embedded-btn"
          onClick={() => setIsOpen(prev => !prev)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1 sm:gap-1.5 cursor-pointer select-none py-1 focus:outline-none"
          title={`Language: ${currentLanguageInfo.name} (${currentLanguageInfo.nativeName})`}
          aria-label="Select language"
          aria-expanded={isOpen}
        >
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.15 }}
            transition={{ duration: 0.3 }}
            className="relative shrink-0 flex items-center justify-center text-indigo-600 dark:text-indigo-400"
          >
            <Globe className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </motion.div>
          <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1">
            <span>{currentLanguageInfo.flag}</span>
            <span className="hidden sm:inline font-sans text-xs uppercase font-black text-indigo-700 dark:text-indigo-300">
              {currentLanguageInfo.code}
            </span>
          </span>
          <ChevronDown className={`w-3 h-3 text-slate-400 dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </motion.button>
      )}

      {variant === 'hud' && (
        <motion.button
          id="global-language-selector-btn"
          onClick={() => setIsOpen(prev => !prev)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="h-10 sm:h-11 px-2.5 sm:px-3 rounded-full border border-slate-100 dark:border-slate-700/60 bg-white/80 dark:bg-[#172033]/90 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] hover:bg-white/95 dark:hover:bg-[#243149] hover:shadow-[0_12px_36px_rgba(79,70,229,0.12)] hover:border-slate-200 active:scale-95 transition-all duration-150 flex items-center gap-1.5 focus:outline-none cursor-pointer select-none"
          title={`Language: ${currentLanguageInfo.name} (${currentLanguageInfo.nativeName})`}
          aria-label="Select language"
          aria-expanded={isOpen}
        >
          <Globe className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1">
            <span>{currentLanguageInfo.flag}</span>
            <span className="hidden sm:inline font-sans text-xs uppercase font-extrabold text-indigo-700 dark:text-indigo-300">
              {currentLanguageInfo.code}
            </span>
          </span>
          <ChevronDown className={`w-3 h-3 text-slate-400 dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </motion.button>
      )}

      {variant === 'pill' && (
        <motion.button
          id="global-language-selector-pill"
          onClick={() => setIsOpen(prev => !prev)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold shadow-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer select-none"
          title="Select language"
          aria-expanded={isOpen}
        >
          <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{currentLanguageInfo.flag} {currentLanguageInfo.name}</span>
          <ChevronDown className={`w-3 h-3 text-indigo-500 dark:text-indigo-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </motion.button>
      )}

      {variant === 'compact' && (
        <motion.button
          id="global-language-selector-compact"
          onClick={() => setIsOpen(prev => !prev)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 dark:bg-slate-800/80 hover:bg-white/30 dark:hover:bg-slate-700 border border-white/20 dark:border-slate-700 text-white transition-all cursor-pointer select-none"
          title="Language Settings"
          aria-expanded={isOpen}
        >
          <Globe className="w-4 h-4" />
        </motion.button>
      )}

      {variant === 'button' && (
        <motion.button
          id="global-language-selector-button"
          onClick={() => setIsOpen(prev => !prev)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-3 py-2 rounded-xl bg-white dark:bg-[#172033] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#243149] text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer select-none"
          aria-expanded={isOpen}
        >
          <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{currentLanguageInfo.name}</span>
          <ChevronDown className={`w-3 h-3 text-slate-400 dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </motion.button>
      )}

      {/* Clean, Compact Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Transparent backdrop on mobile to prevent accidental tap through */}
            <div 
              className="fixed inset-0 z-[9998] sm:hidden" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-full mt-2 w-48 sm:w-52 bg-white/95 dark:bg-[#172033]/98 backdrop-blur-xl rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.55)] border border-slate-200/90 dark:border-[rgba(226,232,240,0.14)] z-[9999] overflow-hidden flex flex-col select-none"
            >
              {/* Dropdown Header */}
              <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-[#243149]/60">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-300 font-sans">
                  Language
                </span>
              </div>

              {/* Scrollable Language List */}
              <div className="p-1.5 max-h-64 sm:max-h-72 overflow-y-auto space-y-0.5 scrollbar-thin">
                {languages.map((lang: LanguageInfo) => {
                  const isSelected = language === lang.code;

                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between text-xs sm:text-sm transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-[#243149] font-medium'
                      }`}
                    >
                      <span className="truncate flex items-center gap-1.5">
                        <span>{lang.flag}</span>
                        <span className="font-semibold">{lang.name}</span>
                        {lang.nativeName && lang.nativeName !== lang.name && (
                          <span className="text-[11px] text-slate-400 font-normal">({lang.nativeName})</span>
                        )}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0 ml-1.5 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

LanguageSelector.displayName = 'LanguageSelector';
