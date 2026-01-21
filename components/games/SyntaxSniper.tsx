
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
  explanation: string;
  isCorrect: boolean;
  isTimeout: boolean;
  userSelection: string;
  targetCorrection: string;
}

const FALLBACK_CHALLENGES = [
  { 
    text: "The researcher [conducts] the study; [however] they [hadnt] find [any] results.", 
    options: ["conducts", "however", "hadnt", "any"], 
    errorIndex: 2, 
    correction: "did not (Formal Tone)", 
    corrected_text: "The researcher conducts the study; however, they did not find any results.", 
    rule: "Register & Style",
    explanation: "Contractions like 'hadnt' are considered informal register and are generally avoided in Standard English writing on the SAT. 'Did not' provides the necessary formal tone."
  },
  { 
    text: "Each of the [students] [are] required [to] bring a [laptop].", 
    options: ["students", "are", "to", "laptop"], 
    errorIndex: 1, 
    correction: "is (Subject-Verb Agreement)", 
    corrected_text: "Each of the students is required to bring a laptop.", 
    rule: "Subject-Verb Agreement",
    explanation: "The subject of the sentence is the singular pronoun 'Each', not the plural 'students'. Therefore, the singular verb 'is' must be used instead of 'are'."
  },
  { 
    text: "The [novel] was [more] [interesting] [then] the movie.", 
    options: ["novel", "more", "interesting", "then"], 
    errorIndex: 3, 
    correction: "than (Comparison)", 
    corrected_text: "The novel was more interesting than the movie.", 
    rule: "Diction",
    explanation: "'Then' is an adverb used to indicate time or sequence. For comparisons between two things (the novel and the movie), the conjunction 'than' is the correct choice."
  }
];

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
    setScore(0);
    setTimeLeft(60);
    setHistory([]);
    setCurrentIdx(0);
    setIsPlaying(true);
    setFeedback(null);

    try {
      const fresh = await generateDynamicSyntaxChallenges(8);
      setChallenges(fresh && fresh.length > 0 ? fresh : FALLBACK_CHALLENGES);
    } catch (e) {
      setChallenges(FALLBACK_CHALLENGES.sort(() => 0.5 - Math.random()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPlaying && !loading && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      const current = challenges[currentIdx];
      if (current && !feedback) {
        setHistory(prev => [...prev, {
          originalText: current.text,
          correctedText: current.corrected_text,
          rule: current.rule,
          explanation: current.explanation,
          isCorrect: false,
          isTimeout: true,
          userSelection: "N/A",
          targetCorrection: current.correction
        }]);
      }
      setIsPlaying(false);
      onXP(score * 30, 'syntax', score);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, loading, timeLeft, challenges, currentIdx, feedback]);

  const handleSnipe = (idx: number) => {
    if (feedback || !challenges[currentIdx] || timeLeft === 0) return;
    const challenge = challenges[currentIdx];
    const isCorrect = idx === challenge.errorIndex;
    
    setHistory(prev => [...prev, {
      originalText: challenge.text,
      correctedText: challenge.corrected_text,
      rule: challenge.rule,
      explanation: challenge.explanation,
      isCorrect: isCorrect,
      isTimeout: false,
      userSelection: challenge.options[idx] || "Unknown",
      targetCorrection: challenge.correction
    }]);

    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      if (timeLeft > 0) {
        setFeedback(null);
        if (currentIdx < challenges.length - 1) {
          setCurrentIdx(prev => prev + 1);
        } else {
          setIsPlaying(false);
          setTimeLeft(0);
        }
      }
    }, 1000);
  };

  if (!isPlaying && timeLeft === 60) {
    return (
      <div className="bg-white rounded-[4rem] p-12 text-center space-y-10 shadow-2xl max-w-xl mx-auto border border-slate-100 animate-in zoom-in-95">
        <div className="text-7xl">🎯</div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Syntax Sniper</h2>
        <p className="text-slate-500 font-medium leading-relaxed px-10">Scan for structural anomalies. Identify and neutralize syntactic errors in Standard English.</p>
        <button 
          onClick={startGame} 
          className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-indigo-700 transition-all shadow-xl active:scale-95"
        >
          ENGAGE PROTOCOL
        </button>
        <button onClick={onBack} className="text-slate-400 font-bold text-sm block mx-auto hover:text-slate-900 transition-colors">Abort</button>
      </div>
    );
  }

  if (!isPlaying && timeLeft === 0) {
    return (
      <div className="bg-white rounded-[4rem] p-12 space-y-10 shadow-2xl max-w-5xl mx-auto border border-slate-100 overflow-y-auto max-h-[92vh] no-scrollbar pb-24">
        <div className="text-center">
          <div className="text-6xl mb-4">🔬</div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Linguistic Forensics Audit</h2>
          <p className="text-7xl font-black text-indigo-600 mt-2">{score}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+ {score * 30} XP Earned</p>
        </div>

        <div className="space-y-10 pt-8 border-t border-slate-100">
           {history.map((record, i) => (
             <div key={i} className={`p-10 rounded-[4rem] border-2 flex flex-col gap-8 transition-all ${record.isCorrect ? 'bg-emerald-50/40 border-emerald-100' : record.isTimeout ? 'bg-amber-50/40 border-amber-100' : 'bg-rose-50/40 border-rose-100 shadow-xl shadow-rose-900/5'}`}>
                <div className="flex justify-between items-center px-2">
                   <div className="flex items-center gap-3">
                      <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">Audit ID #{i+1}</p>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{record.rule}</span>
                   </div>
                   <span className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm ${record.isCorrect ? 'bg-emerald-600 text-white' : record.isTimeout ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'}`}>
                      {record.isCorrect ? 'Neutralized' : record.isTimeout ? 'Timed Out' : 'Detection Failure'}
                   </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                   <div className="space-y-4">
                      <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm relative group">
                         <span className="absolute -top-3 left-8 bg-rose-600 text-white px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Initial Breach</span>
                         <p className="text-slate-500 font-bold leading-relaxed italic opacity-80">"{record.originalText.replace(/\[|\]/g, '')}"</p>
                      </div>
                      <div className="p-8 bg-white rounded-[2.5rem] border border-emerald-200 shadow-sm relative">
                         <span className="absolute -top-3 left-8 bg-emerald-600 text-white px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Forensic Calibration</span>
                         <p className="text-slate-900 font-black leading-relaxed text-lg">"{record.correctedText}"</p>
                      </div>
                   </div>

                   <div className="bg-slate-950 text-slate-200 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                          <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em]">Pedagogical Rationale</p>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-slate-300 pl-4 border-l-2 border-slate-800">
                           {record.explanation}
                        </p>
                        
                        <div className="pt-6 border-t border-slate-800/50 flex justify-between items-center gap-4">
                           <div className="flex-1">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Detected / Chosen Unit</p>
                              <div className={`p-4 rounded-2xl border-2 flex items-center justify-center font-black text-base ${record.isCorrect ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400' : 'bg-rose-950/40 border-rose-600 text-rose-400'}`}>
                                 "{record.userSelection}"
                              </div>
                           </div>
                           <div className="w-8 h-8 flex items-center justify-center text-slate-700">→</div>
                           <div className="flex-1 text-right">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Required Calibration</p>
                              <div className="p-4 rounded-2xl bg-emerald-600 border-2 border-emerald-500 text-white font-black text-base shadow-lg shadow-emerald-900/20">
                                 "{record.targetCorrection}"
                              </div>
                           </div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                   </div>
                </div>
             </div>
           ))}
        </div>

        <div className="flex gap-4 pt-6 sticky bottom-0 bg-white/95 backdrop-blur-md">
          <button onClick={startGame} className="flex-1 bg-slate-950 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">New Session</button>
          <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-900 py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">Return to Hub</button>
        </div>
      </div>
    );
  }

  const current = challenges[currentIdx];
  if (!current || (loading && challenges.length === 0)) {
    return (
      <div className="text-center p-24 animate-pulse text-indigo-400 font-black uppercase tracking-[0.5em] flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        Syncing Neural Data Streams...
      </div>
    );
  }

  const parts = current.text.split(/(\[.*?\])/g);

  return (
    <div className={`max-w-3xl mx-auto space-y-10 p-12 rounded-[4.5rem] transition-all duration-500 ${feedback === 'correct' ? 'bg-emerald-50 scale-[1.01]' : feedback === 'wrong' ? 'bg-rose-50 shake' : 'bg-white shadow-2xl'}`}>
      <div className="flex justify-between items-center px-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clock</p>
          <p className={`text-3xl font-black ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-slate-900'}`}>{timeLeft}s</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</p>
          <p className="text-3xl font-black text-indigo-600">{score}</p>
        </div>
      </div>

      <div className="bg-slate-50/50 rounded-[3.5rem] shadow-inner p-16 border border-slate-100 text-center relative group min-h-[14rem] flex items-center justify-center">
        <h3 className="text-2xl font-bold text-slate-800 leading-[2.8] flex flex-wrap justify-center items-center gap-x-1">
          {parts.map((p: string, i: number) => {
            const isBracketed = p.startsWith('[') && p.endsWith(']');
            if (isBracketed) {
              const cleanText = p.slice(1, -1);
              const optIdx = current.options.indexOf(cleanText);
              return (
                <button
                  key={i}
                  onClick={() => handleSnipe(optIdx)}
                  className={`px-4 py-1.5 rounded-xl border-2 font-black transition-all mx-1 mb-2 shadow-sm ${
                    feedback && optIdx === current.errorIndex 
                      ? 'bg-emerald-600 border-emerald-700 text-white scale-110 shadow-lg' 
                      : 'border-white bg-white text-indigo-600 hover:border-indigo-400 hover:shadow-md active:scale-95'
                  }`}
                >
                  {cleanText}
                </button>
              );
            }
            return <span key={i} className="text-slate-600 whitespace-pre-wrap">{p}</span>;
          })}
        </h3>
        
        {feedback && (
           <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full border-2 animate-in slide-in-from-bottom-4 duration-500 shadow-xl ${feedback === 'correct' ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-rose-600 border-rose-700 text-white'}`}>
              <p className="text-[9px] font-black uppercase tracking-widest">{feedback === 'correct' ? 'Anomaly Neutralized' : 'Detection Failure'}</p>
           </div>
        )}
      </div>

      <p className="text-center text-slate-400 text-[11px] font-black uppercase tracking-[0.4em] animate-pulse">Select the structural anomaly to proceed</p>
    </div>
  );
};

export default SyntaxSniper;
