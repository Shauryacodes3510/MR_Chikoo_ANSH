import React, { memo } from 'react';
import ArenaPage from '../features/arena/pages/ArenaPage';

interface PracticeArenaDashboardProps {
  onBack?: () => void;
  [key: string]: any;
}

export function PracticeArenaDashboard({ onBack }: PracticeArenaDashboardProps) {
  return <ArenaPage onBack={onBack} />;
}

export default memo(PracticeArenaDashboard);
