import { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Check, AlertCircle } from 'lucide-react';

interface HotSpot {
  id: string;
  label: string;
  topPct: number;  // absolute positioning coordinates
  leftPct: number;
  widthPct: number;
  heightPct: number;
  isCorrectSpot: boolean;
  explanation: string;
}

interface TapCorrectAreaProps {
  imageUrl: string;
  hotspots: HotSpot[];
  onSelect: (spotId: string) => void;
  selectedOption: string | null;
  isChecked: boolean;
  isCorrect: boolean;
}

export default function TapCorrectArea({
  imageUrl,
  hotspots,
  onSelect,
  selectedOption,
  isChecked,
  isCorrect
}: TapCorrectAreaProps) {
  const [hoveredSpot, setHoveredSpot] = useState<string | null>(null);

  const selectedSpotObj = hotspots.find(h => h.id === selectedOption);

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center justify-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-slate-400 animate-pulse" />
          <span>Interactive Hotspot Search: Tap the area showing the AI mistake!</span>
        </p>
      </div>

      {/* Main Image Stage */}
      <div className="relative w-full max-w-sm ml-auto mr-auto aspect-video md:aspect-[4/3] bg-slate-100 rounded-3xl overflow-hidden border-4 border-slate-200 shadow-lg">
        <img
          src={imageUrl}
          alt="Spot the Hallucination"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />

        {/* Absolute hot zone buttons */}
        {hotspots.map((spot) => {
          const isSelected = selectedOption === spot.id;
          const isCorrectSpot = spot.isCorrectSpot;

          let blockClass = 'border-dashed border-2 border-transparent hover:border-white/55 bg-black/5 hover:bg-black/10';
          if (isSelected) {
            blockClass = isChecked
              ? isCorrect
                ? 'border-green-500 bg-green-500/20'
                : 'border-red-500 bg-red-500/20'
              : 'border-chikoo-blue-400 bg-chikoo-blue-500/20';
          } else if (isChecked && isCorrectSpot) {
            blockClass = 'border-green-500 bg-green-500/10 pointer-events-none';
          } else if (isChecked) {
            blockClass = 'opacity-20 pointer-events-none';
          }

          return (
            <button
              key={spot.id}
              disabled={isChecked}
              onClick={() => onSelect(spot.id)}
              onMouseEnter={() => !isChecked && setHoveredSpot(spot.id)}
              onMouseLeave={() => setHoveredSpot(null)}
              style={{
                position: 'absolute',
                top: `${spot.topPct}%`,
                left: `${spot.leftPct}%`,
                width: `${spot.widthPct}%`,
                height: `${spot.heightPct}%`,
              }}
              className={`rounded-2xl transition-all flex items-center justify-center cursor-pointer select-none ${blockClass}`}
            >
              {/* Tap target marker */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-md border-2 border-white transition-all ${
                isSelected 
                  ? isChecked
                    ? isCorrect
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                    : 'bg-chikoo-blue-500 text-white animate-scale'
                  : isChecked && isCorrectSpot
                    ? 'bg-green-500 text-white'
                    : 'bg-black/40 text-white'
              }`}>
                {isChecked ? (
                  isCorrectSpot ? <Check className="w-4 h-4" strokeWidth={3} /> : <AlertCircle className="w-4 h-4" />
                ) : (
                  <span>{spot.label}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive feedback explaining current selection */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[60px] flex items-center justify-center text-center">
        {selectedSpotObj ? (
          <div className="space-y-1">
            <p className="text-xs font-black uppercase text-slate-500">Selected Region: {selectedSpotObj.label}</p>
            {isChecked && (
              <p className={`text-sm font-bold ${selectedSpotObj.isCorrectSpot ? 'text-green-700' : 'text-red-700'}`}>
                {selectedSpotObj.explanation}
              </p>
            )}
            {!isChecked && (
              <p className="text-sm font-bold text-slate-700">Tapped Area. Ready to check parameters!</p>
            )}
          </div>
        ) : (
          <p className="text-sm font-bold text-slate-400">Tap anywhere on the image above containing mistakes!</p>
        )}
      </div>
    </div>
  );
}
