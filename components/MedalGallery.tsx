
import React from 'react';
import { UserProgress } from '../types';
import { INITIAL_WORDS } from '../constants';

interface MedalGalleryProps {
  progress: UserProgress;
  onBack: () => void;
}

const MedalGallery: React.FC<MedalGalleryProps> = ({ progress, onBack }) => {
  const masteredCount = Object.values(progress.wordMastery).filter(l => l === 3).length;
  
  const achievements = [
    { id: 'mastery_1', title: 'Novice Linguist', desc: 'Master your first 5 words', goal: 5, current: masteredCount, icon: '🥉', tier: 'bronze' },
    { id: 'mastery_2', title: 'Lexicon Legend', desc: 'Master all initial words', goal: INITIAL_WORDS.length, current: masteredCount, icon: '🥇', tier: 'gold' },
    { id: 'streak_1', title: 'Consistent Scholar', desc: 'Reach a 7-day streak', goal: 7, current: progress.streak, icon: '🔥', tier: 'silver' },
    { id: 'speed_1', title: 'Speed Demon', desc: 'Score 20 in Speed Blitz', goal: 20, current: progress.highScores['speed'] || 0, icon: '⚡', tier: 'gold' },
    { id: 'odd_1', title: 'The Detective', desc: 'Score 15 in Odd One Out', goal: 15, current: progress.highScores['oddout'] || 0, icon: '🔍', tier: 'diamond' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Medal Gallery</h2>
        <p className="text-slate-500 font-medium">Your excellence, permanently recorded.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map(ach => {
          const isComplete = ach.current >= ach.goal;
          const percentage = Math.min((ach.current / ach.goal) * 100, 100);

          return (
            <div key={ach.id} className={`bg-white p-8 rounded-[2.5rem] border-2 transition-all ${isComplete ? 'border-emerald-200 shadow-emerald-50 shadow-xl' : 'border-slate-100 grayscale opacity-70 shadow-sm'}`}>
              <div className="text-6xl mb-6 flex justify-center">{ach.icon}</div>
              <h3 className="text-xl font-black text-slate-900 text-center mb-1">{ach.title}</h3>
              <p className="text-slate-400 text-xs font-medium text-center mb-6">{ach.desc}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <span className="text-slate-400">Progress</span>
                  <span className={isComplete ? 'text-emerald-500' : 'text-slate-400'}>{ach.current} / {ach.goal}</span>
                </div>
                <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${isComplete ? 'bg-emerald-500' : 'bg-slate-300'}`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
              {isComplete && (
                <div className="mt-4 text-center">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">UNLOCKED</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <button onClick={onBack} className="text-slate-400 font-bold hover:text-slate-900">Return to Dashboard</button>
      </div>
    </div>
  );
};

export default MedalGallery;
