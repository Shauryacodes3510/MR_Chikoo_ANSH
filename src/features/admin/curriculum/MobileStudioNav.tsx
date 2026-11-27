import React from 'react';
import { Layers } from 'lucide-react';
import { MobileStudioNavProps } from './types';

export const MobileStudioNav: React.FC<MobileStudioNavProps> = ({
  activeTab,
  setActiveTab,
  mobileNavTab,
  setMobileViewMode,
  adminWorlds = [],
  loadAdminWorlds,
  soundManager,
}) => {
  if (mobileNavTab !== 'lessons') return null;

  return (
    <div className="md:hidden sticky top-0 z-30 bg-[#f8fafc]/95 backdrop-blur-md pt-1 pb-2">
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-200/70 rounded-2xl custom-scrollbar-none">
        <button
          type="button"
          onClick={() => {
            soundManager?.play?.('click');
            setMobileViewMode('map');
          }}
          className="px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 bg-white text-indigo-700 shadow-3xs cursor-pointer"
        >
          <Layers size={13} />
          <span>🗺️ Outline Map</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager?.play?.('click');
            setActiveTab('manage');
            setMobileViewMode('editor');
          }}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'manage' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
          }`}
        >
          Unit & Lessons
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager?.play?.('click');
            setActiveTab('challenges');
            setMobileViewMode('editor');
          }}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'challenges' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
          }`}
        >
          Screen Editor
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager?.play?.('click');
            setActiveTab('worlds');
            loadAdminWorlds?.();
            setMobileViewMode('editor');
          }}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'worlds' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
          }`}
        >
          Worlds ({adminWorlds.length || 1})
        </button>
      </div>
    </div>
  );
};
