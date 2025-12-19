
import React, { useState, useEffect } from 'react';
import { UserInventory } from '../types';

interface RewardStoreProps {
  credits: number;
  inventory: UserInventory;
  masteredCount: number;
  academicIntegrity: number;
  isPremium: boolean;
  onPurchase: (cost: number, item: keyof UserInventory) => boolean;
  onBack: () => void;
}

const RewardStore: React.FC<RewardStoreProps> = ({ credits, inventory, masteredCount, academicIntegrity, isPremium, onPurchase, onBack }) => {
  const [redeemStatus, setRedeemStatus] = useState<string | null>(null);
  const [nextDrop, setNextDrop] = useState("02:44:12");

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
    { id: 'freeze', name: 'Streak Freeze', price: 250, desc: 'Shields your streak from reset.', icon: '🧊', key: 'streakFreezes' as keyof UserInventory },
    { id: 'boost', name: 'XP Booster', price: 500, desc: '2x XP for 30 minutes of play.', icon: '⚡', key: 'xpBoosters' as keyof UserInventory },
  ];

  const highValuePrizes = [
    { 
      name: '$10 Amazon Gift Card', 
      price: 25000, 
      sponsor: 'Vantage Rewards', 
      icon: '🎁', 
      type: 'Verified Claim',
      stock: 2,
      minMastery: 500, // HIGH BARRIER: Master 500 words
      premiumOnly: false,
      desc: 'Master 500 core words to unlock. Subject to manual pacing audit.'
    },
    { 
      name: '$50 Scholarship Grant', 
      price: 100000, 
      sponsor: 'EduFund Global', 
      icon: '💎', 
      type: 'Elite Claim',
      stock: 1,
      minMastery: 1000, // ELITE BARRIER: Master 1000 words
      premiumOnly: true,
      desc: 'Elite Members only. Master 1,000 words. Requires video verification.'
    },
    { 
      name: 'Monthly Tech Giveaway', 
      price: 2000, 
      sponsor: 'FutureLearn', 
      icon: '🎟️', 
      type: 'Raffle Entry',
      stock: 'Unlimited',
      minMastery: 0,
      premiumOnly: false,
      desc: 'Free: 1 entry. Elite: 10 entries. Monthly drawing for high performers.'
    }
  ];

  const handleClaimRequest = (prize: any) => {
    if (prize.premiumOnly && !isPremium) {
      alert("This is an ELITE reward. Upgrade to Vantage Elite on your dashboard to unlock.");
      return;
    }
    if (academicIntegrity < 85) {
      alert(`Trust Verified score too low (${academicIntegrity}%). Maintain consistent, human-like accuracy (>85%) to unlock rewards.`);
      return;
    }
    if (masteredCount < (prize.minMastery || 0)) {
      alert(`Mastery Locked! You have mastered ${masteredCount} words, but this prize requires ${prize.minMastery}. Keep studying!`);
      return;
    }
    if (credits < prize.price) {
      alert("Insufficient Vantage Credits (VC). Play more games or complete daily streaks!");
      return;
    }
    
    const confirmRedeem = window.confirm(
      `Confirm Redemption: ${prize.name}\n\nVerification process for ${isPremium ? 'Elite' : 'Basic'} users:\n- 24-hour Pacing Audit (AI Detection)\n- Mastery Verification (Random Check)\n\nProceed?`
    );

    if (confirmRedeem) {
      setRedeemStatus(`Request for ${prize.name} submitted. Status: ${isPremium ? 'PRIORITY AUDIT (6h)' : 'Standard Audit (48h)'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-10 duration-500 pb-12">
      {redeemStatus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white p-10 rounded-[3rem] text-center shadow-2xl max-w-sm space-y-6 animate-in zoom-in-95">
            <div className="text-6xl">{isPremium ? '⚡' : '⏳'}</div>
            <h2 className="text-2xl font-black text-slate-900">{isPremium ? 'Priority Queue' : 'Audit in Progress'}</h2>
            <p className="text-slate-500 font-medium leading-relaxed">{redeemStatus}</p>
            <button onClick={() => setRedeemStatus(null)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold">Close</button>
          </div>
        </div>
      )}

      <header className="text-center space-y-4">
        <h2 className="text-5xl font-black text-slate-900 tracking-tight">Reward Center</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
            <div className={`inline-flex items-center gap-3 px-8 py-3 rounded-full font-black text-2xl shadow-xl transition-all ${isPremium ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-slate-900 text-white'}`}>
                <span>{credits.toLocaleString()}</span>
                <span className="text-[10px] text-indigo-200 mt-1 uppercase tracking-widest">{isPremium ? 'Elite Credits' : 'VC Credits'}</span>
            </div>
            <div className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black tracking-widest uppercase border border-slate-200">
                NEXT REWARD DROP: {nextDrop}
            </div>
        </div>
      </header>

      {/* Premium Hook Section */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-100 animate-pulse-slow">
           <div className="text-center md:text-left">
              <h3 className="text-2xl font-black mb-1">Boost Your Odds by 10x!</h3>
              <p className="text-indigo-100 text-sm font-medium">Elite members get 10x raffle entries and priority claim verification.</p>
           </div>
           <button onClick={onBack} className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black text-xs hover:scale-105 transition-transform">GO ELITE ✨</button>
        </div>
      )}

      <section className="space-y-6">
        <h3 className="text-xl font-black flex items-center gap-3 px-2">
          <span className="w-2 h-8 bg-slate-900 rounded-full"></span>
          Student Essentials
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {storeItems.map(item => (
            <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-indigo-200 transition-all">
              <div className="text-5xl bg-slate-50 w-24 h-24 flex items-center justify-center rounded-[2rem] group-hover:scale-110 transition-transform">{item.icon}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                   <h4 className="text-xl font-black text-slate-900">{item.name}</h4>
                   {isPremium && <span className="text-[8px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase">Elite -50% Off</span>}
                </div>
                <p className="text-slate-500 text-xs font-medium mb-5">{item.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="font-black text-indigo-600">{isPremium ? Math.floor(item.price * 0.5) : item.price} VC</span>
                  <button 
                    onClick={() => onPurchase(isPremium ? Math.floor(item.price * 0.5) : item.price, item.key) ? alert(`Applied ${item.name}!`) : alert("Insufficient VC.")}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-md"
                  >
                    Buy Item
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
          Proof of Mastery Rewards
        </h3>
        <div className={`p-8 md:p-12 rounded-[3.5rem] border relative overflow-hidden transition-all ${isPremium ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="absolute top-0 right-0 p-12 text-9xl opacity-[0.03] rotate-12">🎓</div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highValuePrizes.map(prize => {
              const isLockedByMastery = masteredCount < (prize.minMastery || 0);
              const isLockedByPremium = prize.premiumOnly && !isPremium;
              const isLocked = isLockedByMastery || isLockedByPremium;
              
              return (
                <div key={prize.name} className={`bg-white p-8 rounded-[2.5rem] border flex flex-col justify-between relative shadow-lg transition-all ${isLocked ? 'grayscale opacity-70' : 'hover:-translate-y-2 border-slate-100'}`}>
                  {isLocked && (
                    <div className="absolute inset-0 z-20 bg-slate-100/60 backdrop-blur-[4px] rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center">
                        <div className="text-4xl mb-3">{isLockedByPremium ? '💎' : '🔒'}</div>
                        <p className="text-xs font-black uppercase text-slate-900">{isLockedByPremium ? 'Elite Only' : 'Mastery Locked'}</p>
                        <p className="text-[10px] text-slate-500 mt-2 font-medium">
                          {isLockedByPremium ? 'Requires Elite Membership' : `Master ${prize.minMastery} words to unlock.`}
                        </p>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="text-5xl">{prize.icon}</div>
                      <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter ${prize.stock === 0 ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                        {prize.stock === 0 ? 'Out of Stock' : `${prize.stock} Drop Left`}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-900 text-xl leading-tight mb-2">{prize.name}</h4>
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-4">Verification Level: {prize.type}</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-6">{prize.desc}</p>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-50">
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-lg font-black text-slate-900">{prize.price.toLocaleString()} <span className="text-xs text-slate-400">VC</span></span>
                      {isPremium && prize.name.includes('Raffle') && <span className="text-[10px] font-black text-indigo-600">x10 Odds 🔥</span>}
                    </div>
                    <button 
                      onClick={() => handleClaimRequest(prize)}
                      disabled={isLocked || prize.stock === 0}
                      className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl disabled:bg-slate-300 disabled:shadow-none ${prize.premiumOnly ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-900 text-white shadow-slate-200'}`}
                    >
                      {prize.stock === 0 ? 'Sold Out' : isLocked ? 'Locked' : 'Initiate Verification'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="text-center pt-16 space-y-6">
        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 max-w-2xl mx-auto shadow-sm">
             <div className="flex items-center justify-center gap-3 mb-4">
                 <div className={`w-3 h-3 rounded-full ${academicIntegrity > 85 ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></div>
                 <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Global Integrity Standard</p>
             </div>
             <p className="text-[10px] text-slate-500 font-medium leading-relaxed text-center">
               <b>Risk Mitigation Disclaimer:</b> Cash-value redemptions (Amazon, Scholarships) require "Proof of Genuine Learning." Mastery gates are set at 500+ words to prevent casual botting. 
               Free users have a lower priority in the manual audit queue and reduced odds in global raffles. Elite membership provides a priority lane but does not bypass Academic Integrity requirements.
             </p>
        </div>
        <div>
            <button onClick={onBack} className="text-slate-400 font-bold hover:text-slate-900 transition-colors text-sm underline decoration-dotted">Return to Personal Dashboard</button>
        </div>
      </footer>
    </div>
  );
};

export default RewardStore;
