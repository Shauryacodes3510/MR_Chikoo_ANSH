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
