
import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../../types';

interface SynonymSprintProps {
  words: Word[];
  onBack: () => void;
  onXP: (amount: number, gameId: string, score: number) => void;
}

interface SprintHistory {
  term: string;
  definition: string;
  correct: string;
  user: string;
  isCorrect: boolean;
}

const SynonymSprint: React.FC<SynonymSprintProps> = ({ words, onBack, onXP }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<{ word: Word, options: string[], correctIndex: number } | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [history, setHistory] = useState<SprintHistory[]>([]);
  const timerRef = useRef<number>(0);

  // CRITICAL: Only pick words that have actual synonym data to prevent "Related Concept" placeholder
  const validPool = words.filter(w => w.synonyms && w.synonyms.length > 0);

  const generateChallenge = () => {
    if (validPool.length < 5) {
      alert("Insufficient synonym data. Please 'Refine' words in the Lab or import a richer dataset.");
      onBack();
      return;
    }

    const randomWord = validPool[Math.floor(Math.random() * validPool.length)];
    const correctSynonym = randomWord.synonyms[Math.floor(Math.random() * randomWord.synonyms.length)];

    const distractors = words
      .filter(w => w.id !== randomWord.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => w.term);

    const options = [correctSynonym, ...distractors].sort(() => 0.5 - Math.random());
    const correctIndex = options.indexOf(correctSynonym);

    setCurrentChallenge({ word: randomWord, options, correctIndex });
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
      onXP(score * 10, 'synonym', score);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, timeLeft]);

  const handleAnswer = (index: number) => {
    if (!currentChallenge || feedback) return;

    const isCorrect = index === currentChallenge.correctIndex;
    setHistory(prev => [...prev, {
      term: currentChallenge.word.term,
      definition: currentChallenge.word.definition,
      correct: currentChallenge.options[currentChallenge.correctIndex],
      user: currentChallenge.options[index],
      isCorrect
    }]);

    if (isCorrect) {
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
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Synonym Sprint</h2>
        <p className="text-slate-500 font-medium leading-relaxed">Training with <span className="text-indigo-600 font-black">{validPool.length} verified assets</span>. Rapid association is the key to recall.</p>
        <button onClick={startGame} className="w-full bg-emerald-500 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all active:scale-95">START SPRINT</button>
        <button onClick={onBack} className="text-slate-400 font-bold text-sm block mx-auto hover:text-slate-900 transition-colors">Cancel</button>
      </div>
    );
  }

  if (!isPlaying && timeLeft === 0) {
    return (
      <div className="bg-white rounded-[3rem] p-12 space-y-8 shadow-xl max-w-2xl mx-auto border border-slate-100 animate-in slide-in-from-bottom-10 overflow-y-auto max-h-[90vh] no-scrollbar pb-20">
        <div className="text-center">
          <div className="text-6xl mb-4">🏁</div>
          <h2 className="text-4xl font-black text-slate-900">Sprint Recap</h2>
          <p className="text-5xl font-black text-emerald-500 mt-2">{score}</p>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Score: {score * 10} XP</p>
        </div>

        <div className="space-y-6 pt-4 border-t border-slate-100">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center mb-6">Deep Context Review</h3>
           {history.map((h, i) => (
             <div key={i} className={`p-8 rounded-[2rem] border ${h.isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <div className="flex justify-between items-start mb-4">
                   <h4 className="text-xl font-black text-slate-900">{h.term}</h4>
                   <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${h.isCorrect ? 'bg-emerald-200 text-emerald-700' : 'bg-rose-200 text-rose-700'}`}>
                     {h.isCorrect ? 'Verified' : 'Missed'}
                   </span>
                </div>
                <p className="text-sm text-slate-600 font-medium mb-4 italic leading-relaxed">"{h.definition}"</p>
                <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase">
                   <div className="space-y-1">
                      <p className="text-slate-400">Target Match</p>
                      <p className="text-emerald-600">{h.correct}</p>
                   </div>
                   {!h.isCorrect && (
                     <div className="space-y-1">
                        <p className="text-slate-400">Your Choice</p>
                        <p className="text-rose-600">{h.user}</p>
                     </div>
                   )}
                </div>
             </div>
           ))}
        </div>

        <div className="flex gap-4 sticky bottom-0 bg-white pt-4">
          <button onClick={startGame} className="flex-1 bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-black transition-all">Retry</button>
          <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-900 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">Return</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-xl mx-auto space-y-8 p-8 rounded-[3rem] transition-colors duration-300 ${feedback === 'correct' ? 'bg-emerald-50' : feedback === 'wrong' ? 'bg-rose-50' : ''}`}>
      <div className="flex justify-between items-center px-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clock</p>
          <p className="text-2xl font-black text-slate-900">{timeLeft}s</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neutralizations</p>
          <p className="text-2xl font-black text-emerald-500">{score}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Neural prompt:</p>
        <h3 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">{currentChallenge?.word.term}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {currentChallenge?.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(idx)}
            className={`p-6 rounded-[1.5rem] border-2 font-bold text-lg transition-all h-24 flex items-center justify-center text-center leading-tight ${
              feedback && idx === currentChallenge.correctIndex 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                : 'bg-white border-slate-100 text-slate-700 hover:border-emerald-500 hover:shadow-lg'
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
