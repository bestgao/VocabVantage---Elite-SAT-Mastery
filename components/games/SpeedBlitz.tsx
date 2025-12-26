
import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../../types';

interface SpeedBlitzProps {
  words: Word[];
  onBack: () => void;
  onXP: (amount: number) => void;
}

interface BlitzHistory {
  term: string;
  displayedDef: string;
  actualDef: string;
  userTrue: boolean;
  isCorrect: boolean;
}

const SpeedBlitz: React.FC<SpeedBlitzProps> = ({ words, onBack, onXP }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<{ word: Word, definition: string, isCorrect: boolean } | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [history, setHistory] = useState<BlitzHistory[]>([]);
  const timerRef = useRef<number>(0);

  const generateChallenge = () => {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const isMatch = Math.random() > 0.5;
    let defToDisplay = randomWord.definition;

    if (!isMatch) {
      const otherWord = words.filter(w => w.id !== randomWord.id)[Math.floor(Math.random() * (words.length - 1))];
      defToDisplay = otherWord.definition;
    }

    setCurrentChallenge({ word: randomWord, definition: defToDisplay, isCorrect: isMatch });
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(30);
    setHistory([]);
    generateChallenge();
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      onXP(score * 5);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, timeLeft]);

  const handleAnswer = (answeredTrue: boolean) => {
    if (!currentChallenge || feedback) return;

    const correct = answeredTrue === currentChallenge.isCorrect;
    setHistory(prev => [...prev, {
      term: currentChallenge.word.term,
      displayedDef: currentChallenge.definition,
      actualDef: currentChallenge.word.definition,
      userTrue: answeredTrue,
      isCorrect: correct
    }]);

    if (correct) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      generateChallenge();
    }, 200);
  };

  if (!isPlaying && timeLeft === 30) {
    return (
      <div className="bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-xl max-w-lg mx-auto border border-slate-100 animate-in zoom-in-95">
        <div className="text-6xl">⚡</div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Speed Blitz</h2>
        <p className="text-slate-500 font-medium">Neural firing simulation. 30 seconds to validate as many definitions as possible.</p>
        <button onClick={startGame} className="w-full bg-amber-500 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-amber-600 shadow-xl shadow-amber-100">START BLITZ</button>
        <button onClick={onBack} className="text-slate-400 font-bold text-sm block mx-auto">Cancel</button>
      </div>
    );
  }

  if (!isPlaying && timeLeft === 0) {
    return (
      <div className="bg-white rounded-[3rem] p-12 space-y-8 shadow-xl max-w-2xl mx-auto border border-slate-100 overflow-y-auto max-h-[90vh] no-scrollbar">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-4xl font-black text-slate-900">Protocol Complete</h2>
          <p className="text-6xl font-black text-amber-500 mt-2">{score}</p>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Precision: {Math.round((score / history.length) * 100) || 0}%</p>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Session Memory Log</h3>
           {history.map((h, i) => (
             <div key={i} className={`p-6 rounded-[2rem] border ${h.isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <div className="flex justify-between items-center mb-2">
                   <h4 className="font-black text-slate-900">{h.term}</h4>
                   <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${h.isCorrect ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>
                     {h.isCorrect ? 'Correct' : 'Erroneous'}
                   </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2"><span className="font-bold">Prompted:</span> {h.displayedDef}</p>
                {!h.isCorrect && (
                   <p className="text-xs text-rose-800 font-bold italic border-t border-rose-200/50 pt-2 mt-2">Reality: {h.actualDef}</p>
                )}
             </div>
           ))}
        </div>

        <div className="flex gap-4 pt-4">
          <button onClick={startGame} className="flex-1 bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs">Run Again</button>
          <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-900 py-5 rounded-[2rem] font-black uppercase text-xs">Exit Hub</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-xl mx-auto space-y-8 transition-colors duration-300 ${feedback === 'correct' ? 'bg-emerald-50' : feedback === 'wrong' ? 'bg-rose-50' : ''} p-8 rounded-[3rem]`}>
      <div className="flex justify-between items-center px-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firing Rate</p>
          <p className={`text-2xl font-black ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-slate-900'}`}>{timeLeft}s</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validations</p>
          <p className="text-2xl font-black text-amber-500">{score}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100 min-h-[16rem] flex flex-col items-center justify-center text-center">
        <h3 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">{currentChallenge?.word.term}</h3>
        <p className="text-lg font-medium text-slate-500 leading-tight">"{currentChallenge?.definition}"</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <button onClick={() => handleAnswer(false)} className="bg-white border-4 border-rose-500 text-rose-500 py-8 rounded-[2rem] font-black text-2xl hover:bg-rose-50 shadow-lg shadow-rose-100">FALSE</button>
        <button onClick={() => handleAnswer(true)} className="bg-emerald-500 text-white py-8 rounded-[2rem] font-black text-2xl hover:bg-emerald-600 shadow-lg shadow-emerald-100">TRUE</button>
      </div>
    </div>
  );
};

export default SpeedBlitz;
