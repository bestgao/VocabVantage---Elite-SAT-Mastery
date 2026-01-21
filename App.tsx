
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProgress, AppScreen, MasteryLevel, Word } from './types';
import { GET_MASTER_CORE } from './database';
import { XP_PER_WORD_UPGRADE } from './constants';
import { STABLE_KEY, saveVault, BootResult, runPersistenceQA } from './persistence';
import Dashboard from './components/Dashboard';
import Flashcards from './components/Flashcards';
import WordBank from './components/WordBank';
import StudySessionSetup from './components/StudySessionSetup';
import SessionSummary from './components/SessionSummary';
import GameHub from './components/GameHub';

interface AppProps {
  bootData: BootResult;
}

const getLocalKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const App: React.FC<AppProps> = ({ bootData }) => {
  const [screen, setScreen] = useState<AppScreen | 'SUMMARY'>(AppScreen.DASHBOARD);
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [sessionResults, setSessionResults] = useState({ mastered: 0, reviews: 0, xp: 0 });
  const [titanLibrary, setTitanLibrary] = useState<Word[]>([]);
  
  const [progress, setProgress] = useState<UserProgress>(bootData.progress);
  const [lastSavedAt, setLastSavedAt] = useState<number>(bootData.progress.updatedAt);
  const [celebration, setCelebration] = useState(false);
  
  const progressRef = useRef<UserProgress>(bootData.progress);
  const lastSeenRevisionRef = useRef<number>(bootData.progress.revision);
  const isDirtyRef = useRef(false);
  const debounceTimer = useRef<number | null>(null);

  const commit = useCallback((p: UserProgress, force = false) => {
    const result = saveVault(p, lastSeenRevisionRef.current, force);
    if (result.success) {
      const raw = localStorage.getItem(STABLE_KEY);
      if (raw) {
        const disk = JSON.parse(raw);
        lastSeenRevisionRef.current = disk.revision;
        isDirtyRef.current = false;
        setLastSavedAt(disk.updatedAt);
      }
    } else if (result.reason === 'STALE_MEMORY_COLLISION') {
      const raw = localStorage.getItem(STABLE_KEY);
      if (raw) {
        const disk = JSON.parse(raw);
        setProgress(disk);
        lastSeenRevisionRef.current = disk.revision;
        isDirtyRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    setTitanLibrary(GET_MASTER_CORE());

    const flush = () => {
      if (isDirtyRef.current) {
        commit(progressRef.current, true);
      }
    };

    window.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    
    return () => {
      window.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
    };
  }, [commit]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const updateProgress = useCallback((updater: (prev: UserProgress) => UserProgress, isCritical = false) => {
    setProgress(prev => {
      const next = updater(prev);
      isDirtyRef.current = true;

      if (isCritical) {
        commit(next, true);
      } else {
        if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
        debounceTimer.current = window.setTimeout(() => {
          commit(progressRef.current);
        }, 1500);
      }
      return next;
    });
  }, [commit]);

  const handleXP = useCallback((amount: number) => {
    const today = getLocalKey();
    updateProgress(prev => {
      const currentLedger = prev.activityLedger[today] || { date: today, mastered: 0, reviewed: 0, xpGained: 0 };
      return {
        ...prev,
        xp: prev.xp + amount,
        credits: prev.credits + Math.floor(amount / 10), // Conversion: 10XP = 1 Credit
        activityLedger: {
          ...prev.activityLedger,
          [today]: {
            ...currentLedger,
            xpGained: currentLedger.xpGained + amount
          }
        }
      };
    }, false);
  }, [updateProgress]);

  const handleWordUpdate = useCallback((id: string, newLevel: MasteryLevel) => {
    const today = getLocalKey();
    
    updateProgress(prev => {
      const oldLevel = prev.wordMastery[id] || 0;
      const reachedMastery = newLevel === 3 && oldLevel < 3;
      const xpGained = newLevel > oldLevel ? (newLevel - oldLevel) * XP_PER_WORD_UPGRADE : 5;
      
      const currentLedger = prev.activityLedger[today] || { date: today, mastered: 0, reviewed: 0, xpGained: 0 };
      const oldDailyMastered = currentLedger.mastered;
      const newDailyMastered = oldDailyMastered + (reachedMastery ? 1 : 0);

      if (reachedMastery && oldDailyMastered < prev.dailyMasteryGoal && newDailyMastered >= prev.dailyMasteryGoal) {
        setCelebration(true);
      }

      setSessionResults(curr => ({
        mastered: curr.mastered + (reachedMastery ? 1 : 0),
        reviews: curr.reviews + 1,
        xp: curr.xp + xpGained
      }));

      return {
        ...prev,
        wordMastery: { ...prev.wordMastery, [id]: newLevel },
        xp: prev.xp + xpGained,
        credits: prev.credits + (reachedMastery ? 50 : 0),
        activityLedger: {
          ...prev.activityLedger,
          [today]: {
            ...currentLedger,
            mastered: newDailyMastered,
            reviewed: currentLedger.reviewed + 1,
            xpGained: currentLedger.xpGained + xpGained
          }
        }
      };
    }, false);
  }, [updateProgress]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {celebration && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-3xl p-16 rounded-[4rem] shadow-2xl border border-indigo-200 text-center animate-in zoom-in-50 fade-in duration-500 pointer-events-auto">
            <div className="text-8xl mb-6">🏆</div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Goal Achieved!</h2>
            <p className="text-indigo-600 font-bold mt-2 uppercase tracking-widest text-xs">Daily Mastery Threshold Cleared</p>
            <button onClick={() => setCelebration(false)} className="mt-10 px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-black transition-all">Continue Excellence</button>
          </div>
        </div>
      )}

      <nav className="bg-slate-950 sticky top-0 z-50 h-24 shadow-2xl flex items-center px-6 border-b border-slate-900">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center space-x-5 cursor-pointer group" onClick={() => setScreen(AppScreen.DASHBOARD)}>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl transition-transform group-hover:rotate-12">V</div>
            <span className="font-black text-3xl tracking-tighter text-white group-hover:text-indigo-400 transition-colors">VocabVantage</span>
          </div>
          <div className="flex items-center space-x-8">
            <div className="flex flex-col items-end leading-tight text-white font-black">
               <span className="text-2xl">{progress.xp.toLocaleString()} <span className="text-[10px] text-slate-500 uppercase">XP</span></span>
               <span className="text-indigo-400 text-[10px] uppercase tracking-widest">Rev {lastSeenRevisionRef.current}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto p-4 md:p-12 w-full">
        {screen === AppScreen.DASHBOARD && (
          <Dashboard 
            progress={progress} 
            lastSavedAt={lastSavedAt}
            bootLog={bootData.logs}
            onNavigate={setScreen} 
            onUpdateGoal={(type, val) => updateProgress(prev => ({ ...prev, [type]: val }), true)}
            onQuickStart={() => {
              setSessionWords(titanLibrary.sort(() => 0.5 - Math.random()).slice(0, 20));
              setScreen(AppScreen.LEARN);
            }} 
            onReset={() => {
              if (window.confirm("Nuclear Reset? All data will be wiped.")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            onExport={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(progress));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", `vault_v20_sentinel.json`);
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}
            onRunQA={async () => {
              const results = await runPersistenceQA();
              alert(results.map(r => `[${r.status}] ${r.name}`).join('\n'));
            }}
          />
        )}
        {screen === AppScreen.LEARN && (
          <Flashcards 
            words={sessionWords} 
            currentMastery={progress.wordMastery} 
            onWordUpdate={handleWordUpdate} 
            onWordPropertyUpdate={(id, updates) => updateProgress(prev => ({
              ...prev,
              customWords: (prev.customWords || []).map(w => w.id === id ? { ...w, ...updates } : w)
            }), false)} 
            onBack={() => setScreen('SUMMARY')} 
          />
        )}
        {screen === AppScreen.GAME_HUB && (
          <GameHub 
            words={titanLibrary} 
            onBack={() => setScreen(AppScreen.DASHBOARD)} 
            onXP={handleXP}
          />
        )}
        {screen === 'SUMMARY' && <SessionSummary results={sessionResults} onContinue={() => setScreen(AppScreen.DASHBOARD)} />}
        {screen === AppScreen.WORD_BANK && <WordBank words={titanLibrary} progress={progress.wordMastery} onImport={() => {}} onDelete={() => {}} onClose={() => setScreen(AppScreen.DASHBOARD)} />}
        {screen === AppScreen.STUDY_SETUP && <StudySessionSetup words={titanLibrary} progress={progress.wordMastery} lastConfig={progress.lastConfig} onBack={() => setScreen(AppScreen.DASHBOARD)} onStart={(w) => { setSessionWords(w); setScreen(AppScreen.LEARN); }} />}
      </main>
    </div>
  );
};
export default App;
