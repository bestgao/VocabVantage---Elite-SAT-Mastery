
import React, { useState, useEffect } from 'react';
import { INITIAL_WORDS } from '../../constants';

interface MatchManiaProps {
  onBack: () => void;
  onXP: (amount: number) => void;
}

interface Card {
  id: string;
  content: string;
  type: 'word' | 'definition';
  pairId: string;
}

const MatchMania: React.FC<MatchManiaProps> = ({ onBack, onXP }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    let interval: number;
    if (!isGameOver) {
      interval = window.setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isGameOver]);

  const initializeGame = () => {
    const selectedWords = [...INITIAL_WORDS].sort(() => 0.5 - Math.random()).slice(0, 5);
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
        }, 500);
      } else {
        // No match
        setTimeout(() => setSelected([]), 800);
      }
    }
  };

  if (isGameOver) {
    return (
      <div className="bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-xl max-w-lg mx-auto border border-slate-100 animate-in zoom-in-95">
        <div className="text-6xl">🧩</div>
        <h2 className="text-4xl font-black text-slate-900">Cleared!</h2>
        <p className="text-slate-500 font-medium">You matched all pairs in {timer} seconds.</p>
        <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-700 font-bold">+ 100 XP Earned</div>
        <div className="flex gap-4">
          <button onClick={initializeGame} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold">Play Again</button>
          <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold">Hub</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase tracking-widest px-2">
        <span>Time: {timer}s</span>
        <span>Matches: {matched.length / 2} / 5</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map(card => {
          const isMatched = matched.includes(card.id);
          const isSelected = selected.includes(card.id);
          
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={isMatched}
              className={`h-40 p-4 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center justify-center text-center shadow-sm border-2 ${
                isMatched 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-500 opacity-50 scale-95' 
                  : isSelected
                    ? 'bg-indigo-600 border-indigo-700 text-white scale-105 shadow-indigo-200 rotate-2'
                    : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300'
              }`}
            >
              {card.content}
            </button>
          );
        })}
      </div>

      <div className="text-center pt-8">
        <button onClick={onBack} className="text-slate-400 font-bold text-sm">Quit Game</button>
      </div>
    </div>
  );
};

export default MatchMania;
