
import React, { useState } from 'react';
import { Word, MasteryLevel } from '../types';
import { INITIAL_WORDS, MASTERY_COLORS } from '../constants';

interface WordBankProps {
  progress: Record<string, MasteryLevel>;
  onClose: () => void;
}

const WordBank: React.FC<WordBankProps> = ({ progress, onClose }) => {
  const [filter, setFilter] = useState<MasteryLevel | 'all'>('all');
  const [search, setSearch] = useState('');

  const filteredWords = INITIAL_WORDS.filter(w => {
    const level = progress[w.id] || 0;
    const matchesFilter = filter === 'all' || level === filter;
    const matchesSearch = w.term.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-black text-slate-900">Word Repository</h2>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-100'}`}
          >
            All
          </button>
          {(Object.keys(MASTERY_COLORS) as unknown as MasteryLevel[]).map(lvl => (
            <button 
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filter === lvl ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-100'}`}
            >
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${MASTERY_COLORS[lvl].bg.replace('-50', '-500')}`}></span>
              {MASTERY_COLORS[lvl].label}
            </button>
          ))}
        </div>
      </header>

      <div className="relative">
        <input 
          type="text"
          placeholder="Search 2,000+ words..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        />
        <span className="absolute right-6 top-4 text-slate-300">🔍</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWords.map(word => {
          const level = progress[word.id] || 0;
          const config = MASTERY_COLORS[level];
          return (
            <div key={word.id} className={`p-6 rounded-[2rem] border-2 transition-all group hover:shadow-lg ${config.border} bg-white`}>
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{word.term}</h3>
                <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${config.bg} ${config.text}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-bold mb-3 uppercase tracking-wider">{word.partOfSpeech}</p>
              <p className="text-slate-700 text-sm leading-relaxed mb-4">{word.definition}</p>
              <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className={`h-full ${config.bg.replace('-50', '-500')} opacity-30`} style={{ width: `${((level + 1) / 4) * 100}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
      {filteredWords.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase tracking-widest">No words found in this category</p>
        </div>
      )}
    </div>
  );
};

export default WordBank;
