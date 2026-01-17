
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// --- Types (整合至此) ---
export interface Word {
  id: string;
  term: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  project: string;
  example?: string;
  masteryLevel: number;
  learnedCount: number;
  lastReviewed?: number;
}

export type AppView = 'home' | 'flashcards' | 'quiz' | 'library' | 'import';

export interface QuizQuestion {
  word: Word;
  options: { definition: string; partOfSpeech: string }[];
  correctIndex: number;
}

// --- Services ---
const STORAGE_KEY = 'beibeibei_v2_data';

const defaultWords: Word[] = [
  { id: "d1", term: "Resilience", definition: "韌性、復原力", partOfSpeech: "n.", project: "核心詞彙", masteryLevel: 0, learnedCount: 0, phonetic: "/rɪˈzɪliəns/" },
  { id: "d2", term: "Abundance", definition: "豐富、充足", partOfSpeech: "n.", project: "核心詞彙", masteryLevel: 0, learnedCount: 0, phonetic: "/əˈbʌndəns/" },
  { id: "d3", term: "Cultivate", definition: "培養、耕作", partOfSpeech: "v.", project: "核心詞彙", masteryLevel: 0, learnedCount: 0, phonetic: "/ˈkʌltɪveɪt/" }
];

const apiService = {
  getWords: async (): Promise<Word[]> => {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) return JSON.parse(local);
    
    try {
      // 嘗試抓取外部 JSON，若失敗則回傳預設值
      const res = await fetch('./data/words.json').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn("Fetch failed, using defaults");
    }
    return defaultWords;
  },
  saveWords: (words: Word[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(words)),
  updateWord: async (updated: Word) => {
    const words = await apiService.getWords();
    const idx = words.findIndex(w => w.id === updated.id);
    if (idx !== -1) {
      words[idx] = { ...updated, lastReviewed: Date.now() };
      apiService.saveWords(words);
    }
  }
};

const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }
};

// --- Components ---

const Navbar: React.FC<{ currentView: AppView; setView: (v: AppView) => void }> = ({ currentView, setView }) => {
  const items: { id: AppView; label: string; icon: string }[] = [
    { id: 'home', label: '學習', icon: '🏠' },
    { id: 'library', label: '清單', icon: '📂' },
    { id: 'import', label: '新增', icon: '📥' },
  ];
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/90 backdrop-blur-xl border border-white shadow-2xl rounded-[32px] px-4 py-2 flex justify-around items-center z-50">
      {items.map((item) => {
        const active = currentView === item.id || (item.id === 'home' && (currentView === 'flashcards' || currentView === 'quiz'));
        return (
          <button key={item.id} onClick={() => setView(item.id)} className={`flex flex-col items-center p-2 rounded-2xl transition-all ${active ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[10px] font-bold mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

const FlashcardView: React.FC<{ words: Word[]; onFinish: () => void }> = ({ words, onFinish }) => {
  const [idx, setIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const current = words[idx];

  useEffect(() => { if (current) speak(current.term); }, [idx]);

  const handleLevel = async (delta: number) => {
    const nextLevel = Math.max(0, Math.min(5, (current.masteryLevel || 0) + delta));
    await apiService.updateWord({ ...current, masteryLevel: nextLevel });
    setIsFlipped(false);
    setTimeout(() => {
      if (idx < words.length - 1) setIdx(idx + 1);
      else onFinish();
    }, 250);
  };

  if (!current) return null;

  return (
    <div className="flex flex-col items-center gap-8 py-4 animate-in fade-in duration-500">
      <div className="w-full flex justify-between items-center text-slate-400 px-2 font-black text-[10px] uppercase tracking-widest">
        <button onClick={onFinish}>✕ 結束</button>
        <span>{idx + 1} / {words.length}</span>
      </div>
      <div className="w-full h-[450px] perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-transform duration-700 preserve-3d shadow-2xl rounded-[40px] ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute inset-0 bg-white rounded-[40px] flex flex-col items-center justify-center p-8 backface-hidden border border-slate-50">
            <h2 className="text-5xl font-black text-slate-800 text-center mb-4">{current.term}</h2>
            <p className="text-indigo-400 font-mono">{current.phonetic}</p>
            <p className="mt-12 text-slate-200 text-[10px] font-black uppercase tracking-widest">點擊翻面</p>
          </div>
          <div className="absolute inset-0 bg-indigo-600 rounded-[40px] flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180 text-white text-center">
            <span className="bg-white/20 px-3 py-1 rounded-lg text-[10px] font-black mb-4 uppercase">{current.partOfSpeech}</span>
            <h3 className="text-4xl font-bold leading-tight">{current.definition}</h3>
          </div>
        </div>
      </div>
      <div className="flex gap-4 w-full px-2">
        <button onClick={() => handleLevel(-1)} className="flex-1 py-5 bg-white border border-slate-100 rounded-[28px] font-black text-slate-300 hover:text-rose-500 active:scale-95 transition-all">不熟</button>
        <button onClick={() => handleLevel(1)} className="flex-1 py-5 bg-slate-900 text-white rounded-[28px] font-black shadow-xl hover:bg-indigo-600 active:scale-95 transition-all">記住了</button>
      </div>
    </div>
  );
};

const QuizView: React.FC<{ targetWords: Word[]; allWords: Word[]; onFinish: () => void }> = ({ targetWords, allWords, onFinish }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const shuffled = [...targetWords].sort(() => Math.random() - 0.5).slice(0, 10);
    const qData = shuffled.map(word => {
      const others = allWords.filter(w => w.definition !== word.definition).sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [...others, word].sort(() => Math.random() - 0.5).map(o => ({ definition: o.definition, partOfSpeech: o.partOfSpeech }));
      return { word, options, correctIndex: options.findIndex(o => o.definition === word.definition) };
    });
    setQuestions(qData);
  }, [targetWords, allWords]);

  const handleAnswer = async (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === questions[idx].correctIndex;
    const word = questions[idx].word;
    const nextLvl = correct ? Math.min(5, (word.masteryLevel || 0) + 1) : Math.max(0, (word.masteryLevel || 0) - 1);
    await apiService.updateWord({ ...word, masteryLevel: nextLvl });
  };

  if (!questions[idx]) return null;
  const q = questions[idx];

  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center text-slate-400 font-black text-[10px]">
        <button onClick={onFinish}>✕ 結束</button>
        <div className="flex-1 h-1 bg-slate-100 rounded-full mx-6 overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
        </div>
        <span>{idx + 1} / {questions.length}</span>
      </div>
      <div className="bg-white rounded-[40px] p-12 shadow-sm border border-slate-50 text-center relative">
        <button onClick={() => speak(q.word.term)} className="absolute top-6 right-6 text-xl opacity-20 hover:opacity-100 transition-opacity">🔊</button>
        <h2 className="text-4xl font-black text-slate-800 break-words">{q.word.term}</h2>
      </div>
      <div className="grid gap-3">
        {q.options.map((opt, i) => {
          let style = "w-full text-left p-6 rounded-[28px] border-2 font-bold text-sm transition-all ";
          if (selected === null) style += "bg-white border-slate-50 hover:border-indigo-100";
          else if (i === q.correctIndex) style += "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-100";
          else if (i === selected) style += "bg-rose-50 border-rose-500 text-rose-700";
          else style += "bg-white border-slate-50 opacity-40";
          return (
            <button key={i} disabled={selected !== null} onClick={() => handleAnswer(i)} className={style}>
              {opt.definition}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <button onClick={() => { if (idx < questions.length - 1) { setIdx(idx + 1); setSelected(null); } else onFinish(); }} className="w-full py-5 bg-slate-900 text-white rounded-[28px] font-black">
          {idx < questions.length - 1 ? '下一題' : '完成'}
        </button>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [importText, setImportText] = useState('');

  useEffect(() => {
    apiService.getWords().then(data => {
      setWords(data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const avgMastery = words.length ? (words.reduce((a, w) => a + (w.masteryLevel || 0), 0) / (words.length * 5)) : 0;

  const renderContent = () => {
    switch (view) {
      case 'flashcards': return <FlashcardView words={words} onFinish={() => setView('home')} />;
      case 'quiz': return <QuizView targetWords={words} allWords={words} onFinish={() => setView('home')} />;
      case 'library': return (
        <div className="space-y-6 pb-24 animate-in fade-in duration-300">
          <h2 className="text-3xl font-black text-slate-800">單字清單</h2>
          <div className="grid gap-3">
            {words.map(w => (
              <div key={w.id} className="bg-white p-5 rounded-[28px] shadow-sm flex justify-between items-center group">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-800">{w.term}</span>
                    <button onClick={() => speak(w.term)} className="text-slate-200 group-hover:text-indigo-400">🔊</button>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">{w.definition}</p>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < (w.masteryLevel || 0) ? 'bg-indigo-500' : 'bg-slate-100'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      case 'import': return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl">
            <h2 className="text-2xl font-black mb-1">匯入新單字</h2>
            <p className="text-slate-400 text-xs mb-8">格式：單字 翻譯（每行一個）</p>
            <textarea className="w-full h-48 p-6 rounded-3xl bg-white/10 border-none text-white font-mono text-sm mb-6" placeholder="apple 蘋果&#10;banana 香蕉" value={importText} onChange={e => setImportText(e.target.value)} />
            <button onClick={async () => {
              const lines = importText.split('\n').filter(l => l.trim());
              const newWords: Word[] = lines.map(l => {
                const parts = l.split(/\s+/);
                return { id: Math.random().toString(36).substr(2, 9), term: parts[0], definition: parts.slice(1).join(' '), partOfSpeech: 'n.', project: '自定義', masteryLevel: 0, learnedCount: 0 };
              });
              if (newWords.length) {
                const all = [...words, ...newWords];
                apiService.saveWords(all);
                setWords(all);
                setImportText('');
                alert(`成功新增 ${newWords.length} 個單字`);
                setView('home');
              }
            }} className="w-full py-5 bg-indigo-600 rounded-2xl font-black shadow-xl">開始匯入</button>
          </div>
        </div>
      );
      default: return (
        <div className="space-y-8 pb-24 animate-in fade-in duration-300">
          <header className="bg-indigo-600 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-2xl font-black mb-2">準備好學習了嗎？</h1>
              <p className="text-indigo-200 text-xs font-medium mb-8">目前掌握進度：{(avgMastery * 100).toFixed(0)}%</p>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${avgMastery * 100}%` }} />
              </div>
            </div>
          </header>
          <div className="grid gap-4">
            <button onClick={() => setView('flashcards')} className="flex items-center gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-slate-50 active:scale-95 transition-all">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl">🗂️</div>
              <div className="text-left">
                <h4 className="font-black text-slate-800">單字卡練習</h4>
                <p className="text-slate-400 text-xs font-medium">翻轉式記憶</p>
              </div>
            </button>
            <button onClick={() => setView('quiz')} className="flex items-center gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-slate-50 active:scale-95 transition-all">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl">🎯</div>
              <div className="text-left">
                <h4 className="font-black text-slate-800">挑戰小測驗</h4>
                <p className="text-slate-400 text-xs font-medium">檢驗學習成效</p>
              </div>
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto p-4 pt-10">
      {renderContent()}
      <Navbar currentView={view} setView={setView} />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
