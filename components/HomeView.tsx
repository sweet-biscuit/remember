
import React, { useState } from 'react';
import { Word } from '../types';

interface HomeViewProps {
  words: Word[];
  onStartStudy: (view: 'flashcards' | 'quiz', filteredWords: Word[]) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ words, onStartStudy }) => {
  const projects: string[] = Array.from(new Set(words.map(w => w.project || '未分類')));
  const [selectedProjects, setSelectedProjects] = useState<string[]>(projects);
  const [excludeMastered, setExcludeMastered] = useState(false);

  const toggleProject = (proj: string) => {
    setSelectedProjects(prev => 
      prev.includes(proj) ? prev.filter(p => p !== proj) : [...prev, proj]
    );
  };

  const filteredWords = words
    .filter(w => selectedProjects.includes(w.project || '未分類'))
    .filter(w => excludeMastered ? !w.isMastered : true);

  const masteredCount = words.filter(w => w.isMastered).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <section className="bg-indigo-600 rounded-[48px] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-1">Hello! 👋</h1>
          <p className="text-indigo-100 text-sm font-medium opacity-80 mb-6">準備好開始學習了嗎？</p>
          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 flex-1 border border-white/10">
              <span className="block text-3xl font-black tabular-nums">{words.length}</span>
              <span className="text-[8px] text-indigo-200 uppercase font-black tracking-widest">總單字</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 flex-1 border border-white/10">
              <span className="block text-3xl font-black tabular-nums">{masteredCount}</span>
              <span className="text-[8px] text-indigo-200 uppercase font-black tracking-widest">已掌握</span>
            </div>
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-400 rounded-full blur-[80px] opacity-40 animate-pulse"></div>
      </section>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-md font-black text-slate-800">1. 選擇練習範圍</h3>
          <div className="flex gap-4">
            <button 
              onClick={() => setExcludeMastered(!excludeMastered)}
              className={`text-xs font-bold transition-colors ${excludeMastered ? 'text-amber-500' : 'text-slate-400'}`}
            >
              {excludeMastered ? '已排除掌握項' : '包含掌握項'}
            </button>
            <button 
              onClick={() => setSelectedProjects(selectedProjects.length === projects.length ? [] : projects)}
              className="text-xs font-bold text-indigo-600"
            >
              {selectedProjects.length === projects.length ? '取消' : '全選'}
            </button>
          </div>
        </div>
        
        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar px-2">
          {projects.length > 0 ? projects.map(proj => {
            const count = words.filter(w => (w.project || '未分類') === proj).length;
            const isSelected = selectedProjects.includes(proj);
            return (
              <button
                key={proj}
                onClick={() => toggleProject(proj)}
                className={`flex-shrink-0 px-6 py-4 rounded-[24px] border-2 transition-all ${
                  isSelected 
                    ? 'border-indigo-600 bg-white text-indigo-600 shadow-md' 
                    : 'border-white bg-white text-slate-300'
                }`}
              >
                <div className="font-black text-sm whitespace-nowrap mb-1">{proj}</div>
                <span className="text-[10px] font-bold opacity-60">{count} Words</span>
              </button>
            );
          }) : (
            <div className="w-full py-12 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100 text-slate-400 text-xs font-bold italic">
              尚未建立任何專案
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="text-md font-black text-slate-800 px-2">2. 學習模式</h3>
        <button 
          disabled={filteredWords.length === 0}
          onClick={() => onStartStudy('flashcards', filteredWords)}
          className="group bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 flex items-center gap-6 active:scale-95 transition-all disabled:opacity-50"
        >
          <div className="w-16 h-16 bg-amber-50 rounded-[20px] flex items-center justify-center text-3xl shrink-0">🗂️</div>
          <div className="text-left">
            <h3 className="text-xl font-black text-slate-800">單字卡模式</h3>
            <p className="text-slate-400 text-xs font-medium">翻轉記憶．{filteredWords.length} 個單字</p>
          </div>
          <div className="ml-auto text-slate-200 font-black text-2xl">→</div>
        </button>

        <button 
          disabled={filteredWords.length < 4}
          onClick={() => onStartStudy('quiz', filteredWords)}
          className="group bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 flex items-center gap-6 active:scale-95 transition-all disabled:opacity-50"
        >
          <div className="w-16 h-16 bg-green-50 rounded-[20px] flex items-center justify-center text-3xl shrink-0">✍️</div>
          <div className="text-left">
            <h3 className="text-xl font-black text-slate-800">挑戰測驗</h3>
            <p className="text-slate-400 text-xs font-medium">混合干擾．{filteredWords.length < 4 ? '需至少 4 個單字' : '馬上開始'}</p>
          </div>
          <div className="ml-auto text-slate-200 font-black text-2xl">→</div>
        </button>
      </div>
    </div>
  );
};

export default HomeView;
