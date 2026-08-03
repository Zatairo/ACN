import { db } from '../api/base44Client';


export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
export const MASTERY_THRESHOLD = 7;
export const ACTIVITIES_PER_LESSON = 10;
export const LEVEL_UNLOCK_AVG = 0.7;

export function calculateMastery(activitiesPassed) {
  return activitiesPassed >= MASTERY_THRESHOLD;
}

export function lessonScore(lesson) {
  return (lesson?.activities_passed || 0) / ACTIVITIES_PER_LESSON;
}

export async function checkLevelTransition(profile) {
  if (!profile) return null;
  try {
    const levelLessons = await db.entities.Lesson.filter({ level: profile.english_level });
    if (levelLessons.length === 0) return null;

    const totalActivities = levelLessons.length * ACTIVITIES_PER_LESSON;
    const totalPassed = levelLessons.reduce((sum, l) => sum + (l.activities_passed || 0), 0);
    const avg = totalPassed / totalActivities;

    if (avg >= LEVEL_UNLOCK_AVG) {
      const idx = LEVELS.indexOf(profile.english_level);
      const nextLevel = LEVELS[idx + 1];
      if (nextLevel) {
        const unlocked = profile.levels_unlocked || [profile.english_level];
        const newUnlocked = unlocked.includes(nextLevel)
          ? [...unlocked]
          : [...unlocked, nextLevel];
        await db.entities.StudentProfile.update(profile.id, {
          english_level: nextLevel,
          levels_unlocked: newUnlocked,
        });
        return nextLevel;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function levelLabel(level) {
  return {
    A1: 'Principiante',
    A2: 'Elemental',
    B1: 'Intermedio',
    B2: 'Intermedio Alto',
    C1: 'Avanzado',
  }[level] || level;
}

