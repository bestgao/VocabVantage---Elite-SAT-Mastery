
import React from 'react';
import { UserInventory } from '../types';

interface RewardStoreProps {
  credits: number;
  inventory: UserInventory;
  onPurchase: (cost: number, item: keyof UserInventory) => boolean;
  onBack: () => void;
}

const RewardStore: React.FC<RewardStoreProps> = ({ credits, inventory, onPurchase, onBack }) => {
  const storeItems = [
    { id: 'freeze', name: 'Streak Freeze', price: 250, desc: 'Protects your streak if you miss a day.', icon: '🧊', key: 'streakFreezes' as keyof UserInventory },
    { id: 'boost', name: 'XP Booster', price: 500, desc: 'Earn 2x XP for your next 30 minutes.', icon: '⚡', key: 'xpBoosters' as keyof UserInventory },
  ];

  const sponsorPrizes = [
    { name: '$10 Amazon Gift Card', price: 25000, sponsor: 'Elite Prep', icon: '🎁' },
    { name: 'SAT Strategy E-Book', price: 5000, sponsor: 'Vantage Books', icon: '📚' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-10 duration-500 pb-12">
      <header className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Vantage Store</h2>
        <div className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-full font-black text-xl shadow-lg shadow-indigo-100">
          {credits} VC
        </div>
      </header>

      <section className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="w-2 h-6 bg-slate-900 rounded-full"></span>
          Essential Supplies
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {storeItems.map(item => (
            <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
              <div className="text-5xl bg-slate-50 w-20 h-20 flex items-center justify-center rounded-[1.5rem]">{item.icon}</div>
              <div className="flex-1">
                <h4 className="text-xl font-black text-slate-900">{item.name}</h4>
                <p className="text-slate-500 text-sm font-medium mb-4">{item.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="font-black text-indigo-600">{item.price} VC</span>
                  <button 
                    onClick={() => {
                      if (onPurchase(item.price, item.key)) {
                        alert(`Purchased ${item.name}!`);
                      } else {
                        alert("Not enough credits!");
                      }
                    }}
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:scale-105 transition-all"
                  >
                    Buy Item
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="w-2 h-6 bg-rose-500 rounded-full"></span>
          Sponsor Rewards
        </h3>
        <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-8xl opacity-10">🎁</div>
          <p className="text-rose-900 font-bold mb-6">Earn real-world rewards by hitting high mastery scores!</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sponsorPrizes.map(prize => (
              <div key={prize.name} className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-rose-100">
                <div className="text-3xl mb-2">{prize.icon}</div>
                <h4 className="font-bold text-slate-900">{prize.name}</h4>
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Sponsor: {prize.sponsor}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-400">{prize.price.toLocaleString()} VC</span>
                  <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-[9px] font-black uppercase">Locked</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="text-center pt-8">
        <button onClick={onBack} className="text-slate-400 font-bold hover:text-slate-900">Back to Dashboard</button>
      </div>
    </div>
  );
};

export default RewardStore;
