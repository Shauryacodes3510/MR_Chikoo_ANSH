import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  LogOut, 
  GraduationCap, 
  Building2, 
  ChevronRight,
  Shield,
  Compass
} from 'lucide-react';
import { soundManager } from '../../lib/sounds';
import { useTranslation } from '../../lib/translation/TranslationContext';

// WebP icons for authentic Chikoo styling
import homeIcon from '@/home_icon.webp';
import practiceIcon from '@/practice_icon.webp';
import ranksIcon from '@/leaderboard_icon.webp';
import rewardsIcon from '@/chest1.webp';
import questIcon from '@/Quest.webp';
import avatarIcon from '@/avatar.webp';
import SmoothImg from '../ui/SmoothImg';

interface DesktopLeftSidebarProps {
  view: string;
  setView: (view: any) => void;
  username: string;
  selectedAvatarId?: string;
  spaceTitle?: string;
  isDbAdmin?: boolean;
  onAdminClick?: () => void;
  isSchoolAccount?: boolean;
  schoolInfo?: any;
  onOpenSchoolAdmin?: () => void;
  onSignOutClick: () => void;
  hasUnclaimedDailyChallenge?: boolean;
  hasUnclaimedDailyChest?: boolean;
  onVisitLanding?: () => void;
  className?: string;
}

export const DesktopLeftSidebar = memo(function DesktopLeftSidebar({
  view,
  setView,
  username,
  selectedAvatarId = 'chikoo-default',
  spaceTitle = 'AI Space Explorer',
  isDbAdmin = false,
  onAdminClick,
  isSchoolAccount = false,
  schoolInfo,
  onOpenSchoolAdmin,
  onSignOutClick,
  hasUnclaimedDailyChallenge = false,
  hasUnclaimedDailyChest = false,
  onVisitLanding,
  className = ''
}: DesktopLeftSidebarProps) {
  const { t } = useTranslation();
  
  const navItems = [
    {
      id: 'tour-desktop-home',
      viewKey: 'home',
      label: t('navigation.map', 'Adventure Map'),
      badgeText: null,
      badgeDot: false,
      icon: homeIcon,
      activeColor: 'text-sky-600 bg-sky-500/10 border-sky-400/40 shadow-[0_2px_10px_rgba(14,165,233,0.12)]'
    },
    {
      id: 'tour-desktop-practice',
      viewKey: 'arena',
      label: t('navigation.practice', 'Battle Arena'),
      badgeText: null,
      badgeDot: false,
      icon: practiceIcon,
      activeColor: 'text-amber-500 bg-amber-500/10 border-amber-400/40 shadow-[0_2px_10px_rgba(245,158,11,0.12)]'
    },
    {
      id: 'tour-desktop-leaderboard',
      viewKey: 'leaderboard',
      label: t('navigation.leaderboard', 'Leaderboard'),
      badgeText: null,
      badgeDot: false,
      icon: ranksIcon,
      activeColor: 'text-amber-600 bg-amber-500/10 border-amber-400/40 shadow-[0_2px_10px_rgba(245,158,11,0.12)]'
    },
    {
      id: 'tour-desktop-quests',
      viewKey: 'quests',
      label: t('navigation.quests', 'Daily Quests'),
      badgeText: hasUnclaimedDailyChest ? 'GIFT' : null,
      badgeDot: hasUnclaimedDailyChest,
      icon: questIcon,
      activeColor: 'text-indigo-600 bg-indigo-500/10 border-indigo-400/40 shadow-[0_2px_10px_rgba(99,102,241,0.12)]'
    },
    {
      id: 'tour-desktop-rewards',
      viewKey: 'rewards_store',
      label: t('navigation.rewards', 'Rewards Store'),
      badgeText: null,
      badgeDot: false,
      icon: rewardsIcon,
      activeColor: 'text-purple-600 bg-purple-500/10 border-purple-400/40 shadow-[0_2px_10px_rgba(168,85,247,0.12)]'
    },
    {
      id: 'tour-desktop-profile',
      viewKey: 'profile',
      label: t('navigation.profile', 'Player Profile'),
      badgeText: null,
      badgeDot: false,
      icon: avatarIcon,
      activeColor: 'text-rose-600 bg-rose-500/10 border-rose-400/40 shadow-[0_2px_10px_rgba(244,63,94,0.12)]'
    }
  ];

  const isRewardsView = view === 'rewards_store' || view === 'rewards';

  const handleNavClick = (targetView: string) => {
    soundManager.play('click');
    setView(targetView);
  };

  return (
    <aside 
      aria-label="Desktop Navigation Sidebar"
      className={`flex flex-col h-full select-none transition-colors duration-300 z-30 ${
        isRewardsView 
          ? 'bg-black text-white border-r border-white/[0.08]' 
          : 'bg-white dark:bg-[#0c101d] text-slate-800 dark:text-slate-100 border-r border-slate-200/90 dark:border-slate-800'
      } ${className}`}
    >
      {/* 1. TOP BRANDING / LOGO HEADER */}
      <div className={`p-5 pb-4 border-b flex items-center justify-between transition-colors ${
        isRewardsView ? 'border-white/10' : 'border-slate-100 dark:border-slate-800'
      }`}>
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
        >
          {/* Mascot character badge */}
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-500 to-indigo-500 p-0.5 shadow-md group-hover:scale-105 transition-transform duration-200">
            <div className={`w-full h-full rounded-[14px] flex items-center justify-center overflow-hidden ${
              isRewardsView ? 'bg-slate-900' : 'bg-white dark:bg-slate-900'
            }`}>
              <SmoothImg 
                src="/Aibo_sneak.webp" 
                alt="Chikoo" 
                className="w-9 h-9 object-contain group-hover:rotate-6 transition-transform duration-200"
              />
            </div>
            {/* Online Pulse Dot */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className={`font-display font-black text-xl tracking-wider leading-none ${
                isRewardsView ? 'text-white' : 'text-slate-800 dark:text-white'
              }`}>
                CHIKOO
              </h1>
              <span className="px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[9px] font-black tracking-widest uppercase font-mono">
                AI
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wide mt-0.5">
              Learning Adventure
            </p>
          </div>
        </button>
      </div>

      {/* 2. NAVIGATION DESTINATIONS (ALWAYS VISIBLE) */}
      <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto scrollbar-hide">
        <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {t('navigation.explore_world', 'Explore World')}
        </div>

        {navItems.map((item, nIdx) => {
          const isBattleArenaActive = (item.viewKey === 'arena' || item.viewKey === 'practice') && (view === 'arena' || view === 'practice' || view === 'knowledge-arena');
          const isActive = view === item.viewKey || isBattleArenaActive;

          return (
            <button
              key={`desktop-nav-${item.viewKey}-${nIdx}`}
              id={item.id}
              onClick={() => handleNavClick(item.viewKey)}
              className={`w-full group relative flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-left font-display text-sm tracking-wide transition-all duration-150 cursor-pointer border-2 ${
                isActive
                  ? item.viewKey === 'rewards_store' && isRewardsView
                    ? 'text-purple-300 bg-purple-950/70 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] font-black'
                    : `${item.activeColor} font-black`
                  : isRewardsView
                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.06] border-transparent font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border-transparent font-bold'
              }`}
            >
              {/* Left active marker indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute left-1 w-1.5 h-6 bg-sky-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}

              {/* Icon */}
              <div className="relative flex-shrink-0 w-7 h-7 flex items-center justify-center">
                <SmoothImg 
                  src={item.icon} 
                  alt="" 
                  className={`w-7 h-7 object-contain transition-transform duration-150 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110 opacity-85 group-hover:opacity-100'
                  }`}
                />
                {item.badgeDot && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white ring-1 ring-amber-400" />
                )}
              </div>

              {/* Label */}
              <span className="flex-1 truncate">
                {item.label}
              </span>

              {/* Badge (if any) */}
              {item.badgeText && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[9px] uppercase tracking-wider shadow-sm">
                  {item.badgeText}
                </span>
              )}
            </button>
          );
        })}

        {/* 3. PORTAL / SPECIAL ACTIONS (ADMIN & SCHOOL) */}
        {(isSchoolAccount || isDbAdmin) && (
          <div className="pt-4 mt-2 border-t border-slate-100 space-y-1.5">
            <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t('navigation.special_portals', 'Special Portals')}
            </div>

            {isSchoolAccount && schoolInfo && schoolInfo.status === 'active' && onOpenSchoolAdmin && (
              <button
                onClick={() => {
                  soundManager.play('click');
                  onOpenSchoolAdmin();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left text-xs font-bold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/50 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                  <GraduationCap size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-black">{t('navigation.school_portal', 'School Portal')}</p>
                  <p className="text-[10px] text-indigo-500 truncate">{schoolInfo.name || 'Academy'}</p>
                </div>
                <ChevronRight size={14} className="text-indigo-400" />
              </button>
            )}

            {isDbAdmin && onAdminClick && (
              <button
                onClick={() => {
                  soundManager.play('complete');
                  onAdminClick();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left text-xs font-bold text-purple-700 bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200/50 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-black">{t('navigation.creator_studio', 'Creator Studio')}</p>
                  <p className="text-[10px] text-purple-500 truncate">Course & DB Admin</p>
                </div>
                <ChevronRight size={14} className="text-purple-400" />
              </button>
            )}
          </div>
        )}

        {onVisitLanding && (
          <div className="pt-2 px-1">
            <button
              type="button"
              id="desktop-sidebar-universe-hub-btn"
              onClick={() => {
                soundManager.play('click');
                onVisitLanding();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left text-xs font-bold text-slate-500 hover:text-sky-600 hover:bg-sky-50/60 border border-slate-200/60 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Compass size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-extrabold text-slate-700">{t('navigation.universe_overview', 'Universe Overview')}</p>
                <p className="text-[10px] text-slate-400 truncate">Explore & Curriculum</p>
              </div>
              <ChevronRight size={13} className="text-slate-300" />
            </button>
          </div>
        )}
      </nav>

      {/* 4. BOTTOM USER PROFILE & SESSION HUB */}
      <div className={`p-3.5 border-t transition-colors ${
        isRewardsView ? 'border-white/10 bg-[#070815]' : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40'
      }`}>
        <div className={`flex items-center justify-between gap-2.5 p-2 rounded-2xl border shadow-xs transition-colors ${
          isRewardsView ? 'bg-[#03040a] border-white/10 text-white' : 'bg-white dark:bg-[#13192b] border-slate-200/70 dark:border-slate-800 text-slate-800 dark:text-white'
        }`}>
          <button
            onClick={() => handleNavClick('profile')}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className={`relative w-9 h-9 rounded-xl border overflow-hidden flex-shrink-0 flex items-center justify-center ${
              isRewardsView ? 'bg-slate-800 border-white/10' : 'bg-sky-100 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800'
            }`}>
              <SmoothImg 
                src="/avatar.webp" 
                alt="Avatar" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`font-display font-black text-xs truncate leading-tight ${
                isRewardsView ? 'text-white' : 'text-slate-800 dark:text-white'
              }`}>
                {username || t('profile.cadet', 'Space Cadet')}
              </p>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate">
                {spaceTitle}
              </p>
            </div>
          </button>

          {/* Quick Sign Out Trigger */}
          <button
            onClick={() => {
              soundManager.play('click');
              onSignOutClick();
            }}
            title={t('navigation.sign_out', 'Sign Out')}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer flex-shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
});

