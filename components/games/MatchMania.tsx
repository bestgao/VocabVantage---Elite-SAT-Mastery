
import React, { useState, useEffect } from 'react';
import { Word } from '../../types';

interface MatchManiaProps {
  words: Word[];
  onBack: () => void;
  onXP: (amount: number) => void;
}

interface Card {
  id: string;
  content: string;
  type: 'word' | 'definition';
  pairId: string;
}

const MatchMania: React.FC<MatchManiaProps> = ({ words, onBack, onXP }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    initializeGame();
  }, [words]);

  useEffect(() => {
    let interval: number;
    if (!isGameOver) {
      interval = window.setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isGameOver]);

  const initializeGame = () => {
    const selectedWords = [...words].sort(() => 0.5 - Math.random()).slice(0, 5);
    const wordCards: Card[] = selectedWords.map(w => ({ id: `w-${w.id}`, content: w.term, type: 'word', pairId: w.id }));
    const defCards: Card[] = selectedWords.map(w => ({ id: `d-${w.id}`, content: w.definition, type: 'definition', pairId: w.id }));
    
    setCards([...wordCards, ...defCards].sort(() => 0.5 - Math.random()));
    setMatched([]);
    setSelected([]);
    setTimer(0);
    setIsGameOver(false);
  };

  const handleCardClick = (id: string) => {
    if (matched.includes(id) || selected.includes(id) || selected.length >= 2) return;

    const newSelected = [...selected, id];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      const card1 = cards.find(c => c.id === newSelected[0])!;
      const card2 = cards.find(c => c.id === newSelected[1])!;

      if (card1.pairId === card2.pairId && card1.type !== card2.type) {
        // Match!
        setTimeout(() => {
          const nextMatched = [...matched, newSelected[0], newSelected[1]];
          setMatched(nextMatched);
          setSelected([]);
          if (nextMatched.length === cards.length) {
            setIsGameOver(true);
            onXP(100);
          }
        }, 300);
      } else {
        // No match
        setTimeout(() => setSelected([]), 600);
      }
    }
  };

  if (isGameOver) {
    return (
      <div className="bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-xl max-w-lg mx-auto border border-slate-100 animate-in zoom-in-95">
        <div className="text-6xl">🧩</div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Arena Cleared!</h2>
        <p className="text-slate-500 font-medium leading-relaxed">You successfully synthesized all pairs in {timer} seconds.</p>
        <div className="bg-emerald-50 p-6 rounded-2xl text-emerald-700 font-black border border-emerald-100">+ 100 XP Earned</div>
        <div className="flex gap-4">
          <button onClick={initializeGame} className="flex-1 bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Re-Initiate</button>
          <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-900 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Exit Arena</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-10 duration-500 pb-12">
      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
        <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> Time: {timer}s</div>
        <div className="bg-slate-100 px-4 py-1.5 rounded-full">Matches: {matched.length / 2} / 5</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map(card => {
          const isMatched = matched.includes(card.id);
          const isSelected = selected.includes(card.id);
          
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={isMatched}
              className={`h-48 p-6 rounded-3xl text-[11px] font-black transition-all duration-300 flex items-center justify-center text-center shadow-sm border-2 leading-relaxed tracking-tight ${
                isMatched 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-400 opacity-40 scale-90' 
                  : isSelected
                    ? 'bg-indigo-600 border-indigo-700 text-white scale-105 shadow-2xl rotate-1 z-10'
                    : 'bg-white border-slate-100 text-slate-800 hover:border-indigo-400 hover:bg-slate-50 hover:shadow-lg'
              }`}
            >
              {card.content}
            </button>
          );
        })}
      </div>

      <div className="text-center pt-8">
        <button onClick={onBack} className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors">Abort Match</button>
      </div>
    </div>
  );
};

export default MatchMania;
