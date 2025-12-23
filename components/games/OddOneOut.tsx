
import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_WORDS } from '../../constants';

interface OddOneOutProps {
  onBack: () => void;
  onXP: (amount: number, gameId: string, score: number) => void;
}

const OddOneOut: React.FC<OddOneOutProps> = ({ onBack, onXP }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<{ options: string[], correctIndex: number } | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const timerRef = useRef<number | null>(null);

  const generateChallenge = () => {
    // Pick 1 base word
    const baseWord = INITIAL_WORDS[Math.floor(Math.random() * INITIAL_WORDS.length)];
    // Pick 2 of its synonyms
    const synonyms = [...baseWord.synonyms].sort(() => 0.5 - Math.random()).slice(0, 2);
    // Pick 1 completely unrelated word from a different group
    const oddWord = INITIAL_WORDS.filter(w => !w.synonyms.some(s => baseWord.synonyms.includes(s)) && w.id !== baseWord.id)[Math.floor(Math.random() * 5)].term;

    const options = [baseWord.term, ...synonyms, oddWord].sort(() => 0.5 - Math.random());
    const correctIndex = options.indexOf(oddWord);

    setCurrentChallenge({ options, correctIndex });
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(45);
    generateChallenge();
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      onXP(score * 15, 'oddout', score);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, timeLeft]);

  const handleAnswer = (index: number) => {
    if (!currentChallenge || feedback) return;

    if (index === currentChallenge.correctIndex) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      generateChallenge();
    }, 500);
  };

  if (!isPlaying && timeLeft === 45) {
    return (
      <div className="bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-xl max-w-lg mx-auto border border-slate-100 animate-in zoom-in-95">
        <div className="text-6xl">🕵️‍♀️</div>
        <h2 className="text-4xl font-black text-slate-900">Odd One Out</h2>
        <p className="text-slate-500 font-medium">Three words share a similar meaning. One is a stranger. Find it!</p>
        <button onClick={startGame} className="w-full bg-rose-500 text-white py-5 rounded-2xl font-black text-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-100">START HUNT</button>
        <button onClick={onBack} className="text-slate-400 font-bold text-sm block mx-auto">Cancel</button>
      </div>
    );
  }

  if (!isPlaying && timeLeft === 0) {
    return (
      <div className="bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-xl max-w-lg mx-auto border border-slate-100">
        <div className="text-6xl">🔍</div>
        <h2 className="text-4xl font-black text-slate-900">Session Over</h2>
        <p className="text-6xl font-black text-rose-500">{score}</p>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Anomalies Detected</p>
        <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-700 font-bold">+ {score * 15} XP Earned</div>
        <div className="flex gap-4">
          <button onClick={startGame} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold">Play Again</button>
          <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold">Hub</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-xl mx-auto space-y-8 p-8 rounded-[3rem] transition-colors duration-300 ${feedback === 'correct' ? 'bg-emerald-50' : feedback === 'wrong' ? 'bg-rose-50' : ''}`}>
      <div className="flex justify-between items-center px-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timer</p>
          <p className="text-2xl font-black text-slate-900">{timeLeft}s</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detected</p>
          <p className="text-2xl font-black text-rose-500">{score}</p>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Which word doesn't belong?</h3>
        <div className="grid grid-cols-2 gap-4">
          {currentChallenge?.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className={`p-8 rounded-[2rem] border-2 font-black text-xl transition-all h-32 flex items-center justify-center text-center leading-tight ${
                feedback && idx === currentChallenge.correctIndex
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                  : 'bg-white border-slate-100 text-slate-700 hover:border-rose-500 hover:scale-105'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OddOneOut;
