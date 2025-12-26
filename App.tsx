import React, { useState, useEffect, useCallback } from 'react';
import { UserProgress, AppScreen, MasteryLevel, Word } from './types';
import { GET_MASTER_CORE } from './database';
import { XP_PER_WORD_UPGRADE } from './constants';
import { validateSystemConnection } from './services/gemini';
import Dashboard from './components/Dashboard';
import Flashcards from './components/Flashcards';
import WordBank from './components/WordBank';
import GameHub from './components/GameHub';
import StudySessionSetup from './components/StudySessionSetup';
import AITutor from './components/AITutor';
import Leaderboard from './components/Leaderboard';
import RewardStore from './components/RewardStore';
import MedalGallery from './components/MedalGallery';

const CURRENT_VERSION = '2.8.4';
const STORAGE_KEY = 'vv_unified_vault_production_v2';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.DASHBOARD);
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [titanLibrary, setTitanLibrary] = useState<Word[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [aiStatus, setAiStatus] = useState<'syncing' | 'online' | 'offline'>('syncing');

  useEffect(() => {
    const initializeApp = async () => {
      const mainStore = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('vv_unified_vault_production');
      let savedData: any = mainStore ? JSON.parse(mainStore) : null;

      const initialProgress: UserProgress = savedData?.progress || {
        wordMastery: {}, masteryHistory: {}, dailyGainHistory: {}, customWords: [],
        streak: 1, lastActive: new Date().toISOString(), lastCheckIn: '',
        xp: 0, credits: 100, highScores: {}, inventory: { streakFreezes: 1, xpBoosters: 0 },
        achievements: [], academicIntegrity: 98, isPremium: false,
        dailyMasteryGoal: 10, dailyMasteryProgress: {}, dailyReviewedProgress: {}, milestonesClaimed: [],
        lastConfig: { levels: ['Core', 'Medium', 'Advanced'], freqs: ['High', 'Mid', 'Low'], masteries: [0, 1, 2] }
      };

      const baseLibrary = GET_MASTER_CORE();
      const savedLibrary = savedData?.library || [];
      const combined = [...savedLibrary];
      const existingTerms = new Set(combined.map(w => w.term.toLowerCase()));
      baseLibrary.forEach(w => {
        if (!existingTerms.has(w.term.toLowerCase())) combined.push(w);
      });

      setTitanLibrary(combined);
      setProgress(initialProgress);
      setIsInitializing(false);

      const check = await validateSystemConnection();
      setAiStatus(check.status === 'online' ? 'online' : 'offline');
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (isInitializing || !progress) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      progress, 
      library: titanLibrary,
      version: CURRENT_VERSION 
    }));
  }, [progress, titanLibrary, isInitializing]);

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

  const handleWordPropertyUpdate = useCallback((id: string, updates: Partial<Word>) => {
    setTitanLibrary(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    setSessionWords(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const handleQuickStart = () => {
    // Weighted selection: Unmastered words are 3x more likely to appear
    const pool: Word[] = [];
    titanLibrary.forEach(w => {
      const m = progress?.wordMastery[w.id] || 0;
      if (m === 3) {
        pool.push(w); // Mastered: 1 entry
      } else {
        // Not mastered: 3 entries
        pool.push(w, w, w);
      }
    });

    const unique = new Set<Word>();
    const maxSession = Math.min(15, titanLibrary.length);
    while(unique.size < maxSession && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      unique.add(pool[idx]);
    }
    
    setSessionWords(Array.from(unique));
    setScreen(AppScreen.LEARN);
  };

  if (isInitializing || !progress || titanLibrary.length === 0) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="bg-slate-950 sticky top-0 z-50 h-20 shadow-2xl flex items-center px-6">
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setScreen(AppScreen.DASHBOARD)}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">V</div>
            <span className="font-black text-2xl tracking-tighter text-white">VocabVantage</span>
          </div>
          
          <div className="flex items-center space-x-8">
            <div className="hidden md:flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${aiStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : aiStatus === 'offline' ? 'bg-rose-500' : 'bg-slate-600 animate-pulse'}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${aiStatus === 'online' ? 'text-emerald-500' : 'text-slate-500'}`}>
                {aiStatus === 'online' ? 'Neural Link Active' : aiStatus === 'offline' ? 'Offline' : 'Syncing...'}
              </span>
            </div>
            <button onClick={() => setScreen(AppScreen.AI_TUTOR)} className="px-5 py-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all">Tutor</button>
            <div className="flex flex-col items-end leading-none">
               <span className="text-white font-black text-lg tracking-tight">{progress.xp.toLocaleString()} <span className="text-[10px] text-slate-500 font-bold uppercase">XP</span></span>
               <span className="text-indigo-400 font-black text-[10px] uppercase tracking-widest">{progress.credits.toLocaleString()} VC</span>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-1 max-w-6xl mx-auto p-4 md:p-12 w-full">
        {screen === AppScreen.DASHBOARD && (
          <Dashboard progress={{...progress, customWords: titanLibrary}} onNavigate={setScreen} appVersion={CURRENT_VERSION} onUpdateGoal={(g) => setProgress(p => p ? ({...p, dailyMasteryGoal: g}) : p)} onQuickStart={handleQuickStart} onDiscover={() => {}} isDiscovering={false} onClaim={() => 0} onUpgrade={() => {}} onReset={() => {}} onImportSync={() => {}} />
        )}
        {screen === AppScreen.LEARN && (
          <Flashcards words={sessionWords} currentMastery={progress.wordMastery} onWordUpdate={handleWordUpdate} onWordPropertyUpdate={handleWordPropertyUpdate} onBack={() => setScreen(AppScreen.DASHBOARD)} />
        )}
        {screen === AppScreen.AI_TUTOR && <AITutor onBack={() => setScreen(AppScreen.DASHBOARD)} />}
        {screen === AppScreen.WORD_BANK && (
          <WordBank words={titanLibrary} progress={progress.wordMastery} onImport={(w) => setTitanLibrary(prev => {
                const existing = new Set(prev.map(item => item.term.toLowerCase()));
                const filtered = w.filter(item => !existing.has(item.term.toLowerCase()));
                return [...prev, ...filtered];
            })} onDelete={() => {}} onClose={() => setScreen(AppScreen.DASHBOARD)} />
        )}
        {screen === AppScreen.GAMES && (
          <GameHub words={titanLibrary} onBack={() => setScreen(AppScreen.DASHBOARD)} onXP={(amount) => setProgress(p => p ? ({...p, xp: p.xp + amount}) : p)} />
        )}
        {screen === AppScreen.LEADERBOARD && (
          <Leaderboard userXP={progress.xp} userHighScores={progress.highScores} onBack={() => setScreen(AppScreen.DASHBOARD)} />
        )}
        {screen === AppScreen.STORE && (
          <RewardStore credits={progress.credits} inventory={progress.inventory} masteredCount={Object.values(progress.wordMastery).filter(v => v === 3).length} academicIntegrity={progress.academicIntegrity} isPremium={progress.isPremium} onBack={() => setScreen(AppScreen.DASHBOARD)} onPurchase={(cost, item) => { if (progress.credits >= cost) { setProgress(prev => prev ? ({...prev, credits: prev.credits - cost, inventory: {...prev.inventory, [item]: prev.inventory[item] + 1}}) : prev); return true; } return false; }} />
        )}
        {screen === AppScreen.ACHIEVEMENTS && (
          <MedalGallery progress={progress} onBack={() => setScreen(AppScreen.DASHBOARD)} onClaimMilestone={(id, bonus) => setProgress(prev => prev ? ({...prev, credits: prev.credits + bonus, milestonesClaimed: [...prev.milestonesClaimed, id]}) : prev)} />
        )}
        {screen === AppScreen.STUDY_SETUP && (
          <StudySessionSetup words={titanLibrary} progress={progress.wordMastery} lastConfig={progress.lastConfig} onBack={() => setScreen(AppScreen.DASHBOARD)} onStart={(words, config) => { setSessionWords(words); setProgress(prev => prev ? ({...prev, lastConfig: config}) : prev); setScreen(AppScreen.LEARN); }} />
        )}
      </main>
      
      <footer className="bg-slate-950 p-6 border-t border-white/5 text-[10px] font-black uppercase tracking-[0.5em] text-slate-700 text-center">
        Titan Logic Engine v{CURRENT_VERSION}
      </footer>
    </div>
  );
};
export default App;