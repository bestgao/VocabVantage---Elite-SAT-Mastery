
import React, { useState, useEffect } from 'react';
import { UserProgress, AppScreen, MasteryLevel, UserInventory } from './types';
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

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.DASHBOARD);
  const [filterLevel, setFilterLevel] = useState<MasteryLevel | null>(null);

  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('vantage_progress_v7');
    if (saved) return JSON.parse(saved);
    return {
      wordMastery: {},
      streak: 1,
      lastActive: new Date().toISOString(),
      lastCheckIn: '',
      xp: 0,
      credits: 100,
      highScores: {},
      inventory: { streakFreezes: 1, xpBoosters: 0 },
      achievements: [],
      academicIntegrity: 98,
      isPremium: false // Default to free user
    };
  });

  useEffect(() => {
    localStorage.setItem('vantage_progress_v7', JSON.stringify(progress));
    checkDailyStatus();
  }, [progress]);

  const checkDailyStatus = () => {
    const today = new Date().toDateString();
    const lastActiveDate = new Date(progress.lastActive).toDateString();
    
    if (today !== lastActiveDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (lastActiveDate !== yesterdayStr && progress.streak > 0) {
        if (progress.inventory.streakFreezes > 0) {
          setProgress(prev => ({
            ...prev,
            inventory: { ...prev.inventory, streakFreezes: prev.inventory.streakFreezes - 1 },
            lastActive: new Date().toISOString()
          }));
        } else {
          setProgress(prev => ({ ...prev, streak: 0, lastActive: new Date().toISOString() }));
        }
      } else if (lastActiveDate === yesterdayStr) {
        setProgress(prev => ({ ...prev, streak: prev.streak + 1, lastActive: new Date().toISOString() }));
      }
    }
  };

  const togglePremium = () => {
    setProgress(prev => ({ ...prev, isPremium: !prev.isPremium }));
  };

  const claimDailyReward = () => {
    const today = new Date().toDateString();
    if (progress.lastCheckIn !== today) {
      const multiplier = progress.isPremium ? 2 : 1;
      const reward = Math.min(progress.streak * 10 + 50, 500) * multiplier;
      setProgress(prev => ({
        ...prev,
        credits: prev.credits + reward,
        lastCheckIn: today
      }));
      return reward;
    }
    return 0;
  };

  const handleWordUpdate = (id: string, newLevel: MasteryLevel) => {
    const oldLevel = progress.wordMastery[id] || 0;
    const xpGained = newLevel > oldLevel ? (newLevel - oldLevel) * XP_PER_WORD_UPGRADE : 0;
    const vcGained = newLevel === 3 ? 50 : 0;
    
    setProgress(prev => ({
      ...prev,
      wordMastery: { ...prev.wordMastery, [id]: newLevel },
      xp: prev.xp + xpGained,
      credits: prev.credits + vcGained
    }));
  };

  const addXP = (amount: number, gameId?: string, score?: number) => {
    setProgress(prev => {
      const newHighScores = { ...prev.highScores };
      let extraCredits = Math.floor(amount / 5);
      if (gameId && score !== undefined) {
        newHighScores[gameId] = Math.max(newHighScores[gameId] || 0, score);
        if (score > (prev.highScores[gameId] || 0)) extraCredits += 50;
      }
      return {
        ...prev,
        xp: prev.xp + amount,
        credits: prev.credits + extraCredits,
        highScores: newHighScores
      };
    });
  };

  const handlePurchase = (cost: number, item: keyof UserInventory) => {
    if (progress.credits >= cost) {
      setProgress(prev => ({
        ...prev,
        credits: prev.credits - cost,
        inventory: { ...prev.inventory, [item]: prev.inventory[item] + 1 }
      }));
      return true;
    }
    return false;
  };

  const handleNavigate = (newScreen: AppScreen, filter?: MasteryLevel) => {
    setFilterLevel(filter ?? null);
    setScreen(newScreen);
  };

  const masteredCount = Object.values(progress.wordMastery).filter(l => l === 3).length;

  const renderScreen = () => {
    switch (screen) {
      case AppScreen.DASHBOARD:
        return <Dashboard progress={progress} onNavigate={handleNavigate} onClaim={claimDailyReward} onUpgrade={togglePremium} />;
      case AppScreen.LEARN:
        const wordsToLearn = filterLevel !== null 
          ? INITIAL_WORDS.filter(w => (progress.wordMastery[w.id] || 0) === filterLevel)
          : INITIAL_WORDS.filter(w => (progress.wordMastery[w.id] || 0) < 3).slice(0, 10);
        return <Flashcards words={wordsToLearn.length > 0 ? wordsToLearn : INITIAL_WORDS.slice(0, 5)} currentMastery={progress.wordMastery} onWordUpdate={handleWordUpdate} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
      case AppScreen.QUIZ:
        return <Quiz onFinish={(s) => { addXP(s * 10); setScreen(AppScreen.DASHBOARD); }} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
      case AppScreen.AI_TUTOR:
        return <AITutor onBack={() => setScreen(AppScreen.DASHBOARD)} />;
      case AppScreen.WORD_BANK:
        return <WordBank progress={progress.wordMastery} onClose={() => setScreen(AppScreen.DASHBOARD)} />;
      case AppScreen.GAMES:
        return <GameHub onBack={() => setScreen(AppScreen.DASHBOARD)} onXP={addXP} />;
      case AppScreen.LEADERBOARD:
        return <Leaderboard userXP={progress.xp} userHighScores={progress.highScores} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
      case AppScreen.STORE:
        return <RewardStore 
          credits={progress.credits} 
          inventory={progress.inventory} 
          masteredCount={masteredCount} 
          academicIntegrity={progress.academicIntegrity} 
          isPremium={progress.isPremium}
          onPurchase={handlePurchase} 
          onBack={() => setScreen(AppScreen.DASHBOARD)} 
        />;
      case AppScreen.ACHIEVEMENTS:
        return <MedalGallery progress={progress} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
      default:
        return <Dashboard progress={progress} onNavigate={handleNavigate} onClaim={claimDailyReward} onUpgrade={togglePremium} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbff] selection:bg-indigo-100 selection:text-indigo-900">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setScreen(AppScreen.DASHBOARD)}>
            <div className="w-10 h-10 bg-slate-900 rounded-[0.8rem] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform">V</div>
            <span className="font-black text-2xl tracking-tighter text-slate-900">VocabVantage</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <button onClick={() => setScreen(AppScreen.DASHBOARD)} className={`hover:text-slate-900 transition-colors ${screen === AppScreen.DASHBOARD ? 'text-slate-900' : ''}`}>Stats</button>
            <button onClick={() => setScreen(AppScreen.GAMES)} className={`hover:text-slate-900 transition-colors ${screen === AppScreen.GAMES ? 'text-slate-900' : ''}`}>Games</button>
            <button onClick={() => setScreen(AppScreen.STORE)} className={`hover:text-slate-900 transition-colors ${screen === AppScreen.STORE ? 'text-slate-900' : ''}`}>Store</button>
            <div className="h-8 w-[1px] bg-slate-100"></div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-indigo-600 font-bold leading-none">{progress.credits.toLocaleString()} VC</span>
                <span className="text-[8px] text-slate-300 mt-1">{progress.isPremium ? 'ELITE CREDITS' : 'BASIC CREDITS'}</span>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all ${progress.isPremium ? 'bg-indigo-600 ring-2 ring-indigo-400 ring-offset-2' : 'bg-slate-900'}`}>
                {progress.streak}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-12 pb-24 md:pb-12">
        {renderScreen()}
      </main>

      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-6 flex justify-around shadow-2xl z-50">
          <button onClick={() => setScreen(AppScreen.DASHBOARD)} className={`text-2xl transition-all ${screen === AppScreen.DASHBOARD ? 'scale-125' : 'grayscale'}`}>📊</button>
          <button onClick={() => setScreen(AppScreen.GAMES)} className={`text-2xl transition-all ${screen === AppScreen.GAMES ? 'scale-125' : 'grayscale'}`}>🎮</button>
          <button onClick={() => setScreen(AppScreen.STORE)} className={`text-2xl transition-all ${screen === AppScreen.STORE ? 'scale-125' : 'grayscale'}`}>🛒</button>
          <button onClick={() => setScreen(AppScreen.ACHIEVEMENTS)} className={`text-2xl transition-all ${screen === AppScreen.ACHIEVEMENTS ? 'scale-125' : 'grayscale'}`}>🎖️</button>
      </footer>
    </div>
  );
};

export default App;
