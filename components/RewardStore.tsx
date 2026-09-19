
import React, { useState, useEffect } from 'react';
import { UserInventory } from '../types';

interface RewardStoreProps {
  credits: number;
  inventory: UserInventory;
  masteredCount: number;
  academicIntegrity: number;
  onPurchase: (cost: number, item: keyof UserInventory) => boolean;
  onRedeemReward: (cost: number, rewardId: string) => boolean;
  onBack: () => void;
}

type MasteryPrize = {
  id: string;
  name: string;
  price: number;
  icon: string;
  type: string;
  minMastery: number;
  desc: string;
  rewardText: string;
};

const RewardStore: React.FC<RewardStoreProps> = ({ credits, inventory, masteredCount, academicIntegrity, onPurchase, onRedeemReward, onBack }) => {
  const [redeemStatus, setRedeemStatus] = useState<string | null>(null);
  const [nextDrop, setNextDrop] = useState("01:12:44");

  useEffect(() => {
    const timer = setInterval(() => {
      setNextDrop(prev => {
        const parts = prev.split(':').map(Number);
        if (parts[2] > 0) parts[2]--;
        else if (parts[1] > 0) { parts[1]--; parts[2] = 59; }
        else if (parts[0] > 0) { parts[0]--; parts[1] = 59; parts[2] = 59; }
        return parts.map(p => p.toString().padStart(2, '0')).join(':');
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const storeItems = [
    { id: 'freeze', name: 'Streak Freeze', price: 250, desc: 'Protects your progress.', icon: '🧊', key: 'streakFreezes' as keyof UserInventory },
    { id: 'boost', name: 'XP Booster', price: 500, desc: 'Earn levels faster.', icon: '⚡', key: 'xpBoosters' as keyof UserInventory },
  ];

  const highValuePrizes: MasteryPrize[] = [
    { 
      id: 'hard_words_challenge',
      name: 'Hard Words Challenge',
      price: 1200,
      icon: '🎯',
      type: 'Practice Unlock',
      minMastery: 25,
      desc: 'Redeem after you have built enough mastery to take on your hardest misses.',
      rewardText: 'Hard Words Challenge is ready. Open Smart Review from the dashboard and focus on your weakest words.'
    },
    { 
      id: 'advanced_context_set',
      name: 'Advanced Context Set',
      price: 2500,
      icon: '📘',
      type: 'Advanced Practice',
      minMastery: 100,
      desc: 'A top-band context practice reward for students with a strong mastery base.',
      rewardText: 'Advanced Context Set is unlocked. Use Quiz mode for a harder context practice block.'
    },
    { 
      id: 'weekly_goal_boost',
      name: 'Weekly Goal Boost',
      price: 800,
      icon: '⚡',
      type: 'Motivation',
      minMastery: 0,
      desc: 'A lightweight momentum reward for a focused weekly mastery push.',
      rewardText: 'Weekly Goal Boost is active. Aim for one extra Smart Review today.'
    }
  ];

  const handleClaimRequest = (prize: MasteryPrize) => {
    if (academicIntegrity < 90) {
      alert(`Account Trust too low (${academicIntegrity}%). You must maintain 90%+ accuracy and realistic pacing.`);
      return;
    }
    if (masteredCount < prize.minMastery) {
      alert(`Mastery Gate: You have ${masteredCount} mastered words. You need ${prize.minMastery} to unlock this reward.`);
      return;
    }
    if (credits < prize.price) {
      alert("Insufficient Vantage Credits (VC).");
      return;
    }
    
    const confirmMsg = `Redeem ${prize.name} for ${prize.price.toLocaleString()} VC?`;

    if (window.confirm(confirmMsg)) {
      const redeemed = onRedeemReward(prize.price, prize.id);
      if (!redeemed) {
        alert("Insufficient Vantage Credits (VC).");
        return;
      }
      setRedeemStatus(prize.rewardText);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-10 duration-500 pb-20">
      {redeemStatus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white p-10 rounded-[3rem] text-center shadow-2xl max-w-sm space-y-6">
            <div className="text-6xl">✓</div>
            <h2 className="text-2xl font-black text-slate-900">Reward Ready</h2>
            <p className="text-slate-500 font-medium leading-relaxed">{redeemStatus}</p>
            <button onClick={() => setRedeemStatus(null)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold">Back to App</button>
          </div>
        </div>
      )}

      <header className="text-center space-y-4">
        <h2 className="text-5xl font-black text-slate-900 tracking-tight">Reward Center</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
            <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full font-black text-2xl shadow-xl bg-slate-900 text-white">
                <span>{credits.toLocaleString()}</span>
                <span className="text-[10px] text-indigo-200 mt-1 uppercase">Vantage Credits</span>
            </div>
            <div className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase border border-slate-200">
                STOCK REFRESH: {nextDrop}
            </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-100">
         <div className="text-center md:text-left">
            <h3 className="text-2xl font-black">Spend Credits on Study Momentum</h3>
            <p className="text-indigo-100 text-sm font-medium">Every reward below is earned through real practice, mastery, and accuracy.</p>
         </div>
         <button onClick={onBack} className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black text-xs hover:scale-105 transition-transform whitespace-nowrap">Keep Studying</button>
      </div>

      <section className="space-y-6">
        <h3 className="text-xl font-black flex items-center gap-3 px-2">
          <span className="w-2 h-8 bg-slate-900 rounded-full"></span>
          Student Utility
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {storeItems.map(item => (
            <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-indigo-200 transition-all">
              <div className="text-5xl bg-slate-50 w-24 h-24 flex items-center justify-center rounded-[2rem] group-hover:scale-110 transition-transform">{item.icon}</div>
              <div className="flex-1">
                <h4 className="text-xl font-black text-slate-900">{item.name}</h4>
                <p className="text-slate-500 text-xs font-medium mb-5">{item.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="font-black text-indigo-600">{item.price} VC</span>
                  <button 
                    onClick={() => onPurchase(item.price, item.key) ? alert("Item added!") : alert("Insufficient VC.")}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Buy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xl font-black flex items-center gap-3 px-2">
          <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
          Mastery Payouts
        </h3>
        <div className="p-8 md:p-12 rounded-[3.5rem] border bg-slate-50 border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highValuePrizes.map(prize => {
              const isLockedByMastery = masteredCount < prize.minMastery;
              const isUnaffordable = credits < prize.price;
              const isLocked = isLockedByMastery || isUnaffordable;
              
              return (
                <div key={prize.name} className={`bg-white p-8 rounded-[2.5rem] border flex flex-col justify-between relative shadow-lg ${isLocked ? 'grayscale opacity-70' : 'hover:-translate-y-2 border-slate-100'}`}>
                  {isLocked && (
                    <div className="absolute inset-0 z-20 bg-slate-100/60 backdrop-blur-[4px] rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center">
                        <div className="text-4xl mb-3">🔒</div>
                        <p className="text-[10px] font-black uppercase text-slate-900">
                        {isLockedByMastery ? `Master ${prize.minMastery} Words` : `Need ${prize.price.toLocaleString()} VC`}
                        </p>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="text-5xl">{prize.icon}</div>
                      <span className="px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-700">
                        {prize.type}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-900 text-xl leading-tight mb-2">{prize.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-6">{prize.desc}</p>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-50">
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-lg font-black text-slate-900">{prize.price.toLocaleString()} <span className="text-xs text-slate-400">VC</span></span>
                    </div>
                    <button 
                      onClick={() => handleClaimRequest(prize)}
                      disabled={isLocked}
                      className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-slate-900 text-white disabled:bg-slate-300"
                    >
                      {isLockedByMastery ? 'Locked' : isUnaffordable ? 'Need VC' : 'Redeem'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="text-center pt-12">
        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 max-w-2xl mx-auto shadow-sm">
             <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-widest mb-4">Progress Integrity</p>
             <p className="text-xs text-slate-500 font-medium leading-relaxed">
               Rewards are tied to actual study progress, accuracy, and mastery gates so motivation stays connected to learning.
             </p>
        </div>
        <button onClick={onBack} className="mt-8 text-slate-400 font-bold hover:text-slate-900 transition-colors text-sm">Return to Dashboard</button>
      </footer>
    </div>
  );
};

export default RewardStore;
