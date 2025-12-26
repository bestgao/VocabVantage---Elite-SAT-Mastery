
import React, { useState, useMemo, useRef } from 'react';
import { Word, MasteryLevel } from '../types';
import { MASTERY_COLORS } from '../constants';

interface WordBankProps {
  words: Word[];
  progress: Record<string, MasteryLevel>;
  onImport: (words: Word[]) => void;
  onDelete: (ids: string[]) => void;
  onClose: () => void;
}

const WordBank: React.FC<WordBankProps> = ({ words, progress, onImport, onDelete, onClose }) => {
  const [filterMastery, setFilterMastery] = useState<MasteryLevel | 'all'>('all');
  const [filterLevel, setFilterLevel] = useState<Word['satLevel'] | 'all'>('all');
  const [filterFreq, setFilterFreq] = useState<Word['frequencyTier'] | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showImporter, setShowImporter] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredWords = useMemo(() => {
    const s = search.toLowerCase().trim();
    return words.filter(w => {
      if (!w) return false;
      const mastery = progress[w.id] ?? 0;
      const matchesMastery = filterMastery === 'all' || mastery === filterMastery;
      const matchesLevel = filterLevel === 'all' || w.satLevel === filterLevel;
      const matchesFreq = filterFreq === 'all' || w.frequencyTier === filterFreq;
      const matchesSearch = w.term.toLowerCase().includes(s) || w.definition.toLowerCase().includes(s);
      return matchesMastery && matchesLevel && matchesFreq && matchesSearch;
    });
  }, [words, progress, filterMastery, filterLevel, filterFreq, search]);

  const parseCSVLine = (line: string): string[] => {
    const fields = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { fields.push(cur.trim()); cur = ""; }
      else { cur += char; }
    }
    fields.push(cur.trim());
    return fields;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const content = event.target?.result as string;
      let rawWords: Word[] = [];

      try {
        const lines = content.split(/\r?\n/);
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const clean = parseCSVLine(line);
          if (clean.length >= 3) {
            const term = clean[0].trim();
            const def = clean[2];
            if (!term || !def) continue;
            const termKey = term.toLowerCase().trim();
            rawWords.push({
              id: `sat-${termKey}`,
              term: term,
              partOfSpeech: clean[1] || "noun",
              definition: def,
              example: clean[3] || "Context needed.",
              synonyms: clean[4] ? clean[4].split(';').map(s => s.trim()) : [],
              satLevel: clean[5]?.includes('Core') ? 'Core' : clean[5]?.includes('Advanced') ? 'Advanced' : 'Medium',
              frequencyTier: clean[6]?.includes('High') ? 'High' : clean[6]?.includes('Low') ? 'Low' : 'Mid'
            });
          }
        }
        onImport(rawWords);
        setShowImporter(false);
      } catch (err) {
        alert("CSV Parse Error.");
      } finally {
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Titan Repository</h2>
          {/* RESTORED COUNT DISPLAY */}
          <p className="text-slate-500 font-medium text-sm tracking-tight mt-1">
            Displaying <span className="text-indigo-600 font-black">{filteredWords.length.toLocaleString()}</span> units of <span className="text-slate-900 font-black">{words.length.toLocaleString()} total assets</span>.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowImporter(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Import CSV</button>
          <button onClick={onClose} className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200">Exit</button>
        </div>
      </div>

      {showImporter && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-12 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="text-center space-y-3">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Intelligence Feed</h3>
              <p className="text-sm text-slate-500 font-medium">Titan 2.2 Parser: Handling 2,280+ word dataset with deduplication active.</p>
            </div>
            
            <div onClick={() => !isParsing && fileInputRef.current?.click()} className="group border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 text-center transition-all cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30">
              {isParsing ? <div className="flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div><p className="text-indigo-600 font-black text-xs uppercase tracking-widest">Processing Data...</p></div> : <><p className="text-slate-400 font-black text-xs uppercase tracking-widest group-hover:text-indigo-600">Select Dataset File</p><p className="text-[10px] text-slate-300 font-bold mt-2 uppercase">CSV Bulk Ingestion</p></>}
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
            <button disabled={isParsing} onClick={() => setShowImporter(false)} className="w-full py-5 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">Close</button>
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
        <div className="relative">
          <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
          <input 
            type="text" 
            placeholder="Search vault assets..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-20 pr-10 py-6 bg-slate-50 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-black text-xl"
          />
        </div>
        
        <div className="flex flex-wrap gap-8 items-center">
          <div className="space-y-2"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">SAT Category</p><div className="flex bg-slate-50 p-2 rounded-2xl gap-1">
            {['all', 'Core', 'Medium', 'Advanced'].map(lvl => (
              <button key={lvl} onClick={() => setFilterLevel(lvl as any)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${filterLevel === lvl ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>{lvl}</button>
            ))}
          </div></div>
          <div className="space-y-2"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Engagement State</p><div className="flex bg-slate-50 p-2 rounded-2xl gap-1">
            {['all', 0, 1, 2, 3].map(m => (
              <button key={m} onClick={() => setFilterMastery(m as any)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${filterMastery === m ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>{m === 'all' ? 'All' : `Lvl ${Number(m)+1}`}</button>
            ))}
          </div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWords.slice(0, 300).map((word) => { 
          const mLevel = progress[word.id] || 0;
          const config = MASTERY_COLORS[mLevel as MasteryLevel];
          return (
            <div key={word.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                   <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${word.satLevel === 'Core' ? 'bg-indigo-50 text-indigo-600' : word.satLevel === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>{word.satLevel}</span>
                   <div className={`w-3 h-3 rounded-full ${config.text.replace('text-', 'bg-')}`}></div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">{word.term}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-4">{word.definition}</p>
                <div className="mt-auto pt-4 border-t border-slate-50 italic text-[10px] text-slate-400">"{word.example}"</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WordBank;
