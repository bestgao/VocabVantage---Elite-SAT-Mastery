
import React, { useState, useEffect } from 'react';
import { Word } from '../../types';
import { INITIAL_WORDS } from '../../constants';
import { generateWordImage } from '../../services/gemini';

interface VisualVibeProps {
  onBack: () => void;
  onXP: (amount: number) => void;
}

const VisualVibe: React.FC<VisualVibeProps> = ({ onBack, onXP }) => {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [streak, setStreak] = useState(0);

  const startNextRound = async () => {
    setLoading(true);
    setIsAnswered(false);
    setSelectedId(null);
    setImageUrl(null);

    const randomWord = INITIAL_WORDS[Math.floor(Math.random() * INITIAL_WORDS.length)];
    setCurrentWord(randomWord);

    const otherOptions = INITIAL_WORDS
      .filter(w => w.id !== randomWord.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    setOptions([randomWord, ...otherOptions].sort(() => 0.5 - Math.random()));

    try {
      const url = await generateWordImage(randomWord.term, randomWord.definition);
      setImageUrl(url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startNextRound();
  }, []);

  const handleSelect = (id: string) => {
    if (isAnswered) return;
    setSelectedId(id);
    setIsAnswered(true);

    if (id === currentWord?.id) {
      setStreak(s => s + 1);
      onXP(25);
    } else {
      setStreak(0);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-right-10 duration-500">
      <header className="flex justify-between items-center text-slate-400 font-bold text-xs uppercase tracking-widest px-2">
        <button onClick={onBack} className="hover:text-slate-900">← Exit Hub</button>
        <span className="text-rose-500">Streak: {streak} 🔥</span>
      </header>

      <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100 relative min-h-[24rem] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
            <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase text-xs animate-pulse">AI is painting the prompt...</p>
          </div>
        ) : (
          <>
            <div className="relative h-72 w-full bg-slate-50">
              {imageUrl ? (
                <img src={imageUrl} alt="Guess the word" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">Image generation failed</div>
              )}
              {isAnswered && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">The word was:</p>
                    <h3 className="text-4xl font-black text-slate-900">{currentWord?.term}</h3>
                    <p className="text-sm text-slate-600 font-medium italic">{currentWord?.definition}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">Identify the word illustrated above</p>
              <div className="grid grid-cols-2 gap-3">
                {options.map(opt => {
                  let styles = "p-4 rounded-2xl border-2 font-black transition-all ";
                  if (isAnswered) {
                    if (opt.id === currentWord?.id) styles += "bg-emerald-50 border-emerald-500 text-emerald-700";
                    else if (opt.id === selectedId) styles += "bg-rose-50 border-rose-500 text-rose-700";
                    else styles += "bg-slate-50 border-transparent text-slate-300";
                  } else {
                    styles += "bg-white border-slate-100 hover:border-rose-500 text-slate-700";
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(opt.id)}
                      disabled={isAnswered}
                      className={styles}
                    >
                      {opt.term}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {isAnswered && (
        <button
          onClick={startNextRound}
          className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 animate-in fade-in zoom-in-95"
        >
          NEXT ROUND →
        </button>
      )}
    </div>
  );
};

export default VisualVibe;
