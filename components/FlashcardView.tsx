
import React, { useState, useEffect } from 'react';
import { Word, Phrase } from '../types';
import { speak } from '../services/ttsService';

interface FlashcardViewProps {
  words: Word[];
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ words }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Requirement: Auto-speak ONLY the English word term on card change
  useEffect(() => {
    if (words.length > 0) {
      speak(words[currentIndex].term);
    }
  }, [currentIndex, words]);

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <span className="text-6xl mb-4">📭</span>
        <p className="text-lg font-bold">目前沒有單字</p>
        <p className="text-sm">請前往「匯入」頁面增加新單字。</p>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % words.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
  };

  return (
    <div className="max-w-lg mx-auto p-4 flex flex-col items-center gap-6">
      <div className="w-full flex justify-between items-center text-slate-400 text-[10px] font-black tracking-[0.2em] uppercase">
        <span>Learning Session</span>
        <span className="bg-white border border-slate-100 px-3 py-1 rounded-full shadow-sm text-indigo-600">
          {currentIndex + 1} / {words.length}
        </span>
      </div>

      <div 
        className="w-full h-[580px] perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front Card */}
          <div className="absolute inset-0 bg-white rounded-[48px] shadow-2xl flex flex-col items-center justify-center p-10 backface-hidden border border-slate-100">
            <button 
              onClick={(e) => { e.stopPropagation(); speak(currentWord.term); }}
              className="absolute top-10 right-10 w-16 h-16 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 rounded-full transition-all text-3xl shadow-sm active:scale-90"
              title="再次聆讀單字 (僅英文)"
            >
              🔊
            </button>
            <h2 className="text-6xl font-black text-slate-800 text-center break-words w-full tracking-tighter mb-4">
              {currentWord.term}
            </h2>
            {currentWord.phonetic && (
              <p className="text-indigo-400 font-mono text-2xl bg-indigo-50/50 px-5 py-2 rounded-2xl">{currentWord.phonetic}</p>
            )}
            <div className="mt-24 text-center">
              <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">點擊查看釋義</p>
            </div>
          </div>

          {/* Back Card */}
          <div className="absolute inset-0 bg-indigo-600 rounded-[48px] shadow-2xl flex flex-col p-8 backface-hidden rotate-y-180 text-white overflow-hidden">
            <div className="overflow-y-auto pr-2 custom-scrollbar h-full space-y-6">
              <div className="flex items-start gap-3">
                <span className="mt-1 bg-white/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                  {currentWord.partOfSpeech}
                </span>
                <h3 className="text-4xl font-black tracking-tight leading-tight">{currentWord.definition}</h3>
              </div>
              
              {currentWord.inflections && (
                <div className="bg-white/10 p-5 rounded-3xl border border-white/5">
                  <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-2 opacity-70">詞形變化</p>
                  <p className="text-base font-bold tracking-wide">{currentWord.inflections}</p>
                </div>
              )}

              {currentWord.phrases && currentWord.phrases.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest px-1 opacity-70">相關片語與搭配</p>
                  <div className="grid gap-3">
                    {currentWord.phrases.map((p, i) => (
                      <div key={i} className="bg-black/10 p-5 rounded-3xl hover:bg-black/20 transition-all group relative">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-black text-lg text-white">"{p.text}"</span>
                          <span className="text-indigo-200 text-xs font-bold">{p.meaning}</span>
                        </div>
                        {p.example && (
                          <div className="mt-3 text-sm border-l-2 border-indigo-400/40 pl-4 flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <p className="italic text-indigo-50 leading-relaxed">{p.example}</p>
                              {p.exampleTranslation && <p className="text-[11px] text-indigo-300 mt-2 font-medium">{p.exampleTranslation}</p>}
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); speak(p.example || ''); }}
                              className="mt-1 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all shrink-0"
                              title="朗讀片語例句"
                            >
                              <span className="text-[10px]">🔊</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(currentWord.example || currentWord.exampleTranslation) && (
                <div className="pt-6 border-t border-white/10">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest opacity-70">主要用法例句</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); speak(currentWord.example || ''); }}
                      className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all shadow-sm"
                      title="朗讀主例句"
                    >
                      <span className="text-xs">🔊</span>
                    </button>
                  </div>
                  <div className="bg-indigo-700/50 p-6 rounded-[32px] border border-white/5">
                    <p className="text-xl italic leading-relaxed font-serif text-white">
                      {currentWord.example}
                    </p>
                    {currentWord.exampleTranslation && (
                      <p className="text-sm text-indigo-200 mt-4 font-medium border-t border-white/10 pt-4">
                        {currentWord.exampleTranslation}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {currentWord.notes && (
                <div className="bg-black/20 p-5 rounded-3xl text-[12px] leading-relaxed text-indigo-100 border border-white/5">
                  <span className="font-black opacity-50 uppercase mr-2 tracking-tighter">學習筆記:</span>
                  {currentWord.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 w-full px-2">
        <button 
          onClick={handlePrev}
          className="flex-1 py-5 bg-white border border-slate-200 rounded-[32px] font-black text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
        >
          <span>←</span> 上一個
        </button>
        <button 
          onClick={handleNext}
          className="flex-1 py-5 bg-indigo-600 rounded-[32px] font-black text-white hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2"
        >
          下一個 <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default FlashcardView;
