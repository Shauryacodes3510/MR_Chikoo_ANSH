import { useState, useEffect } from 'react';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Save, Sparkles, Check, GripVertical, 
  Gift, Zap, Layers, Trophy, BookOpen, AlertCircle, Trash
} from 'lucide-react';
import { Module, Lesson } from '../lib/curriculumTypes';
import { soundManager } from '../lib/sounds';
import { saveCurriculumToStorage } from '../lib/content';
import { 
  getModuleLearningPath, 
  saveModuleLearningPath, 
  ModuleLearningPathNode 
} from '../lib/supabase';
import { 
  getChallengePacksAsync, 
  getPuzzlePacksAsync, 
  ChallengePack, 
  PuzzlePack 
} from '../lib/practiceStoreNew';

interface LearningPathBuilderProps {
  module: Module;
  modulesList: Module[];
  practiceModulesList: Module[];
  setModulesList: (list: Module[]) => void;
  setPracticeModulesList: (list: Module[]) => void;
  triggerNotification: (msg: string, type?: "success" | "info" | "error" | "warning") => void;
}

interface PathBlock {
  type: 'lesson' | 'challenge' | 'treasure';
  lessonId?: string; // Only for 'lesson' type
  id?: string;       // For 'challenge' or 'treasure' type (ChallengePack or PuzzlePack ID)
  lane: 'left' | 'center' | 'right';
}

export default function LearningPathBuilder({
  module,
  modulesList,
  practiceModulesList,
  setModulesList,
  setPracticeModulesList,
  triggerNotification
}: LearningPathBuilderProps) {
  const [pathBlocks, setPathBlocks] = useState<PathBlock[]>([]);
  const [challengePacks, setChallengePacks] = useState<ChallengePack[]>([]);
  const [puzzlePacks, setPuzzlePacks] = useState<PuzzlePack[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Load available challenge packs and puzzle packs for dropdowns
  useEffect(() => {
    async function loadPacks() {
      try {
        const chalList = await getChallengePacksAsync();
        const puzList = await getPuzzlePacksAsync();
        setChallengePacks(chalList || []);
        setPuzzlePacks(puzList || []);
      } catch (err) {
        console.error("Failed to load packs in LearningPathBuilder:", err);
      }
    }
    loadPacks();
  }, []);

  // Reset to last saved order from DB
  const handleResetPath = () => {
    soundManager.play('click');
    if (module?.id) {
        loadPath(); // Re-fetch from DB
    }
  };

  async function loadPath() {
    if (!module?.id) return;
    setLoading(true);
    try {
      if (module.metadata?.learningPath && Array.isArray(module.metadata.learningPath) && module.metadata.learningPath.length > 0) {
        const fallbackMapped: PathBlock[] = module.metadata.learningPath.map((block: any) => {
          const bType = (block.type === 'challenge' || block.type === 'treasure') ? block.type : 'lesson';
          return {
            type: bType,
            lessonId: bType === 'lesson' ? (block.lessonId || block.id) : undefined,
            id: bType !== 'lesson' ? (block.id || block.lessonId) : undefined,
            lane: block.lane || 'center'
          };
        });

        // Include any newly added lessons in module.lessons that are not yet in the metadata learningPath
        const existingLessonIds = new Set(fallbackMapped.filter(b => b.type === 'lesson').map(b => b.lessonId));
        (module.lessons || []).forEach(l => {
          if (!existingLessonIds.has(l.id)) {
            const nextIdx = fallbackMapped.length;
            fallbackMapped.push({
              type: 'lesson',
              lessonId: l.id,
              lane: nextIdx % 3 === 0 ? 'left' : nextIdx % 3 === 1 ? 'center' : 'right'
            });
            existingLessonIds.add(l.id);
          }
        });

        setPathBlocks(fallbackMapped);
      } else {
        const dbNodes = await getModuleLearningPath(module.id);
        console.log("Loaded nodes from DB:", dbNodes);
        if (dbNodes && dbNodes.length > 0) {
          // Sort is already applied by the getModuleLearningPath query (order_index / sort_order)
          const mapped: PathBlock[] = dbNodes.map(node => {
            const blockType = (node.node_type === 'lesson' || node.node_type === 'challenge' || node.node_type === 'treasure')
              ? node.node_type 
              : 'lesson';
            return {
              type: blockType,
              lessonId: blockType === 'lesson' ? node.node_id : undefined,
              id: blockType !== 'lesson' ? node.node_id : undefined,
              lane: node.lane || 'center'
            };
          });

          // Include any lessons not yet in the DB nodes
          const existingLessonIds = new Set(mapped.filter(b => b.type === 'lesson').map(b => b.lessonId));
          (module.lessons || []).forEach(l => {
            if (!existingLessonIds.has(l.id)) {
              const nextIdx = mapped.length;
              mapped.push({
                type: 'lesson',
                lessonId: l.id,
                lane: nextIdx % 3 === 0 ? 'left' : nextIdx % 3 === 1 ? 'center' : 'right'
              });
              existingLessonIds.add(l.id);
            }
          });

          setPathBlocks(mapped);
        } else {
          // Auto-generate default lessons alternating lanes
          const defaultPath: PathBlock[] = (module.lessons || []).map((l, idx) => ({
            type: 'lesson',
            lessonId: l.id,
            lane: idx % 3 === 0 ? 'left' : idx % 3 === 1 ? 'center' : 'right'
          }));
          setPathBlocks(defaultPath);
        }
      }
    } catch (err) {
      console.error("Error loading learning path in builder:", err);
    } finally {
      setLoading(false);
    }
  }

  // Initialize path
  useEffect(() => {
    loadPath();
  }, [module]);

  // Save Layout to module_learning_path Database Table
  const handleSavePath = async () => {
    soundManager.play('click');

    // Validation: make sure all lessons, challenge packs, or puzzle packs have selected IDs
    const hasEmptyNode = pathBlocks.some(b => {
      if (b.type === 'lesson' && !b.lessonId) return true;
      if (b.type === 'challenge' && !b.id) return true;
      if (b.type === 'treasure' && !b.id) return true;
      return false;
    });

    if (hasEmptyNode) {
      triggerNotification("Please select a valid option for all trail blocks before saving.", "error");
      return;
    }

    try {
      const nodesToSave: ModuleLearningPathNode[] = pathBlocks.map((block, idx) => ({
        module_id: module.id,
        node_type: block.type,
        node_id: block.type === 'lesson' ? (block.lessonId || '') : (block.id || ''),
        lane: block.lane || 'center',
        sort_order: idx
      }));

      console.log("Saving nodes:", nodesToSave);
      // Persist to Supabase/localStorage
      await saveModuleLearningPath(module.id, nodesToSave);
      console.log("Save operation completed successfully.");


      // Sync metadata so changes propagate to local caches & memory states
      const updatedAi = modulesList.map(m => {
        if (m.id === module.id) {
          return {
            ...m,
            metadata: {
              ...(m.metadata || {}),
              learningPath: pathBlocks
            }
          };
        }
        return m;
      });

      const updatedPrac = practiceModulesList.map(m => {
        if (m.id === module.id) {
          return {
            ...m,
            metadata: {
              ...(m.metadata || {}),
              learningPath: pathBlocks
            }
          };
        }
        return m;
      });

      setModulesList(updatedAi);
      setPracticeModulesList(updatedPrac);
      saveCurriculumToStorage(updatedAi, updatedPrac);

      triggerNotification("Adventure path custom layout saved successfully!", "success");
      soundManager.play('complete');

      // Dispatch event to refresh layout instantly
      window.dispatchEvent(new Event('curriculumChanged'));
    } catch (err) {
      console.error("Failed to save learning path to database:", err);
      triggerNotification("Failed to save layout to the database.", "error");
    }
  };

  // Drag and Drop Event Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
    soundManager.play('click');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null) return;
    
    const reordered = [...pathBlocks];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, removed);
    
    setPathBlocks(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
    soundManager.play('click');
  };

  // Reordering controls
  const moveUp = (index: number) => {
    if (index === 0) return;
    const reordered = [...pathBlocks];
    const temp = reordered[index];
    reordered[index] = reordered[index - 1];
    reordered[index - 1] = temp;
    setPathBlocks(reordered);
    soundManager.play('click');
  };

  const moveDown = (index: number) => {
    if (index === pathBlocks.length - 1) return;
    const reordered = [...pathBlocks];
    const temp = reordered[index];
    reordered[index] = reordered[index + 1];
    reordered[index + 1] = temp;
    setPathBlocks(reordered);
    soundManager.play('click');
  };

  const deleteBlock = (index: number) => {
    const reordered = pathBlocks.filter((_, idx) => idx !== index);
    setPathBlocks(reordered);
    soundManager.play('click');
  };

  const updateBlockLane = (index: number, lane: 'left' | 'center' | 'right') => {
    const updated = [...pathBlocks];
    updated[index].lane = lane;
    setPathBlocks(updated);
    soundManager.play('click');
  };

  const updateBlockType = (index: number, newType: 'lesson' | 'challenge' | 'treasure') => {
    const updated = [...pathBlocks];
    
    let defaultId = '';
    if (newType === 'lesson') {
      defaultId = module.lessons[0]?.id || '';
    } else if (newType === 'challenge') {
      defaultId = challengePacks[0]?.id || '';
    } else if (newType === 'treasure') {
      defaultId = puzzlePacks[0]?.id || '';
    }

    updated[index] = {
      type: newType,
      lessonId: newType === 'lesson' ? defaultId : undefined,
      id: newType !== 'lesson' ? defaultId : undefined,
      lane: updated[index].lane || 'center'
    };
    setPathBlocks(updated);
    soundManager.play('click');
  };

  const updateBlockField = (index: number, field: 'lessonId' | 'id', value: string) => {
    const updated = [...pathBlocks];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setPathBlocks(updated);
  };

  const addBlock = (type: PathBlock['type']) => {
    let newBlock: PathBlock;

    switch (type) {
      case 'lesson': {
        const usedLessonIds = new Set(pathBlocks.map(b => b.lessonId).filter(Boolean));
        const unusedLesson = module.lessons.find(l => !usedLessonIds.has(l.id)) || module.lessons[0];
        newBlock = {
          type: 'lesson',
          lessonId: unusedLesson?.id || '',
          lane: 'left'
        };
        break;
      }
      case 'challenge': {
        const unusedPack = challengePacks.find(p => !pathBlocks.some(b => b.id === p.id)) || challengePacks[0];
        newBlock = {
          type: 'challenge',
          id: unusedPack?.id || '',
          lane: 'right'
        };
        break;
      }
      case 'treasure': {
        const unusedPack = puzzlePacks.find(p => !pathBlocks.some(b => b.id === p.id)) || puzzlePacks[0];
        newBlock = {
          type: 'treasure',
          id: unusedPack?.id || '',
          lane: 'center'
        };
        break;
      }
      default:
        return;
    }

    setPathBlocks([...pathBlocks, newBlock]);
    soundManager.play('complete');
  };

  return (
    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <span className="text-[10px] uppercase font-black text-[#0ea5e9] tracking-wider font-mono">Unit Customizer</span>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mt-0.5">
            <Layers className="text-[#0ea5e9]" size={18} />
            Learning Path Builder
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
            Sequence, edit, and configure the lessons, challenge packs, and treasure vaults along the student trail.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleResetPath}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSavePath}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl border border-indigo-550 flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Save size={13} />
            Save Adventure Path Layout
          </button>
        </div>
      </div>

      {/* BLOCK ADDER TOOLBAR */}
      <div className="space-y-2">
        <label className="block text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">
          Add trail block elements
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addBlock('lesson')}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200/50 flex items-center gap-1 transition active:scale-95 cursor-pointer"
          >
            <Plus size={12} />
            Lesson Node
          </button>
          <button
            type="button"
            onClick={() => addBlock('challenge')}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200/50 flex items-center gap-1 transition active:scale-95 cursor-pointer"
          >
            <Plus size={12} />
            Challenge Pack
          </button>
          <button
            type="button"
            onClick={() => addBlock('treasure')}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-200/50 flex items-center gap-1 transition active:scale-95 cursor-pointer"
          >
            <Plus size={12} />
            Treasure Chest
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-xs text-slate-400 font-bold mt-3 uppercase tracking-wider">Loading trail sequence...</p>
        </div>
      ) : pathBlocks.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
          <AlertCircle className="mx-auto text-slate-400 mb-2" size={24} />
          <span className="text-xs text-slate-500 font-semibold block">The adventure trail is empty. Click elements above to start building!</span>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {pathBlocks.map((block, index) => {
            let typeColor = 'indigo';
            let icon = <BookOpen size={14} />;
            let label = 'Lesson Unit';

            if (block.type === 'treasure') {
              typeColor = 'amber';
              icon = <Gift size={14} />;
              label = 'Secret Chest (Puzzle)';
            } else if (block.type === 'challenge') {
              typeColor = 'rose';
              icon = <Zap size={14} />;
              label = 'AI Challenge Pack';
            }

            const borderColors: Record<string, string> = {
              indigo: 'border-l-4 border-l-indigo-500 border-slate-200',
              amber: 'border-l-4 border-l-amber-500 border-slate-200',
              rose: 'border-l-4 border-l-rose-500 border-slate-200',
            };

            const bgGlows: Record<string, string> = {
              indigo: 'bg-indigo-50/20 hover:bg-indigo-50/40',
              amber: 'bg-amber-50/20 hover:bg-amber-50/40',
              rose: 'bg-rose-50/20 hover:bg-rose-50/40',
            };

            return (
              <div
                key={`${block.type}-${block.id || block.lessonId || index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
                className={`flex flex-col md:flex-row items-stretch gap-4 p-4 rounded-2xl border bg-white shadow-2xs transition-all relative ${
                  borderColors[block.type] || 'border-slate-200'
                } ${bgGlows[block.type] || ''} ${
                  draggedIndex === index ? 'opacity-30 border-dashed border-indigo-400' : ''
                } ${dragOverIndex === index ? 'border-b-4 border-b-indigo-500 scale-[1.01]' : ''}`}
              >
                {/* Drag Handle & Drag Index Badge */}
                <div className="flex md:flex-col items-center justify-between md:justify-center gap-2 border-b md:border-b-0 md:border-r border-slate-100 pb-2 md:pb-0 md:pr-4">
                  <div className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition">
                    <GripVertical size={16} />
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-150 text-slate-600 w-5 h-5 rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>

                {/* Block Icon & Type Info */}
                <div className="flex-1 space-y-3 min-w-0 pr-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`p-1.5 rounded-lg flex items-center justify-center text-white bg-${typeColor}-500`} style={{
                      backgroundColor: 
                        block.type === 'lesson' ? '#6366f1' :
                        block.type === 'treasure' ? '#f59e0b' :
                        '#f43f5e'
                    }}>
                      {icon}
                    </span>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider">
                        Node Type
                      </span>
                      <select
                        value={block.type}
                        onChange={(e) => updateBlockType(index, e.target.value as PathBlock['type'])}
                        className="block bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-800 font-bold cursor-pointer"
                      >
                        <option value="lesson">Lesson</option>
                        <option value="challenge">Challenge Pack</option>
                        <option value="treasure">Puzzle Pack</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Dropdown showing appropriate source of truth */}
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-black tracking-wider text-slate-400">
                      {block.type === 'lesson' ? 'Select Target Lesson' : block.type === 'challenge' ? 'Select Challenge Pack' : 'Select Puzzle Pack'}
                    </label>
                    {block.type === 'lesson' ? (
                      <select
                        value={block.lessonId || ''}
                        onChange={(e) => updateBlockField(index, 'lessonId', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-bold focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="">-- Select Lesson --</option>
                        {(module.lessons || []).map(l => (
                          <option key={l.id} value={l.id}>{l.title} (ID: {l.id})</option>
                        ))}
                      </select>
                    ) : block.type === 'challenge' ? (
                      <select
                        value={block.id || ''}
                        onChange={(e) => updateBlockField(index, 'id', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-bold focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="">-- Select Challenge Pack --</option>
                        {challengePacks.map(p => (
                          <option key={p.id} value={p.id}>{p.topic} ({p.difficulty} - {p.questionsCount} Questions)</option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={block.id || ''}
                        onChange={(e) => updateBlockField(index, 'id', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-bold focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="">-- Select Puzzle Pack --</option>
                        {puzzlePacks.map(p => (
                          <option key={p.id} value={p.id}>{p.title} ({p.category} - {p.xpReward} XP)</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Lane placement picker */}
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-black tracking-wider text-slate-400">Zig-Zag Lane placement</label>
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1 max-w-[280px]">
                      {(['left', 'center', 'right'] as const).map(lane => (
                        <button
                          key={lane}
                          type="button"
                          onClick={() => updateBlockLane(index, lane)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            block.lane === lane 
                              ? 'bg-white text-indigo-700 shadow-3xs' 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {lane}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Operations & ordering controls */}
                <div className="flex md:flex-col items-center justify-end md:justify-center gap-1 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4 shrink-0">
                  <div className="flex items-center md:flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 transition cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(index)}
                      disabled={index === pathBlocks.length - 1}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 transition cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBlock(index)}
                      className="p-1.5 hover:bg-rose-50 text-slate-350 hover:text-rose-600 rounded transition cursor-pointer ml-2 md:ml-0 md:mt-2"
                      title="Delete Element"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
