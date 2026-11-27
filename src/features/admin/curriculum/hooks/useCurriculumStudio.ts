import React, { useState, useMemo } from 'react';
import { 
  Module, 
  Lesson, 
  saveCurriculumToStorage, 
  saveSingleLesson, 
  removeSyncedHash 
} from '../../../../lib/content';
import { 
  saveCustomModule, 
  batchUpdateModules, 
  deleteCustomModule, 
  deleteCustomLesson, 
  isSupabaseConfigured 
} from '../../../../lib/supabase';
import { cleanEntityForExport } from '../utils';

export interface UseCurriculumStudioOptions {
  modulesList: Module[];
  practiceModulesList: Module[];
  setModulesList: React.Dispatch<React.SetStateAction<Module[]>>;
  setPracticeModulesList: React.Dispatch<React.SetStateAction<Module[]>>;
  selectedAdminWorldId: string;
  triggerNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
  triggerConfirm: (title: string, message: string, onConfirm: () => void) => void;
  soundManager: any;
  setRawJsonText?: (text: string) => void;
  setActiveTab?: (tab: any) => void;
  setMobileViewMode?: (mode: 'map' | 'editor') => void;
  selectedModuleId?: string;
  setSelectedModuleId?: (id: string) => void;
  selectedLessonId?: string;
  setSelectedLessonId?: (id: string) => void;
  isOutlineCollapsed?: boolean;
  setIsOutlineCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useCurriculumStudio({
  modulesList,
  practiceModulesList,
  setModulesList,
  setPracticeModulesList,
  selectedAdminWorldId,
  triggerNotification,
  triggerConfirm,
  soundManager,
  setRawJsonText,
  setActiveTab,
  setMobileViewMode,
  selectedModuleId: propSelectedModuleId,
  setSelectedModuleId: propSetSelectedModuleId,
  selectedLessonId: propSelectedLessonId,
  setSelectedLessonId: propSetSelectedLessonId,
  isOutlineCollapsed: propIsOutlineCollapsed,
  setIsOutlineCollapsed: propSetIsOutlineCollapsed,
}: UseCurriculumStudioOptions) {
  // Navigation & selection
  const [internalSelectedModuleId, setInternalSelectedModuleId] = useState<string>('');
  const [internalSelectedLessonId, setInternalSelectedLessonId] = useState<string>('');
  const [internalIsOutlineCollapsed, setInternalIsOutlineCollapsed] = useState(false);

  const selectedModuleId = propSelectedModuleId !== undefined ? propSelectedModuleId : internalSelectedModuleId;
  const setSelectedModuleId = propSetSelectedModuleId !== undefined ? propSetSelectedModuleId : setInternalSelectedModuleId;
  const selectedLessonId = propSelectedLessonId !== undefined ? propSelectedLessonId : internalSelectedLessonId;
  const setSelectedLessonId = propSetSelectedLessonId !== undefined ? propSetSelectedLessonId : setInternalSelectedLessonId;
  const isOutlineCollapsed = propIsOutlineCollapsed !== undefined ? propIsOutlineCollapsed : internalIsOutlineCollapsed;
  const setIsOutlineCollapsed = propSetIsOutlineCollapsed !== undefined ? propSetIsOutlineCollapsed : setInternalIsOutlineCollapsed;
  const [searchQuery, setSearchQuery] = useState('');
  const [openLessonMenuId, setOpenLessonMenuId] = useState<string | null>(null);
  const [pendingModules, setPendingModules] = useState<Module[]>([]);

  // Module Edit State
  const [modTitle, setModTitle] = useState('');
  const [modDifficulty, setModDifficulty] = useState<any>('Beginner');
  const [modTargetGroup, setModTargetGroup] = useState<'space' | 'practice'>('space');
  const [selectedModuleWorldId, setSelectedModuleWorldId] = useState<string>('world_1');

  // Lesson Edit State
  const [lesId, setLesId] = useState('');
  const [lesTitle, setLesTitle] = useState('');
  const [lesDescription, setLesDescription] = useState('');
  const [lesDifficulty, setLesDifficulty] = useState<any>('Easy');
  const [lesCategory, setLesCategory] = useState('Celestial Mechanics');
  const [lesXpReward, setLesXpReward] = useState<number>(50);
  const [lesChestIconUrl, setLesChestIconUrl] = useState('');
  const [lesLinkedUnitId, setLesLinkedUnitId] = useState('');

  // Bulk Image Generation State
  const [isGeneratingAllImages, setIsGeneratingAllImages] = useState(false);

  // Sync JSON text helper
  const syncJsonText = (ai: Module[], prac: Module[]) => {
    if (setRawJsonText) {
      setRawJsonText(JSON.stringify({ spaceCurriculum: ai, practiceCurriculum: prac }, null, 2));
    }
  };

  // Select lesson properties into form
  const selectLessonProperty = (modId: string, les: Lesson) => {
    soundManager.play('click');
    setSelectedModuleId(modId);
    setSelectedLessonId(les.id);
    setLesId(les.id);
    setLesTitle(les.title);
    setLesDescription(les.description || '');
    setLesCategory((les as any).category || 'Celestial Mechanics');
    setLesDifficulty(les.difficulty);
    setLesXpReward(les.xpReward || 50);
    setLesChestIconUrl((les as any).chest_icon_url || (les as any).chestIconUrl || '');
    setLesLinkedUnitId((les as any).linked_unit_id || (les as any).linkedUnitId || '');
    if (setActiveTab) setActiveTab('manage');
    if (setMobileViewMode) setMobileViewMode('editor');
  };

  // Add / Create Module
  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modTitle.trim()) {
      triggerNotification("Module Title is required!", "error");
      return;
    }

    const newId = 'm_' + Date.now().toString().slice(-6);
    const newModule: Module = {
      id: newId,
      order: modTargetGroup === 'space' ? modulesList.length : practiceModulesList.length,
      sort_order: modTargetGroup === 'space' ? modulesList.length : practiceModulesList.length,
      title: modTitle.trim(),
      difficulty: modDifficulty,
      world_id: selectedModuleWorldId,
      lessons: []
    };

    let updatedAi = [...modulesList];
    let updatedPrac = [...practiceModulesList];

    if (modTargetGroup === 'space') {
      updatedAi.push(newModule);
      setModulesList(updatedAi);
    } else {
      updatedPrac.push(newModule);
      setPracticeModulesList(updatedPrac);
    }

    saveCurriculumToStorage(updatedAi, updatedPrac)
      .then(() => {
        triggerNotification(`Created unit module "${modTitle.trim()}" successfully!`);
        soundManager.play('complete');
      })
      .catch((err: any) => {
        triggerNotification(`Unit created locally, but database sync failed: ${err.message}`, "error");
      });

    syncJsonText(updatedAi, updatedPrac);

    if (isSupabaseConfigured) {
      saveCustomModule({
        id: newId,
        title: modTitle.trim(),
        description: '',
        order: 0,
        world_id: selectedModuleWorldId,
        is_practice: modTargetGroup !== 'space'
      }).catch(console.error);
    }
    
    setSelectedModuleId(newId);
    setSelectedLessonId('');
    setModTitle('');
  };

  // Delete Module
  const handleDeleteModule = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerConfirm(
      "Delete Module",
      "Are you sure you want to delete this module and ALL its lessons? This action is permanent.",
      async () => {
        const updatedAi = modulesList.filter(m => m.id !== id);
        const updatedPrac = practiceModulesList.filter(m => m.id !== id);
        
        setModulesList(updatedAi);
        setPracticeModulesList(updatedPrac);
        saveCurriculumToStorage(updatedAi, updatedPrac);
        syncJsonText(updatedAi, updatedPrac);
        
        if (selectedModuleId === id) {
          setSelectedModuleId('');
          setSelectedLessonId('');
        }

        try {
          await deleteCustomModule(id);
          removeSyncedHash(id);
        } catch (delErr: any) {
          console.warn("Delete module database sync note:", delErr);
        }
        
        triggerNotification("Module deleted successfully!", "success");
        soundManager.play('incorrect');
      }
    );
  };

  // Save Module Edits
  const handleSaveModuleEdits = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedModuleId) return;

    const allMods = [...modulesList, ...practiceModulesList];
    const targetMod = allMods.find(m => m.id === selectedModuleId);
    if (!targetMod) return;

    const updatedModulePayload = {
      ...targetMod,
      title: modTitle.trim(),
      difficulty: modDifficulty,
      world_id: selectedModuleWorldId,
      order: targetMod.order ?? targetMod.sort_order ?? 0
    };

    try {
      if (isSupabaseConfigured) {
        await saveCustomModule(updatedModulePayload);
      }

      const updatedAi = modulesList.map(m => {
        if (m.id === selectedModuleId) {
          return { ...m, title: modTitle.trim(), difficulty: modDifficulty, world_id: selectedModuleWorldId };
        }
        return m;
      });

      const updatedPrac = practiceModulesList.map(m => {
        if (m.id === selectedModuleId) {
          return { ...m, title: modTitle.trim(), difficulty: modDifficulty, world_id: selectedModuleWorldId };
        }
        return m;
      });

      setModulesList(updatedAi);
      setPracticeModulesList(updatedPrac);
      const isSpace = modulesList.some(m => m.id === selectedModuleId);
      if (isSpace) {
        await saveCurriculumToStorage(updatedAi, updatedPrac);
      } else {
        await saveCurriculumToStorage(updatedAi, updatedPrac);
      }
      syncJsonText(updatedAi, updatedPrac);

      triggerNotification("Unit Module details updated successfully!", "success");
      soundManager.play('complete');
    } catch (err: any) {
      console.error("Module save failed:", err);
      triggerNotification("Failed to save unit module: " + (err?.message || "Unknown error"), "error");
      soundManager.play('incorrect');
    }
  };

  // Reorder Unit
  const reorderUnit = async (moduleId: string, direction: 'up' | 'down', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isPractice = practiceModulesList.some(m => m.id === moduleId);
    const currentList = isPractice ? [...practiceModulesList] : [...modulesList];
    
    const idx = currentList.findIndex(m => m.id === moduleId);
    if (idx === -1) return;

    const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= currentList.length) return;

    const temp = currentList[idx];
    currentList[idx] = currentList[nextIdx];
    currentList[nextIdx] = temp;

    const updatedList = currentList.map((m, i) => ({
      ...m,
      sort_order: i,
      order: i
    }));

    let updatedAi = modulesList;
    let updatedPrac = practiceModulesList;

    if (!isPractice) {
      updatedAi = updatedList;
      setModulesList(updatedList);
      setPendingModules(updatedList);
    } else {
      updatedPrac = updatedList;
      setPracticeModulesList(updatedList);
    }

    saveCurriculumToStorage(updatedAi, updatedPrac);
    syncJsonText(updatedAi, updatedPrac);

    try {
      await batchUpdateModules(updatedList);
    } catch (saveErr) {
      console.warn("Failed persisting batch module update:", saveErr);
    }

    triggerNotification("Unit successfully reordered!", "success");
    soundManager.play('complete');
  };

  // Move Module by Index
  const moveModule = (idx: number, direction: 'up' | 'down') => {
    const isModuleInSelectedWorld = (mod: Module) => {
      const isW1 = selectedAdminWorldId === 'world_1';
      if (mod.world_id === selectedAdminWorldId) return true;
      if (isW1 && (!mod.world_id || mod.world_id === 'world_1')) return true;
      return false;
    };
    const visibleSpace = pendingModules.filter(isModuleInSelectedWorld);
    if (idx >= 0 && idx < visibleSpace.length) {
      reorderUnit(visibleSpace[idx].id, direction);
    }
  };

  // Save Order
  const saveOrder = async () => {
    if (!window.confirm('Save this unit order to the live database? Real students will see the new order immediately.')) return;
    try {
      const modulesToUpdate = pendingModules.map((m, idx) => ({
        ...m,
        sort_order: idx,
        order: idx 
      }));
      setPendingModules(modulesToUpdate);
      setModulesList(modulesToUpdate);
      await saveCurriculumToStorage(modulesToUpdate, practiceModulesList);
      await batchUpdateModules(modulesToUpdate);
      triggerNotification("New unit order saved successfully!", "success");
      soundManager.play('complete');
    } catch (err) {
      triggerNotification("Failed to save new order.", "error");
      soundManager.play('incorrect');
    }
  };

  // Create Lesson
  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId) {
      triggerNotification("Please select or create a target module first!", "error");
      return;
    }
    if (!lesTitle.trim()) {
      triggerNotification("Lesson Title is required!", "error");
      return;
    }

    const finalLesId = lesId.trim() || 'les_' + Date.now().toString().slice(-6);
    
    const newLesson: Lesson = {
      id: finalLesId,
      title: lesTitle.trim(),
      description: lesDescription.trim() || "Discover amazing facts with step-by-step challenges.",
      difficulty: lesDifficulty,
      xpReward: Number(lesXpReward) || 50,
      challenges: []
    };
    (newLesson as any).category = lesCategory.trim() || "Cosmos Era";

    let updatedAi = [...modulesList];
    let updatedPrac = [...practiceModulesList];
    let found = false;

    updatedAi = updatedAi.map(m => {
      if (m.id === selectedModuleId) {
        found = true;
        return { ...m, lessons: [...m.lessons, newLesson] };
      }
      return m;
    });

    if (!found) {
      updatedPrac = updatedPrac.map(m => {
        if (m.id === selectedModuleId) {
          found = true;
          return { ...m, lessons: [...m.lessons, newLesson] };
        }
        return m;
      });
    }

    saveCurriculumToStorage(updatedAi, updatedPrac)
      .then(() => {
        triggerNotification(`Created lesson "${lesTitle.trim()}" successfully!`);
        soundManager.play('complete');
      })
      .catch((err: any) => {
        triggerNotification(`Lesson created locally, but database sync failed: ${err.message}`, "error");
      });

    setModulesList(updatedAi);
    setPracticeModulesList(updatedPrac);
    syncJsonText(updatedAi, updatedPrac);
    
    setSelectedLessonId(finalLesId);
    setLesId('');
    setLesTitle('');
    setLesDescription('');
    setLesCategory('Celestial Mechanics');
    setLesXpReward(50);
  };

  // Delete Lesson
  const handleDeleteLesson = (moduleId: string, lessonId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerConfirm(
      "Delete Lesson",
      "Are you sure you want to delete this lesson and all its tasks? This action is permanent.",
      async () => {
        let updatedAi = [...modulesList].map(m => {
          return { 
            ...m, 
            lessons: (m.lessons || []).filter(l => l.id !== lessonId) 
          };
        });

        let updatedPrac = [...practiceModulesList].map(m => {
          return { 
            ...m, 
            lessons: (m.lessons || []).filter(l => l.id !== lessonId) 
          };
        });

        const isPractice = practiceModulesList.some(m => m.id === moduleId);
        if (isPractice) {
          saveCurriculumToStorage(updatedAi, updatedPrac);
        } else {
          saveCurriculumToStorage(updatedAi, updatedPrac);
        }
        setModulesList(updatedAi);
        setPracticeModulesList(updatedPrac);
        syncJsonText(updatedAi, updatedPrac);
        
        if (selectedLessonId === lessonId) {
          setSelectedLessonId('');
        }

        try {
          await deleteCustomLesson(lessonId);
          removeSyncedHash(lessonId);
        } catch (delErr: any) {
          console.warn("Delete lesson database sync note:", delErr);
        }
        
        triggerNotification("Lesson deleted successfully!", "success");
        soundManager.play('incorrect');
      }
    );
  };

  // Save Lesson Edits
  const handleSaveLessonEdits = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedModuleId || !selectedLessonId) return;

    const allMods = [...modulesList, ...practiceModulesList];
    const targetMod = allMods.find(m => m.id === selectedModuleId);
    const targetLes = targetMod?.lessons?.find(l => l.id === selectedLessonId);
    if (!targetLes) return;

    const updatedLessonData: Lesson = {
      ...targetLes,
      title: lesTitle.trim(),
      description: lesDescription.trim(),
      difficulty: lesDifficulty,
      xpReward: Number(lesXpReward) || 50,
      chest_icon_url: lesChestIconUrl.trim() || undefined,
      chestIconUrl: lesChestIconUrl.trim() || undefined,
      linked_unit_id: lesLinkedUnitId || undefined,
      linkedUnitId: lesLinkedUnitId || undefined
    };
    (updatedLessonData as any).category = lesCategory.trim();

    try {
      const savedLesson = await saveSingleLesson(selectedModuleId, updatedLessonData);

      const updateProps = (l: Lesson) => (l.id === selectedLessonId ? savedLesson : l);

      const updatedAi = modulesList.map(m => {
        if (m.id === selectedModuleId) {
          return { ...m, lessons: m.lessons.map(updateProps) };
        }
        return m;
      });

      const updatedPrac = practiceModulesList.map(m => {
        if (m.id === selectedModuleId) {
          return { ...m, lessons: m.lessons.map(updateProps) };
        }
        return m;
      });

      setModulesList(updatedAi);
      setPracticeModulesList(updatedPrac);
      syncJsonText(updatedAi, updatedPrac);

      triggerNotification("Lesson details updated and saved to database successfully!", "success");
      soundManager.play('complete');
    } catch (err: any) {
      console.error("Lesson save failed:", err);
      triggerNotification("Failed to save lesson: " + (err?.message || "Unknown error"), "error");
      soundManager.play('incorrect');
    }
  };

  // Duplicate Lesson
  const handleDuplicateLesson = (moduleId: string, lesson: Lesson) => {
    const newLessonId = 'les_' + Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 5);
    const clonedChallenges = (lesson.challenges || []).map((c, idx) => ({
      ...c,
      id: 'scr_' + (Date.now() + idx) + '_' + Math.random().toString(36).slice(2, 7)
    }));
    const clonedLesson: Lesson = {
      ...lesson,
      id: newLessonId,
      title: `${lesson.title} (Copy)`,
      challenges: clonedChallenges
    };

    const updatedAi = modulesList.map(m => {
      if (m.id === moduleId) {
        const idx = m.lessons.findIndex(l => l.id === lesson.id);
        const lessonsCopy = [...m.lessons];
        if (idx !== -1) {
          lessonsCopy.splice(idx + 1, 0, clonedLesson);
        } else {
          lessonsCopy.push(clonedLesson);
        }
        return { ...m, lessons: lessonsCopy };
      }
      return m;
    });

    const updatedPrac = practiceModulesList.map(m => {
      if (m.id === moduleId) {
        const idx = m.lessons.findIndex(l => l.id === lesson.id);
        const lessonsCopy = [...m.lessons];
        if (idx !== -1) {
          lessonsCopy.splice(idx + 1, 0, clonedLesson);
        } else {
          lessonsCopy.push(clonedLesson);
        }
        return { ...m, lessons: lessonsCopy };
      }
      return m;
    });

    setModulesList(updatedAi);
    setPracticeModulesList(updatedPrac);
    saveCurriculumToStorage(updatedAi, updatedPrac)
      .then(() => {
        triggerNotification(`Duplicated lesson "${lesson.title}" successfully!`, "success");
        soundManager.play('complete');
      })
      .catch((err: any) => {
        triggerNotification(`Lesson duplicated locally, but database sync failed: ${err.message}`, "error");
      });
    syncJsonText(updatedAi, updatedPrac);
    
    selectLessonProperty(moduleId, clonedLesson);
  };

  // Reorder Lesson
  const reorderLesson = (moduleId: string, lessonId: string, direction: 'up' | 'down', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updatedAi = [...modulesList];
    let updatedPrac = [...practiceModulesList];
    let found = false;

    const processList = (list: Module[]) => {
      return list.map(m => {
        if (m.id === moduleId) {
          found = true;
          const lesList = [...m.lessons];
          const idx = lesList.findIndex(l => l.id === lessonId);
          if (idx !== -1) {
            const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (nextIdx >= 0 && nextIdx < lesList.length) {
              const temp = lesList[idx];
              lesList[idx] = lesList[nextIdx];
              lesList[nextIdx] = temp;
            }
          }
          return { ...m, lessons: lesList };
        }
        return m;
      });
    };

    updatedAi = processList(updatedAi);
    if (!found) {
      updatedPrac = processList(updatedPrac);
    }

    setModulesList(updatedAi);
    setPracticeModulesList(updatedPrac);
    if (direction === 'up') {
      saveCurriculumToStorage(updatedAi, updatedPrac);
    } else {
      saveCurriculumToStorage(updatedAi, updatedPrac);
    }
    syncJsonText(updatedAi, updatedPrac);
    triggerNotification("Lesson successfully reordered!", "success");
    soundManager.play('complete');
  };

  // Add Unit Instantly
  const addUnitInstantly = (assignedWorldId?: string, targetGroup: 'space' | 'practice' = 'space') => {
    const count = targetGroup === 'space' ? modulesList.length : practiceModulesList.length;
    const newId = 'm_' + Date.now().toString().slice(-6);
    const newModule: Module = {
      id: newId,
      order: count,
      sort_order: count,
      title: `Unit ${count + 1}: Stellar AI Engineering`,
      difficulty: 'Beginner',
      world_id: assignedWorldId || selectedAdminWorldId || 'world_1',
      lessons: []
    };

    let updatedAi = [...modulesList];
    let updatedPrac = [...practiceModulesList];

    if (targetGroup === 'space') {
      updatedAi.push(newModule);
      setModulesList(updatedAi);
    } else {
      updatedPrac.push(newModule);
      setPracticeModulesList(updatedPrac);
    }

    saveCurriculumToStorage(updatedAi, updatedPrac);
    syncJsonText(updatedAi, updatedPrac);

    if (isSupabaseConfigured) {
      saveCustomModule({
        id: newId,
        title: newModule.title,
        description: '',
        order: count,
        world_id: assignedWorldId,
        is_practice: targetGroup !== 'space'
      }).catch(console.error);
    }

    setSelectedModuleId(newId);
    setSelectedLessonId('');
    if (setActiveTab) setActiveTab('manage');
    if (setMobileViewMode) setMobileViewMode('editor');
    triggerNotification("Created dynamic Unit instantly! Rename it in the properties pane.", "success");
    soundManager.play('complete');
  };

  // Add Lesson Instantly
  const addLessonInstantly = (moduleId: string) => {
    const targetMod = [...modulesList, ...practiceModulesList].find(m => m.id === moduleId);
    if (!targetMod) return;
    const count = targetMod.lessons.length;
    const newId = 'les_' + Date.now().toString().slice(-6);
    const newLesson: Lesson = {
      id: newId,
      title: `📚 Lesson ${count + 1}: Stellar Mechanics`,
      description: "Understand physics-grounded AI orbits and facts with step-by-step challenges.",
      difficulty: 'Easy',
      xpReward: 50,
      challenges: []
    };
    (newLesson as any).category = "Cosmos Era";

    const updateLessonsInList = (list: Module[]) => list.map(m => {
      if (m.id === moduleId) {
        return { ...m, lessons: [...m.lessons, newLesson] };
      }
      return m;
    });

    const updatedAi = updateLessonsInList([...modulesList]);
    const updatedPrac = updateLessonsInList([...practiceModulesList]);

    setModulesList(updatedAi);
    setPracticeModulesList(updatedPrac);
    saveCurriculumToStorage(updatedAi, updatedPrac);
    syncJsonText(updatedAi, updatedPrac);

    setSelectedModuleId(moduleId);
    setSelectedLessonId(newId);
    if (setActiveTab) setActiveTab('manage');
    if (setMobileViewMode) setMobileViewMode('editor');
    triggerNotification("Created dynamic Lesson instantly! Adjust properties on the right.", "success");
    soundManager.play('complete');
  };

  // JSON Copy & Export helpers
  const copyLessonJsonToClipboard = (lesson: any) => {
    const cleanJson = cleanEntityForExport('lesson', lesson);
    navigator.clipboard.writeText(JSON.stringify(cleanJson, null, 2));
    triggerNotification("Lesson JSON copied to clipboard!", "success");
    soundManager.play('complete');
  };

  const exportLessonAsJsonFile = (lesson: any) => {
    const cleanJson = cleanEntityForExport('lesson', lesson);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanJson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const filename = (lesson.title || 'lesson').toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.json';
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotification("Lesson JSON file downloaded!", "success");
    soundManager.play('complete');
  };

  // Bulk Generate Images
  const handleBulkGenerateImages = async () => {
    setIsGeneratingAllImages(true);
    try {
      const response = await fetch("/api/generate-lesson-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateAllMissing: true })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to bulk generate images");
      }
      triggerNotification("Batch generation triggered successfully!", "success");
      soundManager.play('complete');
    } catch (err: any) {
      triggerNotification("Bulk generation error: " + err.message, "error");
      soundManager.play('incorrect');
    } finally {
      setIsGeneratingAllImages(false);
    }
  };

  return {
    selectedModuleId,
    setSelectedModuleId,
    selectedLessonId,
    setSelectedLessonId,
    isOutlineCollapsed,
    setIsOutlineCollapsed,
    searchQuery,
    setSearchQuery,
    openLessonMenuId,
    setOpenLessonMenuId,
    pendingModules,
    setPendingModules,
    modTitle,
    setModTitle,
    modDifficulty,
    setModDifficulty,
    modTargetGroup,
    setModTargetGroup,
    selectedModuleWorldId,
    setSelectedModuleWorldId,
    lesId,
    setLesId,
    lesTitle,
    setLesTitle,
    lesDescription,
    setLesDescription,
    lesDifficulty,
    setLesDifficulty,
    lesCategory,
    setLesCategory,
    lesXpReward,
    setLesXpReward,
    lesChestIconUrl,
    setLesChestIconUrl,
    lesLinkedUnitId,
    setLesLinkedUnitId,
    isGeneratingAllImages,
    selectLessonProperty,
    handleCreateModule,
    handleDeleteModule,
    handleSaveModuleEdits,
    reorderUnit,
    moveModule,
    saveOrder,
    handleCreateLesson,
    handleDeleteLesson,
    handleSaveLessonEdits,
    handleDuplicateLesson,
    reorderLesson,
    addUnitInstantly,
    addLessonInstantly,
    copyLessonJsonToClipboard,
    exportLessonAsJsonFile,
    handleBulkGenerateImages
  };
}
