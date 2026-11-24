
type ErrorCategory = 'auth' | 'permission' | 'network' | 'missing_data' | 'server';

interface StructuredError {
  operation: string;
  component: string;
  category: ErrorCategory;
  error: string;
  timestamp: string;
  context?: Record<string, any>;
}

export const assertUniqueKeys = <T>(
  items: T[],
  keySelector: (item: T) => string | number,
  listName: string
) => {
  if (!import.meta.env.DEV) return;
  const seen = new Set();
  for (const item of items) {
    const key = keySelector(item);
    if (seen.has(key)) {
      console.error(`[DUPLICATE_DATA] list=${listName}, key=${key}`, item);
      // Removed: throw new Error(`Duplicate key found: ${key} in ${listName}`);
    }
    seen.add(key);
  }
};
export const logProductionError = (
  operation: string,
  component: string,
  category: ErrorCategory,
  err: any,
  context?: Record<string, any>
) => {
  const structuredError: StructuredError = {
    operation,
    component,
    category,
    error: err?.message || String(err),
    timestamp: new Date().toISOString(),
    context: sanitizeContext(context || {}),
  };

  // Structured logging to console/backend
  console.error('[PRODUCTION_ERROR]', JSON.stringify(structuredError));
  
  // Potential integration with external monitoring tool goes here
};

const sanitizeContext = (context: Record<string, any>): Record<string, any> => {
  const secrets = ['password', 'hash', 'key', 'token', 'secret', 'authorization'];
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(context)) {
    if (secrets.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeContext(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};
