
import React, { useState } from 'react';
import { Word } from '../types';

interface HomeViewProps {
  words: Word[];
  onStartStudy: (view: 'flashcards' | 'quiz', filteredWords: Word[]) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ words, onStartStudy }) => {
  const projects = Array.from(new Set(words.map(w => w.project || '未分類')));
  const [selectedProjects, setSelectedProjects] = useState<string[]>(projects);
  const [excludeMastered, setExcludeMastered] = useState(false);

  const filteredWords = words
    .filter(w => selectedProjects.includes(w.project || '未分類'))
    .filter(w => excludeMastered ? (w.masteryLevel || 0) < 5 : true);

  // 計算整體進度但不顯示具體數字
  const averageMastery = words.length > 0 
    ? (words.reduce((acc, w) => acc + (w.masteryLevel || 0), 0) / (words.length * 5))
    : 0;

  return (
    <div className="space-y-8 pb-10">
      <section className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-black mb-1">你好！今天想學點什麼？</h1>
          <p className="text-slate-400 text-xs font-medium mb-8">專注於當下的學習，進度交給我們默默記錄。</p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span>學習路徑</span>
              <span>{averageMastery > 0.8 ? '非常出色！' : '穩步前進中'}</span>
            </div>
            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-1000 ease-out" 
                style={{ width: `${averageMastery * 100}%` }}
              />
            </div>
          </div>
        </div>
        {/* 裝飾性背景元素 */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl"></div>
      </section>

      <div className="space-y-4 px-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800">單字集</h3>
          <button 
            onClick={() => setExcludeMastered(!excludeMastered)} 
            className={`text-xs font-bold transition-colors ${excludeMastered ? 'text-indigo-500' : 'text-slate-300'}`}
          >
            {excludeMastered ? '已過濾熟練項' : '顯示所有'}
          </button>
        </div>
        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
          {projects.map(proj => {
            const isSelected = selectedProjects.includes(proj);
            const projWords = words.filter(w => w.project === proj);
            const projMastery = projWords.length > 0 
              ? (projWords.reduce((acc, w) => acc + (w.masteryLevel || 0), 0) / (projWords.length * 5))
              : 0;

            return (
              <button 
                key={proj} 
                onClick={() => setSelectedProjects(prev => prev.includes(proj) ? prev.filter(p => p !== proj) : [...prev, proj])} 
                className={`flex-shrink-0 px-6 py-5 rounded-[32px] border-2 transition-all ${
                  isSelected ? 'border-indigo-600 bg-white shadow-lg text-indigo-600' : 'border-transparent bg-white text-slate-300'
                }`}
              >
                <div className="font-black text-sm mb-1">{proj}</div>
                <div className="w-12 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-indigo-400" style={{ width: `${projMastery * 100}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 px-2">
        <button 
          disabled={filteredWords.length === 0} 
          onClick={() => onStartStudy('flashcards', filteredWords)} 
          className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-50 flex items-center gap-6 active:scale-95 transition-all disabled:opacity-50"
        >
          <div className="w-16 h-16 bg-amber-50 rounded-[24px] flex items-center justify-center text-3xl">🗂️</div>
          <div className="text-left">
            <h3 className="text-xl font-black">單字卡練習</h3>
            <p className="text-slate-400 text-xs font-medium">看一看、聽一聽</p>
          </div>
        </button>
        <button 
          disabled={filteredWords.length < 4} 
          onClick={() => onStartStudy('quiz', filteredWords)} 
          className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-50 flex items-center gap-6 active:scale-95 transition-all disabled:opacity-50"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-[24px] flex items-center justify-center text-3xl">🎯</div>
          <div className="text-left">
            <h3 className="text-xl font-black">自我挑戰</h3>
            <p className="text-slate-400 text-xs font-medium">隨機小測驗</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default HomeView;
