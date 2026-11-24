import React, { useState, useMemo } from 'react';
import { 
  Volume2, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Filter, 
  ListOrdered,
  Layers,
  BookOpen
} from 'lucide-react';
import { Module, Lesson, Challenge } from '../../lib/content';
import { soundManager } from '../../lib/sounds';
import { extractScreenText } from '../../hooks/useScreenAudio';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface BulkNarrationQueueProps {
  modulesList: Module[];
  practiceModulesList: Module[];
  lessonTitle?: string;
  onSaveCurriculum?: (updatedSpace: Module[], updatedPrac: Module[]) => void;
  triggerNotification?: (msg: string, type?: 'success' | 'error') => void;
}

interface MissingVoiceItem {
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  screen: Challenge;
  screenIndex: number;
  missingLanguages: ('english' | 'hinglish' | 'marathi')[];
}

export const BulkNarrationQueue: React.FC<BulkNarrationQueueProps> = ({
  modulesList,
  practiceModulesList,
  triggerNotification
}) => {
  const [selectedLang, setSelectedLang] = useState<'english' | 'hinglish' | 'marathi' | 'all'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalInQueue, setTotalInQueue] = useState(0);
  const [currentProcessingItem, setCurrentProcessingItem] = useState<string | null>(null);

  // Scan curriculum modules for screens missing narrations
  const missingItems = useMemo(() => {
    const allModules = [...modulesList, ...practiceModulesList];
    const items: MissingVoiceItem[] = [];

    allModules.forEach((mod) => {
      (mod.lessons || []).forEach((les) => {
        (les.challenges || []).forEach((scr, idx) => {
          const narrations = scr.audioNarrations || {};
          const missing: ('english' | 'hinglish' | 'marathi')[] = [];

          if (!narrations.english?.url) missing.push('english');
          if (!narrations.hinglish?.url) missing.push('hinglish');
          if (!narrations.marathi?.url) missing.push('marathi');

          if (missing.length > 0) {
            if (selectedLang === 'all' || missing.includes(selectedLang as any)) {
              items.push({
                moduleId: mod.id,
                moduleTitle: mod.title,
                lessonId: les.id,
                lessonTitle: les.title,
                screen: scr,
                screenIndex: idx,
                missingLanguages: missing
              });
            }
          }
        });
      });
    });

    return items;
  }, [modulesList, practiceModulesList, selectedLang]);

  const handleGenerateSingle = async (item: MissingVoiceItem, lang: 'english' | 'hinglish' | 'marathi') => {
    try {
      soundManager.play('click');
      const extractedText = extractScreenText(item.screen);
      if (!extractedText.trim()) {
        triggerNotification(`Screen ${item.screen.id} has no readable text for narration.`, 'error');
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.access_token) {
            headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
          }
        } catch (_) {}
      }

      const response = await fetch('/api/screen-audio/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          screenId: item.screen.id,
          screenType: item.screen.type,
          screenText: extractedText,
          language: lang,
          lessonId: item.lessonId,
          lessonTitle: item.lessonTitle
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.url) {
        soundManager.play('complete');
        triggerNotification(`Generated ${lang} narration for ${item.screen.id}!`, 'success');
      } else {
        throw new Error(data.error || 'Failed to generate audio URL');
      }
    } catch (err: any) {
      console.error('Bulk narration error:', err);
      soundManager.play('incorrect');
      triggerNotification(`Failed generating ${lang} narration: ${err.message}`, 'error');
    }
  };

  const handleProcessQueue = async () => {
    if (missingItems.length === 0) return;
    setIsProcessing(true);
    setProcessedCount(0);
    setTotalInQueue(missingItems.length);

    for (let i = 0; i < missingItems.length; i++) {
      const item = missingItems[i];
      setCurrentProcessingItem(`${item.lessonTitle} - Screen ${item.screenIndex + 1}`);

      for (const lang of item.missingLanguages) {
        if (selectedLang !== 'all' && lang !== selectedLang) continue;
        await handleGenerateSingle(item, lang);
      }

      setProcessedCount(i + 1);
    }

    setIsProcessing(false);
    setCurrentProcessingItem(null);
    triggerNotification('Batch narration generation completed!', 'success');
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600">
              <Volume2 size={18} />
            </div>
            <h3 className="text-base font-black text-slate-900">Bulk Audio Narration Queue</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Scan and batch-generate AI speech audio for all lesson screens missing audio narrations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Filter size={12} className="text-slate-400 ml-1.5" />
            {(['all', 'english', 'hinglish', 'marathi'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  soundManager.play('click');
                  setSelectedLang(lang);
                }}
                className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                  selectedLang === lang
                    ? 'bg-white text-indigo-700 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={isProcessing || missingItems.length === 0}
            onClick={handleProcessQueue}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Processing ({processedCount}/{totalInQueue})</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Generate Queue ({missingItems.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {isProcessing && (
        <div className="p-4 bg-indigo-50 border border-indigo-150 rounded-2xl space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-indigo-600" />
              Generating audio: {currentProcessingItem}
            </span>
            <span>{Math.round((processedCount / totalInQueue) * 100)}%</span>
          </div>
          <div className="w-full bg-indigo-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(processedCount / totalInQueue) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Queue Items Table */}
      {missingItems.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-3">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <h4 className="text-sm font-black text-slate-900">All Narrations Up To Date!</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All active screens in your curriculum have registered audio narrations for the selected language filter ({selectedLang}).
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-3 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
            <span className="text-[10px] font-mono font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <ListOrdered size={12} />
              <span>Screens Pending Audio ({missingItems.length})</span>
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
            {missingItems.map((item, idx) => (
              <div
                key={`${item.screen.id}_${idx}`}
                className="p-3.5 hover:bg-slate-50/80 transition flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <BookOpen size={10} />
                      {item.lessonTitle}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      Screen ID: {item.screen.id}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">
                    {item.screen.question || 'Content Screen'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.missingLanguages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleGenerateSingle(item, lang)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-lg text-[10px] font-black uppercase border border-slate-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw size={10} />
                      <span>{lang}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkNarrationQueue;
