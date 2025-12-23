
import React, { useState, useEffect, useRef } from 'react';
import { SAT_TRANSITIONS } from '../../constants';

interface TransitionTussleProps {
  onBack: () => void;
  onXP: (amount: number, gameId: string, score: number) => void;
}

const TransitionTussle: React.FC<TransitionTussleProps> = ({ onBack, onXP }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const timerRef = useRef<number | null>(null);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(30);
    setCurrentIdx(Math.floor(Math.random() * SAT_TRANSITIONS.length));
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      onXP(score * 20, 'transition', score);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, timeLeft]);

  const handleAnswer = (idx: number) => {
    if (feedback) return;
    const isCorrect = idx === SAT_TRANSITIONS[currentIdx].correct;
    
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      setCurrentIdx(Math.floor(Math.random() * SAT_TRANSITIONS.length));
    }, 600);
  };

  if (!isPlaying && timeLeft === 30) {
    return (
      <div className="bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-xl max-w-lg mx-auto border border-slate-100 animate-in zoom-in-95">
        <div className="text-6xl">🔗</div>
        <h2 className="text-4xl font-black text-slate-900">Transition Tussle</h2>
        <p className="text-slate-500 font-medium">Connect sentences logically. This is the #1 most tested logic skill on the SAT.</p>
        <button onClick={startGame} className="w-full bg-sky-500 text-white py-5 rounded-2xl font-black text-xl hover:bg-sky-600 transition-all shadow-lg shadow-sky-100">START LOGIC SESSION</button>
        <button onClick={onBack} className="text-slate-400 font-bold text-sm block mx-auto">Cancel</button>
      </div>
    );
  }

  if (!isPlaying && timeLeft === 0) {
    return (
      <div className="bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-xl max-w-lg mx-auto border border-slate-100">
        <div className="text-6xl">🏁</div>
        <h2 className="text-4xl font-black text-slate-900">Logic Mastered</h2>
        <p className="text-6xl font-black text-sky-500">{score}</p>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Transitions Correct</p>
        <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-700 font-bold">+ {score * 20} XP Earned</div>
        <div className="flex gap-4">
          <button onClick={startGame} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold">Play Again</button>
          <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold">Hub</button>
        </div>
      </div>
    );
  }

  const current = SAT_TRANSITIONS[currentIdx];

  return (
    <div className={`max-w-2xl mx-auto space-y-8 p-8 rounded-[3rem] transition-colors duration-300 ${feedback === 'correct' ? 'bg-emerald-50' : feedback === 'wrong' ? 'bg-rose-50' : ''}`}>
      <div className="flex justify-between items-center px-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Meter</p>
          <p className="text-2xl font-black text-slate-900">{timeLeft}s</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points</p>
          <p className="text-2xl font-black text-sky-500">{score}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100 text-left space-y-6">
        <p className="text-lg font-medium text-slate-700 leading-relaxed">"{current.s1}"</p>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-[2px] bg-slate-100"></div>
          <div className="w-12 h-12 rounded-full border-4 border-dashed border-sky-300 flex items-center justify-center text-sky-400 font-black animate-pulse">?</div>
          <div className="flex-1 h-[2px] bg-slate-100"></div>
        </div>
        <p className="text-lg font-medium text-slate-700 leading-relaxed">"{current.s2}"</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {current.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(idx)}
            className={`p-6 rounded-2xl border-2 font-black text-lg transition-all ${
              feedback && idx === current.correct 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                : 'bg-white border-slate-100 text-slate-700 hover:border-sky-500 hover:scale-[1.02]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TransitionTussle;
