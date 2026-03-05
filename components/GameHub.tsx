
import React, { useState } from 'react';
import { Word, AppScreen } from '../types';
import SpeedBlitz from './games/SpeedBlitz';
import MatchMania from './games/MatchMania';
import VisualVibe from './games/VisualVibe';
import SynonymSprint from './games/SynonymSprint';
import OddOneOut from './games/OddOneOut';
import TransitionTussle from './games/TransitionTussle';
import SyntaxSniper from './games/SyntaxSniper';

interface GameHubProps {
  words: Word[];
  onBack: () => void;
  onXP: (amount: number, gameId?: string, score?: number) => void;
  onNavigate: (screen: AppScreen) => void;
}

const GameHub: React.FC<GameHubProps> = ({ words, onBack, onXP, onNavigate }) => {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const games = [
    { id: 'synonym', title: 'Synonym Sprint', desc: 'Find synonyms in the vault. Speed is everything.', icon: '🏃‍♂️', color: 'bg-emerald-50', text: 'text-emerald-600' },
    { id: 'oddout', title: 'Odd One Out', desc: 'Spot the word that doesn\'t belong in the set.', icon: '🕵️‍♀️', color: 'bg-rose-50', text: 'text-rose-600' },
    { id: 'syntax', title: 'Syntax Sniper', desc: 'Identify grammar errors in high-speed sentences.', icon: '🎯', color: 'bg-violet-50', text: 'text-violet-600', tag: 'WRITING' },
    { id: 'match', title: 'Match Mania', desc: 'Connect terms to definitions as fast as possible.', icon: '🧩', color: 'bg-blue-50', text: 'text-blue-600' },
    { id: 'quiz', title: 'Trap Master Quiz', desc: 'Identify definitions while avoiding common SAT traps.', icon: '🪤', color: 'bg-amber-50', text: 'text-amber-600', tag: 'NEW' },
    { id: 'speed', title: 'Speed Blitz', desc: 'Rapid true/false word matching. 30 seconds.', icon: '⚡', color: 'bg-orange-50', text: 'text-orange-600' },
    { id: 'transition', title: 'Transition Tussle', desc: 'Choose the right logical connector.', icon: '🔗', color: 'bg-sky-50', text: 'text-sky-600', tag: 'SAT CORE' },
    { id: 'visual', title: 'Visual Vibe', desc: 'Identify the word based on AI illustrations.', icon: '🎨', color: 'bg-slate-50', text: 'text-slate-600', tag: 'AI-GEN' }
  ];

  if (activeGame === 'speed') return <SpeedBlitz words={words} onBack={() => setActiveGame(null)} onXP={(xp) => onXP(xp, 'speed', 10)} />;
  if (activeGame === 'match') return <MatchMania words={words} onBack={() => setActiveGame(null)} onXP={(xp) => onXP(xp, 'match', 100)} />;
  if (activeGame === 'visual') return <VisualVibe words={words} onBack={() => setActiveGame(null)} onXP={(xp) => onXP(xp, 'visual', 100)} />;
  if (activeGame === 'synonym') return <SynonymSprint words={words} onBack={() => setActiveGame(null)} onXP={onXP} />;
  if (activeGame === 'oddout') return <OddOneOut words={words} onBack={() => setActiveGame(null)} onXP={onXP} />;
  if (activeGame === 'transition') return <TransitionTussle onBack={() => setActiveGame(null)} onXP={onXP} />;
  if (activeGame === 'syntax') return <SyntaxSniper onBack={() => setActiveGame(null)} onXP={onXP} />;

  const handleGameSelect = (id: string) => {
    if (id === 'quiz') {
      onNavigate(AppScreen.QUIZ);
    } else {
      setActiveGame(id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 px-4 animate-in slide-in-from-bottom-10 duration-500 pb-12">
      <header className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase italic">Neural <span className="text-indigo-600">Arena</span></h2>
        <p className="text-slate-500 font-medium text-sm">Infinite permutations generated from {words.length.toLocaleString()} local assets.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {games.map(game => (
          <button
            key={game.id}
            onClick={() => handleGameSelect(game.id)}
            className={`${game.color} p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-left border-2 border-transparent hover:border-slate-200 transition-all hover:-translate-y-2 group relative shadow-sm`}
          >
            <div className="text-4xl md:text-5xl mb-4 md:mb-6 group-hover:scale-110 transition-transform inline-block">{game.icon}</div>
            <h3 className={`text-xl md:text-2xl font-black mb-1 md:mb-2 ${game.text}`}>{game.title}</h3>
            <p className="text-slate-600 text-xs md:text-sm font-medium leading-relaxed">{game.desc}</p>
            {game.tag && (
              <span className="absolute top-4 md:top-6 right-4 md:right-6 px-2 md:px-3 py-1 bg-white/60 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest text-slate-400 border border-slate-100">{game.tag}</span>
            )}
          </button>
        ))}
      </div>
      <div className="text-center pt-6 md:pt-8">
        <button onClick={onBack} className="text-slate-400 font-black uppercase tracking-widest hover:text-slate-900 transition-colors bg-white px-6 md:px-8 py-3 rounded-full border border-slate-100 shadow-sm text-[9px] md:text-[10px]">Back to Dashboard</button>
      </div>
    </div>
  );
};

export default GameHub;
