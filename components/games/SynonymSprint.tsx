
import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../../types';

interface SynonymSprintProps {
  words: Word[];
  onBack: () => void;
  onXP: (amount: number, gameId: string, score: number) => void;
}

const SynonymSprint: React.FC<SynonymSprintProps> = ({ words, onBack, onXP }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const timerRef = useRef<number>(0);

  const generateChallenge = () => {
    const hasSyns = words.filter(w => w.synonyms && w.synonyms.length > 0);
    const pool = hasSyns.length > 10 ? hasSyns : words;
    const randomWord = pool[Math.floor(Math.random() * pool.length)];
    
    let correctTarget = "";
    if (randomWord.synonyms && randomWord.synonyms.length > 0) {
      const filteredSyns = randomWord.synonyms.filter(s => s.toLowerCase() !== randomWord.term.toLowerCase());
      correctTarget = filteredSyns.length > 0 ? filteredSyns[Math.floor(Math.random() * filteredSyns.length)] : randomWord.synonyms[0];
    } else {
      const peers = words.filter(w => 
        w.id !== randomWord.id && 
        w.satLevel === randomWord.satLevel && 
        w.partOfSpeech === randomWord.partOfSpeech
      );
      const peer = peers.length > 0 ? peers[Math.floor(Math.random() * peers.length)] : words[Math.floor(Math.random() * words.length)];
      correctTarget = peer.term;
    }

    const distractors = words
      .filter(w => 
        w.term.toLowerCase() !== randomWord.term.toLowerCase() && 
        w.term.toLowerCase() !== correctTarget.toLowerCase() &&
        !randomWord.synonyms?.includes(w.term)
      )
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => w.term);

    const options = [correctTarget, ...distractors].sort(() => 0.5 - Math.random());
    
    setCurrentChallenge({ 
      word: randomWord, 
      options, 
      correctIndex: options.indexOf(correctTarget) 
    });
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(30);
    setHistory([]);
    setFeedback(null);
    generateChallenge();
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      // LOGIC FIX: Log the final unanswered challenge if it exists
      if (currentChallenge && !feedback) {
        setHistory(prev => [...prev, {
          term: currentChallenge.word.term,
          definition: currentChallenge.word.definition,
          selected: "N/A",
          correct: currentChallenge.options[currentChallenge.correctIndex],
          isCorrect: false,
          isTimeout: true,
          explanation: `Time expired before selection. The word "${currentChallenge.word.term}" relates to "${currentChallenge.options[currentChallenge.correctIndex]}".`
        }]);
      }
      setIsPlaying(false);
      onXP(score * 15, 'synonym', score);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, timeLeft, currentChallenge, feedback]);

  const handleAnswer = (idx: number) => {
    if (!currentChallenge || feedback || timeLeft === 0) return;
    const isCorrect = idx === currentChallenge.correctIndex;
    
    setHistory(prev => [...prev, {
      term: currentChallenge.word.term,
      definition: currentChallenge.word.definition,
      selected: currentChallenge.options[idx],
      correct: currentChallenge.options[currentChallenge.correctIndex],
      isCorrect,
      isTimeout: false,
      explanation: `The word "${currentChallenge.word.term}" refers to "${currentChallenge.word.definition}". In SAT contexts, it is semantically linked to "${currentChallenge.options[currentChallenge.correctIndex]}".`
    }]);

    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(s => s + 1);
    
    setTimeout(() => { 
      if (timeLeft > 0) {
        setFeedback(null); 
        generateChallenge(); 
      }
    }, 400);
  };

  if (!isPlaying && timeLeft === 30) {
    return (
      <div className="bg-white rounded-[4rem] p-12 text-center space-y-10 shadow-2xl max-w-lg mx-auto border border-slate-100 animate-in zoom-in-95">
        <div className="text-7xl mb-4">🏃‍♂️</div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Synonym Sprint</h2>
        <p className="text-slate-500 font-medium leading-relaxed">Rapid-fire neural matching. Link terms to their semantic pairs under extreme time pressure.</p>
        <button onClick={startGame} className="w-full bg-emerald-500 text-white py-6 rounded-3xl font-black text-xl hover:bg-emerald-600 transition-all shadow-xl active:scale-95">START SPRINT</button>
        <button onClick={onBack} className="text-slate-400 font-bold text-sm block mx-auto hover:text-slate-900">Abort Session</button>
      </div>
    );
  }

  if (!isPlaying && timeLeft === 0) {
    return (
      <div className="bg-white rounded-[3.5rem] p-12 space-y-10 shadow-2xl max-w-4xl mx-auto border border-slate-100 overflow-y-auto max-h-[90vh] no-scrollbar">
        <div className="text-center">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Pedagogical Audit</h2>
          <p className="text-7xl font-black text-emerald-500 mt-2">{score}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">+ {score * 15} XP Earned</p>
        </div>
        
        <div className="space-y-6 pt-8 border-t border-slate-100">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-4">Semantic Breakdown</h3>
           {history.map((h, i) => (
             <div key={i} className={`p-8 rounded-[2.5rem] border-2 flex flex-col gap-4 ${h.isCorrect ? 'bg-emerald-50 border-emerald-100' : h.isTimeout ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'}`}>
                <div className="flex justify-between items-center">
                   <h4 className="text-2xl font-black text-slate-900">{h.term}</h4>
                   <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${h.isCorrect ? 'bg-emerald-600 text-white' : h.isTimeout ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'}`}>
                     {h.isCorrect ? 'Validated' : h.isTimeout ? 'Timed Out' : 'Incorrect'}
                   </span>
                </div>
                <div className="p-4 bg-white/50 rounded-2xl border border-slate-100/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Concept Explanation</p>
                  <p className="text-sm font-medium text-slate-700 italic">{h.explanation}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Your Selection</p>
                      <p className={`font-black text-lg ${h.isCorrect ? 'text-emerald-600' : h.isTimeout ? 'text-amber-600' : 'text-rose-600'}`}>"{h.selected}"</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Correct Pair</p>
                      <p className="font-black text-lg text-emerald-600">"{h.correct}"</p>
                   </div>
                </div>
             </div>
           ))}
        </div>

        <div className="flex gap-4 pt-6 sticky bottom-0 bg-white/95 py-4 border-t">
          <button onClick={startGame} className="flex-1 bg-slate-950 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl">Re-Initiate</button>
          <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-900 py-6 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-xl mx-auto space-y-10 p-12 rounded-[4rem] transition-all duration-300 ${feedback === 'correct' ? 'bg-emerald-50 scale-[1.03]' : feedback === 'wrong' ? 'bg-rose-50 shake' : feedback === 'timeout' ? 'bg-amber-50' : 'bg-white shadow-2xl border border-slate-100'}`}>
      <div className="flex justify-between items-center px-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Remaining</p>
          <p className={`text-3xl font-black ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-slate-900'}`}>{timeLeft}s</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success Rate</p>
          <p className="text-3xl font-black text-emerald-500">{score}</p>
        </div>
      </div>
      
      <div className="bg-slate-950 p-12 rounded-[3rem] text-center border-b-[8px] border-indigo-700 shadow-xl relative overflow-hidden group">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4 group-hover:tracking-[0.6em] transition-all">Target Word</p>
        <h3 className="text-5xl font-black text-white tracking-tighter italic">{currentChallenge?.word.term}</h3>
        <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {currentChallenge?.options.map((opt: string, idx: number) => (
          <button 
            key={idx} 
            onClick={() => handleAnswer(idx)} 
            className={`p-6 rounded-[2.5rem] border-2 font-black text-lg transition-all h-28 flex items-center justify-center text-center leading-tight shadow-sm active:scale-95 ${
              feedback && idx === currentChallenge.correctIndex 
                ? 'bg-emerald-600 border-emerald-700 text-white scale-110 shadow-lg' 
                : 'bg-white border-slate-100 text-slate-700 hover:border-emerald-500 hover:shadow-md'
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
