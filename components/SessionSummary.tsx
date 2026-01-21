import React from 'react';

interface SessionSummaryProps {
  results: {
    mastered: number;
    reviews: number;
    xp: number;
  };
  onContinue: () => void;
}

const SessionSummary: React.FC<SessionSummaryProps> = ({ results, onContinue }) => {
  return (
    <div className="max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center space-y-12 animate-in zoom-in-95 duration-500">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-5xl mx-auto shadow-2xl shadow-indigo-200 animate-bounce mb-8">✨</div>
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Session Stabilized</h2>
        <p className="text-slate-500 font-medium text-lg">Neural integration successful. Insights updated.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-2">
          <p className="text-5xl font-black text-indigo-600">+{results.xp}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">XP Acquired</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-2">
          <p className="text-5xl font-black text-emerald-500">{results.mastered}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Masters</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-2">
          <p className="text-5xl font-black text-slate-900">{results.reviews}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units Processed</p>
        </div>
      </div>

      <div className="w-full space-y-6">
        <button 
          onClick={onContinue}
          className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-lg uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
        >
          Return to Dashboard
        </button>
        <div className="flex justify-center gap-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          <span>Efficiency: High</span>
          <span>Retention: +4.2% Estimated</span>
        </div>
      </div>
    </div>
  );
};

export default SessionSummary;