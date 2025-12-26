
import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../../types';
import { generateOddOneOutExplanation } from '../../services/gemini';
import { titanSanitize } from '../../constants';

interface OddOneOutProps {
  words: Word[];
  onBack: () => void;
  onXP: (amount: number, gameId: string, score: number) => void;
}

interface OddHistory {
  options: string[];
  oddWord: string;
  userWord: string;
  isCorrect: boolean;
  definition: string;
  relationship: string;
  explanation: string;
}

const OddOneOut: React.FC<OddOneOutProps> = ({ words, onBack, onXP }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<{ options: string[], correctIndex: number, oddWord: string, def: string } | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [history, setHistory] = useState<OddHistory[]>([]);
  const timerRef = useRef<number>(0);

  // Filter for words with high-quality peer data
  const validBaseWords = words.filter(w => w.synonyms && w.synonyms.filter(s => s.length > 2 && !s.includes('Concept')).length >= 2);

  const generateChallenge = () => {
    if (words.length < 10) {
      alert("Insufficient data in Vault.");
      onBack();
      return;
    }

    // Try to pick a word with synonyms first
    let baseWord = validBaseWords[Math.floor(Math.random() * validBaseWords.length)];
    if (!baseWord) baseWord = words[Math.floor(Math.random() * words.length)];

    const synonyms = (baseWord.synonyms || [])
      .filter(s => s.length > 2 && !s.includes('Concept'))
      .slice(0, 2);
    
    // Pick the odd word from words that are NOT synonyms of the base word
    const oddWordObj = words
      .filter(w => w.id !== baseWord.id && !(baseWord.synonyms || []).includes(w.term))
      .sort(() => 0.5 - Math.random())[0];

    // Clean all strings using the global titanSanitize
    const options = [baseWord.term, ...synonyms, oddWordObj.term]
      .map(titanSanitize)
      .sort(() => 0.5 - Math.random());
    
    setCurrentChallenge({
      options,
      correctIndex: options.indexOf(titanSanitize(oddWordObj.term)),
      oddWord: titanSanitize(oddWordObj.term),
      def: titanSanitize(oddWordObj.definition)
    });
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(45);
    setHistory([]);
    generateChallenge();
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      onXP(score * 15, 'oddout', score);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, timeLeft]);

  const handleAnswer = async (index: number) => {
    if (!currentChallenge || feedback || loadingChallenge) return;

    const isCorrect = index === currentChallenge.correctIndex;
    const userWord = currentChallenge.options[index];
    const oddWord = currentChallenge.oddWord;
    
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setLoadingChallenge(true);

    try {
      const analysis = await generateOddOneOutExplanation(currentChallenge.options, oddWord);
      setHistory(prev => [...prev, {
        options: currentChallenge.options,
        oddWord,
        userWord,
        isCorrect,
        definition: currentChallenge.def,
        relationship: analysis.relationship,
        explanation: analysis.explanation
      }]);
    } catch (e) {
      setHistory(prev => [...prev, {
        options: currentChallenge.options,
        oddWord,
        userWord,
        isCorrect,
        definition: currentChallenge.def,
        relationship: "Semantic bond detected",
        explanation: "Neural link failed during analysis."
      }]);
    }

    if (isCorrect) setScore(s => s + 1);

    setTimeout(() => {
      setFeedback(null);
      setLoadingChallenge(false);
      generateChallenge();
    }, 800);
  };

  if (!isPlaying && timeLeft === 45) {
    return (
      <div className="bg-white rounded-[4rem] p-12 text-center space-y-10 shadow-2xl max-w-lg mx-auto border border-slate-100 animate-in zoom-in-95">
        <div className="text-7xl mb-4">🕵️‍♀️</div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Odd One Out</h2>
        <p className="text-slate-500 font-medium leading-relaxed px-6">Identify the infiltrator failing the semantic pattern established by your vault assets.</p>
        <button onClick={startGame} className="w-full bg-rose-500 text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-rose-600 shadow-xl transition-all active:scale-95">START HUNT</button>
        <button onClick={onBack} className="text-slate-400 font-bold text-sm block mx-auto hover:text-slate-900 transition-colors">Abort</button>
      </div>
    );
  }

  if (!isPlaying && timeLeft === 0) {
    return (
      <div className="bg-white rounded-[4rem] p-10 md:p-14 space-y-12 shadow-2xl max-w-4xl mx-auto border border-slate-100 overflow-y-auto max-h-[92vh] no-scrollbar pb-24">
        <div className="text-center">
          <div className="text-6xl mb-4">📜</div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Post-Session Audit</h2>
          <p className="text-7xl font-black text-rose-500 mt-2">{score}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">+ {score * 15} XP Earned</p>
        </div>

        <div className="space-y-10 pt-4 border-t border-slate-100">
           {history.map((h, i) => (
             <div key={i} className={`p-10 rounded-[4rem] border-2 transition-all ${h.isCorrect ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100 shadow-xl shadow-rose-100/10'}`}>
                <div className="flex justify-between items-start mb-8">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detected Outlier</p>
                      <h4 className="text-4xl font-black text-slate-900 tracking-tight">{h.oddWord}</h4>
                   </div>
                   <span className={`text-[9px] font-black uppercase px-6 py-2 rounded-full tracking-widest shadow-sm ${h.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                     {h.isCorrect ? 'Neutralized' : 'Breach Recorded'}
                   </span>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                       <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Logic Flow</p>
                       <div className="flex flex-col gap-4">
                          <div className={`p-4 rounded-2xl border ${h.isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-200'}`}>
                             <p className="text-[9px] font-black uppercase text-slate-500 mb-1">User Deduction</p>
                             <p className="font-black text-slate-900">"{h.userWord}"</p>
                          </div>
                          {!h.isCorrect && (
                            <div className="p-4 rounded-2xl border bg-emerald-50 border-emerald-200">
                               <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">Actual Outlier</p>
                               <p className="font-black text-emerald-800 italic">"{h.oddWord}"</p>
                            </div>
                          )}
                       </div>
                    </div>
                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Outlier Definition</p>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed italic">"{h.definition}"</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-950 text-slate-200 p-10 rounded-[3rem] shadow-2xl flex flex-col justify-center">
                    <p className="text-amber-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Semantic Bond: {h.relationship}</p>
                    <p className="text-sm font-medium leading-[1.8] text-slate-400 border-l-2 border-slate-700 pl-6">
                      {h.explanation}
                    </p>
                  </div>
                </div>
             </div>
           ))}
        </div>

        <div className="flex gap-4 pt-6 sticky bottom-0 bg-white/95 backdrop-blur-md">
          <button onClick={startGame} className="flex-1 bg-slate-950 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Re-Initiate Hunt</button>
          <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-900 py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">Hub</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-xl mx-auto space-y-10 p-12 rounded-[4.5rem] transition-all duration-500 ${feedback === 'correct' ? 'bg-emerald-50 scale-[1.02]' : feedback === 'wrong' ? 'bg-rose-50 shake' : 'bg-white shadow-2xl'}`}>
      <div className="flex justify-between items-center px-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clock</p>
          <p className="text-3xl font-black text-slate-900">{timeLeft}s</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validations</p>
          <p className="text-3xl font-black text-rose-500">{score}</p>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-2xl font-black text-slate-900 mb-12 uppercase tracking-tighter leading-tight">
          Select the term that <br/><span className="text-rose-600">fails</span> the semantic bond:
        </h3>
        <div className="grid grid-cols-2 gap-6">
          {currentChallenge?.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className={`p-6 rounded-[3rem] border-2 font-black text-xl transition-all h-44 flex items-center justify-center text-center leading-tight ${
                feedback && idx === currentChallenge.correctIndex
                  ? 'bg-emerald-600 border-emerald-700 text-white scale-110 shadow-xl'
                  : 'bg-white border-slate-100 text-slate-700 hover:border-rose-500 hover:scale-[1.02] hover:shadow-lg'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      
      {loadingChallenge && (
        <p className="text-center text-indigo-400 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Running Neural Audit...</p>
      )}
    </div>
  );
};

export default OddOneOut;
