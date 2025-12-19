
import React, { useState, useEffect } from 'react';
import { UserProgress, AppScreen, MasteryLevel } from './types';
import { INITIAL_WORDS, XP_PER_QUIZ, XP_PER_WORD_UPGRADE } from './constants';
import Dashboard from './components/Dashboard';
import Flashcards from './components/Flashcards';
import Quiz from './components/Quiz';
import AITutor from './components/AITutor';
import WordBank from './components/WordBank';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.DASHBOARD);
  const [filterLevel, setFilterLevel] = useState<MasteryLevel | null>(null);
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('vantage_progress_v2');
    if (saved) return JSON.parse(saved);
    return {
      wordMastery: {},
      streak: 1,
      lastActive: new Date().toISOString(),
      xp: 0
    };
  });

  useEffect(() => {
    localStorage.setItem('vantage_progress_v2', JSON.stringify(progress));
  }, [progress]);

  const handleWordUpdate = (id: string, newLevel: MasteryLevel) => {
    const oldLevel = progress.wordMastery[id] || 0;
    const xpGained = newLevel > oldLevel ? (newLevel - oldLevel) * XP_PER_WORD_UPGRADE : 0;
    
    setProgress(prev => ({
      ...prev,
      wordMastery: { ...prev.wordMastery, [id]: newLevel },
      xp: prev.xp + xpGained
    }));
  };

  const handleNavigate = (newScreen: AppScreen, filter?: MasteryLevel) => {
    setFilterLevel(filter ?? null);
    setScreen(newScreen);
  };

  const renderScreen = () => {
    switch (screen) {
      case AppScreen.DASHBOARD:
        return <Dashboard progress={progress} onNavigate={handleNavigate} />;
      case AppScreen.LEARN:
        const wordsToLearn = filterLevel !== null 
          ? INITIAL_WORDS.filter(w => (progress.wordMastery[w.id] || 0) === filterLevel)
          : INITIAL_WORDS.filter(w => (progress.wordMastery[w.id] || 0) < 3).slice(0, 10);
        
        const finalWords = wordsToLearn.length > 0 ? wordsToLearn : INITIAL_WORDS.slice(0, 10);
        
        return (
          <Flashcards 
            words={finalWords} 
            currentMastery={progress.wordMastery}
            onWordUpdate={handleWordUpdate}
            onBack={() => setScreen(AppScreen.DASHBOARD)} 
          />
        );
      case AppScreen.QUIZ:
        return <Quiz onFinish={(s) => { setProgress(p => ({ ...p, xp: p.xp + (s * 10) })); setScreen(AppScreen.DASHBOARD); }} onBack={() => setScreen(AppScreen.DASHBOARD)} />;
      case AppScreen.AI_TUTOR:
        return <AITutor onBack={() => setScreen(AppScreen.DASHBOARD)} />;
      case AppScreen.WORD_BANK:
        return <WordBank progress={progress.wordMastery} onClose={() => setScreen(AppScreen.DASHBOARD)} />;
      default:
        return <Dashboard progress={progress} onNavigate={handleNavigate} />;
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
          <div className="hidden md:flex items-center space-x-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
            <button onClick={() => setScreen(AppScreen.DASHBOARD)} className={`hover:text-slate-900 transition-colors ${screen === AppScreen.DASHBOARD ? 'text-slate-900' : ''}`}>Stats</button>
            <button onClick={() => setScreen(AppScreen.WORD_BANK)} className={`hover:text-slate-900 transition-colors ${screen === AppScreen.WORD_BANK ? 'text-slate-900' : ''}`}>Word Bank</button>
            <button onClick={() => setScreen(AppScreen.AI_TUTOR)} className={`hover:text-slate-900 transition-colors ${screen === AppScreen.AI_TUTOR ? 'text-slate-900' : ''}`}>AI Coach</button>
            <div className="h-10 w-[1px] bg-slate-100"></div>
            <div className="flex items-center gap-2">
              <span className="text-slate-900">{progress.xp} XP</span>
              <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-50"></div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-12 pb-24 md:pb-12">
        {renderScreen()}
      </main>

      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 flex justify-around shadow-2xl">
          <button onClick={() => setScreen(AppScreen.DASHBOARD)} className={`text-2xl ${screen === AppScreen.DASHBOARD ? 'grayscale-0' : 'grayscale'}`}>📊</button>
          <button onClick={() => setScreen(AppScreen.LEARN)} className={`text-2xl ${screen === AppScreen.LEARN ? 'grayscale-0' : 'grayscale'}`}>🧠</button>
          <button onClick={() => setScreen(AppScreen.WORD_BANK)} className={`text-2xl ${screen === AppScreen.WORD_BANK ? 'grayscale-0' : 'grayscale'}`}>📂</button>
      </footer>
    </div>
  );
};

export default App;
