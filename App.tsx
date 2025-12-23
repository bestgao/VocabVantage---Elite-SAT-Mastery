
import React, { useState, useEffect, useCallback } from 'react';
import { UserProgress, AppScreen, MasteryLevel, Word } from './types';
import { INITIAL_WORDS, XP_PER_WORD_UPGRADE } from './constants';
import Dashboard from './components/Dashboard';
import Flashcards from './components/Flashcards';
import Quiz from './components/Quiz';
import AITutor from './components/AITutor';
import WordBank from './components/WordBank';
import GameHub from './components/GameHub';
import RewardStore from './components/RewardStore';
import MedalGallery from './components/MedalGallery';

const REPO_STORAGE_KEY = 'vv_titan_repository_v2';
const USER_DATA_KEY = 'vv_titan_user_progress_v2';
const APP_VERSION = 'v2.4.5-Titan';
const DEPLOY_TIMESTAMP = new Date().toLocaleDateString();

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.DASHBOARD);
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [titanLibrary, setTitanLibrary] = useState<Word[]>(() => {
    const savedRepo = localStorage.getItem(REPO_STORAGE_KEY);
    if (savedRepo) {
      try { return JSON.parse(savedRepo); } catch (e) { console.error("Repo Load Error"); }
    }
    return INITIAL_WORDS;
  });

  const [progress, setProgress] = useState<UserProgress>(() => {
    const savedUser = localStorage.getItem(USER_DATA_KEY);
    if (savedUser) {
      try {
        const p = JSON.parse(savedUser);
        return {
          ...p,
          wordMastery: p.wordMastery || {},
          credits: p.credits ?? 100,
          xp: p.xp ?? 0,
          streak: p.streak ?? 1,
          customWords: []
        };
      } catch (e) { console.error("User Data Load Error"); }
    }
    return {
      wordMastery: {},
      masteryHistory: {},
      dailyGainHistory: {},
      customWords: [],
      streak: 1,
      lastActive: new Date().toISOString(),
      lastCheckIn: '',
      xp: 0,
      credits: 100,
      highScores: {},
      inventory: { streakFreezes: 1, xpBoosters: 0 },
      achievements: [],
      academicIntegrity: 98,
      isPremium: false 
    };
  });

  useEffect(() => {
    localStorage.setItem(REPO_STORAGE_KEY, JSON.stringify(titanLibrary));
    setHasUnsavedChanges(true);
  }, [titanLibrary]);

  useEffect(() => {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(progress));
    setHasUnsavedChanges(true);
  }, [progress]);

  const handleWordUpdate = useCallback((id: string, newLevel: MasteryLevel) => {
    setProgress(prev => {
      const oldLevel = prev.wordMastery[id] || 0;
      if (oldLevel === newLevel) return prev;
      const xpGained = newLevel > oldLevel ? (newLevel - oldLevel) * XP_PER_WORD_UPGRADE : 0;
      return {
        ...prev,
        wordMastery: { ...prev.wordMastery, [id]: newLevel },
        xp: prev.xp + xpGained,
        credits: prev.credits + (newLevel === 3 && oldLevel < 3 ? 50 : 0)
      };
    });
  }, []);

  const handleBulkImport = (newWords: Word[]) => {
    setTitanLibrary(newWords);
    alert(`Titan Repository Updated: ${newWords.length} words synced.`);
  };

  const handleSyncProgress = (importedData: string) => {
    try {
      const decoded = JSON.parse(atob(importedData));
      if (decoded.wordMastery) {
        setProgress(prev => ({ ...prev, ...decoded }));
        alert("Vantage Sync Complete! Your progress has been migrated.");
      }
    } catch (e) {
      alert("Invalid Sync Key.");
    }
  };

  const handleNavigate = (newScreen: AppScreen, filterMastery?: MasteryLevel, satLevel?: Word['satLevel']) => {
    if (newScreen === AppScreen.LEARN) {
      let pool = titanLibrary;
      if (satLevel) pool = pool.filter(w => w.satLevel === satLevel);
      if (filterMastery !== undefined) pool = pool.filter(w => (progress.wordMastery[w.id] || 0) === filterMastery);
      if (pool.length === 0) {
        alert("Selection empty. Review your Word Bank.");
        return;
      }
      const selection = [...pool]
        .sort((a, b) => {
          const mA = progress.wordMastery[a.id] || 0;
          const mB = progress.wordMastery[b.id] || 0;
          if (mA !== mB) return mA - mB;
          const pA = a.frequencyTier === 'High' ? 3 : a.frequencyTier === 'Mid' ? 2 : 1;
          const pB = b.frequencyTier === 'High' ? 3 : b.frequencyTier === 'Mid' ? 2 : 1;
          return pB - pA;
        })
        .slice(0, 15);
      setSessionWords(selection);
    }
    setScreen(newScreen);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-950 sticky top-0 z-50 shadow-2xl border-b border-slate-900">
        <div className="max-w-6xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setScreen(AppScreen.DASHBOARD)}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">V</div>
            <div className="flex flex-col -space-y-1">
              <span className="font-black text-2xl tracking-tighter text-white">VocabVantage</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{APP_VERSION}</span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">GITHUB LIVE</span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <button onClick={() => setScreen(AppScreen.DASHBOARD)} className={screen === AppScreen.DASHBOARD ? 'text-white' : 'hover:text-indigo-300'}>Dashboard</button>
            <button onClick={() => setScreen(AppScreen.WORD_BANK)} className={screen === AppScreen.WORD_BANK ? 'text-white' : 'hover:text-indigo-300'}>Bank ({titanLibrary.length})</button>
            <button onClick={() => setScreen(AppScreen.GAMES)} className={screen === AppScreen.GAMES ? 'text-white' : 'hover:text-indigo-300'}>Games</button>
            <div className="flex items-center gap-4 border-l border-slate-800 pl-8">
              <span className="text-indigo-400 font-black">{progress.credits.toLocaleString()} VC</span>
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-900/20">{progress.streak}</div>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-6xl mx-auto p-4 md:p-12">
        {(() => {
          switch (screen) {
            case AppScreen.DASHBOARD: return <Dashboard progress={{...progress, customWords: titanLibrary}} onNavigate={handleNavigate} onDiscover={() => {}} isDiscovering={isDiscovering} onClaim={() => 50} onUpgrade={() => {}} onReset={() => {}} onImportSync={handleSyncProgress} />;
            case AppScreen.LEARN: return <Flashcards words={sessionWords} currentMastery={progress.wordMastery} onWordUpdate={handleWordUpdate} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
            case AppScreen.WORD_BANK: return <WordBank words={titanLibrary} progress={progress.wordMastery} onImport={handleBulkImport} onDelete={() => {}} onClose={() => setScreen(AppScreen.DASHBOARD)} />;
            case AppScreen.GAMES: return <GameHub onBack={() => setScreen(AppScreen.DASHBOARD)} onXP={(a) => setProgress(p => ({...p, xp: p.xp + a, credits: p.credits + Math.floor(a/5)}))} />;
            case AppScreen.STORE: return <RewardStore credits={progress.credits} inventory={progress.inventory} masteredCount={Object.values(progress.wordMastery).filter(v => v === 3).length} academicIntegrity={98} isPremium={false} onPurchase={(c, i) => {
               if (progress.credits >= c) {
                 setProgress(p => ({...p, credits: p.credits - c, inventory: {...p.inventory, [i]: p.inventory[i] + 1}}));
                 return true;
               }
               return false;
            }} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
            case AppScreen.ACHIEVEMENTS: return <MedalGallery progress={{...progress, wordMastery: progress.wordMastery}} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
            default: return <Dashboard progress={{...progress, customWords: titanLibrary}} onNavigate={handleNavigate} onDiscover={() => {}} isDiscovering={isDiscovering} onClaim={() => 50} onUpgrade={() => {}} onReset={() => {}} onImportSync={handleSyncProgress} />;
          }
        })()}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-200 mt-12 mb-20 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start space-y-2">
           <div className="flex items-center gap-2">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Build Status:</p>
             <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">Deploy Ready</span>
           </div>
           <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Last Manual Sync: {DEPLOY_TIMESTAMP}</p>
        </div>
        <div className="flex gap-4">
           {hasUnsavedChanges && (
             <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-full border border-amber-100 animate-bounce">
               <span className="w-2 h-2 rounded-full bg-amber-500"></span>
               <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Click GitHub Icon to Save</span>
             </div>
           )}
           <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
             <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Cloud API Online</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
