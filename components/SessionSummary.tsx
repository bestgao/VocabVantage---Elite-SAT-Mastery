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
    <div className="max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center space-y-8 md:space-y-12 px-4 animate-in zoom-in-95 duration-500">
      <div className="text-center space-y-3 md:space-y-4">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-indigo-600 rounded-[2rem] md:rounded-3xl flex items-center justify-center text-4xl md:text-5xl mx-auto shadow-2xl shadow-indigo-200 animate-bounce mb-6 md:mb-8">✨</div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Session Stabilized</h2>
        <p className="text-slate-500 font-medium text-base md:text-lg">Neural integration successful. Insights updated.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-1 md:space-y-2">
          <p className="text-4xl md:text-5xl font-black text-indigo-600">+{results.xp}</p>
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">XP Acquired</p>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-1 md:space-y-2">
          <p className="text-4xl md:text-5xl font-black text-emerald-500">{results.mastered}</p>
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">New Masters</p>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-1 md:space-y-2">
          <p className="text-4xl md:text-5xl font-black text-slate-900">{results.reviews}</p>
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Units Processed</p>
        </div>
      </div>

      <div className="w-full space-y-4 md:space-y-6">
        <button 
          onClick={onContinue}
          className="w-full bg-slate-900 text-white py-5 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black text-base md:text-lg uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
        >
          Return to Dashboard
        </button>
        <div className="flex justify-center gap-6 md:gap-8 text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          <span>Efficiency: High</span>
          <span>Retention: +4.2%</span>
        </div>
      </div>
    </div>
  );
};

export default SessionSummary;