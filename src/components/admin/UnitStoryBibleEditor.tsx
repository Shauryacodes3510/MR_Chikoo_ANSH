import React, { useState } from 'react';
import { 
  BookOpen, 
  Users, 
  Sparkles, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Compass, 
  Layers, 
  CheckCircle2, 
  ArrowUp, 
  ArrowDown, 
  MessageSquare,
  Globe,
  AlertCircle
} from 'lucide-react';
import { Module, UnitStoryBible, StoryBibleCharacter, LessonMemory } from '../../lib/curriculumTypes';
import { soundManager } from '../../lib/sounds';

interface UnitStoryBibleEditorProps {
  module: Module;
  onSave: (updatedModule: Module) => void;
  onClose: () => void;
}

export const DEFAULT_STORY_BIBLE: UnitStoryBible = {
  learningGoal: "Understand foundational AI concepts and how pattern recognition helps systems solve real-world problems.",
  conceptProgression: [
    "Introduction to AI & Machine Learning",
    "Training Data as Fuel",
    "Pattern Recognition & Visual Features",
    "Classification vs Prediction",
    "Data Quality & Sensor Noise",
    "Ethical & Safe AI"
  ],
  storyPremise: "Chikoo the curious star-hopper and Byte the robotic navigator are exploring new frontiers. To solve challenges and navigate unfamiliar terrain, they must teach their starship's AI system using observations and clean data.",
  characters: [
    {
      name: "Chikoo",
      role: "Curious Lead Explorer",
      personality: "Energetic, inquisitive, loves solving puzzles with everyday food and nature analogies."
    },
    {
      name: "Byte",
      role: "Robotic Starship Navigator",
      personality: "Literal-minded, loves structured data tables, gets puzzled by messy inputs."
    },
    {
      name: "Spark",
      role: "AI Mentor / Star-Guide",
      personality: "Calm, encouraging mentor who offers friendly Socratic nudges."
    }
  ],
  characterRelationships: "Chikoo asks the big imaginative questions, Byte crunches sensor streams, and Spark guides them with warm Socratic nudges.",
  currentStorySituation: "The crew has charted initial coordinates and is approaching their next mission milestone.",
  toneRules: "Kid-friendly, playful, conversational, highly encouraging, everyday physical analogies, zero heavy academic jargon.",
  worldRules: "AI is an intelligent computational tool built with clear data and algorithms, not magic. Physical metaphors guide every lesson.",
  lessonMemories: []
};

export const UnitStoryBibleEditor: React.FC<UnitStoryBibleEditorProps> = ({
  module,
  onSave,
  onClose
}) => {
  const existingBible: UnitStoryBible = module.metadata?.storyBible || DEFAULT_STORY_BIBLE;

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'concepts' | 'characters' | 'memories'>('overview');
  const [learningGoal, setLearningGoal] = useState(existingBible.learningGoal || '');
  const [storyPremise, setStoryPremise] = useState(existingBible.storyPremise || '');
  const [characterRelationships, setCharacterRelationships] = useState(existingBible.characterRelationships || '');
  const [currentStorySituation, setCurrentStorySituation] = useState(existingBible.currentStorySituation || '');
  const [toneRules, setToneRules] = useState(existingBible.toneRules || '');
  const [worldRules, setWorldRules] = useState(existingBible.worldRules || '');

  // Concepts list
  const [conceptProgression, setConceptProgression] = useState<string[]>(
    existingBible.conceptProgression && existingBible.conceptProgression.length > 0
      ? existingBible.conceptProgression
      : DEFAULT_STORY_BIBLE.conceptProgression
  );
  const [newConceptInput, setNewConceptInput] = useState('');

  // Characters list
  const [characters, setCharacters] = useState<StoryBibleCharacter[]>(
    existingBible.characters && existingBible.characters.length > 0
      ? existingBible.characters
      : DEFAULT_STORY_BIBLE.characters
  );
  const [newCharName, setNewCharName] = useState('');
  const [newCharRole, setNewCharRole] = useState('');
  const [newCharPersonality, setNewCharPersonality] = useState('');

  // Lesson Memories
  const [lessonMemories, setLessonMemories] = useState<LessonMemory[]>(
    existingBible.lessonMemories || []
  );

  const handleAddConcept = () => {
    if (!newConceptInput.trim()) return;
    setConceptProgression([...conceptProgression, newConceptInput.trim()]);
    setNewConceptInput('');
    soundManager.play('click');
  };

  const handleRemoveConcept = (idx: number) => {
    setConceptProgression(conceptProgression.filter((_, i) => i !== idx));
    soundManager.play('click');
  };

  const handleMoveConcept = (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= conceptProgression.length) return;
    const updated = [...conceptProgression];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setConceptProgression(updated);
    soundManager.play('click');
  };

  const handleAddCharacter = () => {
    if (!newCharName.trim()) return;
    setCharacters([
      ...characters,
      {
        name: newCharName.trim(),
        role: newCharRole.trim() || 'Explorer',
        personality: newCharPersonality.trim() || 'Friendly and helpful'
      }
    ]);
    setNewCharName('');
    setNewCharRole('');
    setNewCharPersonality('');
    soundManager.play('click');
  };

  const handleRemoveCharacter = (idx: number) => {
    setCharacters(characters.filter((_, i) => i !== idx));
    soundManager.play('click');
  };

  const handleRemoveMemory = (idx: number) => {
    setLessonMemories(lessonMemories.filter((_, i) => i !== idx));
    soundManager.play('click');
  };

  const handleSaveBible = () => {
    const updatedBible: UnitStoryBible = {
      learningGoal,
      storyPremise,
      conceptProgression,
      characters,
      characterRelationships,
      currentStorySituation,
      toneRules,
      worldRules,
      lessonMemories
    };

    const updatedModule: Module = {
      ...module,
      metadata: {
        ...(module.metadata || {}),
        storyBible: updatedBible
      }
    };

    onSave(updatedModule);
    soundManager.play('complete');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">Unit Story Bible & Curriculum Context</h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                  {module.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{module.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => { setActiveSubTab('overview'); soundManager.play('click'); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Compass size={14} />
            Premise & World Rules
          </button>

          <button
            onClick={() => { setActiveSubTab('concepts'); soundManager.play('click'); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'concepts'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Layers size={14} />
            Concept Progression ({conceptProgression.length})
          </button>

          <button
            onClick={() => { setActiveSubTab('characters'); soundManager.play('click'); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'characters'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Users size={14} />
            Cast & Characters ({characters.length})
          </button>

          <button
            onClick={() => { setActiveSubTab('memories'); soundManager.play('click'); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'memories'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles size={14} />
            Lesson Continuity Memories ({lessonMemories.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* TAB 1: OVERVIEW & WORLD RULES */}
          {activeSubTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Overall Unit Learning Goal
                </label>
                <textarea
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  rows={2}
                  placeholder="e.g. Master pattern recognition, understand training datasets, and discover classification."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Story Premise & Setting
                </label>
                <textarea
                  value={storyPremise}
                  onChange={(e) => setStoryPremise(e.target.value)}
                  rows={3}
                  placeholder="Describe the adventure world, where the characters are, and the overarching mission."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Current Story Situation
                  </label>
                  <textarea
                    value={currentStorySituation}
                    onChange={(e) => setCurrentStorySituation(e.target.value)}
                    rows={3}
                    placeholder="Where are the characters right now at this point in the unit?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Character Relationships & Dynamics
                  </label>
                  <textarea
                    value={characterRelationships}
                    onChange={(e) => setCharacterRelationships(e.target.value)}
                    rows={3}
                    placeholder="How do Chikoo, Byte, and others interact?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Tone & Voice Guidelines
                  </label>
                  <textarea
                    value={toneRules}
                    onChange={(e) => setToneRules(e.target.value)}
                    rows={3}
                    placeholder="e.g. Kid-friendly, playful, conversational, everyday physical analogies."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    World Consistency & STEM Rules
                  </label>
                  <textarea
                    value={worldRules}
                    onChange={(e) => setWorldRules(e.target.value)}
                    rows={3}
                    placeholder="e.g. AI is a helpful tool, physical analogies, zero magic."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONCEPT PROGRESSION */}
          {activeSubTab === 'concepts' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                <Layers className="text-indigo-600 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                  The <strong>Concept Progression</strong> defines the pedagogical learning arc for this unit. The AI Lesson Generator references this ordered list to suggest upcoming concepts and maintain rigorous curriculum continuity.
                </p>
              </div>

              {/* Add concept input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newConceptInput}
                  onChange={(e) => setNewConceptInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddConcept(); } }}
                  placeholder="Enter new concept (e.g. Feature Extraction via Color & Shapes)..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500 font-bold"
                />
                <button
                  type="button"
                  onClick={handleAddConcept}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={14} />
                  Add Concept
                </button>
              </div>

              {/* Concepts List */}
              <div className="space-y-2">
                {conceptProgression.map((concept, idx) => {
                  // Check if a lesson in the unit already covers or matches this
                  const hasLesson = (module.lessons || []).some(l => 
                    (l.title && l.title.toLowerCase().includes(concept.toLowerCase())) ||
                    (l.category && l.category.toLowerCase().includes(concept.toLowerCase()))
                  );

                  return (
                    <div
                      key={`concept-${concept}-${idx}`}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black font-mono">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-xs font-extrabold text-slate-850">{concept}</span>
                          {hasLesson && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 size={10} />
                              Lesson Created
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveConcept(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveConcept(idx, 'down')}
                          disabled={idx === conceptProgression.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveConcept(idx)}
                          className="p-1 text-rose-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CHARACTERS */}
          {activeSubTab === 'characters' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input
                  type="text"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  placeholder="Character Name (e.g. Chikoo)"
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                />
                <input
                  type="text"
                  value={newCharRole}
                  onChange={(e) => setNewCharRole(e.target.value)}
                  placeholder="Role (e.g. Lead Explorer)"
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCharPersonality}
                    onChange={(e) => setNewCharPersonality(e.target.value)}
                    placeholder="Personality traits"
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCharacter}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Characters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {characters.map((char, idx) => (
                  <div key={`char-${char.name}-${idx}`} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 relative group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                          {char.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{char.name}</h4>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {char.role}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCharacter(idx)}
                        className="p-1 text-slate-300 hover:text-rose-500 rounded hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-2 rounded-lg">
                      "{char.personality}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LESSON CONTINUITY MEMORIES */}
          {activeSubTab === 'memories' && (
            <div className="space-y-4">
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/60 flex items-start gap-3">
                <Sparkles className="text-amber-600 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-amber-900 font-medium leading-relaxed">
                  <strong>Lesson Continuity Memories</strong> track the story events, character status, and cliffhanger hooks after each lesson is completed. When generating new lessons, the AI generator automatically picks up from the most recent memory to ensure 100% story continuity!
                </p>
              </div>

              {lessonMemories.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <BookOpen className="mx-auto text-slate-400 mb-2" size={24} />
                  <p className="text-xs text-slate-600 font-bold">No lesson memories recorded yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    When you generate lessons using the AI Lesson Generator, memories are automatically saved here!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lessonMemories.map((mem, idx) => (
                    <div key={`memory-${mem.lessonTitle || 'mem'}-${idx}`} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            Memory #{idx + 1}
                          </span>
                          <h4 className="text-xs font-black text-slate-900">{mem.lessonTitle}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMemory(idx)}
                          className="text-slate-300 hover:text-rose-500 p-1 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-lg">
                          <span className="block text-[9px] uppercase font-black text-slate-400">Concept Taught</span>
                          <p className="font-bold text-slate-800">{mem.conceptTaught}</p>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg">
                          <span className="block text-[9px] uppercase font-black text-slate-400">Character State</span>
                          <p className="font-medium text-slate-700">{mem.characterStatus}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg text-xs">
                        <span className="block text-[9px] uppercase font-black text-slate-400">Story Event</span>
                        <p className="font-medium text-slate-700 leading-relaxed">{mem.storyEvent}</p>
                      </div>

                      {mem.cliffhangerOrHook && (
                        <div className="bg-amber-50/60 border border-amber-100 p-2.5 rounded-lg text-xs">
                          <span className="block text-[9px] uppercase font-black text-amber-600">Cliffhanger / Hook for Next Lesson</span>
                          <p className="font-bold text-amber-900">{mem.cliffhangerOrHook}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveBible}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xs transition-colors"
          >
            <Save size={14} />
            Save Unit Story Bible
          </button>
        </div>

      </div>
    </div>
  );
};
