/**
 * Utility helpers for Curriculum Studio (export data cleaning, etc.)
 */

export function cleanEntityForExport(type: 'screen' | 'lesson' | 'unit' | 'world', data: any): any {
  if (type === 'screen') {
    const { id, created_at, updated_at, createdAt, updatedAt, ...rest } = data;
    return rest;
  }
  
  if (type === 'lesson') {
    return {
      lessonTitle: data.title || data.lessonTitle || 'Lesson',
      lessonDescription: data.description || data.lessonDescription || '',
      difficulty: data.difficulty || 'Easy',
      xp: data.xpReward || 50,
      isChallenge: data.isChallenge,
      isChest: data.isChest,
      isBonus: data.isBonus,
      category: data.category || 'Cosmos Era',
      screens: (data.challenges || []).map((c: any) => cleanEntityForExport('screen', c))
    };
  }

  if (type === 'unit') {
    return {
      unitTitle: data.title || data.unitTitle || 'Unit',
      unitDescription: data.description || data.unitDescription || '',
      difficulty: data.difficulty || 'Easy',
      world_id: data.world_id || '256e5b30-e5ec-45ba-a024-7318c96eb623',
      lessons: (data.lessons || []).map((l: any) => cleanEntityForExport('lesson', l))
    };
  }

  if (type === 'world') {
    const worldUnits = data.units || [];
    return {
      worldId: data.id || data.worldId || 'world_1',
      worldNumber: data.world_number || data.worldNumber || 1,
      worldTitle: data.title || data.worldTitle || 'World',
      worldDescription: data.description || data.worldDescription || '',
      units: worldUnits.map((u: any) => cleanEntityForExport('unit', u))
    };
  }
  return data;
}

export const getComicValidation = (bodyText: string, mediaUrls: string) => {
  const dialogues = bodyText ? bodyText.split(',').map(s => s.trim()) : [];
  const images = mediaUrls ? mediaUrls.split(',').map(s => s.trim()) : [];

  let dialogueStatus = { type: 'success' as 'success' | 'warning' | 'error', message: '' };
  if (!bodyText) {
    dialogueStatus = { type: 'error', message: 'Comic Strip Scene requires exactly 3 panels.' };
  } else if (dialogues.length < 3) {
    dialogueStatus = { type: 'error', message: `Only ${dialogues.length} panel${dialogues.length > 1 ? 's' : ''} detected. Comic Strip Scene requires exactly 3 panels.` };
  } else {
    const emptyIdx = dialogues.findIndex((val, idx) => idx < 3 && val === '');
    if (emptyIdx !== -1) {
      dialogueStatus = { type: 'error', message: `Panel ${emptyIdx + 1} dialogue is empty.` };
    } else if (dialogues.length > 3) {
      dialogueStatus = { type: 'warning', message: 'Only the first 3 values will be used.' };
    } else {
      dialogueStatus = { type: 'success', message: '3 / 3 Panels Ready' };
    }
  }

  let imageStatus = { type: 'success' as 'success' | 'warning' | 'error', message: '' };
  if (!mediaUrls) {
    imageStatus = { type: 'error', message: 'Comic Strip Scene requires exactly 3 panels.' };
  } else if (images.length < 3) {
    imageStatus = { type: 'error', message: `Only ${images.length} panels detected. Comic Strip Scene requires exactly 3 panels.` };
  } else {
    const emptyIdx = images.findIndex((val, idx) => idx < 3 && val === '');
    if (emptyIdx !== -1) {
      imageStatus = { type: 'error', message: `Panel ${emptyIdx + 1} image missing.` };
    } else if (images.length > 3) {
      imageStatus = { type: 'warning', message: 'Only the first 3 values will be used.' };
    } else {
      imageStatus = { type: 'success', message: '3 / 3 Panels Ready' };
    }
  }

  return { dialogueStatus, imageStatus };
};

