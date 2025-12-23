
import React, { useState, useMemo, useRef } from 'react';
import { Word, MasteryLevel } from '../types';
import { MASTERY_COLORS } from '../constants';
import { enrichContextualExamples } from '../services/gemini';

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
  const [enrichmentProgress, setEnrichmentProgress] = useState<{current: number, total: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredWords = useMemo(() => {
    const s = search.toLowerCase();
    return words.filter(w => {
      const mastery = progress[w.id] ?? 0;
      const matchesMastery = filterMastery === 'all' || mastery === filterMastery;
      const matchesLevel = filterLevel === 'all' || w.satLevel === filterLevel;
      const matchesFreq = filterFreq === 'all' || w.frequencyTier === filterFreq;
      const matchesSearch = w.term.toLowerCase().includes(s) || w.definition.toLowerCase().includes(s);
      return matchesMastery && matchesLevel && matchesFreq && matchesSearch;
    });
  }, [words, progress, filterMastery, filterLevel, filterFreq, search]);

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
          const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          const clean = parts.map(p => p.replace(/^"|"$/g, '').trim());

          if (clean.length >= 2) {
            rawWords.push({
              id: `titan-${clean[0].toLowerCase().replace(/\s+/g, '-')}`,
              term: clean[0],
              partOfSpeech: clean[1] || "noun",
              definition: clean[2] || "Definition pending.",
              example: clean[3] || "Context pending.",
              synonyms: clean[4] ? clean[4].split(';').map(s => s.trim()) : [],
              satLevel: (clean[5] as any) || "Medium",
              frequencyTier: (clean[6] as any) || "Mid"
            });
          }
        }

        // DETECT REPETITIVE EXAMPLES
        const needsEnrichment = rawWords.filter(w => 
          w.example.toLowerCase().includes("passage uses the concept") || 
          w.example.toLowerCase().includes("author uses this detail")
        );

        if (needsEnrichment.length > 0) {
          const enrichedWords: Word[] = [...rawWords];
          const batchSize = 10;
          setEnrichmentProgress({ current: 0, total: needsEnrichment.length });

          for (let i = 0; i < needsEnrichment.length; i += batchSize) {
            const batch = needsEnrichment.slice(i, i + batchSize);
            const enrichedBatch = await enrichContextualExamples(batch);
            
            // Map back to main list
            enrichedBatch.forEach(ew => {
              const idx = enrichedWords.findIndex(w => w.id === ew.id);
              if (idx !== -1) enrichedWords[idx] = ew;
            });

            setEnrichmentProgress({ current: Math.min(i + batchSize, needsEnrichment.length), total: needsEnrichment.length });
          }
          
          onImport(enrichedWords);
        } else {
          onImport(rawWords);
        }
        
        setShowImporter(false);
      } catch (err) {
        alert("Integrity check failed. Please ensure standard CSV encoding.");
      } finally {
        setIsParsing(false);
        setEnrichmentProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Titan Repository</h2>
          <p className="text-slate-500 font-medium text-sm tracking-tight">Active intelligence pool: <span className="text-indigo-600 font-black">{words.length.toLocaleString()} words</span>.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowImporter(true)} 
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            Update Repository
          </button>
          <button onClick={onClose} className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200">Exit</button>
        </div>
      </div>

      {showImporter && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-12 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">⚙️</div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Intelligence Sync</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
                The app will automatically detect and fix repetitive examples using AI enrichment.
              </p>
            </div>
            
            <div 
              onClick={() => !isParsing && fileInputRef.current?.click()}
              className={`group border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 text-center transition-all ${isParsing ? 'bg-indigo-50/20' : 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30'}`}
            >
              {isParsing ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="space-y-2">
                    <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">Neural Enrichment in Progress...</p>
                    {enrichmentProgress && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Fixing repetitive context: {enrichmentProgress.current} / {enrichmentProgress.total}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-400 font-black text-xs uppercase tracking-widest group-hover:text-indigo-600">Select CSV for Ingestion</p>
                  <p className="text-[10px] text-slate-300 font-bold mt-2 uppercase">2,200+ words fully supported</p>
                </>
              )}
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
            <button disabled={isParsing} onClick={() => setShowImporter(false)} className="w-full py-5 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50">Cancel Ingestion</button>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
        <div className="relative">
          <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
          <input 
            type="text" 
            placeholder="Search thousands of terms..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-20 pr-10 py-6 bg-slate-50 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-black text-xl placeholder:text-slate-300"
          />
        </div>
        
        <div className="flex flex-wrap gap-8 items-center">
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">SAT Level</p>
            <div className="flex bg-slate-50 p-2 rounded-2xl gap-1">
              {['all', 'Core', 'Medium', 'Advanced'].map(lvl => (
                <button 
                  key={lvl}
                  onClick={() => setFilterLevel(lvl as any)}
                  className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${filterLevel === lvl ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Frequency</p>
            <div className="flex bg-slate-50 p-2 rounded-2xl gap-1">
              {['all', 'High', 'Mid', 'Low'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilterFreq(f as any)}
                  className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${filterFreq === f ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WORD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredWords.slice(0, 150).map((word) => { 
          const mLevel = progress[word.id] || 0;
          const config = MASTERY_COLORS[mLevel as MasteryLevel];
          const isGeneric = word.example.includes("passage uses");
          
          return (
            <div key={word.id} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-2xl hover:-translate-y-2 transition-all">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      word.satLevel === 'Core' ? 'bg-indigo-50 text-indigo-600' :
                      word.satLevel === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {word.satLevel}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-400">
                      {word.frequencyTier} Freq
                    </span>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full ${config.text.replace('text-', 'bg-')}`}></div>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter group-hover:text-indigo-600 transition-colors">{word.term}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-3">{word.definition}</p>
              </div>
              <div className="mt-10 pt-8 border-t border-slate-50">
                 <p className={`text-[10px] italic font-medium leading-relaxed ${isGeneric ? 'text-rose-300' : 'text-slate-400'}`}>
                   {isGeneric ? "⚠️ Generic placeholder detected." : `"${word.example}"`}
                 </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WordBank;
