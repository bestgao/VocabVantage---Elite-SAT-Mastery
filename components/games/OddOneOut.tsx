
import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../../types';

interface OddOneOutProps {
  words: Word[];
  onBack: () => void;
  onXP: (amount: number, gameId: string, score: number) => void;
}

interface OddHistory {
  options: { term: string, definition: string, isOutlier: boolean }[];
  oddWord: string;
  userWord: string;
  isCorrect: boolean;
  isTimeout: boolean;
  theme: string;
  nexusReason: string;
}

const OddOneOut: React.FC<OddOneOutProps> = ({ words, onBack, onXP }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<{ options: { term: string, definition: string, isOutlier: boolean }[], correctIndex: number, theme: string } | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [history, setHistory] = useState<OddHistory[]>([]);
  const timerRef = useRef<number>(0);

  const generateChallenge = () => {
    const levels = ['Core', 'Medium', 'Advanced'] as const;
    const tier = levels[Math.floor(Math.random() * levels.length)];
    const nexusPool = words.filter(w => w.satLevel === tier);
    
    // Fallback if specific tier pool is empty or too small
    const finalNexus = nexusPool.length >= 3 ? nexusPool : words;
    const baseWords = [...finalNexus].sort(() => 0.5 - Math.random()).slice(0, 3);
    const outlier = words.filter(w => 
      !baseWords.some(bw => bw.id === w.id) && 
      (nexusPool.length >= 3 ? w.satLevel !== tier : true)
    ).sort(() => 0.5 - Math.random())[0] || words.find(w => !baseWords.some(bw => bw.id === w.id));

    if (!outlier) return; // Safety check

    const options = baseWords.map(w => ({ term: w.term, definition: w.definition, isOutlier: false }));
    options.push({ term: outlier.term, definition: outlier.definition, isOutlier: true });

    const shuffled = options.sort(() => 0.5 - Math.random());
    setCurrentChallenge({
      options: shuffled,
      correctIndex: shuffled.findIndex(o => o.isOutlier),
      theme: nexusPool.length >= 3 ? `${tier} Tier Register` : "General Vocabulary"
    });
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(45);
    setHistory([]);
    setFeedback(null);
    generateChallenge();
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      if (currentChallenge && !feedback) {
        const oddWord = currentChallenge.options[currentChallenge.correctIndex].term;
        setHistory(prev => [...prev, {
          options: currentChallenge.options,
          oddWord,
          userWord: "N/A",
          isCorrect: false,
          isTimeout: true,
          theme: currentChallenge.theme,
          nexusReason: `Identification stalled. The group members belonged to the '${currentChallenge.theme}', while "${oddWord}" was the outlier.`
        }]);
      }
      setIsPlaying(false);
      onXP(score * 20, 'oddout', score);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, timeLeft, currentChallenge, feedback]);

  const handleAnswer = (index: number) => {
    if (!currentChallenge || feedback || timeLeft === 0) return;
    const isCorrect = index === currentChallenge.correctIndex;
    
    const oddWord = currentChallenge.options[currentChallenge.correctIndex].term;
    const nexusReason = `The primary group consists of words within the '${currentChallenge.theme}'. "${oddWord}" was the outlier because its complexity level or semantic categorization deviates from the group bond.`;

    setHistory(prev => [...prev, {
      options: currentChallenge.options,
      oddWord,
      userWord: currentChallenge.options[index].term,
      isCorrect,
      isTimeout: false,
      theme: currentChallenge.theme,
      nexusReason
    }]);

    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(s => s + 1);
    
    setTimeout(() => { 
      if (timeLeft > 0) {
        setFeedback(null); 
        generateChallenge(); 
      }
    }, 300);
  };

  // START SCREEN
  if (!isPlaying && timeLeft === 45) {
    return (
      <div className="bg-white rounded-[4rem] p-12 text-center space-y-10 shadow-2xl max-w-lg mx-auto border border-slate-100 animate-in zoom-in-95">
        <div className="text-7xl mb-4">🕵️‍♀️</div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">Odd One <span className="text-rose-600">Out</span></h2>
        <p className="text-slate-500 font-medium leading-relaxed">Analyze the set. Spot the semantic anomaly that doesn't belong in the group register.</p>
        <button onClick={startGame} className="w-full bg-rose-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-rose-700 transition-all shadow-xl active:scale-95">INITIALIZE SCAN</button>
        <button onClick={onBack} className="text-slate-400 font-bold text-sm block mx-auto hover:text-slate-900">Return to Hub</button>
      </div>
    );
  }

  // RESULTS SCREEN
  if (!isPlaying && timeLeft === 0) {
    const accuracy = history.length > 0 ? Math.round((score / history.length) * 100) : 0;
    
    return (
      <div className="bg-white rounded-[4rem] p-10 md:p-14 space-y-12 shadow-2xl max-w-5xl mx-auto border border-slate-100 overflow-y-auto max-h-[90vh] no-scrollbar pb-24">
        <div className="text-center">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Detective Performance Audit</h2>
          <div className="flex justify-center gap-12 items-center mt-6">
             <div className="text-center">
                <p className="text-6xl font-black text-rose-500">{score}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Infiltrators Neutralized</p>
             </div>
             <div className="h-16 w-px bg-slate-100"></div>
             <div className="text-center">
                <p className="text-6xl font-black text-slate-900">{accuracy}%</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Accuracy</p>
             </div>
          </div>
        </div>

        <div className="space-y-12 border-t border-slate-100 pt-12">
          {history.map((h, i) => (
            <div key={i} className={`p-10 rounded-[4rem] border-2 transition-all ${h.isCorrect ? 'bg-emerald-50 border-emerald-100' : h.isTimeout ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'}`}>
               <div className="flex justify-between items-center mb-6">
                 <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-4 py-1.5 bg-white rounded-full border border-slate-100">Case ID #{i+1}: {h.theme}</p>
                 <span className={`text-[9px] font-black uppercase px-6 py-2 rounded-full tracking-widest ${h.isCorrect ? 'bg-emerald-600 text-white' : h.isTimeout ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'}`}>
                   {h.isCorrect ? 'Validated' : h.isTimeout ? 'Timed Out' : 'Detection Failure'}
                 </span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                 {h.options.map((opt, idx) => (
                   <div key={idx} className={`p-6 rounded-3xl border transition-all h-44 flex flex-col justify-between ${opt.isOutlier ? 'bg-amber-100 border-amber-300 shadow-md ring-4 ring-amber-500/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <div>
                        <h4 className={`font-black text-lg ${opt.isOutlier ? 'text-rose-600' : 'text-slate-900'}`}>{opt.term}</h4>
                        <p className="text-[10px] text-slate-500 italic mt-1 leading-relaxed line-clamp-3">"{opt.definition}"</p>
                      </div>
                      <p className={`text-[8px] font-black uppercase tracking-widest mt-2 ${opt.isOutlier ? 'text-amber-600' : 'text-slate-300'}`}>
                        {opt.isOutlier ? 'Outlier' : 'Nexus Member'}
                      </p>
                   </div>
                 ))}
               </div>

               <div className="p-6 bg-white/50 rounded-3xl border border-slate-200/50 mb-8">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Nexus Explanation</p>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed italic">{h.nexusReason}</p>
               </div>

               <div className="mt-8 pt-6 border-t border-slate-200/50 flex justify-center gap-12">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Your Deduction</p>
                    <p className={`font-black text-xl ${h.isCorrect ? 'text-emerald-600' : h.isTimeout ? 'text-amber-600' : 'text-rose-600'}`}>{h.userWord}</p>
                  </div>
                  {(!h.isCorrect || h.isTimeout) && (
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Actual Outlier</p>
                      <p className="font-black text-xl text-emerald-600 underline underline-offset-8">{h.oddWord}</p>
                    </div>
                  )}
               </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 pt-6 sticky bottom-0 bg-white/90 backdrop-blur pb-10">
          <button onClick={startGame} className="flex-1 bg-slate-950 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-2xl">Re-Initiate</button>
          <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-900 py-6 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Hub</button>
        </div>
      </div>
    );
  }

  // GAMEPLAY UI
  return (
    <div className={`max-w-xl mx-auto space-y-10 p-12 rounded-[4rem] transition-all duration-300 ${feedback === 'correct' ? 'bg-emerald-50 scale-105' : feedback === 'wrong' ? 'bg-rose-50 shake' : 'bg-white shadow-2xl border border-slate-100'}`}>
      <div className="flex justify-between items-center px-4">
        <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Scan</p><p className="text-3xl font-black text-slate-900">{timeLeft}s</p></div>
        <div className="space-y-1 text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hits</p><p className="text-3xl font-black text-rose-500">{score}</p></div>
      </div>
      <div className="text-center">
        <h3 className="text-2xl font-black text-slate-900 mb-10 uppercase tracking-tighter leading-tight">Neutralize the <br/><span className="text-rose-600 underline decoration-rose-200 underline-offset-8">Outlier</span>:</h3>
        <div className="grid grid-cols-2 gap-6">
          {currentChallenge?.options.map((opt, idx) => (
            <button 
              key={idx} 
              onClick={() => handleAnswer(idx)} 
              className={`p-6 rounded-[2.5rem] border-2 font-black text-xl transition-all h-40 flex items-center justify-center text-center shadow-sm active:scale-95 ${
                feedback && idx === currentChallenge.correctIndex 
                  ? 'bg-emerald-600 border-emerald-700 text-white scale-110 shadow-lg' 
                  : 'bg-white border-slate-100 text-slate-700 hover:border-rose-500 hover:scale-[1.02]'
              }`}
            >
              {opt.term}
            </button>
          ))}
        </div>
      </div>
      <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">Analyzing semantic bond...</p>
    </div>
  );
};
export default OddOneOut;
