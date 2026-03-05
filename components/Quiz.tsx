
import React, { useState, useEffect } from 'react';
import { Word, QuizQuestion } from '../types';
import { INITIAL_WORDS } from '../constants';

interface QuizProps {
  words: Word[];
  onFinish: (score: number) => void;
  onWordResult: (wordId: string, term: string, isCorrect: boolean) => void;
  onBack: () => void;
}

const TRAP_INSIGHTS: Record<string, string> = {
  'semantic + tense trap': 'This distractor uses a similar meaning but the wrong verb tense (e.g., past vs. present), which is a common way the SAT tests precision.',
  'semantic + category trap': 'This is a "category error." The word belongs to a similar field (like Economics), but the specific definition is slightly off-target.',
  'semantic + tone trap': 'This trap uses a word with the right meaning but the wrong emotional "charge" or tone (too positive or too negative for the context).',
  'polysemy trap': 'This word has multiple meanings! The SAT often provides a definition for the *other* common meaning to see if you are paying attention to context.'
};

const Quiz: React.FC<QuizProps> = ({ words, onFinish, onWordResult, onBack }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    // Generate 10 random questions for a more robust session
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    
    const quizQuestions: QuizQuestion[] = selected.map((word) => {
      const options = [word.definition];
      
      // Intelligent Distractor Selection
      const potentialDistractors = words.filter(w => w.id !== word.id);
      
      const smartDistractors = potentialDistractors
        .filter(w => w.academicDomain === word.academicDomain || w.distractorType === word.distractorType)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      const randomDistractors = potentialDistractors
        .filter(w => !smartDistractors.find(sd => sd.id === w.id))
        .sort(() => 0.5 - Math.random())
        .slice(0, 3 - smartDistractors.length);
      
      options.push(...smartDistractors.map(w => w.definition), ...randomDistractors.map(w => w.definition));
      const shuffledOptions = options.sort(() => 0.5 - Math.random());
      
      return {
        id: Math.random().toString(),
        word,
        questionText: `Identify the correct definition for:`,
        options: shuffledOptions,
        correctIndex: shuffledOptions.indexOf(word.definition),
        type: 'definition'
      };
    });

    setQuestions(quizQuestions);
  }, [words]);

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    const isCorrect = index === questions[currentIndex].correctIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    onWordResult(questions[currentIndex].word.id, questions[currentIndex].word.term, isCorrect);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      onFinish(score);
    }
  };

  if (questions.length === 0) return <div className="p-8 text-center">Loading quiz...</div>;

  const currentQuestion = questions[currentIndex];
  const trapKey = currentQuestion.word.distractorType || (currentQuestion.word.multipleMeaningsFlag ? 'polysemy trap' : '');
  const insight = TRAP_INSIGHTS[trapKey] || 'This distractor is designed to look plausible by using related vocabulary from the same academic domain.';

  return (
    <div className="max-w-xl mx-auto space-y-6 md:space-y-8 px-4 animate-in slide-in-from-right-10 duration-500">
       <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-[10px] md:text-sm text-slate-500 hover:text-slate-900 flex items-center bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="15 19l-7-7 7-7" /></svg>
          Quit
        </button>
        <span className="font-bold text-indigo-600 text-xs md:text-sm">Question {currentIndex + 1}/{questions.length}</span>
      </div>

      <div className="bg-white rounded-[2.5rem] md:rounded-3xl shadow-xl p-8 md:p-10 border border-slate-100">
        <h2 className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{currentQuestion.questionText}</h2>
        <div className="text-3xl md:text-4xl font-black text-slate-900 mb-6 md:mb-8">{currentQuestion.word.term}</div>

        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            let className = "w-full p-4 md:p-5 text-left rounded-xl md:rounded-2xl border-2 transition-all duration-200 font-medium text-sm md:text-base ";
            
            if (isAnswered) {
              if (idx === currentQuestion.correctIndex) {
                className += "bg-emerald-50 border-emerald-500 text-emerald-900";
              } else if (idx === selectedOption) {
                className += "bg-rose-50 border-rose-500 text-rose-900";
              } else {
                className += "bg-slate-50 border-transparent text-slate-400";
              }
            } else {
              className += "bg-white border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                className={className}
                disabled={isAnswered}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {isAnswered && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
          {selectedOption !== currentQuestion.correctIndex && (
            <div className="p-6 md:p-8 bg-amber-50 border-2 border-amber-200 rounded-[2rem] md:rounded-[2.5rem] shadow-lg relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-5xl md:text-6xl opacity-10 rotate-12">🪤</div>
              <p className="text-[9px] md:text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] mb-2 md:mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Trap Master Insight
              </p>
              <p className="text-xs md:text-sm text-amber-900 font-bold leading-relaxed">
                {insight}
              </p>
              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-amber-200/50">
                 <p className="text-[8px] md:text-[9px] font-black text-amber-500 uppercase tracking-widest">Trap Signature</p>
                 <p className="text-[10px] md:text-xs font-black text-amber-700 italic">{trapKey || 'General Distractor'}</p>
              </div>
            </div>
          )}
          
          <button
            onClick={handleNext}
            className="w-full bg-slate-900 text-white py-5 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl active:scale-95 text-sm md:text-base"
          >
            {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;
