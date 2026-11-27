import React, { memo, useCallback } from 'react';
import { LandingNavbar } from './landing/LandingNavbar';
import { LandingHero } from './landing/LandingHero';
import { LandingFeatures } from './landing/LandingFeatures';
import { LandingSocialProof } from './landing/LandingSocialProof';
import { LandingBottomCTA } from './landing/LandingBottomCTA';
import { LandingFooter } from './landing/LandingFooter';
import { soundManager } from '../../lib/sounds';

interface DesktopLandingPageProps {
  onStartAdventure: () => void;
  onSignIn: () => void;
  onContinueToApp?: () => void;
  isAuthenticated?: boolean;
  username?: string;
  onNavigateSeo?: (path: string) => void;
}

export const DesktopLandingPage = memo(function DesktopLandingPage({
  onStartAdventure,
  onSignIn,
  onContinueToApp,
  isAuthenticated = false,
  username = 'Explorer',
  onNavigateSeo,
}: DesktopLandingPageProps) {

  const handleGetApp = useCallback(() => {
    try {
      soundManager.play('click');
    } catch (_) {}

    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = 'https://play.google.com/store/apps/details?id=com.mrchikoo.learn.twa';
      return;
    }

    // Direct APK download fallback
    const link = document.createElement('a');
    link.href = '/chikoo.apk';
    link.download = 'Chikoo-Learn-AI.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Also open Play Store link
    setTimeout(() => {
      window.open('https://play.google.com/store/apps/details?id=com.mrchikoo.learn.twa', '_blank');
    }, 600);
  }, []);

  const handleExplore = useCallback(() => {
    try {
      soundManager.play('click');
    } catch (_) {}

    const isLearnDomain = typeof window !== 'undefined' && (
      window.location.hostname === 'learn.mrchikoo.com' ||
      window.location.hostname.startsWith('learn.') ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );

    if (isLearnDomain) {
      if (isAuthenticated && onContinueToApp) {
        onContinueToApp();
      } else {
        onStartAdventure();
      }
    } else {
      window.location.href = 'https://learn.mrchikoo.com';
    }
  }, [isAuthenticated, onContinueToApp, onStartAdventure]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-blue-500/20 overflow-x-hidden">
      {/* 1. Sticky Navigation Bar */}
      <LandingNavbar
        onExplore={handleExplore}
        onGetApp={handleGetApp}
        isAuthenticated={isAuthenticated}
      />

      {/* 2. Hero Section with Clouds, Skyline & Mascot */}
      <LandingHero
        onExplore={handleExplore}
        onGetApp={handleGetApp}
      />

      {/* 3. Features Section with Interactive Phone Showcases */}
      <LandingFeatures
        onGetApp={handleGetApp}
      />

      {/* 4. Social Proof & Statistics */}
      <LandingSocialProof />

      {/* 5. Bottom Call to Action */}
      <LandingBottomCTA
        onExplore={handleExplore}
        onGetApp={handleGetApp}
      />

      {/* 6. Footer */}
      <LandingFooter
        onExplore={handleExplore}
      />
    </div>
  );
});

export default DesktopLandingPage;
