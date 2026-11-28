import type { ScreenHandler } from '../types';
import { mcqHandler } from './mcq';
import { contentHandler } from './content';

/** Registry of supported actions. Adding a screen type = add a handler here. */
export const HANDLERS: readonly ScreenHandler[] = [mcqHandler, contentHandler];

export const findHandlerByAction = (actionName: string): ScreenHandler | undefined =>
  HANDLERS.find(h => h.actionName === actionName);
