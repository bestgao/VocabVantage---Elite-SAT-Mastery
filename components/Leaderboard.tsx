
import React from 'react';

interface LeaderboardProps {
  userXP: number;
  userHighScores: Record<string, number>;
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ userXP, userHighScores, onBack }) => {
  // Mocked global data for the "Global Competition" feel
  const globalRankings = [
    { name: 'Alex M.', xp: 12450, avatar: '👤', rank: 1 },
    { name: 'Sarah J.', xp: 11200, avatar: '🦊', rank: 2 },
    { name: 'Chris K.', xp: 9800, avatar: '🦁', rank: 3 },
    { name: 'Jordan W.', xp: 8500, avatar: '🐘', rank: 4 },
    { name: 'Taylor P.', xp: 7200, avatar: '🦉', rank: 5 },
  ];

  // Insert user into list
  const userRank = userXP > globalRankings[0].xp ? 1 : 
                   userXP > globalRankings[2].xp ? 3 :
                   userXP > 0 ? 124 : '---';

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-10 duration-500 pb-12">
      <header className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Global Rankings</h2>
        <p className="text-slate-500 font-medium">Competition breeds excellence. Can you hit #1?</p>
      </header>

      <div className="bg-slate-900 text-white rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center text-4xl border-4 border-slate-800 shadow-xl">👑</div>
            <div>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Your Current Rank</p>
              <h3 className="text-5xl font-black">#{userRank}</h3>
            </div>
          </div>
          <div className="h-12 w-[1px] bg-slate-800 hidden md:block"></div>
          <div className="text-center md:text-right">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total XP</p>
            <h3 className="text-3xl font-black">{userXP}</h3>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest flex justify-between">
          <span>Rank & Student</span>
          <span>Experience Points</span>
        </div>
        <div className="divide-y divide-slate-100">
          {globalRankings.map((student) => (
            <div key={student.rank} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-xs ${
                  student.rank === 1 ? 'bg-amber-100 text-amber-600' :
                  student.rank === 2 ? 'bg-slate-200 text-slate-500' :
                  student.rank === 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {student.rank}
                </span>
                <span className="text-2xl">{student.avatar}</span>
                <span className="font-bold text-slate-900">{student.name}</span>
              </div>
              <span className="font-black text-slate-900">{student.xp.toLocaleString()} XP</span>
            </div>
          ))}
          {userRank !== '---' && typeof userRank === 'number' && userRank > 5 && (
             <div className="p-6 flex items-center justify-between bg-indigo-50 border-y border-indigo-100">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 flex items-center justify-center rounded-lg font-black text-xs bg-indigo-200 text-indigo-700">
                    {userRank}
                  </span>
                  <span className="text-2xl">👤</span>
                  <span className="font-bold text-slate-900">You (Current)</span>
                </div>
                <span className="font-black text-indigo-600">{userXP} XP</span>
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Synonym Record</p>
            <p className="text-2xl font-black text-emerald-500">{userHighScores['synonym'] || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Detective Level</p>
            <p className="text-2xl font-black text-rose-500">{userHighScores['oddout'] || 0}</p>
        </div>
      </div>

      <div className="text-center">
        <button onClick={onBack} className="text-slate-400 font-bold hover:text-slate-900 transition-colors">Return to Dashboard</button>
      </div>
    </div>
  );
};

export default Leaderboard;
