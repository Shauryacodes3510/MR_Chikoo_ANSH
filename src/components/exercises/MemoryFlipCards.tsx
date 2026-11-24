import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Layers } from 'lucide-react';
import { soundManager } from '../../lib/sounds';

interface CardItem {
  id: string; // unique card id like "concept1", "example1"
  pairId: string; // shared pair ID like "pair1"
  content: string; // visible text or emoji
  type: 'concept' | 'example';
}

interface MemoryFlipCardsProps {
  cards: CardItem[];
  onSelect: (completed: boolean) => void;
  isChecked: boolean;
}

export default function MemoryFlipCards({
  cards: initialCards,
  onSelect,
  isChecked
}: MemoryFlipCardsProps) {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<string[]>([]); // pairIds

  // Mix and populate when initialized
  useEffect(() => {
    // Generate fresh scrambled list
    const scrambled = [...initialCards].sort(() => Math.random() - 0.5);
    setCards(scrambled);
    setFlipped([]);
    setSolved([]);
  }, [initialCards]);

  const handleCardClick = (index: number) => {
    if (isChecked || flipped.includes(index) || solved.includes(cards[index].pairId)) return;

    soundManager.play('click');

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const firstCard = cards[newFlipped[0]];
      const secondCard = cards[newFlipped[1]];

      if (firstCard.pairId === secondCard.pairId && firstCard.id !== secondCard.id) {
        // MATCH!
        setSolved(prev => {
          const updated = [...prev, firstCard.pairId];
          // Check if all pairs are solved
          const totalPairsCount = initialCards.length / 2;
          if (updated.length === totalPairsCount) {
            onSelect(true); // completed successfully
          }
          return updated;
        });
        setFlipped([]);
        soundManager.play('correct');
      } else {
        // NO MATCH, close cards back
        setTimeout(() => {
          setFlipped([]);
        }, 1200);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-6 w-full max-w-lg mx-auto">
        <div className="text-center">
          <p className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center justify-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span>Match companion cards of similar concepts!</span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4.5 w-full">
          {cards.map((card, idx) => {
            const isCardFlipped = flipped.includes(idx);
            const isCardSolved = solved.includes(card.pairId);
            const showFront = isCardFlipped || isCardSolved || isChecked;

            let blockClass = 'bg-white border-2 border-slate-200 text-slate-700 shadow-[0_5px_0_#f1f5f9]';
            if (isCardSolved) {
              blockClass = 'bg-emerald-50 border-2 border-emerald-400 text-emerald-900 shadow-[0_5px_0_#a7f3d0] ring-4 ring-emerald-100';
            } else if (isCardFlipped) {
              blockClass = 'bg-indigo-50 border-2 border-indigo-400 text-indigo-950 shadow-[0_5px_0_#c7d2fe] ring-4 ring-indigo-100';
            } else {
              blockClass = 'bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-400 shadow-[0_5px_0_#f1f5f9] cursor-pointer';
            }

            return (
              <motion.div
                key={`mem-card-${idx}-${card.id}`}
                whileHover={!showFront ? { y: -3, scale: 1.025 } : {}}
                whileTap={!showFront ? { y: 1, scale: 0.975 } : {}}
                onClick={() => handleCardClick(idx)}
                className="h-28 relative rounded-2xl select-none"
                style={{ perspective: 1000 }}
              >
                <motion.div
                  animate={{ rotateY: showFront ? 180 : 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="w-full h-full relative"
                >
                  {/* Back of Card */}
                  <div
                    style={{ backfaceVisibility: 'hidden' }}
                    className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center ${
                      showFront ? 'pointer-events-none opacity-0' : blockClass
                    }`}
                  >
                    {!showFront && (
                      <div className="flex flex-col items-center space-y-1">
                        <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-full mb-1">
                          <HelpCircle className="w-5 h-5 text-indigo-500 animate-pulse" />
                        </div>
                        <span className="text-[9px] font-black tracking-widest uppercase text-indigo-600">FLIP ME</span>
                      </div>
                    )}
                  </div>

                  {/* Front of Card */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                    className={`absolute inset-0 rounded-2xl p-4 flex flex-col items-center justify-center text-center font-bold text-xs sm:text-sm select-none border-2 border-transparent ${
                      showFront ? blockClass : 'pointer-events-none opacity-0'
                    }`}
                  >
                    <p className="line-clamp-4 leading-snug font-bold tracking-wide text-slate-800">{card.content}</p>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center font-display font-black text-xs uppercase tracking-widest text-slate-400">
          Match Progress: <span className="text-indigo-600 text-sm font-black">{solved.length}</span> / {initialCards.length / 2} Pairs
        </div>
      </div>
    </div>
  );
}
