
import React, { useState, useEffect, useMemo } from 'react';
import { UserProgress, AppScreen, MasteryLevel, Word } from './types';
import { INITIAL_WORDS, XP_PER_WORD_UPGRADE } from './constants';
import Dashboard from './components/Dashboard';
import Flashcards from './components/Flashcards';
import Quiz from './components/Quiz';
import AITutor from './components/AITutor';
import WordBank from './components/WordBank';
import GameHub from './components/GameHub';
import Leaderboard from './components/Leaderboard';
import RewardStore from './components/RewardStore';
import MedalGallery from './components/MedalGallery';
import { discoverWords } from './services/gemini';

const STORAGE_KEY = 'vocabvantage_persistent_v2';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.DASHBOARD);
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure masteryHistory exists
      if (!parsed.masteryHistory) parsed.masteryHistory = {};
      return parsed;
    }
    return {
      wordMastery: {},
      masteryHistory: {},
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

  const allWords = useMemo(() => [...INITIAL_WORDS, ...(progress.customWords || [])], [progress.customWords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const updateMasteryHistory = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentMasteredCount = Object.values(progress.wordMastery).filter(l => l === 3).length;
    
    if (progress.masteryHistory[today] !== currentMasteredCount) {
      setProgress(prev => ({
        ...prev,
        masteryHistory: {
          ...prev.masteryHistory,
          [today]: currentMasteredCount
        }
      }));
    }
  };

  // Sync mastery history whenever mastery changes
  useEffect(() => {
    updateMasteryHistory();
  }, [progress.wordMastery]);

  useEffect(() => {
    checkDailyStatus();
  }, []);

  const checkDailyStatus = () => {
    const today = new Date().toDateString();
    const lastActiveDate = new Date(progress.lastActive).toDateString();
    if (today !== lastActiveDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastActiveDate !== yesterday.toDateString() && progress.streak > 0) {
        if (progress.inventory.streakFreezes > 0) {
          setProgress(prev => ({
            ...prev,
            inventory: { ...prev.inventory, streakFreezes: prev.inventory.streakFreezes - 1 },
            lastActive: new Date().toISOString(),
            streak: prev.streak 
          }));
        } else {
          setProgress(prev => ({ ...prev, streak: 0, lastActive: new Date().toISOString() }));
        }
      } else if (lastActiveDate === yesterday.toDateString()) {
        setProgress(prev => ({ ...prev, streak: prev.streak + 1, lastActive: new Date().toISOString() }));
      }
    }
  };

  const discoverMoreWords = async () => {
    if (isDiscovering) return;
    setIsDiscovering(true);
    try {
      const existingTerms = allWords.map(w => w.term);
      const newBatch = await discoverWords(existingTerms);
      if (newBatch.length > 0) {
        setProgress(prev => ({
          ...prev,
          customWords: [...(prev.customWords || []), ...newBatch]
        }));
        alert(`Successfully discovered ${newBatch.length} new words! Basis expanded.`);
      }
    } catch (e) {
      alert("AI Discovery failed. Please try again later.");
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleWordUpdate = (id: string, newLevel: MasteryLevel) => {
    const oldLevel = progress.wordMastery[id] || 0;
    const xpGained = newLevel > oldLevel ? (newLevel - oldLevel) * XP_PER_WORD_UPGRADE : 0;
    
    setProgress(prev => ({
      ...prev,
      wordMastery: { ...prev.wordMastery, [id]: newLevel },
      xp: prev.xp + xpGained,
      credits: prev.credits + (newLevel === 3 && oldLevel < 3 ? 50 : 0)
    }));
  };

  const handleDeleteWords = (ids: string[]) => {
    setProgress(prev => {
      const newCustomWords = (prev.customWords || []).filter(w => !ids.includes(w.id));
      const newMastery = { ...prev.wordMastery };
      ids.forEach(id => delete newMastery[id]);
      return {
        ...prev,
        customWords: newCustomWords,
        wordMastery: newMastery
      };
    });
  };

  const handleImportWords = (newWords: Word[]) => {
    setProgress(prev => ({
      ...prev,
      customWords: [...(prev.customWords || []), ...newWords]
    }));
  };

  const addXP = (amount: number, gameId?: string, score?: number) => {
    setProgress(prev => {
      const newHighScores = { ...prev.highScores };
      if (gameId && score !== undefined) newHighScores[gameId] = Math.max(newHighScores[gameId] || 0, score);
      return { ...prev, xp: prev.xp + amount, credits: prev.credits + Math.floor(amount/5), highScores: newHighScores };
    });
  };

  const handleNavigate = (newScreen: AppScreen, filter?: MasteryLevel) => {
    if (newScreen === AppScreen.LEARN) {
      let wordsToLearn: Word[] = [];
      if (filter !== undefined && filter !== null) {
        wordsToLearn = allWords.filter(w => (progress.wordMastery[w.id] || 0) === filter);
        if (wordsToLearn.length === 0) {
            alert(`You don't have any words at this level yet! Practice more to categorize them.`);
            return;
        }
      } else {
        const weights: Record<number, number> = { 0: 20, 1: 10, 2: 5, 3: 0.5 };
        const weightedPool: Word[] = [];
        allWords.forEach(word => {
          const level = progress.wordMastery[word.id] || 0;
          const count = Math.ceil(weights[level] * 5);
          for (let i = 0; i < count; i++) weightedPool.push(word);
        });
        const selected = new Set<string>();
        while (selected.size < 10 && selected.size < allWords.length) {
          const rw = weightedPool[Math.floor(Math.random() * weightedPool.length)];
          if (rw) selected.add(rw.id);
        }
        wordsToLearn = allWords.filter(w => selected.has(w.id));
      }
      setSessionWords(wordsToLearn.length > 0 ? wordsToLearn : allWords.slice(0, 10));
    }
    setScreen(newScreen);
  };

  return (
    <div className="min-h-screen bg-[#fafbff]">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setScreen(AppScreen.DASHBOARD)}>
            <div className="w-10 h-10 bg-slate-900 rounded-[0.8rem] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-200">V</div>
            <span className="font-black text-2xl tracking-tighter text-slate-900">VocabVantage</span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <button onClick={() => setScreen(AppScreen.DASHBOARD)} className={screen === AppScreen.DASHBOARD ? 'text-slate-900' : ''}>Dashboard</button>
            <button onClick={() => setScreen(AppScreen.WORD_BANK)} className={screen === AppScreen.WORD_BANK ? 'text-slate-900' : ''}>Word Bank ({allWords.length})</button>
            <button onClick={() => setScreen(AppScreen.GAMES)} className={screen === AppScreen.GAMES ? 'text-slate-900' : ''}>Games</button>
            <div className="flex items-center gap-4 border-l pl-8">
              <span className="text-indigo-600 font-bold">{progress.credits.toLocaleString()} VC</span>
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold" title="Streak">{progress.streak}</div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-4 md:p-12">
        {(() => {
          switch (screen) {
            case AppScreen.DASHBOARD: return <Dashboard progress={progress} onNavigate={handleNavigate} onDiscover={discoverMoreWords} isDiscovering={isDiscovering} onClaim={() => 50} onUpgrade={() => {}} />;
            case AppScreen.LEARN: return <Flashcards words={sessionWords} currentMastery={progress.wordMastery} onWordUpdate={handleWordUpdate} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
            case AppScreen.WORD_BANK: return <WordBank words={allWords} progress={progress.wordMastery} onImport={handleImportWords} onDelete={handleDeleteWords} onClose={() => setScreen(AppScreen.DASHBOARD)} />;
            case AppScreen.GAMES: return <GameHub onBack={() => setScreen(AppScreen.DASHBOARD)} onXP={addXP} />;
            case AppScreen.LEADERBOARD: return <Leaderboard userXP={progress.xp} userHighScores={progress.highScores} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
            case AppScreen.STORE: return <RewardStore credits={progress.credits} inventory={progress.inventory} masteredCount={Object.values(progress.wordMastery).filter(l => l === 3).length} academicIntegrity={progress.academicIntegrity} isPremium={progress.isPremium} onPurchase={(c, i) => false} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
            case AppScreen.ACHIEVEMENTS: return <MedalGallery progress={progress} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
            case AppScreen.AI_TUTOR: return <AITutor onBack={() => setScreen(AppScreen.DASHBOARD)} />;
            case AppScreen.QUIZ: return <Quiz onFinish={(s) => { addXP(s * 10); setScreen(AppScreen.DASHBOARD); }} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
            default: return <Dashboard progress={progress} onNavigate={handleNavigate} onDiscover={discoverMoreWords} isDiscovering={isDiscovering} onClaim={() => 50} onUpgrade={() => {}} />;
          }
        })()}
      </main>
    </div>
  );
};

export default App;
