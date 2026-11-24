import React, { useState } from 'react';
import { useCelebration, CelebrationEvent, CelebrationAsset, CelebrationSettings } from './CelebrationProvider';
import { 
  Plus, Trash2, Play, Save, Check, X, Sparkles, Sliders, 
  FolderOpen, Image as ImageIcon, ToggleLeft, ToggleRight, 
  SlidersHorizontal, Settings2, Edit, CheckCircle, Info, HelpCircle,
  Trophy, Star, Zap, Lock, Award
} from 'lucide-react';
import { soundManager, enterFullscreen, exitFullscreen } from '../lib/sounds';
import CelebrationOverlay from './CelebrationOverlay';

export default function CelebrationCenter() {
  const { 
    events, assets, settings, activeCelebration, triggerCelebration,
    addEvent, updateEvent, deleteEvent, addAsset, deleteAsset, updateSettings 
  } = useCelebration();

  const [activeSubTab, setActiveSubTab] = useState<'events' | 'animations' | 'preview' | 'assets' | 'settings'>('preview');

  // Event Edit State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editReward, setEditReward] = useState('');
  const [editAnim, setEditAnim] = useState<CelebrationEvent['animationType']>('confetti');
  const [editCategory, setEditCategory] = useState<CelebrationEvent['category']>('medium');
  const [editDuration, setEditDuration] = useState(3000);
  const [editTrigger, setEditTrigger] = useState<CelebrationEvent['triggerType']>('challenge_complete');
  const [editAssetUrl, setEditAssetUrl] = useState('⭐');

  // New Event Creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newReward, setNewReward] = useState('');
  const [newAnim, setNewAnim] = useState<CelebrationEvent['animationType']>('confetti');
  const [newCategory, setNewCategory] = useState<CelebrationEvent['category']>('medium');
  const [newDuration, setNewDuration] = useState(3000);
  const [newTrigger, setNewTrigger] = useState<CelebrationEvent['triggerType']>('challenge_complete');
  const [newAssetUrl, setNewAssetUrl] = useState('⭐');

  // New Asset Creation state
  const [showCreateAsset, setShowCreateAsset] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState<CelebrationAsset['type']>('badge');
  const [newAssetLocation, setNewAssetLocation] = useState('');

  // Preview Studio state
  const [previewEventId, setPreviewEventId] = useState(events[0]?.id || 'e1');
  const [previewAnimOverride, setPreviewAnimOverride] = useState<CelebrationEvent['animationType'] | 'default'>('default');
  const [previewAssetOverride, setPreviewAssetOverride] = useState<string | 'default'>('default');

  const startEditing = (evt: CelebrationEvent) => {
    soundManager.play('click');
    setEditingEventId(evt.id);
    setEditName(evt.name);
    setEditTitle(evt.title);
    setEditDesc(evt.description);
    setEditReward(evt.rewardText);
    setEditAnim(evt.animationType);
    setEditCategory(evt.category);
    setEditDuration(evt.duration);
    setEditTrigger(evt.triggerType);
    setEditAssetUrl(evt.assetUrl || '⭐');
  };

  const saveEditedEvent = () => {
    if (!editingEventId) return;
    soundManager.play('complete');
    
    const updated: CelebrationEvent = {
      id: editingEventId,
      name: editName,
      title: editTitle,
      description: editDesc,
      rewardText: editReward,
      animationType: editAnim,
      category: editCategory,
      duration: editDuration,
      triggerType: editTrigger,
      enabled: events.find(e => e.id === editingEventId)?.enabled ?? true,
      assetUrl: editAssetUrl
    };

    updateEvent(updated);
    setEditingEventId(null);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newTitle) return;
    soundManager.play('complete');

    const created: CelebrationEvent = {
      id: 'e_' + Date.now(),
      name: newName,
      title: newTitle,
      description: newDesc,
      rewardText: newReward,
      animationType: newAnim,
      category: newCategory,
      duration: newDuration,
      triggerType: newTrigger,
      enabled: true,
      assetUrl: newAssetUrl
    };

    addEvent(created);
    setShowCreateForm(false);
    
    // Clear form
    setNewName('');
    setNewTitle('');
    setNewDesc('');
    setNewReward('');
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName || !newAssetLocation) return;
    soundManager.play('complete');

    const created: CelebrationAsset = {
      id: 'a_' + Date.now(),
      name: newAssetName,
      type: newAssetType,
      url: newAssetLocation
    };

    addAsset(created);
    setShowCreateAsset(false);
    setNewAssetName('');
    setNewAssetLocation('');
  };

  const launchPreview = () => {
    soundManager.play('complete');
    
    const baseEvent = events.find(e => e.id === previewEventId);
    if (!baseEvent) return;

    // Build custom overrides
    const customProps: Partial<CelebrationEvent> = {};
    if (previewAnimOverride !== 'default') {
      customProps.animationType = previewAnimOverride;
    }
    if (previewAssetOverride !== 'default') {
      customProps.assetUrl = previewAssetOverride;
    }

    triggerCelebration(baseEvent.id, customProps);
  };

  return (
    <div className="bg-white/80 dark:bg-[#172033]/90 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800 p-5.5 space-y-6 shadow-sm transition-colors">
      {/* Celebration Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
        <div>
          <span className="bg-violet-100 dark:bg-violet-950/60 text-violet-750 dark:text-violet-300 font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-1.5 shadow-sm border border-violet-200/40 dark:border-violet-700/50">
            CELEBRATION CENTER 🏅
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Live Event & Celebration System
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-300 font-bold mt-1 max-w-lg">
            Make learning feel alive! Configure animated triggers, review PNG assets, live-preview any particle effect, and inject social gaming alerts.
          </p>
        </div>

        <button
          onClick={() => {
            soundManager.play('complete');
            enterFullscreen();
            triggerCelebration('e7'); // Fire epic battle win immediately to show off
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_14px_rgba(124,58,237,0.3)] flex items-center gap-1.5 shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Sparkles size={13} className="text-amber-300 animate-pulse fill-current" />
          <span>Fire Live Victory!</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs inside Creator Mode */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/30">
        <button
          onClick={() => { soundManager.play('click'); setActiveSubTab('preview'); }}
          className={`flex-1 min-w-[90px] py-2 px-3 text-2xs font-extrabold uppercase tracking-widest rounded-xl transition-all ${
            activeSubTab === 'preview'
              ? 'bg-white text-violet-700 shadow-sm border border-slate-200/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          ⚡ Preview Studio
        </button>
        <button
          onClick={() => { soundManager.play('click'); setActiveSubTab('events'); }}
          className={`flex-1 min-w-[90px] py-2 px-3 text-2xs font-extrabold uppercase tracking-widest rounded-xl transition-all ${
            activeSubTab === 'events'
              ? 'bg-white text-violet-700 shadow-sm border border-slate-200/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          📚 Event Library
        </button>
        <button
          onClick={() => { soundManager.play('click'); setActiveSubTab('animations'); }}
          className={`flex-1 min-w-[90px] py-2 px-3 text-2xs font-extrabold uppercase tracking-widest rounded-xl transition-all ${
            activeSubTab === 'animations'
              ? 'bg-white text-violet-700 shadow-sm border border-slate-200/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          🎭 Animation Library
        </button>
        <button
          onClick={() => { soundManager.play('click'); setActiveSubTab('assets'); }}
          className={`flex-1 min-w-[90px] py-2 px-3 text-2xs font-extrabold uppercase tracking-widest rounded-xl transition-all ${
            activeSubTab === 'assets'
              ? 'bg-white text-violet-700 shadow-sm border border-slate-200/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          ✨ Asset Manager
        </button>
        <button
          onClick={() => { soundManager.play('click'); setActiveSubTab('settings'); }}
          className={`flex-1 min-w-[90px] py-2 px-3 text-2xs font-extrabold uppercase tracking-widest rounded-xl transition-all ${
            activeSubTab === 'settings'
              ? 'bg-white text-violet-700 shadow-sm border border-slate-200/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* SUB-VIEW 1: PREVIEW STUDIO */}
      {activeSubTab === 'preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Sandbox Settings */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-slate-50 border border-slate-200/55 rounded-2.5xl p-6 space-y-5 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Sparkles size={18} className="animate-spin-slow" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">
                    Interactive Sandbox Studio
                  </h4>
                  <p className="text-[11px] text-slate-500 font-bold">
                    Test and calibrate reward milestones in real-time
                  </p>
                </div>
              </div>
              
              <div className="h-px bg-slate-200/60" />

              <div className="space-y-4">
                {/* Event selector */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    1. Target Event Trigger
                  </label>
                  <select
                    value={previewEventId}
                    onChange={(e) => setPreviewEventId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {events.map(evt => (
                      <option key={evt.id} value={evt.id}>{evt.name} ({evt.category})</option>
                    ))}
                  </select>
                </div>

                {/* Animation override selector */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    2. Animation Style Override
                  </label>
                  <select
                    value={previewAnimOverride}
                    onChange={(e) => setPreviewAnimOverride(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="default">(Static Preset Native)</option>
                    <option value="confetti">Confetti Shower Mini</option>
                    <option value="fireworks">Neon Space Fireworks</option>
                    <option value="star_shower">Golden Shooting Stars</option>
                    <option value="glow_burst">Circular Solar Sunbeam</option>
                    <option value="badge_reveal">Spinning Crest Medals</option>
                    <option value="reward_explosion">XP Payout Explosion</option>
                    <option value="chest_opening">Vibrating Chest Unboxing</option>
                    <option value="level_up">Level Up Horizon</option>
                    <option value="victory_screen">Grand Gladiator Podium</option>
                  </select>
                </div>

                {/* Asset override selector */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    3. Celebration Asset Badge
                  </label>
                  <select
                    value={previewAssetOverride}
                    onChange={(e) => setPreviewAssetOverride(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="default">(Static Preset Native)</option>
                    {assets.map(ast => (
                      <option key={ast.id} value={ast.url}>{ast.name} ({ast.url})</option>
                    ))}
                    <option value="https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=120&auto=format&fit=crop&q=60">Custom Astronaut (Web URL)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex justify-end">
                <button
                  onClick={launchPreview}
                  className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-550 hover:to-indigo-550 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play size={12} className="fill-current text-yellow-300 animate-pulse" />
                  <span>Launch Celebration!</span>
                </button>
              </div>
            </div>
            
            <div className="flex gap-3.5 bg-violet-50/50 border border-violet-100 rounded-2.5xl p-5">
              <Info size={18} className="text-violet-600 shrink-0 mt-0.5 animate-bounce" />
              <div className="text-[11px] text-slate-600 font-bold leading-relaxed">
                <strong className="text-violet-950 block mb-0.5">Real-Time Mobile Sandboxing</strong>
                Triggering the preview fires the particle engines directly inside the simulated Smartphone view to the right, letting you test alignment, visual style, and reward cards in context.
              </div>
            </div>
          </div>

          {/* Right Column: High-fidelity Device Preview */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-50 border border-slate-200/50 rounded-3xl p-6 shadow-2xs">
            <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> SIMULATOR ACTIVE
            </span>

            {/* Simulated Smartphone Device Mock Frame */}
            <div className="relative w-full max-w-[300px] h-[522px] bg-slate-950 rounded-[2.5rem] border-[10px] border-slate-900 shadow-2xl overflow-hidden flex flex-col select-none ring-4 ring-indigo-500/10 leading-none">
              
              {/* Device Status Bar Notch */}
              <div className="absolute top-0 inset-x-0 h-5 bg-slate-900 flex items-center justify-between px-6 text-[8px] text-slate-400 font-extrabold tracking-tight pointer-events-none z-[100] font-mono select-none">
                <span>9:41</span>
                {/* Speaker Notch */}
                <div className="w-16 h-3 bg-slate-950 rounded-full flex items-center justify-center -mt-1.5" />
                <div className="flex items-center gap-1">
                  <span>5G</span>
                  <div className="w-4 h-2 border border-slate-400/50 rounded-2xs p-0.5 flex">
                    <div className="flex-1 bg-emerald-400 rounded-3xs" />
                  </div>
                </div>
              </div>

              {/* Dynamic App Profile Top Bar */}
              <div className="pt-7 pb-2.5 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0 z-40 relative">
                <div className="flex items-center gap-1 text-pink-500 font-black text-[10px]">
                  <Trophy size={11} className="fill-current text-amber-400 shrink-0" />
                  <span className="text-slate-100 font-mono">4.2k</span>
                </div>
                <div className="flex items-center gap-1 font-black text-[10px] text-purple-400 select-none">
                  <Star size={11} className="fill-current text-purple-400 shrink-0" />
                  <span className="text-slate-200 font-medium text-[9px]">Gold League</span>
                </div>
                <div className="flex items-center gap-1 font-black text-[10px] text-emerald-400">
                  <Zap size={11} className="fill-current text-yellow-400 shrink-0" />
                  <span className="text-slate-100 font-mono">5/5</span>
                </div>
              </div>

              {/* Interactive Roadmap Background Mock */}
              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#090b16] via-[#0e1124] to-[#080a14] relative p-4 space-y-7 scrollbar-hide py-6 z-20 flex flex-col items-center">
                
                {/* Cosmic space decoration background */}
                <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                  <div className="absolute top-[10%] left-[15%] text-[10px] text-indigo-400">✨</div>
                  <div className="absolute top-[40%] right-[12%] text-[11px] text-teal-300">🪐</div>
                  <div className="absolute top-[75%] left-[20%] text-[9px] text-pink-400">⭐</div>
                  {/* Grid Lines mockup */}
                  <div className="absolute inset-x-0 h-px bg-white/5 top-1/4" />
                  <div className="absolute inset-x-0 h-px bg-white/5 top-2/4" />
                  <div className="absolute inset-x-0 h-px bg-white/5 top-3/4" />
                </div>

                <div className="text-center z-10 w-full mb-1">
                  <h3 className="text-[8px] font-black uppercase tracking-widest text-indigo-300">
                    🌌 PATHWAY SECTOR
                  </h3>
                  <p className="text-[11px] font-bold text-white mt-0.5 tracking-tight">Grade 6: AI Odyssey</p>
                </div>

                {/* S-Shaped Pathway Nodes */}
                <div className="flex flex-col items-center gap-6 w-full z-10 relative">
                  
                  {/* Node 5: Trophy Crown */}
                  <div className="w-11 h-11 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500 relative cursor-not-allowed transform translate-x-3">
                    <Trophy size={14} className="text-slate-600" />
                    <span className="absolute -bottom-1 -right-1 bg-slate-900 p-0.5 rounded-full border border-slate-800">
                      <Lock size={7} className="text-slate-500" />
                    </span>
                  </div>

                  {/* Node 4: Active Stage */}
                  <div className="relative flex flex-col items-center transform -translate-x-3">
                    <div className="relative w-12 h-12 bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center text-white rounded-full cursor-pointer shadow-[0_4px_10px_rgba(99,102,241,0.4)] border-2 border-amber-300 ring-2 ring-indigo-500/20">
                      <Star size={16} className="fill-current text-yellow-300 animate-bounce" />
                    </div>
                    <span className="absolute -top-5.5 bg-amber-300 text-slate-950 text-[6.5px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide border border-slate-900 shadow-xs pointer-events-none">
                      ACTIVE
                    </span>
                  </div>

                  {/* Node 3: Completed */}
                  <div className="w-10 h-10 bg-emerald-500 flex items-center justify-center text-white rounded-full shadow-md border border-emerald-400 transform translate-x-4">
                    <CheckCircle className="w-5 h-5 stroke-[3]" />
                  </div>

                  {/* Node 2: Completed */}
                  <div className="w-10 h-10 bg-emerald-500 flex items-center justify-center text-white rounded-full shadow-md border border-emerald-400 transform -translate-x-3">
                    <CheckCircle className="w-5 h-5 stroke-[3]" />
                  </div>

                </div>

                {/* Simulated Stats Sub-banner */}
                <div className="text-center z-10 w-full pt-2">
                  <p className="text-[8px] text-slate-400 font-extrabold">
                    Level Completion: 75%
                  </p>
                </div>
              </div>

              {/* Celebration Overlay bound precisely inside the Smartphone frame */}
              <div className="absolute inset-0 z-50 pointer-events-auto overflow-hidden rounded-[2.2rem]">
                <CelebrationOverlay />
              </div>

            </div>
          </div>

        </div>
      )}

      {/* SUB-VIEW 2: EVENT LIBRARY */}
      {activeSubTab === 'events' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FolderOpen size={14} className="text-teal-500" />
              Event Catalog & Direct Triggers ({events.length})
            </h4>
            
            <button
              onClick={() => { soundManager.play('click'); setShowCreateForm(!showCreateForm); }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer transition-all"
            >
              <Plus size={11} />
              <span>{showCreateForm ? 'Cancel Creation' : 'Create New Event'}</span>
            </button>
          </div>

          {/* CREATE EVENT FORM */}
          {showCreateForm && (
            <form onSubmit={handleCreateEvent} className="bg-slate-50 border border-slate-200 rounded-2.5xl p-5 space-y-4 max-w-2xl">
              <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 block">CREATE CELEBRATION INSTANT TRACE</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Event Name (Admin reference)</label>
                  <input
                    type="text" required value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Battle Win Boss"
                    className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Display Title</label>
                  <input
                    type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. ⚔️ Decimated Boss Core!"
                    className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Description</label>
                  <input
                    type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)}
                    placeholder="Detailed explanation of the player action..."
                    className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Reward Text payout</label>
                  <input
                    type="text" value={newReward} onChange={e => setNewReward(e.target.value)}
                    placeholder="e.g. +500 XP • Nebula Badge"
                    className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Animation Type</label>
                  <select
                    value={newAnim} onChange={e => setNewAnim(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg p-2 text-slate-800"
                  >
                    <option value="confetti">Confetti</option>
                    <option value="fireworks">Fireworks</option>
                    <option value="star_shower">Star Shower</option>
                    <option value="glow_burst">Glow Burst</option>
                    <option value="badge_reveal">Badge Reveal</option>
                    <option value="reward_explosion">Reward Explosion</option>
                    <option value="chest_opening">Chest Opening</option>
                    <option value="level_up">Level Up</option>
                    <option value="victory_screen">Grand Victory Podium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Duration (ms)</label>
                  <input
                    type="number" value={newDuration} onChange={e => setNewDuration(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Trigger Type link</label>
                  <select
                    value={newTrigger} onChange={e => setNewTrigger(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg p-2 text-slate-800"
                  >
                    <option value="challenge_complete">Challenge Complete</option>
                    <option value="lesson_complete">Lesson Complete</option>
                    <option value="level_up">Level Up</option>
                    <option value="new_rank">New Rank</option>
                    <option value="reward_box_opened">Reward Box Opened</option>
                    <option value="puzzle_unlocked">Puzzle Unlocked</option>
                    <option value="battle_won">Battle Won</option>
                    <option value="achievement_earned">Achievement Earned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Category tier size</label>
                  <select
                    value={newCategory} onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg p-2 text-slate-800"
                  >
                    <option value="small">Small Toast (Brief alerts)</option>
                    <option value="medium">Medium Modal (Popup card)</option>
                    <option value="full">Full Screen (Whole screen showstopper)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Asset URL / Emoji</label>
                  <input
                    type="text" value={newAssetUrl} onChange={e => setNewAssetUrl(e.target.value)}
                    placeholder="⭐ or https://..."
                    className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-md cursor-pointer hover:scale-103 transition-transform"
                >
                  Confirm and Add
                </button>
              </div>
            </form>
          )}

          {/* LIST OF EVENTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {events.map((evt) => {
              const isEditing = editingEventId === evt.id;
              return (
                <div 
                  key={evt.id} 
                  className={`border rounded-2.5xl p-4.5 transition-all ${
                    isEditing 
                      ? 'border-violet-500 bg-slate-50/50' 
                      : 'border-slate-200/60 bg-white hover:shadow-md'
                  }`}
                >
                  {isEditing ? (
                    // EDIT MODE
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-violet-100/50 px-3 py-1.5 rounded-lg border border-violet-100">
                        <span className="text-[9px] font-black uppercase text-violet-700">EDITING: {evt.name}</span>
                        <div className="flex gap-1.5">
                          <button onClick={saveEditedEvent} className="p-1 bg-emerald-100 hover:bg-emerald-250 text-emerald-700 rounded-md">
                            <Check size={11} className="stroke-[3]" />
                          </button>
                          <button onClick={() => setEditingEventId(null)} className="p-1 bg-rose-100 hover:bg-rose-250 text-rose-700 rounded-md">
                            <X size={11} className="stroke-[3]" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-500 uppercase">Title</label>
                          <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-white border border-slate-200 text-xs p-1.5 rounded text-slate-800" />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-500 uppercase">Reward Code</label>
                          <input type="text" value={editReward} onChange={e => setEditReward(e.target.value)} className="w-full bg-white border border-slate-200 text-xs p-1.5 rounded text-slate-800" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[8px] font-bold text-slate-500 uppercase">Description</label>
                          <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full bg-white border border-slate-200 text-xs p-1.5 rounded text-slate-800" />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-500 uppercase">Animation</label>
                          <select value={editAnim} onChange={e => setEditAnim(e.target.value as any)} className="w-full bg-white border border-slate-200 text-xs p-1.5 rounded text-slate-800">
                            <option value="confetti">confetti</option>
                            <option value="fireworks">fireworks</option>
                            <option value="star_shower">star_shower</option>
                            <option value="glow_burst">glow_burst</option>
                            <option value="badge_reveal">badge_reveal</option>
                            <option value="reward_explosion">reward_explosion</option>
                            <option value="chest_opening">chest_opening</option>
                            <option value="level_up">level_up</option>
                            <option value="victory_screen">victory_screen</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-500 uppercase">Asset URL</label>
                          <input type="text" value={editAssetUrl} onChange={e => setEditAssetUrl(e.target.value)} className="w-full bg-white border border-slate-200 text-xs p-1.5 rounded text-slate-800" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // VIEW MODE
                    <div className="flex gap-3 justify-between items-start">
                      <div className="flex gap-3 min-w-0">
                        {/* Little circle placeholder visual */}
                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl shrink-0 flex items-center justify-center text-xl shadow-inner uppercase select-none">
                          {evt.assetUrl?.startsWith('http') ? '🌐' : (evt.assetUrl || '⭐')}
                        </div>

                        <div className="min-w-0">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block ${
                            evt.category === 'full' 
                              ? 'bg-rose-100 text-rose-800 border-rose-250/20' 
                              : evt.category === 'medium'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {evt.category} Event
                          </span>
                          <h5 className="font-extrabold text-[13px] text-slate-900 tracking-tight mt-1">{evt.title}</h5>
                          <p className="text-[10px] text-slate-500 font-bold leading-normal truncate mt-0.5">{evt.description}</p>
                          <div className="flex gap-2.5 items-center mt-2.5">
                            <span className="text-[9px] font-mono font-black text-amber-600 bg-amber-50 rounded-md border border-amber-200/50 px-1.5 py-0.5 uppercase tracking-wide">
                              {evt.rewardText || 'No reward'}
                            </span>
                            <span className="text-[8px] font-mono font-bold text-slate-400">
                              Anim: {evt.animationType}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right quick controls */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <div className="flex gap-1">
                          {/* Run/Preview button */}
                          <button
                            onClick={() => {
                              soundManager.play('complete');
                              triggerCelebration(evt.id);
                            }}
                            title="Interactive Test Preview"
                            className="p-1.5 bg-slate-100 hover:bg-slate-250 text-slate-700 rounded-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                          >
                            <Play size={10} className="fill-current text-indigo-600 stroke-[3]" />
                          </button>
                          
                          {/* Edit button */}
                          <button
                            onClick={() => startEditing(evt)}
                            title="Edit configurations"
                            className="p-1.5 bg-slate-100 hover:bg-slate-250 text-slate-700 rounded-md transition-all cursor-pointer"
                          >
                            <Edit size={10} />
                          </button>

                          {/* Toggle enable state */}
                          <button
                            onClick={() => {
                              soundManager.play('click');
                              updateEvent({ ...evt, enabled: !evt.enabled });
                            }}
                            title={evt.enabled ? 'Enabled (Click to disable)' : 'Disabled (Click to enable)'}
                            className={`p-1.5 rounded-md transition-all cursor-pointer ${
                              evt.enabled ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-150 text-slate-400'
                            }`}
                          >
                            {evt.enabled ? <CheckCircle size={10} className="stroke-[3]" /> : <X size={10} className="stroke-[3]" />}
                          </button>
                        </div>

                        {/* Delete button (prevent deleting default indices unless desired) */}
                        <button
                          onClick={() => {
                            if (confirm(`Delete the custom trigger event "${evt.name}"?`)) {
                              soundManager.play('complete');
                              deleteEvent(evt.id);
                            }
                          }}
                          className="p-1 text-[8px] text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded text-center block w-full uppercase tracking-wider font-extrabold mt-1 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: ANIMATION LIBRARY */}
      {activeSubTab === 'animations' && (
        <div className="space-y-4 max-w-3xl">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sliders size={14} className="text-amber-500 animate-pulse" />
            Particle Engine Showroom
          </h4>
          <p className="text-[11px] text-slate-500 font-bold leading-normal">
            Click on any animation engine category to summon its custom vectors instantly onto the display viewport!
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'confetti', name: 'Confetti Shower', desc: 'Rains colorful rectangular and triangular flying planes from space', color: 'from-pink-500 to-rose-500' },
              { id: 'fireworks', name: 'Neon Fireworks', desc: 'Explodes colorful neon rings and sparks on radial coordinates', color: 'from-amber-400 to-orange-500' },
              { id: 'star_shower', name: 'Star Shower', desc: 'Floats glowing golden star symbols downwards across coordinates', color: 'from-yellow-400 to-amber-500' },
              { id: 'glow_burst', name: 'Ambient Sunbeam', desc: 'A broad halo rotation that revolves behind vectors', color: 'from-violet-500 to-indigo-500' },
              { id: 'badge_reveal', name: 'Spinning Crest', desc: 'Neon rings rotate, spin, and expand with high brightness', color: 'from-cyan-500 to-blue-500' },
              { id: 'reward_explosion', name: 'Payout Blast', desc: 'XP diamonds scale out and fall with simulation physics', color: 'from-teal-400 to-emerald-500' },
              { id: 'chest_opening', name: 'Mystic Unboxing', desc: 'Animated chests shake before bursting into rewards', color: 'from-fuchsia-500 to-purple-600' },
              { id: 'level_up', name: 'Level Up Horizon', desc: 'A gorgeous horizontal fill bar that counts and rings', color: 'from-orange-500 to-red-600' },
              { id: 'victory_screen', name: 'Gladiator Podium', desc: 'The major battle victory, displaying trophies and fire rings', color: 'from-indigo-600 to-violet-800' }
            ].map(anm => (
              <button
                key={anm.id}
                onClick={() => {
                  soundManager.play('complete');
                  // Trigger direct preview
                  triggerCelebration('e1', {
                    title: `✨ Previewing: ${anm.name}`,
                    description: anm.desc,
                    animationType: anm.id as any,
                    rewardText: 'Visual Engine Active'
                  });
                }}
                className="bg-white border hover:border-violet-500 rounded-2xl p-4.5 text-left transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between h-34"
              >
                <div>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${anm.color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                    <Sparkles size={13} className="animate-pulse" />
                  </div>
                  <h5 className="font-extrabold text-xs text-slate-900 tracking-tight mt-2.5 group-hover:text-violet-700 transition-colors uppercase">
                    {anm.name}
                  </h5>
                </div>
                <p className="text-[9px] text-slate-400 font-bold leading-normal shrink-0 mt-1">
                  {anm.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: ASSET MANAGER */}
      {activeSubTab === 'assets' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ImageIcon size={14} className="text-purple-500" />
              PNG Asset and Emblem Manager ({assets.length})
            </h4>
            
            <button
              onClick={() => { soundManager.play('click'); setShowCreateAsset(!showCreateAsset); }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer transition-all"
            >
              <Plus size={11} />
              <span>{showCreateAsset ? 'Cancel Asset Upload' : 'Upload PNG Asset'}</span>
            </button>
          </div>

          {/* UPLOAD FORM */}
          {showCreateAsset && (
            <form onSubmit={handleCreateAsset} className="bg-slate-50 border border-slate-200 rounded-2.5xl p-5 space-y-4 max-w-xl">
              <span className="text-[9px] font-black uppercase tracking-widest text-purple-600 block">UPLOAD CELEBRATION COMPONENT</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Asset Name</label>
                  <input
                    type="text" required value={newAssetName} onChange={e => setNewAssetName(e.target.value)}
                    placeholder="e.g. Diamond Shield Custom"
                    className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Asset Type</label>
                  <select
                    value={newAssetType} onChange={e => setNewAssetType(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg p-2 text-slate-800"
                  >
                    <option value="trophy">Trophy Art</option>
                    <option value="badge">Badge Emblem</option>
                    <option value="star">Star Element</option>
                    <option value="chest">Reward Chest</option>
                    <option value="character">Custom Character</option>
                    <option value="victory">Victory Banner</option>
                    <option value="custom">General Custom PNG</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">PNG Asset web URL or Emoji Character</label>
                  <input
                    type="text" required value={newAssetLocation} onChange={e => setNewAssetLocation(e.target.value)}
                    placeholder="e.g. 🎒 or https://custom-art.png"
                    className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-md cursor-pointer hover:scale-103 transition-transform"
                >
                  Save and Load PNG
                </button>
              </div>
            </form>
          )}

          {/* LIST OF ASSETS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {assets.map(ast => (
              <div key={ast.id} className="border border-slate-200/50 bg-white rounded-2.5xl p-4 text-center space-y-3 relative group hover:shadow-md transition-all">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100/50 shadow-inner flex items-center justify-center mx-auto text-3xl select-none">
                  {ast.url.startsWith('http') ? (
                    <img src={ast.url} alt={ast.name} className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
                  ) : ast.url}
                </div>
                <div>
                  <span className="text-[7.5px] font-mono leading-none bg-slate-100 text-slate-500 rounded px-1 py-0.5 uppercase tracking-wide inline-block">
                    {ast.type}
                  </span>
                  <h6 className="font-extrabold text-[11px] text-slate-850 tracking-tight mt-1 max-w-[120px] mx-auto truncate">
                    {ast.name}
                  </h6>
                </div>
                
                {/* Delete overlay */}
                <button
                  onClick={() => {
                    if (confirm(`Delete the asset "${ast.name}"?`)) {
                      soundManager.play('complete');
                      deleteAsset(ast.id);
                    }
                  }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-50 rounded transition-opacity cursor-pointer text-xs flex items-center justify-center"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="space-y-5 max-w-xl">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <SlidersHorizontal size={14} className="text-violet-500" />
            Celebration Intensity & Permission Controls
          </h4>

          <div className="bg-slate-50 border border-slate-200/55 rounded-2.5xl p-5 space-y-4">
            {/* Intensity Select */}
            <div className="pb-4 border-b border-slate-200/50">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                ⚡ SMART CELEBRATION FREQUENCY CONTROL
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'low', label: 'Low Frequency', desc: 'Trigger for grand celebrations only (Level Ups and Arena wins). Avoids medium modals.' },
                  { id: 'medium', label: 'Medium Balance', desc: 'Balanced gameplay triggers (Rank updates, completed study modules, unboxing chests).' },
                  { id: 'high', label: 'High Game-like', desc: 'Full MMO/mobile-game intensity. Shows regular challenge clears, minor achievements, and active activity rails!' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      soundManager.play('click');
                      updateSettings({ celebrationIntensity: opt.id as any });
                    }}
                    className={`flex-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      settings.celebrationIntensity === opt.id
                        ? 'border-violet-600 bg-violet-50/50 shadow-inner'
                        : 'border-slate-200 bg-white hover:border-slate-350'
                    }`}
                  >
                    <span className={`text-[10px] font-black uppercase block ${
                      settings.celebrationIntensity === opt.id ? 'text-violet-750' : 'text-slate-700'
                    }`}>
                      {opt.label}
                    </span>
                    <span className="text-[8px] text-slate-400 font-medium leading-tight block mt-1">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Toggles */}
            <div className="space-y-3.5">
              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-slate-400 block">
                GLOBAL CELEBRATION CENTRE PERMISSIONS
              </span>

              {[
                { key: 'enableCelebrations', title: 'Enable Game System celebrations', desc: 'Disable to mute all animation overlays across the learning path.' },
                { key: 'enableConfetti', title: 'Allow Confetti showers', desc: 'Enable flying neon particle geometry sheets.' },
                { key: 'enableFullScreenEvents', title: 'Allow Full-Screen showstoppers', desc: 'Permit epic screens like Level Up and Gladiator Arena podiums.' },
                { key: 'enableBattleAnimations', title: 'Trigger on Duel Arena battle wins', desc: 'Summon gold trophies and victory rails on arena completions.' },
                { key: 'enableRewardAnimations', title: 'Trigger on unboxed reward cargo chests', desc: 'Play lock cracking and gemstone payout explosions.' },
                { key: 'enableAchievementPopups', title: 'Trigger on unlocked milestone badges', desc: 'Launch star rains on badge achievements.' }
              ].map(tgl => {
                const checked = (settings as any)[tgl.key];
                return (
                  <div key={tgl.key} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200/50 shadow-inner">
                    <div className="min-w-0 pr-4">
                      <h6 className="font-extrabold text-[11px] text-slate-804 tracking-tight leading-none">{tgl.title}</h6>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 max-w-sm">{tgl.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.play('click');
                        updateSettings({ [tgl.key]: !checked });
                      }}
                      className="text-violet-650 hover:text-violet-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      {checked ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-slate-350" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
