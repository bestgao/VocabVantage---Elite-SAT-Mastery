
import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_WORDS } from '../../constants';

interface SpeedBlitzProps {
  onBack: () => void;
  onXP: (amount: number) => void;
}

const SpeedBlitz: React.FC<SpeedBlitzProps> = ({ onBack, onXP }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<{ word: string, definition: string, isCorrect: boolean } | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const timerRef = useRef<number | null>(null);

  const generateChallenge = () => {
    const randomWord = INITIAL_WORDS[Math.floor(Math.random() * INITIAL_WORDS.length)];
    const isCorrect = Math.random() > 0.5;
    let defToDisplay = randomWord.definition;

    if (!isCorrect) {
      const otherWord = INITIAL_WORDS.filter(w => w.id !== randomWord.id)[Math.floor(Math.random() * (INITIAL_WORDS.length - 1))];
      defToDisplay = otherWord.definition;
    }

    setCurrentChallenge({ word: randomWord.term, definition: defToDisplay, isCorrect });
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(30);
    generateChallenge();
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      onXP(score * 5);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, timeLeft]);

  const handleAnswer = (answeredTrue: boolean) => {
    if (!currentChallenge) return;

    const correct = answeredTrue === currentChallenge.isCorrect;
    if (correct) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      generateChallenge();
    }, 300);
  };

  if (!isPlaying && timeLeft === 30) {
    return (
      <div className="bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-xl max-w-lg mx-auto border border-slate-100 animate-in zoom-in-95">
        <div className="text-6xl">⚡</div>
        <h2 className="text-4xl font-black text-slate-900">Speed Blitz</h2>
        <p className="text-slate-500 font-medium">You have 30 seconds to determine if the definitions are correct. Ready?</p>
        <button 
          onClick={startGame}
          className="w-full bg-amber-500 text-white py-5 rounded-2xl font-black text-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
        >
          START BLITZ
        </button>
        <button onClick={onBack} className="text-slate-400 font-bold text-sm block mx-auto">Cancel</button>
      </div>
    );
  }

  if (!isPlaying && timeLeft === 0) {
    return (
      <div className="bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-xl max-w-lg mx-auto border border-slate-100">
        <div className="text-6xl">🏆</div>
        <h2 className="text-4xl font-black text-slate-900">Time's Up!</h2>
        <div className="space-y-1">
          <p className="text-6xl font-black text-amber-500">{score}</p>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Correct Answers</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-700 font-bold">
          + {score * 5} XP Earned
        </div>
        <div className="flex gap-4">
          <button onClick={startGame} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold">Play Again</button>
          <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold">Hub</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-xl mx-auto space-y-8 transition-colors duration-300 ${feedback === 'correct' ? 'bg-emerald-50' : feedback === 'wrong' ? 'bg-rose-50' : ''} p-8 rounded-[3rem]`}>
      <div className="flex justify-between items-center px-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Left</p>
          <p className={`text-2xl font-black ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-slate-900'}`}>{timeLeft}s</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</p>
          <p className="text-2xl font-black text-amber-500">{score}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100 min-h-[16rem] flex flex-col items-center justify-center text-center">
        <h3 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">{currentChallenge?.word}</h3>
        <p className="text-lg font-medium text-slate-500 leading-tight">{currentChallenge?.definition}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => handleAnswer(false)}
          className="bg-white border-4 border-rose-500 text-rose-500 py-6 rounded-3xl font-black text-2xl hover:bg-rose-50 transition-all shadow-lg shadow-rose-100"
        >
          FALSE
        </button>
        <button 
          onClick={() => handleAnswer(true)}
          className="bg-emerald-500 text-white py-6 rounded-3xl font-black text-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
        >
          TRUE
        </button>
      </div>
    </div>
  );
};

export default SpeedBlitz;
