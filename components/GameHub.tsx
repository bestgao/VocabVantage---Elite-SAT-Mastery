
import React, { useState } from 'react';
import SpeedBlitz from './games/SpeedBlitz';
import MatchMania from './games/MatchMania';
import VisualVibe from './games/VisualVibe';
import SynonymSprint from './games/SynonymSprint';
import OddOneOut from './games/OddOneOut';
import TransitionTussle from './games/TransitionTussle';
import SyntaxSniper from './games/SyntaxSniper';

interface GameHubProps {
  onBack: () => void;
  onXP: (amount: number, gameId?: string, score?: number) => void;
}

const GameHub: React.FC<GameHubProps> = ({ onBack, onXP }) => {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const games = [
    { 
      id: 'transition', 
      title: 'Transition Tussle', 
      desc: 'Master logical flow. Choose the right connector between sentences.', 
      icon: '🔗',
      color: 'bg-sky-50',
      text: 'text-sky-600',
      tag: 'SAT CORE'
    },
    { 
      id: 'syntax', 
      title: 'Syntax Sniper', 
      desc: 'Identify grammar errors in high-speed sentences. Defuse the mistakes!', 
      icon: '🎯',
      color: 'bg-violet-50',
      text: 'text-violet-600',
      tag: 'WRITING'
    },
    { 
      id: 'match', 
      title: 'Match Mania', 
      desc: 'Classic memory matching. Connect terms to definitions as fast as possible.', 
      icon: '🧩',
      color: 'bg-blue-50',
      text: 'text-blue-600',
    },
    { 
      id: 'synonym', 
      title: 'Synonym Sprint', 
      desc: 'Quick! Identify the synonym from four options. High speed, high reward.', 
      icon: '🏃‍♂️',
      color: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    { 
      id: 'oddout', 
      title: 'Odd One Out', 
      desc: 'Three words are synonyms, one is not. Find the interloper.', 
      icon: '🕵️‍♀️',
      color: 'bg-rose-50',
      text: 'text-rose-600',
    },
    { 
      id: 'speed', 
      title: 'Speed Blitz', 
      desc: 'Rapid true/false word matching. 30 seconds to win.', 
      icon: '⚡',
      color: 'bg-amber-50',
      text: 'text-amber-600'
    },
    { 
      id: 'visual', 
      title: 'Visual Vibe', 
      desc: 'Guess the SAT word based on an AI-generated artistic illustration.', 
      icon: '🎨',
      color: 'bg-slate-50',
      text: 'text-slate-600',
      tag: 'AI-GEN'
    }
  ];

  if (activeGame === 'speed') return <SpeedBlitz onBack={() => setActiveGame(null)} onXP={onXP} />;
  if (activeGame === 'match') return <MatchMania onBack={() => setActiveGame(null)} onXP={(xp) => onXP(xp, 'match', 100)} />;
  if (activeGame === 'visual') return <VisualVibe onBack={() => setActiveGame(null)} onXP={(xp) => onXP(xp, 'visual', 100)} />;
  if (activeGame === 'synonym') return <SynonymSprint onBack={() => setActiveGame(null)} onXP={onXP} />;
  if (activeGame === 'oddout') return <OddOneOut onBack={() => setActiveGame(null)} onXP={onXP} />;
  if (activeGame === 'transition') return <TransitionTussle onBack={() => setActiveGame(null)} onXP={onXP} />;
  if (activeGame === 'syntax') return <SyntaxSniper onBack={() => setActiveGame(null)} onXP={onXP} />;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-10 duration-500 pb-12">
      <header className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Game Center</h2>
        <p className="text-slate-500 font-medium">Climb the global rankings by mastering SAT logic and syntax.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map(game => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className={`${game.color} p-8 rounded-[2.5rem] text-left border-2 border-transparent hover:border-slate-200 transition-all hover:-translate-y-2 group relative shadow-sm`}
          >
            {game.tag && (
              <span className="absolute top-4 right-6 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-full">
                {game.tag}
              </span>
            )}
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform inline-block">{game.icon}</div>
            <h3 className={`text-2xl font-black mb-2 ${game.text}`}>{game.title}</h3>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">{game.desc}</p>
            <div className="mt-8 flex items-center font-bold text-xs uppercase tracking-widest gap-2">
              Play Now <span className="text-lg">→</span>
            </div>
          </button>
        ))}
      </div>

      <div className="text-center pt-8">
        <button 
          onClick={onBack}
          className="text-slate-400 font-bold hover:text-slate-900 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default GameHub;
