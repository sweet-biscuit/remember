
import React, { useState, useEffect } from 'react';
import { Word } from '../types';
import { speak } from '../services/ttsService';
import { apiService } from '../services/storageService';

interface FlashcardViewProps {
  words: Word[];
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ words }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [localWords, setLocalWords] = useState<Word[]>(words);

  useEffect(() => {
    if (localWords.length > 0) {
      speak(localWords[currentIndex].term);
    }
  }, [currentIndex, localWords]);

  if (localWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <span className="text-6xl mb-4 text-slate-200">📭</span>
        <p className="text-lg font-bold">目前沒有可練習的單字</p>
      </div>
    );
  }

  const currentWord = localWords[currentIndex];

  const updateMastery = async (delta: number) => {
    const newLevel = Math.max(0, Math.min(5, (currentWord.masteryLevel || 0) + delta));
    const updatedWord = { 
      ...currentWord, 
      masteryLevel: newLevel,
      isMastered: newLevel === 5,
      lastReviewed: Date.now()
    };
    
    await apiService.updateWord(updatedWord);
    
    // 更新本地狀態
    const newList = [...localWords];
    newList[currentIndex] = updatedWord;
    setLocalWords(newList);

    // 自動切換下一張
    setTimeout(() => {
      setIsFlipped(false);
      setCurrentIndex((prev) => (prev + 1) % localWords.length);
    }, 250);
  };

  return (
    <div className="max-w-lg mx-auto p-4 flex flex-col items-center gap-6">
      <div className="w-full flex justify-between items-center px-4">
        <span className="text-slate-400 text-[10px] font-black tracking-widest uppercase">練習中</span>
        <span className="bg-white border border-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400">
          {currentIndex + 1} / {localWords.length}
        </span>
      </div>

      <div className="w-full h-[500px] perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 bg-white rounded-[48px] shadow-2xl flex flex-col items-center justify-center p-10 backface-hidden border border-slate-100">
            <h2 className="text-5xl font-black text-slate-800 text-center tracking-tighter mb-4">{currentWord.term}</h2>
            {currentWord.phonetic && <p className="text-indigo-400 font-mono text-xl bg-indigo-50 px-4 py-1 rounded-xl">{currentWord.phonetic}</p>}
            <p className="mt-16 text-slate-300 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">點擊翻面</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 bg-indigo-600 rounded-[48px] shadow-2xl flex flex-col p-12 backface-hidden rotate-y-180 text-white overflow-hidden justify-center items-center text-center">
            <div className="space-y-6">
              <span className="bg-white/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{currentWord.partOfSpeech}</span>
              <h3 className="text-4xl font-black leading-tight">{currentWord.definition}</h3>
              {currentWord.example && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="italic text-white/70 text-sm leading-relaxed">"{currentWord.example}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 w-full px-2">
        <button 
          onClick={(e) => { e.stopPropagation(); updateMastery(-1); }}
          className="flex-1 py-5 bg-white border border-slate-100 rounded-[32px] font-black text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-95"
        >
          還不太熟
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); updateMastery(1); }}
          className="flex-1 py-5 bg-slate-900 rounded-[32px] font-black text-white shadow-xl hover:bg-indigo-600 transition-all active:scale-95"
        >
          記住了！
        </button>
      </div>
    </div>
  );
};

export default FlashcardView;
