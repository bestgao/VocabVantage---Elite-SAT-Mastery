
import React, { useState, useEffect, useRef } from 'react';
import { generateDynamicSyntaxChallenges } from '../../services/gemini';

interface SyntaxSniperProps {
  onBack: () => void;
  onXP: (amount: number, gameId: string, score: number) => void;
}

interface SnipedRecord {
  originalText: string;
  correctedText: string;
  rule: string;
  isCorrect: boolean;
  userSelection: string;
  targetCorrection: string;
}

const SyntaxSniper: React.FC<SyntaxSniperProps> = ({ onBack, onXP }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [history, setHistory] = useState<SnipedRecord[]>([]);
  const timerRef = useRef<number>(0);

  const startGame = async () => {
    setLoading(true);
    try {
      const fresh = await generateDynamicSyntaxChallenges(8);
      setChallenges(fresh);
      setIsPlaying(true);
      setScore(0);
      setTimeLeft(60);
      setHistory([]);
      setCurrentIdx(0);
    } catch (e) {
      alert("Neural link failed. recalibrating...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      onXP(score * 30, 'syntax', score);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, timeLeft]);

  const handleSnipe = (idx: number) => {
    if (feedback || !challenges[currentIdx]) return;
    const challenge = challenges[currentIdx];
    const isCorrect = idx === challenge.errorIndex;
    
    setHistory(prev => [...prev, {
      originalText: challenge.text,
      correctedText: challenge.corrected_text,
      rule: challenge.rule,
      isCorrect: isCorrect,
      userSelection: challenge.options[idx],
      targetCorrection: challenge.correction
    }]);

    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIdx < challenges.length - 1) {
        setCurrentIdx(prev => prev + 1);
      } else {
        setIsPlaying(false);
        setTimeLeft(0);
      }
    }, 1200);
  };

  if (!isPlaying && timeLeft === 60) {
    return (
      <div className="bg-white rounded-[4rem] p-12 text-center space-y-10 shadow-2xl max-w-xl mx-auto border border-slate-100">
        <div className="text-7xl">🎯</div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Syntax Sniper</h2>
        <p className="text-slate-500 font-medium leading-relaxed px-10">Analyze structural complexity. Identify and neutralize syntactic anomalies in Standard English.</p>
        <button 
          onClick={startGame} 
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-indigo-700 transition-all shadow-xl active:scale-95 disabled:bg-slate-300"
        >
          {loading ? 'CALIBRATING...' : 'START PROTOCOL'}
        </button>
        <button onClick={onBack} className="text-slate-400 font-bold text-sm block mx-auto hover:text-slate-900 transition-colors">Abort</button>
      </div>
    );
  }

  if (!isPlaying && timeLeft === 0) {
    return (
      <div className="bg-white rounded-[4rem] p-12 space-y-10 shadow-2xl max-w-4xl mx-auto border border-slate-100 overflow-y-auto max-h-[92vh] no-scrollbar pb-24">
        <div className="text-center">
          <div className="text-6xl mb-4">🔬</div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Forensic Linguistics Report</h2>
          <p className="text-7xl font-black text-indigo-600 mt-2">{score}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+ {score * 30} XP</p>
        </div>

        <div className="space-y-10 pt-8 border-t border-slate-100">
           {history.map((record, i) => (
             <div key={i} className={`p-12 rounded-[4rem] border-2 flex flex-col gap-10 transition-all ${record.isCorrect ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100 shadow-lg shadow-rose-100/20'}`}>
                <div className="flex justify-between items-center">
                   <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Case Analysis #{i+1}</p>
                   <span className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest ${record.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                      {record.isCorrect ? 'Neutralized' : 'Anomaly Remained'}
                   </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div className="p-8 bg-white rounded-[2.5rem] border border-rose-100 shadow-sm">
                         <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">Faulty Syntax (Input)</p>
                         <p className="text-slate-800 font-bold leading-relaxed italic">"{record.originalText.replace(/\[|\]/g, '')}"</p>
                      </div>
                      <div className="p-8 bg-white rounded-[2.5rem] border border-emerald-100 shadow-sm border-l-[12px] border-l-emerald-500">
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Optimized Syntax (Corrected)</p>
                         <p className="text-slate-900 font-black leading-relaxed">"{record.correctedText}"</p>
                      </div>
                   </div>

                   <div className="bg-slate-950 text-slate-200 p-10 rounded-[3rem] flex flex-col justify-center shadow-2xl">
                      <p className="text-amber-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Rule Violation: {record.rule}</p>
                      <p className="text-sm font-medium leading-[1.8] text-slate-400 border-l-2 border-slate-700 pl-6">
                         Standard English conventions require this modification to ensure logical clarity and structural cohesion. 
                         The error specifically targeted {record.rule.toLowerCase()}.
                      </p>
                      <div className="mt-8 pt-8 border-t border-slate-800 flex justify-between items-center">
                         <div>
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Selected</p>
                           <p className="text-rose-400 font-black text-lg">"{record.userSelection}"</p>
                         </div>
                         <div className="text-right">
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Fix</p>
                           <p className="text-emerald-400 font-black text-lg">"{record.targetCorrection}"</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>

        <div className="flex gap-4 pt-6 sticky bottom-0 bg-white/95 backdrop-blur-md">
          <button onClick={startGame} className="flex-1 bg-slate-950 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">New Protocol</button>
          <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-900 py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">Return to Hub</button>
        </div>
      </div>
    );
  }

  const current = challenges[currentIdx];
  if (!current) return <div className="text-center p-24 animate-pulse text-indigo-400 font-black uppercase tracking-[0.5em]">Syncing Neural Data...</div>;
  const parts = current.text.split(/\[|\]/);

  return (
    <div className={`max-w-3xl mx-auto space-y-10 p-12 rounded-[4.5rem] transition-all duration-500 ${feedback === 'correct' ? 'bg-emerald-50 scale-[1.01]' : feedback === 'wrong' ? 'bg-rose-50 shake' : 'bg-white shadow-2xl'}`}>
      <div className="flex justify-between items-center px-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detection Clock</p>
          <p className={`text-3xl font-black ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-slate-900'}`}>{timeLeft}s</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Hits</p>
          <p className="text-3xl font-black text-indigo-600">{score}</p>
        </div>
      </div>

      <div className="bg-slate-50/50 rounded-[3.5rem] shadow-inner p-16 border border-slate-100 text-center relative group">
        <h3 className="text-3xl font-bold text-slate-800 leading-[1.8] flex flex-wrap justify-center items-center gap-x-2 gap-y-4">
          {parts.map((p: string, i: number) => {
            const optIdx = current.options.indexOf(p);
            if (optIdx !== -1) {
              return (
                <button
                  key={i}
                  onClick={() => handleSnipe(optIdx)}
                  className={`px-5 py-2 rounded-2xl border-2 font-black transition-all ${
                    feedback && optIdx === current.errorIndex 
                      ? 'bg-emerald-600 border-emerald-700 text-white scale-110 shadow-lg' 
                      : 'border-white bg-white text-indigo-600 hover:border-indigo-400 hover:shadow-md'
                  }`}
                >
                  {p}
                </button>
              );
            }
            return <span key={i} className="text-slate-600">{p}</span>;
          })}
        </h3>
        
        {feedback && (
           <div className={`mt-10 p-8 rounded-[2.5rem] border-2 animate-in slide-in-from-bottom-4 duration-500 ${feedback === 'correct' ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-rose-100 border-rose-200 text-rose-800'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1">{feedback === 'correct' ? 'Breach Neutralized' : 'Anomaly Recorded'}</p>
              <p className="text-lg font-black italic">{current.rule}</p>
           </div>
        )}
      </div>

      <p className="text-center text-slate-400 text-[11px] font-black uppercase tracking-[0.4em] animate-pulse">Scan & Select the structural anomaly</p>
    </div>
  );
};

export default SyntaxSniper;
