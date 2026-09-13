import React, { useMemo, useState } from 'react';
import { Word } from '../types';
import { buildLocalContextQuestion, ContextQuestion } from '../services/contextQuestions';

interface QuizProps {
  words: Word[];
  onFinish: (score: number) => void;
  onWordResult: (wordId: string, term: string, isCorrect: boolean) => void;
  onBack: () => void;
}

type QuestionMode = 'definition' | 'context' | 'written';

interface MixedQuestion {
  id: string;
  word: Word;
  mode: QuestionMode;
  questionText: string;
  options?: string[];
  correctIndex?: number;
  passage?: string;
  rationale: string;
  optionReasons?: string[];
}

const shuffle = <T,>(items: T[]) => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s'-]/gu, '')
    .replace(/\s+/g, ' ');

function buildDefinitionQuestion(word: Word, pool: Word[]): MixedQuestion {
  const potentialDistractors = pool.filter(w => w.id !== word.id);
  const smartDistractors = shuffle(
    potentialDistractors.filter(
      w => w.academicDomain === word.academicDomain || w.distractorType === word.distractorType
    )
  ).slice(0, 2);

  const randomDistractors = shuffle(
    potentialDistractors.filter(w => !smartDistractors.some(sd => sd.id === w.id))
  ).slice(0, Math.max(0, 3 - smartDistractors.length));

  const options = shuffle([
    word.definition,
    ...smartDistractors.map(w => w.definition),
    ...randomDistractors.map(w => w.definition)
  ]).slice(0, 4);

  return {
    id: `definition-${word.id}-${Math.random()}`,
    word,
    mode: 'definition',
    questionText: 'Which definition best matches this word?',
    options,
    correctIndex: options.indexOf(word.definition),
    rationale: `"${word.term}" means ${word.definition}.`
  };
}

function buildContextQuestion(word: Word, pool: Word[]): MixedQuestion {
  const q: ContextQuestion = buildLocalContextQuestion(word, pool);
  return {
    id: q.id,
    word,
    mode: 'context',
    questionText: q.questionText,
    options: q.options,
    correctIndex: q.correctIndex,
    passage: q.passage,
    rationale: q.rationale,
    optionReasons: q.optionReasons
  };
}

function buildWrittenQuestion(word: Word): MixedQuestion {
  return {
    id: `written-${word.id}-${Math.random()}`,
    word,
    mode: 'written',
    questionText: 'Type the SAT vocabulary word that matches this meaning.',
    rationale: `"${word.term}" means ${word.definition}.`
  };
}

const Quiz: React.FC<QuizProps> = ({ words, onFinish, onWordResult, onBack }) => {
  const questions = useMemo<MixedQuestion[]>(() => {
    const selected = shuffle(words).slice(0, Math.min(10, words.length));
    return selected.map((word, index) => {
      // Deliberate progression: recognition -> context -> retrieval.
      if (index % 3 === 2) return buildWrittenQuestion(word);
      if (index % 3 === 1) return buildContextQuestion(word, words);
      return buildDefinitionQuestion(word, words);
    });
  }, [words]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  if (questions.length === 0) {
    return <div className="p-8 text-center font-bold text-slate-500">No words available for this quiz.</div>;
  }

  const currentQuestion = questions[currentIndex];

  const recordResult = (isCorrect: boolean) => {
    setIsAnswered(true);
    setLastCorrect(isCorrect);
    if (isCorrect) setScore(prev => prev + 1);
    onWordResult(currentQuestion.word.id, currentQuestion.word.term, isCorrect);
  };

  const handleSelect = (index: number) => {
    if (isAnswered || currentQuestion.correctIndex == null) return;
    setSelectedOption(index);
    recordResult(index === currentQuestion.correctIndex);
  };

  const handleWrittenSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isAnswered || !typedAnswer.trim()) return;
    const accepted = [
      currentQuestion.word.term,
      ...(currentQuestion.word.synonyms || [])
    ].map(normalize);
    const isCorrect = accepted.includes(normalize(typedAnswer));
    recordResult(isCorrect);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setTypedAnswer('');
      setIsAnswered(false);
      setLastCorrect(null);
    } else {
      onFinish(score);
    }
  };

  const modeLabel =
    currentQuestion.mode === 'context'
      ? 'SAT Context'
      : currentQuestion.mode === 'written'
        ? 'Written Recall'
        : 'Definition';

  return (
    <div className="max-w-xl mx-auto space-y-5 md:space-y-7 px-4 pb-28 animate-in slide-in-from-right-10 duration-500">
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-[10px] md:text-sm text-slate-500 hover:text-slate-900 flex items-center bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm"
        >
          ← Quit
        </button>
        <div className="text-right">
          <span className="font-bold text-indigo-600 text-xs md:text-sm">
            Question {currentIndex + 1}/{questions.length}
          </span>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{modeLabel}</p>
        </div>
      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-[2rem] md:rounded-3xl shadow-xl p-7 md:p-10 border border-slate-100">
        <h2 className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
          {currentQuestion.questionText}
        </h2>

        {currentQuestion.mode === 'context' && currentQuestion.passage ? (
          <div className="mb-7 p-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 font-medium leading-relaxed">
            {currentQuestion.passage}
          </div>
        ) : currentQuestion.mode === 'written' ? (
          <div className="mb-7">
            <p className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              {currentQuestion.word.definition}
            </p>
            <p className="text-xs text-slate-400 mt-3">
              Part of speech: {currentQuestion.word.partOfSpeech}
            </p>
          </div>
        ) : (
          <div className="text-3xl md:text-4xl font-black text-slate-900 mb-7">
            {currentQuestion.word.term}
          </div>
        )}

        {currentQuestion.mode === 'written' ? (
          <form onSubmit={handleWrittenSubmit} className="space-y-3">
            <input
              autoFocus
              value={typedAnswer}
              onChange={e => setTypedAnswer(e.target.value)}
              disabled={isAnswered}
              placeholder="Type your answer"
              autoComplete="off"
              className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 outline-none text-lg font-bold disabled:bg-slate-50"
            />
            {!isAnswered && (
              <button
                type="submit"
                disabled={!typedAnswer.trim()}
                className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black disabled:opacity-40"
              >
                CHECK ANSWER
              </button>
            )}
          </form>
        ) : (
          <div className="space-y-3">
            {(currentQuestion.options || []).map((option, idx) => {
              let className =
                'w-full p-4 md:p-5 text-left rounded-xl md:rounded-2xl border-2 transition-all duration-200 font-medium text-sm md:text-base ';

              if (isAnswered) {
                if (idx === currentQuestion.correctIndex) {
                  className += 'bg-emerald-50 border-emerald-500 text-emerald-900';
                } else if (idx === selectedOption) {
                  className += 'bg-rose-50 border-rose-500 text-rose-900';
                } else {
                  className += 'bg-slate-50 border-transparent text-slate-400';
                }
              } else {
                className += 'bg-white border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700';
              }

              return (
                <button
                  key={`${option}-${idx}`}
                  onClick={() => handleSelect(idx)}
                  className={className}
                  disabled={isAnswered}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isAnswered && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
          <div
            className={`p-5 md:p-6 rounded-[2rem] border-2 shadow-sm ${
              lastCorrect
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <p
              className={`text-xs font-black uppercase tracking-widest ${
                lastCorrect ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {lastCorrect ? 'Correct' : 'Learn this one'}
            </p>
            <p className="text-sm md:text-base font-bold text-slate-800 mt-2">
              {currentQuestion.rationale}
            </p>

            {!lastCorrect && currentQuestion.mode === 'written' && (
              <p className="mt-3 text-sm text-slate-700">
                Correct answer: <strong>{currentQuestion.word.term}</strong>
              </p>
            )}

            {currentQuestion.mode === 'context' && selectedOption != null && currentQuestion.optionReasons && (
              <p className="mt-3 text-sm text-slate-600">
                {currentQuestion.optionReasons[selectedOption]}
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-black/5">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">SAT usage</p>
              <p className="text-sm text-slate-700 mt-1 italic">
                “{currentQuestion.word.example}”
              </p>
            </div>
          </div>

          <button
            onClick={handleNext}
            className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
          >
            {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;
