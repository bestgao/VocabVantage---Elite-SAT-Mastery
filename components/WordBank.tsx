
import React, { useState, useRef, useMemo } from 'react';
import { Word, MasteryLevel } from '../types';
import { MASTERY_COLORS } from '../constants';
import { sanitizeImportedWords } from '../services/gemini';

interface WordBankProps {
  words: Word[];
  progress: Record<string, MasteryLevel>;
  onImport: (words: Word[]) => void;
  onDelete: (ids: string[]) => void;
  onClose: () => void;
}

interface RowValidation {
  type: 'error' | 'warning' | 'clean';
  message: string;
}

const WordBank: React.FC<WordBankProps> = ({ words, progress, onImport, onDelete, onClose }) => {
  const [filter, setFilter] = useState<MasteryLevel | 'all'>('all');
  const [search, setSearch] = useState('');
  
  // Import Management
  const [importStudioActive, setImportStudioActive] = useState(false);
  const [pendingWords, setPendingWords] = useState<Partial<Word>[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredWords = useMemo(() => words.filter(w => {
    const level = progress[w.id] ?? 0;
    const matchesFilter = filter === 'all' || level === filter;
    const matchesSearch = w.term.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [words, progress, filter, search]);

  const validateRow = (word: Partial<Word>): RowValidation => {
    if (!word.term?.trim()) return { type: 'error', message: 'Missing Term' };
    if (!word.definition?.trim()) return { type: 'error', message: 'Missing Definition' };
    
    const validPOS = ['noun', 'verb', 'adjective', 'adverb'];
    if (!word.partOfSpeech || !validPOS.includes(word.partOfSpeech.toLowerCase())) {
      return { type: 'warning', message: 'Invalid/Missing POS' };
    }
    
    if (!word.example || word.example.length < 10) {
      return { type: 'warning', message: 'Weak/Missing Example' };
    }

    return { type: 'clean', message: 'Ready' };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/);
        const parsed: Partial<Word>[] = [];

        // Skipping header, loop through CSV rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Basic CSV split (handles quotes)
          const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (parts.length >= 2) {
            parsed.push({
              id: `custom-${Date.now()}-${i}`,
              term: parts[0].replace(/"/g, '').trim(),
              definition: (parts[1] || '').replace(/"/g, '').trim(),
              partOfSpeech: (parts[2] || '').replace(/"/g, '').trim(),
              example: (parts[3] || '').replace(/"/g, '').trim(),
              synonyms: (parts[4] || '').replace(/"/g, '').split(';').map(s => s.trim()).filter(Boolean)
            });
          }
        }

        if (parsed.length > 0) {
          setPendingWords(parsed);
          setImportStudioActive(true);
        }
      } catch (err) {
        alert("Parse Error: Ensure file is a standard Comma Separated CSV.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAISuggestions = async () => {
    const messyRows = pendingWords.filter(w => validateRow(w).type !== 'clean');
    if (messyRows.length === 0) {
      alert("All rows already look healthy!");
      return;
    }

    setIsProcessingAI(true);
    try {
      const sanitized = await sanitizeImportedWords(messyRows);
      
      // Merge back into pendingWords
      setPendingWords(prev => prev.map(old => {
        const found = sanitized.find(s => s.id === old.id);
        return found ? found : old;
      }));
    } catch (err) {
      alert("AI Service busy. Please try manually fixing rows.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleCellEdit = (index: number, field: keyof Word, value: string) => {
    setPendingWords(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const confirmImport = () => {
    const finalWords = pendingWords.filter(w => validateRow(w).type !== 'error') as Word[];
    if (finalWords.length === 0) {
      alert("No valid words to import. Fix Red rows first.");
      return;
    }
    onImport(finalWords);
    setImportStudioActive(false);
    setPendingWords([]);
    alert(`Success: ${finalWords.length} words added.`);
  };

  const deleteCustom = () => {
    if (window.confirm("Purge all personal imports? This action is permanent.")) {
      const ids = words.filter(w => w.id.startsWith('custom-')).map(w => w.id);
      onDelete(ids);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 relative">
      {/* --- IMPORT STUDIO MODAL --- */}
      {importStudioActive && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8">
          <div className="bg-white w-full max-w-7xl h-full max-h-[92vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
            <header className="p-8 md:p-12 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 gap-6">
              <div>
                <h2 className="text-4xl font-black text-slate-900 flex items-center gap-4 tracking-tighter">
                  <span className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-xl">✨</span>
                  Import Studio
                </h2>
                <p className="text-slate-500 text-sm font-semibold mt-2">
                  Double-checking {pendingWords.length} records. Fix issues or use AI to complete missing data.
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={handleAISuggestions}
                  disabled={isProcessingAI}
                  className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50 hover:scale-105 transition-transform"
                >
                  {isProcessingAI ? '🪄 Repairing...' : '✨ Fix messy rows with AI'}
                </button>
                <button 
                  onClick={confirmImport}
                  className="flex-1 md:flex-none px-8 py-4 bg-emerald-500 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 transition-transform"
                >
                  Import {pendingWords.filter(w => validateRow(w).type !== 'error').length} Words
                </button>
                <button onClick={() => setImportStudioActive(false)} className="px-6 py-4 bg-white text-slate-400 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest border border-slate-200">Cancel</button>
              </div>
            </header>

            <div className="flex-1 overflow-auto p-4 md:p-12 no-scrollbar bg-slate-50/20">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead className="sticky top-0 z-10 bg-white/50 backdrop-blur-sm">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="pb-6 pl-8 w-40">Status Check</th>
                    <th className="pb-6">Word / Term</th>
                    <th className="pb-6">Meaning / Definition</th>
                    <th className="pb-6 w-32">Type (POS)</th>
                    <th className="pb-6 text-right pr-8">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingWords.map((pw, idx) => {
                    const validation = validateRow(pw);
                    const isError = validation.type === 'error';
                    const isWarning = validation.type === 'warning';
                    
                    return (
                      <tr key={idx} className={`group transition-all hover:translate-x-1 ${isError ? 'bg-rose-50 border border-rose-100' : isWarning ? 'bg-amber-50/40' : 'bg-white shadow-sm'}`}>
                        <td className="py-5 pl-8 rounded-l-[1.5rem]">
                          <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md tracking-tighter ${isError ? 'bg-rose-500 text-white' : isWarning ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                            {validation.message}
                          </span>
                        </td>
                        <td className="py-5">
                          <input 
                            value={pw.term || ''} 
                            onChange={(e) => handleCellEdit(idx, 'term', e.target.value)}
                            className="bg-transparent font-black text-slate-900 border-b border-transparent focus:border-indigo-400 outline-none w-full"
                          />
                        </td>
                        <td className="py-5">
                          <textarea 
                            value={pw.definition || ''} 
                            onChange={(e) => handleCellEdit(idx, 'definition', e.target.value)}
                            className="bg-transparent text-sm text-slate-600 border-b border-transparent focus:border-indigo-400 outline-none w-full min-h-[40px] resize-none overflow-hidden"
                            placeholder="Type definition..."
                          />
                        </td>
                        <td className="py-5">
                           <select 
                            value={pw.partOfSpeech?.toLowerCase() || ''} 
                            onChange={(e) => handleCellEdit(idx, 'partOfSpeech', e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase text-slate-400 outline-none border-b border-transparent focus:border-indigo-400 cursor-pointer"
                          >
                            <option value="">Choose</option>
                            <option value="noun">noun</option>
                            <option value="verb">verb</option>
                            <option value="adjective">adjective</option>
                            <option value="adverb">adverb</option>
                          </select>
                        </td>
                        <td className="py-5 pr-8 rounded-r-[1.5rem] text-right">
                          <button 
                            onClick={() => setPendingWords(prev => prev.filter((_, i) => i !== idx))}
                            className="text-rose-300 hover:text-rose-600 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Word Repository</h2>
          <p className="text-slate-500 font-medium text-sm">Review, filter, and import your vocabulary collection.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".csv"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-none px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all"
          >
            📂 Bulk CSV Import
          </button>
          <button 
            onClick={deleteCustom}
            className="px-6 py-3 bg-rose-50 text-rose-500 rounded-2xl font-bold border border-rose-100 hover:bg-rose-100 transition-all"
          >
            🗑️ Purge Custom
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input 
            type="text" 
            placeholder="Search terms..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-semibold"
          />
        </div>
        <div className="flex gap-2">
          {['all', 0, 1, 2, 3].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === lvl 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              {lvl === 'all' ? 'All' : `Lvl ${Number(lvl) + 1}`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWords.map((word) => {
          const level = progress[word.id] || 0;
          const config = MASTERY_COLORS[level as MasteryLevel];
          return (
            <div key={word.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${config.bg} ${config.text} border ${config.border}`}>
                    {config.label.split(':')[1]}
                  </span>
                  <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">{word.partOfSpeech}</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight group-hover:text-indigo-600 transition-colors">{word.term}</h3>
                <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">{word.definition}</p>
                <p className="text-slate-400 text-xs italic font-medium leading-relaxed">"{word.example}"</p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-50 flex gap-2">
                {word.synonyms.slice(0, 3).map((syn, i) => (
                  <span key={i} className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                    {syn}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredWords.length === 0 && (
        <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
           <p className="text-slate-400 font-bold">No words match your current filters.</p>
        </div>
      )}

      <div className="text-center pt-12">
        <button onClick={onClose} className="text-slate-400 font-bold hover:text-slate-900 transition-colors">Back to Dashboard</button>
      </div>
    </div>
  );
};

export default WordBank;
