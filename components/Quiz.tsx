
import React, { useState, useEffect } from 'react';
import { Word, QuizQuestion } from '../types';
import { INITIAL_WORDS } from '../constants';

interface QuizProps {
  onFinish: (score: number) => void;
  onBack: () => void;
}

const Quiz: React.FC<QuizProps> = ({ onFinish, onBack }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    // Generate 5 random questions
    const shuffled = [...INITIAL_WORDS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    
    const quizQuestions: QuizQuestion[] = selected.map((word) => {
      const options = [word.definition];
      const otherDefs = INITIAL_WORDS
        .filter(w => w.id !== word.id)
        .map(w => w.definition)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      options.push(...otherDefs);
      const shuffledOptions = options.sort(() => 0.5 - Math.random());
      
      // Fixed: Added missing questionText and type properties to satisfy QuizQuestion interface
      return {
        id: Math.random().toString(),
        word,
        questionText: `What is the definition of the word: ${word.term}?`,
        options: shuffledOptions,
        correctIndex: shuffledOptions.indexOf(word.definition),
        type: 'definition'
      };
    });

    setQuestions(quizQuestions);
  }, []);

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === questions[currentIndex].correctIndex) {
      setScore(prev => prev + 1);
    }
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

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-right-10 duration-500">
       <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-900 flex items-center">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="15 19l-7-7 7-7" /></svg>
          Quit Quiz
        </button>
        <span className="font-bold text-indigo-600">Question {currentIndex + 1}/5</span>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-10 border border-slate-100">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{currentQuestion.questionText}</h2>
        <div className="text-4xl font-black text-slate-900 mb-8">{currentQuestion.word.term}</div>

        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            let className = "w-full p-5 text-left rounded-2xl border-2 transition-all duration-200 font-medium ";
            
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
        <button
          onClick={handleNext}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all animate-in fade-in zoom-in-95"
        >
          {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </button>
      )}
    </div>
  );
};

export default Quiz;
