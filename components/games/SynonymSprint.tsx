
import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_WORDS } from '../../constants';
import { Word } from '../../types';

interface SynonymSprintProps {
  onBack: () => void;
  onXP: (amount: number, gameId: string, score: number) => void;
}

const SynonymSprint: React.FC<SynonymSprintProps> = ({ onBack, onXP }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<{ word: Word, options: string[], correctIndex: number } | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const timerRef = useRef<number | null>(null);

  const generateChallenge = () => {
    const randomWord = INITIAL_WORDS[Math.floor(Math.random() * INITIAL_WORDS.length)];
    const correctSynonym = randomWord.synonyms[Math.floor(Math.random() * randomWord.synonyms.length)];
    
    // Get 3 distractor definitions or words
    const distractors = INITIAL_WORDS
      .filter(w => w.id !== randomWord.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => w.synonyms[0]);

    const options = [correctSynonym, ...distractors].sort(() => 0.5 - Math.random());
    const correctIndex = options.indexOf(correctSynonym);

    setCurrentChallenge({ word: randomWord, options, correctIndex });
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(30);
    generateChallenge();
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      onXP(score * 10, 'synonym', score);
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
    }, 400);
  };

  if (!isPlaying && timeLeft === 30) {
    return (
      <div className="bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-xl max-w-lg mx-auto border border-slate-100 animate-in zoom-in-95">
        <div className="text-6xl">🏃‍♂️</div>
        <h2 className="text-4xl font-black text-slate-900">Synonym Sprint</h2>
        <p className="text-slate-500 font-medium">Find the correct synonym as fast as you can. 30 seconds on the clock!</p>
        <button onClick={startGame} className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black text-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100">START SPRINT</button>
        <button onClick={onBack} className="text-slate-400 font-bold text-sm block mx-auto">Cancel</button>
      </div>
    );
  }

  if (!isPlaying && timeLeft === 0) {
    return (
      <div className="bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-xl max-w-lg mx-auto border border-slate-100 animate-in fade-in">
        <div className="text-6xl">🏁</div>
        <h2 className="text-4xl font-black text-slate-900">Sprint Finished!</h2>
        <p className="text-6xl font-black text-emerald-500">{score}</p>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Words Synced</p>
        <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-700 font-bold">+ {score * 10} XP Earned</div>
        <div className="flex gap-4">
          <button onClick={startGame} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold">Try Again</button>
          <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold">Hub</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-xl mx-auto space-y-8 p-8 rounded-[3rem] transition-colors duration-300 ${feedback === 'correct' ? 'bg-emerald-50' : feedback === 'wrong' ? 'bg-rose-50' : ''}`}>
      <div className="flex justify-between items-center px-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</p>
          <p className="text-2xl font-black text-slate-900">{timeLeft}s</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</p>
          <p className="text-2xl font-black text-emerald-500">{score}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Find the synonym for:</p>
        <h3 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">{currentChallenge?.word.term}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentChallenge?.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(idx)}
            className={`p-6 rounded-2xl border-2 font-bold text-lg transition-all ${
              feedback && idx === currentChallenge.correctIndex 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                : 'bg-white border-slate-100 text-slate-700 hover:border-emerald-500'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SynonymSprint;
