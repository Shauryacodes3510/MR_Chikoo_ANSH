import React, { useState, useEffect } from 'react';
import WhatIsChikooPage from './WhatIsChikooPage';
import UnitsDirectoryPage from './UnitsDirectoryPage';
import UnitDetailPage from './UnitDetailPage';
import LessonDetailPage from './LessonDetailPage';
import FeaturesDirectoryPage from './FeaturesDirectoryPage';
import FeatureDetailPage from './FeatureDetailPage';
import LearnDirectoryPage from './LearnDirectoryPage';
import LearnArticlePage from './LearnArticlePage';
import PrivacyPolicyPage from '../legal/PrivacyPolicyPage';
import AccountDeletionPage from '../legal/AccountDeletionPage';
import { 
  getAllSeoUnits, 
  getSeoUnitBySlug, 
  getSeoLesson, 
  getSeoFeatureBySlug, 
  getSeoTopicBySlug 
} from '../../lib/seoRegistry';
import { Module } from '../../lib/curriculumTypes';

interface SeoPageRouterProps {
  dynamicModules?: Module[];
  onLaunchApp: (target?: { view?: string; unitId?: string; lessonId?: string }) => void;
}

export default function SeoPageRouter({ dynamicModules, onLaunchApp }: SeoPageRouterProps) {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const path = currentPath.toLowerCase().replace(/\/+$/, '') || '/';

  // Privacy Policy & Account Deletion Public Legal Routes
  if (path === '/privacy-policy') {
    return <PrivacyPolicyPage onLaunchApp={() => onLaunchApp()} />;
  }
  if (path === '/delete-account') {
    return <AccountDeletionPage onLaunchApp={() => onLaunchApp()} />;
  }

  // 1. What is Chikoo
  if (path === '/what-is-chikoo' || path === '/about') {
    return <WhatIsChikooPage onLaunchApp={() => onLaunchApp()} />;
  }

  // 2. Units Directory
  if (path === '/units') {
    return <UnitsDirectoryPage dynamicModules={dynamicModules} onLaunchApp={onLaunchApp} />;
  }

  // 3. Unit or Lesson Detail: /units/:unitSlug or /units/:unitSlug/lessons/:lessonSlug
  if (path.startsWith('/units/')) {
    const parts = path.split('/').filter(Boolean); // ['units', 'unit-slug', 'lessons', 'lesson-slug']
    if (parts.length === 2) {
      const unitSlug = parts[1];
      const unit = getSeoUnitBySlug(unitSlug, dynamicModules);
      if (unit) {
        return <UnitDetailPage unit={unit} onLaunchApp={onLaunchApp} />;
      }
    } else if (parts.length === 4 && parts[2] === 'lessons') {
      const unitSlug = parts[1];
      const lessonSlug = parts[3];
      const unit = getSeoUnitBySlug(unitSlug, dynamicModules);
      const lesson = getSeoLesson(unitSlug, lessonSlug, dynamicModules);
      if (unit && lesson) {
        return <LessonDetailPage unit={unit} lesson={lesson} onLaunchApp={onLaunchApp} />;
      }
    }
    // Fallback if not found: show units directory
    return <UnitsDirectoryPage dynamicModules={dynamicModules} onLaunchApp={onLaunchApp} />;
  }

  // 4. Features Directory or Feature Detail
  if (path === '/features') {
    return <FeaturesDirectoryPage onLaunchApp={onLaunchApp} />;
  }
  if (path.startsWith('/features/')) {
    const parts = path.split('/').filter(Boolean);
    const featureSlug = parts[1];
    const feature = getSeoFeatureBySlug(featureSlug);
    if (feature) {
      return <FeatureDetailPage feature={feature} onLaunchApp={onLaunchApp} />;
    }
    return <FeaturesDirectoryPage onLaunchApp={onLaunchApp} />;
  }

  // 5. Learn Directory or Article Detail
  if (path === '/learn') {
    return <LearnDirectoryPage onLaunchApp={() => onLaunchApp()} />;
  }
  if (path.startsWith('/learn/')) {
    const parts = path.split('/').filter(Boolean);
    const topicSlug = parts[1];
    const article = getSeoTopicBySlug(topicSlug);
    if (article) {
      return <LearnArticlePage article={article} onLaunchApp={onLaunchApp} />;
    }
    return <LearnDirectoryPage onLaunchApp={() => onLaunchApp()} />;
  }

  // Not an SEO route -> return null so normal app renders
  return null;
}
