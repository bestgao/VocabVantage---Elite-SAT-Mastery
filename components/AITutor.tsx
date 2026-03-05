
import React from 'react';

const AITutor: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-[650px] max-w-3xl mx-auto bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-700">
      <div className="p-10 bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
        <div className="flex items-center gap-6 relative z-10">
          <div className={`w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-700`}></div>
          <div>
            <h2 className="font-black text-2xl tracking-tight italic">Neural <span className="text-indigo-500">Tutor</span></h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-bold">Protocol Offline</p>
          </div>
        </div>
        <button onClick={onBack} className="w-14 h-14 bg-slate-900 text-slate-400 rounded-2xl flex items-center justify-center hover:text-white transition-all relative z-10 border border-slate-800 active:scale-95">✕</button>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-10 bg-slate-50/30">
        <div className="relative">
          <div className="text-9xl grayscale opacity-20">🤖</div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl">Phase 2: Neural Integration</div>
          </div>
        </div>

        <div className="space-y-4 max-w-sm mx-auto">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">AI Training Locked</h3>
          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            The Neural Tutor requires an active API handshaking protocol. To maximize learning efficiency in this initial version, we have prioritized the **Local Titan Engine**.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
           <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">Benefit</p>
              <p className="text-[11px] font-bold text-slate-700">Unlimited Offline Practice</p>
           </div>
           <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Stability</p>
              <p className="text-[11px] font-bold text-slate-700">Zero Latency Feedback</p>
           </div>
        </div>

        <button 
          onClick={onBack}
          className="px-10 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
        >
          Return to Local Lab
        </button>
      </div>

      <div className="p-6 bg-slate-100/50 text-center border-t border-slate-100">
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Powered by VocabVantage V21 "Local Titan" Architecture</p>
      </div>
    </div>
  );
};
export default AITutor;
