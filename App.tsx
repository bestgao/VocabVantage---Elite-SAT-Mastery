
import React, { useState, useEffect } from 'react';
// Added UserInventory to the imports from types.ts
import { UserProgress, AppScreen, MasteryLevel, UserInventory } from './types';
import { INITIAL_WORDS, XP_PER_QUIZ, XP_PER_WORD_UPGRADE } from './constants';
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
  const [showDailyModal, setShowDailyModal] = useState(false);

  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('vantage_progress_v5');
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
      achievements: []
    };
  });

  useEffect(() => {
    localStorage.setItem('vantage_progress_v5', JSON.stringify(progress));
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
        // We missed a day!
        if (progress.inventory.streakFreezes > 0) {
          // Auto-use streak freeze
          setProgress(prev => ({
            ...prev,
            inventory: { ...prev.inventory, streakFreezes: prev.inventory.streakFreezes - 1 },
            lastActive: new Date().toISOString()
          }));
          alert("🧊 Your Streak Freeze protected your streak!");
        } else {
          setProgress(prev => ({ ...prev, streak: 0 }));
        }
      } else if (lastActiveDate === yesterdayStr) {
        // Continued streak
        setProgress(prev => ({ ...prev, streak: prev.streak + 1, lastActive: new Date().toISOString() }));
      }
    }
  };

  const claimDailyReward = () => {
    const today = new Date().toDateString();
    if (progress.lastCheckIn !== today) {
      const reward = Math.min(progress.streak * 10 + 50, 500);
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
    const vcGained = newLevel === 3 ? 50 : 0; // Bonus for mastering
    
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
        if (score > (prev.highScores[gameId] || 0)) extraCredits += 50; // New high score bonus
      }
      return {
        ...prev,
        xp: prev.xp + amount,
        credits: prev.credits + extraCredits,
        highScores: newHighScores
      };
    });
  };

  // Fixed: Added UserInventory to types import to ensure 'UserInventory' is defined here.
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

  const renderScreen = () => {
    switch (screen) {
      case AppScreen.DASHBOARD:
        return <Dashboard progress={progress} onNavigate={handleNavigate} onClaim={claimDailyReward} />;
      case AppScreen.LEARN:
        const wordsToLearn = filterLevel !== null 
          ? INITIAL_WORDS.filter(w => (progress.wordMastery[w.id] || 0) === filterLevel)
          : INITIAL_WORDS.filter(w => (progress.wordMastery[w.id] || 0) < 3).slice(0, 10);
        const finalWords = wordsToLearn.length > 0 ? wordsToLearn : INITIAL_WORDS.slice(0, 10);
        return <Flashcards words={finalWords} currentMastery={progress.wordMastery} onWordUpdate={handleWordUpdate} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
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
        return <RewardStore credits={progress.credits} inventory={progress.inventory} onPurchase={handlePurchase} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
      case AppScreen.ACHIEVEMENTS:
        return <MedalGallery progress={progress} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
      default:
        return <Dashboard progress={progress} onNavigate={handleNavigate} onClaim={claimDailyReward} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbff]">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setScreen(AppScreen.DASHBOARD)}>
            <div className="w-10 h-10 bg-slate-900 rounded-[0.8rem] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-200">V</div>
            <span className="font-black text-2xl tracking-tighter text-slate-900">VocabVantage</span>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <button onClick={() => setScreen(AppScreen.DASHBOARD)} className={`hover:text-slate-900 ${screen === AppScreen.DASHBOARD ? 'text-slate-900' : ''}`}>Stats</button>
            <button onClick={() => setScreen(AppScreen.GAMES)} className={`hover:text-slate-900 ${screen === AppScreen.GAMES ? 'text-slate-900' : ''}`}>Games</button>
            <button onClick={() => setScreen(AppScreen.ACHIEVEMENTS)} className={`hover:text-slate-900 ${screen === AppScreen.ACHIEVEMENTS ? 'text-slate-900' : ''}`}>Medals</button>
            <button onClick={() => setScreen(AppScreen.STORE)} className={`hover:text-slate-900 ${screen === AppScreen.STORE ? 'text-slate-900' : ''}`}>Store</button>
            <div className="h-10 w-[1px] bg-slate-100"></div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-indigo-600 font-bold">{progress.credits} VC</span>
                <span className="text-slate-300">CREDITS</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-indigo-500 shadow-sm flex items-center justify-center text-white font-bold">
                {progress.streak}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-12 pb-24 md:pb-12">
        {renderScreen()}
      </main>

      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 flex justify-around shadow-2xl z-50">
          <button onClick={() => setScreen(AppScreen.DASHBOARD)} className={`text-2xl ${screen === AppScreen.DASHBOARD ? 'grayscale-0' : 'grayscale'}`}>📊</button>
          <button onClick={() => setScreen(AppScreen.GAMES)} className={`text-2xl ${screen === AppScreen.GAMES ? 'grayscale-0' : 'grayscale'}`}>🎮</button>
          <button onClick={() => setScreen(AppScreen.STORE)} className={`text-2xl ${screen === AppScreen.STORE ? 'grayscale-0' : 'grayscale'}`}>🛒</button>
          <button onClick={() => setScreen(AppScreen.ACHIEVEMENTS)} className={`text-2xl ${screen === AppScreen.ACHIEVEMENTS ? 'grayscale-0' : 'grayscale'}`}>🎖️</button>
      </footer>
    </div>
  );
};

export default App;
