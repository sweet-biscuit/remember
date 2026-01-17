
import React, { useState, useEffect, useCallback } from 'react';
import { Word, QuizQuestion, QuizOption } from '../types';
import { speak } from '../services/ttsService';
import { apiService } from '../services/storageService';

interface QuizViewProps {
  targetWords: Word[];
  allWords: Word[];
}

const QuizView: React.FC<QuizViewProps> = ({ targetWords, allWords }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const generateQuiz = useCallback(() => {
    if (targetWords.length === 0) return;
    const shuffledTargets = [...targetWords].sort(() => Math.random() - 0.5).slice(0, 10);
    const quizItems: QuizQuestion[] = shuffledTargets.map(word => {
      const otherWordsPool = allWords.filter(w => w.definition !== word.definition);
      const uniqueDistractors = Array.from(new Map(otherWordsPool.map(w => [w.definition, w])).values())
        .sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [...uniqueDistractors, word].sort(() => Math.random() - 0.5);
      return { word, options, correctIndex: options.findIndex(opt => opt.definition === word.definition) };
    });
    setQuestions(quizItems);
    setCurrentIdx(0); setIsFinished(false); setSelectedAnswer(null);
  }, [targetWords, allWords]);

  useEffect(() => { generateQuiz(); }, [generateQuiz]);

  const handleAnswer = async (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const currentQuestion = questions[currentIdx];
    const isCorrect = index === currentQuestion.correctIndex;
    
    if (isCorrect) {
      const newLevel = Math.min(5, (currentQuestion.word.masteryLevel || 0) + 1);
      await apiService.updateWord({ ...currentQuestion.word, masteryLevel: newLevel, isMastered: newLevel === 5 });
    } else {
      await apiService.updateWord({ ...currentQuestion.word, masteryLevel: 0, isMastered: false });
    }
  };

  if (isFinished) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-[48px] p-12 shadow-xl text-center animate-in zoom-in duration-500">
        <div className="text-7xl mb-8">🌿</div>
        <h2 className="text-3xl font-black text-slate-800 mb-4">挑戰完成了！</h2>
        <p className="text-slate-400 font-medium mb-10 leading-relaxed">每一次練習，都是讓記憶生根發芽的養分。休息一下，或是再接再厲？</p>
        <button onClick={generateQuiz} className="w-full py-5 bg-slate-900 text-white rounded-[28px] font-black hover:bg-indigo-600 transition-colors">再次挑戰</button>
      </div>
    );
  }

  const q = questions[currentIdx];
  if (!q) return null;

  return (
    <div className="max-w-md mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <div className="h-2 flex-1 bg-slate-100 rounded-full mr-4 overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-700 ease-out" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
        </div>
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{currentIdx + 1} / {questions.length}</span>
      </div>

      <div className="bg-white rounded-[48px] p-12 shadow-sm border border-slate-50 text-center relative">
        <button onClick={() => speak(q.word.term)} className="absolute top-8 right-8 text-2xl opacity-20 hover:opacity-100 transition-opacity">🔊</button>
        <h2 className="text-5xl font-black text-slate-800 break-words leading-tight tracking-tighter">{q.word.term}</h2>
      </div>

      <div className="grid gap-3">
        {q.options.map((option, idx) => {
          let btnStyle = "w-full text-left p-6 rounded-[32px] border-2 transition-all font-bold text-sm ";
          if (selectedAnswer === null) btnStyle += "bg-white border-slate-50 hover:border-indigo-100";
          else if (idx === q.correctIndex) btnStyle += "bg-emerald-50 border-emerald-500 text-emerald-700";
          else if (idx === selectedAnswer) btnStyle += "bg-rose-50 border-rose-500 text-rose-700";
          else btnStyle += "bg-white border-slate-50 opacity-40";

          return (
            <button key={idx} disabled={selectedAnswer !== null} onClick={() => handleAnswer(idx)} className={btnStyle}>
              {option.definition}
            </button>
          );
        })}
      </div>

      {selectedAnswer !== null && (
        <button 
          onClick={() => currentIdx + 1 < questions.length ? (setCurrentIdx(prev => prev + 1), setSelectedAnswer(null)) : setIsFinished(true)} 
          className="w-full py-5 bg-slate-900 text-white rounded-[28px] font-black animate-in slide-in-from-bottom"
        >
          {currentIdx + 1 < questions.length ? '下一題' : '查看結果'}
        </button>
      )}
    </div>
  );
};

export default QuizView;
