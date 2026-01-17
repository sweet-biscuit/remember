
import React, { useState, useEffect, useCallback } from 'react';
import { Word, QuizQuestion, QuizOption } from '../types';
import { speak } from '../services/ttsService';

interface QuizViewProps {
  targetWords: Word[]; // 選擇範圍內的單字 (題目來源)
  allWords: Word[];    // 所有單字 (干擾項來源)
}

const QuizView: React.FC<QuizViewProps> = ({ targetWords, allWords }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const generateQuiz = useCallback(() => {
    if (targetWords.length === 0) return;
    
    // 隨機選出最多 10 個單字作為題目
    const shuffledTargets = [...targetWords].sort(() => Math.random() - 0.5).slice(0, 10);
    
    const quizItems: QuizQuestion[] = shuffledTargets.map(word => {
      // 1. 從「全體單字」中找出所有定義不同的單字作為干擾項候選
      // 這樣就能包含「別的不認識專案」的中文
      const otherWordsPool = allWords.filter(w => w.definition !== word.definition);
      
      // 2. 確保干擾項定義不重複
      const distractorsMap = new Map<string, QuizOption>();
      otherWordsPool.forEach(w => {
        distractorsMap.set(w.definition, { 
          definition: w.definition, 
          partOfSpeech: w.partOfSpeech 
        });
      });
      
      const uniqueDistractorsPool = Array.from(distractorsMap.values());

      // 3. 隨機選 3 個干擾項
      const selectedDistractors = uniqueDistractorsPool
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      const correctOption: QuizOption = { 
        definition: word.definition, 
        partOfSpeech: word.partOfSpeech 
      };
      
      // 4. 合併並隨機排序
      const options = [...selectedDistractors, correctOption].sort(() => Math.random() - 0.5);
      const correctIndex = options.findIndex(opt => opt.definition === word.definition);
      
      return { word, options, correctIndex };
    });

    setQuestions(quizItems);
    setCurrentIdx(0);
    setScore(0);
    setIsFinished(false);
    setSelectedAnswer(null);
  }, [targetWords, allWords]);

  useEffect(() => {
    generateQuiz();
  }, [generateQuiz]);

  useEffect(() => {
    if (questions.length > 0 && questions[currentIdx] && !isFinished) {
      speak(questions[currentIdx].word.term);
    }
  }, [currentIdx, questions, isFinished]);

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (index === questions[currentIdx].correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  const getPosBadgeClass = (pos: string) => {
    const p = pos.toLowerCase();
    if (p.includes('n.')) return 'bg-blue-100 text-blue-700';
    if (p.includes('v.')) return 'bg-green-100 text-green-700';
    if (p.includes('adj.')) return 'bg-amber-100 text-amber-700';
    if (p.includes('adv.')) return 'bg-purple-100 text-purple-700';
    return 'bg-slate-100 text-slate-600';
  };

  if (isFinished) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-[40px] p-10 shadow-xl text-center border border-slate-100 animate-in zoom-in duration-300">
        <h2 className="text-3xl font-black text-slate-800 mb-4">挑戰結束！</h2>
        <div className="text-7xl mb-6">🎯</div>
        <p className="text-lg text-slate-600 mb-8 font-medium">
          得分：<span className="text-5xl font-black text-indigo-600">{score}</span> / {questions.length}
        </p>
        <button 
          onClick={generateQuiz}
          className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          重新挑戰
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  if (!currentQuestion) return null;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center px-2">
        <div className="h-2 flex-1 bg-slate-100 rounded-full mr-4 overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-black text-slate-400 tabular-nums">{currentIdx + 1} / {questions.length}</span>
      </div>

      <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 relative group">
        <div className="absolute top-6 right-6">
          <button 
            onClick={() => speak(currentQuestion.word.term)} 
            className="w-12 h-12 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full transition-all group-hover:scale-110 shadow-sm"
          >
            🔊
          </button>
        </div>
        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">Quiz Time</p>
        <h2 className="text-5xl font-black text-slate-800 break-words leading-tight">{currentQuestion.word.term}</h2>
      </div>

      <div className="grid gap-3">
        {currentQuestion.options.map((option, idx) => {
          let buttonClass = "w-full text-left p-5 rounded-[24px] border-2 transition-all flex items-center gap-4 group ";
          if (selectedAnswer === null) {
            buttonClass += "border-slate-50 bg-white hover:border-indigo-200 hover:shadow-md text-slate-700";
          } else if (idx === currentQuestion.correctIndex) {
            buttonClass += "border-green-500 bg-green-50 text-green-700";
          } else if (idx === selectedAnswer) {
            buttonClass += "border-red-500 bg-red-50 text-red-700";
          } else {
            buttonClass += "border-slate-50 opacity-40 text-slate-300";
          }

          return (
            <button
              key={idx}
              disabled={selectedAnswer !== null}
              onClick={() => handleAnswer(idx)}
              className={buttonClass}
            >
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase shrink-0 ${getPosBadgeClass(option.partOfSpeech)}`}>
                {option.partOfSpeech}
              </span>
              <span className="font-bold text-lg leading-tight flex-1">{option.definition}</span>
              {selectedAnswer !== null && idx === currentQuestion.correctIndex && (
                <span className="text-green-500 font-bold text-xl">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedAnswer !== null && (
        <button 
          onClick={nextQuestion}
          className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl animate-in fade-in slide-in-from-top-2"
        >
          {currentIdx + 1 === questions.length ? '查看結果' : '下一題'}
          <span className="text-xl">→</span>
        </button>
      )}
    </div>
  );
};

export default QuizView;
