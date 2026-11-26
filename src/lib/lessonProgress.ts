/**
 * Progress-based unlocking.
 *
 * The "active" lesson is the first not-yet-completed lesson that comes AFTER the
 * furthest lesson the user has already completed (progress is read from
 * profiles.completed_lessons). Completed lessons are always shown as completed,
 * and lessons that sit before the user's furthest progress stay open, so
 * re-ordering modules or inserting a new lesson can never re-lock a user's progress.
 *
 * Returns an index into `flat`; `flat.length` means "everything is completed".
 */
export function getActiveLessonIdx(
  flat: ReadonlyArray<{ id: string }>,
  completedLessons: ReadonlyArray<string>
): number {
  if (flat.length === 0) return 0;
  const done = new Set(completedLessons);

  let furthestDone = -1;
  for (let i = 0; i < flat.length; i++) {
    if (done.has(flat[i].id)) furthestDone = i;
  }

  for (let i = furthestDone + 1; i < flat.length; i++) {
    if (!done.has(flat[i].id)) return i;
  }

  // Nothing left after the furthest completed lesson: surface a skipped one, else all done
  const firstOpen = flat.findIndex(l => !done.has(l.id));
  return firstOpen === -1 ? flat.length : firstOpen;
}
