import React from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { SyncStatusBadgeProps } from './types';

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ status, onRetry, className = '' }) => {
  if (status.state === 'idle') return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {status.state === 'saving' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-3xs animate-pulse">
          <Loader2 size={12} className="animate-spin text-amber-600" />
          Saving...
        </span>
      )}
      {status.state === 'saved' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-3xs">
          <Check size={12} className="text-emerald-600" />
          Saved ✓
        </span>
      )}
      {status.state === 'error' && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 shadow-3xs transition cursor-pointer"
          title={status.message || "Click to retry saving changes"}
        >
          <AlertCircle size={12} className="text-rose-600" />
          Save failed ✗ (click to retry)
        </button>
      )}
    </div>
  );
};

export default SyncStatusBadge;
