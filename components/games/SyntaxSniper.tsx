
import React, { useState, useEffect, useRef } from 'react';
import { SYNTAX_CHALLENGES } from '../../constants';

interface SyntaxSniperProps {
  onBack: () => void;
  onXP: (amount: number, gameId: string, score: number) => void;
}

const SyntaxSniper: React.FC<SyntaxSniperProps> = ({ onBack, onXP }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const timerRef = useRef<number | null>(null);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(45);
    setCurrentIdx(Math.floor(Math.random() * SYNTAX_CHALLENGES.length));
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      onXP(score * 30, 'syntax', score);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, timeLeft]);

  const handleSnipe = (idx: number) => {
    if (feedback) return;
    const isCorrect = idx === SYNTAX_CHALLENGES[currentIdx].errorIndex;
    
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      setCurrentIdx(Math.floor(Math.random() * SYNTAX_CHALLENGES.length));
    }, 1000);
  };

  if (!isPlaying && timeLeft === 45) {
    return (
      <div className="bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-xl max-w-lg mx-auto border border-slate-100 animate-in zoom-in-95">
        <div className="text-6xl">🎯</div>
        <h2 className="text-4xl font-black text-slate-900">Syntax Sniper</h2>
        <p className="text-slate-500 font-medium">Find the error in the sentence before the timer hits zero. Be precise!</p>
        <button onClick={startGame} className="w-full bg-violet-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-100">START HUNT</button>
        <button onClick={onBack} className="text-slate-400 font-bold text-sm block mx-auto">Cancel</button>
      </div>
    );
  }

  if (!isPlaying && timeLeft === 0) {
    return (
      <div className="bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-xl max-w-lg mx-auto border border-slate-100">
        <div className="text-6xl">🏆</div>
        <h2 className="text-4xl font-black text-slate-900">Grammar Master</h2>
        <p className="text-6xl font-black text-violet-600">{score}</p>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Errors Sniped</p>
        <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-700 font-bold">+ {score * 30} XP Earned</div>
        <button onClick={startGame} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold mt-4">Play Again</button>
        <button onClick={onBack} className="text-slate-400 font-bold text-sm mt-4">Hub</button>
      </div>
    );
  }

  const current = SYNTAX_CHALLENGES[currentIdx];
  const parts = current.text.split(/\[|\]/);

  return (
    <div className={`max-w-3xl mx-auto space-y-8 p-8 rounded-[3rem] transition-colors duration-300 ${feedback === 'correct' ? 'bg-emerald-50' : feedback === 'wrong' ? 'bg-rose-50' : ''}`}>
      <div className="flex justify-between items-center px-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</p>
          <p className="text-2xl font-black text-slate-900">{timeLeft}s</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accuracy</p>
          <p className="text-2xl font-black text-violet-600">{score}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl p-12 border border-slate-100 text-center relative overflow-hidden">
        <div className="absolute top-4 left-4 text-[10px] font-black uppercase text-slate-300">Find the ERROR</div>
        <div className="text-2xl font-medium text-slate-700 leading-relaxed flex flex-wrap justify-center items-baseline gap-1">
          {parts.map((p, i) => {
            const isClickable = current.options.includes(p);
            const optIdx = current.options.indexOf(p);
            
            if (isClickable) {
              return (
                <button
                  key={i}
                  onClick={() => handleSnipe(optIdx)}
                  className={`px-3 py-1 rounded-lg border-2 font-black transition-all ${
                    feedback && optIdx === current.errorIndex 
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-800 scale-110' 
                      : 'border-transparent text-violet-600 hover:border-violet-300 hover:bg-violet-50 underline decoration-dotted'
                  }`}
                >
                  {p}
                </button>
              );
            }
            return <span key={i}>{p}</span>;
          })}
        </div>
        {feedback === 'correct' && (
          <div className="mt-8 p-4 bg-emerald-50 rounded-2xl text-emerald-700 font-bold animate-in fade-in slide-in-from-bottom-2">
             Correction: {current.correction}
          </div>
        )}
      </div>

      <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Snipe the word that breaks a grammar rule</p>
    </div>
  );
};

export default SyntaxSniper;
