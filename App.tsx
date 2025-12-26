
import React, { useState, useEffect, useCallback } from 'react';
import { UserProgress, AppScreen, MasteryLevel, Word } from './types';
import { GET_MASTER_CORE, titanSanitize } from './database';
import { XP_PER_WORD_UPGRADE } from './constants';
import Dashboard from './components/Dashboard';
import Flashcards from './components/Flashcards';
import WordBank from './components/WordBank';
import GameHub from './components/GameHub';
import AchievementPrizes from './components/MedalGallery';
import StudySessionSetup from './components/StudySessionSetup';

const APP_VERSION = 'v5.6.0-Master-Core';
const ACTIVE_VAULT_KEY = 'vv_vault_data_v4'; 
const USER_PROGRESS_KEY = 'vv_user_data_v4';
const TARGET_ASSET_COUNT = 2279;

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.DASHBOARD);
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [titanLibrary, setTitanLibrary] = useState<Word[] | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);

  // 1. MASTER SENTINEL SYNC
  useEffect(() => {
    const performDeepSentinelSync = () => {
      // Always get the full master core list from the independent file
      const masterCore = GET_MASTER_CORE();
      
      let savedLibrary: Word[] = [];
      try {
        const raw = localStorage.getItem(ACTIVE_VAULT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          savedLibrary = Array.isArray(parsed) ? parsed : [];
        }
      } catch (e) {
        console.warn("Storage corrupt, rebuilding from core.");
      }

      // 2. CONSOLIDATION PROTOCOL
      const libraryMap = new Map<string, Word>();
      
      // Load Master Core first as the baseline
      masterCore.forEach(w => {
        const key = w.term.toLowerCase().trim();
        libraryMap.set(key, w);
      });
      
      // Layer saved mods on top (preserving mastery ID links if they exist)
      savedLibrary.forEach(w => {
        const key = titanSanitize(w.term).toLowerCase().trim();
        if (key && libraryMap.has(key)) {
          const base = libraryMap.get(key)!;
          libraryMap.set(key, {
            ...base,
            ...w,
            term: titanSanitize(w.term),
            definition: titanSanitize(w.definition)
          });
        }
      });

      const finalLibrary = Array.from(libraryMap.values());
      
      // Verification Lock: If somehow count is still low, ignore storage entirely
      if (finalLibrary.length < TARGET_ASSET_COUNT) {
        console.log(`Discrepancy detected: Re-initializing with ${masterCore.length} Master Assets.`);
        setTitanLibrary(masterCore);
        localStorage.setItem(ACTIVE_VAULT_KEY, JSON.stringify(masterCore));
      } else {
        console.log(`Sentinel Sync: Verified ${finalLibrary.length} unique semantic assets.`);
        setTitanLibrary(finalLibrary);
        localStorage.setItem(ACTIVE_VAULT_KEY, JSON.stringify(finalLibrary));
      }

      // Load User Progress Stats
      const savedUser = localStorage.getItem(USER_PROGRESS_KEY);
      if (savedUser) {
        try { setProgress(JSON.parse(savedUser)); } catch (e) {}
      } else {
        setProgress({
          wordMastery: {}, masteryHistory: {}, dailyGainHistory: {}, customWords: [],
          streak: 1, lastActive: new Date().toISOString(), lastCheckIn: '',
          xp: 0, credits: 100, highScores: {}, inventory: { streakFreezes: 1, xpBoosters: 0 },
          achievements: [], academicIntegrity: 98, isPremium: false,
          dailyMasteryGoal: 10, dailyMasteryProgress: {}, dailyReviewedProgress: {}, milestonesClaimed: [],
          lastConfig: { levels: ['Core', 'Medium', 'Advanced'], freqs: ['High', 'Mid', 'Low'], masteries: [0, 1, 2] }
        });
      }
      setIsInitializing(false);
    };

    performDeepSentinelSync();
  }, []);

  // 3. PERSISTENCE SENTINEL
  useEffect(() => {
    if (isInitializing || titanLibrary === null) return;
    
    // Integrity Check: Never allow a save that drops below the master floor
    const currentCount = titanLibrary.length;
    if (currentCount < TARGET_ASSET_COUNT - 10) { // Slight buffer for accidental deletes
       console.error("Save Intercepted: Attempted word count regressed below floor.");
       return;
    }

    localStorage.setItem(ACTIVE_VAULT_KEY, JSON.stringify(titanLibrary));
  }, [titanLibrary, isInitializing]);

  useEffect(() => {
    if (isInitializing || !progress) return;
    localStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(progress));
  }, [progress, isInitializing]);

  const handleWordUpdate = useCallback((id: string, newLevel: MasteryLevel) => {
    const todayKey = new Date().toISOString().split('T')[0];
    setProgress(prev => {
      if (!prev) return prev;
      const oldLevel = prev.wordMastery[id] || 0;
      const reachedMastery = newLevel === 3 && oldLevel < 3;
      const xpGained = newLevel > oldLevel ? (newLevel - oldLevel) * XP_PER_WORD_UPGRADE : 0;
      return {
        ...prev,
        wordMastery: { ...prev.wordMastery, [id]: newLevel },
        xp: prev.xp + xpGained,
        credits: prev.credits + (reachedMastery ? 50 : 0),
        dailyMasteryProgress: { ...prev.dailyMasteryProgress, [todayKey]: (prev.dailyMasteryProgress[todayKey] || 0) + (reachedMastery ? 1 : 0) },
        dailyReviewedProgress: { ...prev.dailyReviewedProgress, [todayKey]: (prev.dailyReviewedProgress[todayKey] || 0) + 1 }
      };
    });
  }, []);

  const handleXP = useCallback((amount: number, gameId?: string, score?: number) => {
    setProgress(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        xp: prev.xp + amount,
        credits: prev.credits + Math.floor(amount / 2),
        highScores: gameId && score ? { ...prev.highScores, [gameId]: Math.max(prev.highScores[gameId] || 0, score) } : prev.highScores
      };
    });
  }, []);

  const handleQuickStart = () => {
    if (!titanLibrary || titanLibrary.length === 0) {
      setScreen(AppScreen.WORD_BANK);
      return;
    }
    const selection = [...titanLibrary].sort(() => 0.5 - Math.random()).slice(0, 20);
    setSessionWords(selection);
    setScreen(AppScreen.LEARN);
  };

  if (isInitializing || titanLibrary === null || !progress) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6 text-center px-6">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl animate-bounce flex items-center justify-center text-white font-black text-4xl shadow-[0_0_60px_rgba(79,70,229,0.4)]">V</div>
        <div className="space-y-2">
          <p className="text-indigo-400 font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">Syncing Master Core Intelligence...</p>
          <p className="text-slate-600 text-[9px] uppercase tracking-widest italic">Verifying 2,279 semantic assets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.4em] py-2.5 text-center border-b border-white/10">
        Vault Status: {titanLibrary.length.toLocaleString()} Assets Verified • {APP_VERSION}
      </div>

      <nav className="bg-slate-950 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setScreen(AppScreen.DASHBOARD)}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">V</div>
            <span className="font-black text-2xl tracking-tighter text-white">VocabVantage</span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <button onClick={() => setScreen(AppScreen.DASHBOARD)} className={screen === AppScreen.DASHBOARD ? 'text-white border-b-2 border-indigo-500 pb-1' : ''}>Dashboard</button>
            <button onClick={() => setScreen(AppScreen.WORD_BANK)} className={screen === AppScreen.WORD_BANK ? 'text-white border-b-2 border-indigo-500 pb-1' : ''}>Vault</button>
            <button onClick={() => setScreen(AppScreen.GAMES)} className={screen === AppScreen.GAMES ? 'text-white border-b-2 border-indigo-500 pb-1' : ''}>Training</button>
          </div>
        </div>
      </nav>
      
      <main className="flex-1 max-w-6xl mx-auto p-4 md:p-12 w-full">
        {(() => {
          switch (screen) {
            case AppScreen.DASHBOARD: return <Dashboard progress={{...progress, customWords: titanLibrary}} onNavigate={(s) => setScreen(s)} appVersion={APP_VERSION} onUpdateGoal={(g) => setProgress(p => p ? ({...p, dailyMasteryGoal: g}) : p)} onQuickStart={handleQuickStart} onDiscover={() => {}} isDiscovering={false} onClaim={() => 0} onUpgrade={() => {}} onReset={() => {}} onImportSync={() => {}} />;
            case AppScreen.LEARN: return <Flashcards words={sessionWords} currentMastery={progress.wordMastery} onWordUpdate={handleWordUpdate} onWordPropertyUpdate={(id, up) => setTitanLibrary(prev => prev ? prev.map(w => w.id === id ? {...w, ...up} : w) : prev)} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
            case AppScreen.WORD_BANK: return <WordBank words={titanLibrary} progress={progress.wordMastery} onImport={(nw) => setTitanLibrary(prev => {
              const map = new Map();
              if (prev) prev.forEach(w => map.set(titanSanitize(w.term).toLowerCase().trim(), w));
              nw.forEach(w => map.set(titanSanitize(w.term).toLowerCase().trim(), w));
              return Array.from(map.values());
            })} onDelete={() => {}} onClose={() => setScreen(AppScreen.DASHBOARD)} />;
            case AppScreen.GAMES: return <GameHub words={titanLibrary} onBack={() => setScreen(AppScreen.DASHBOARD)} onXP={handleXP} />;
            case AppScreen.ACHIEVEMENTS: return <AchievementPrizes progress={{...progress, customWords: titanLibrary}} onBack={() => setScreen(AppScreen.DASHBOARD)} onClaimMilestone={(id, bonus) => setProgress(p => p ? ({...p, credits: p.credits + bonus, milestonesClaimed: [...p.milestonesClaimed, id]}) : p)} />;
            case AppScreen.STUDY_SETUP: return <StudySessionSetup words={titanLibrary} progress={progress.wordMastery} lastConfig={progress.lastConfig} onStart={(sel, cfg) => { setSessionWords(sel); setProgress(p => p ? ({...p, lastConfig: cfg}) : p); setScreen(AppScreen.LEARN); }} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
            default: return <Dashboard progress={{...progress, customWords: titanLibrary}} onNavigate={(s) => setScreen(s)} onUpdateGoal={(g) => setProgress(p => p ? ({...p, dailyMasteryGoal: g}) : p)} onQuickStart={handleQuickStart} onDiscover={() => {}} isDiscovering={false} onClaim={() => 0} onUpgrade={() => {}} onReset={() => {}} onImportSync={() => {}} appVersion={APP_VERSION} />;
          }
        })()}
      </main>
    </div>
  );
};

export default App;
