
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// --- 全域定義 ---
interface Word {
  id: string;
  term: string;
  definition: string;
  phonetic?: string;
  partOfSpeech: string;
  project: string;
  masteryLevel: number;
}

type AppView = 'home' | 'flashcards' | 'quiz' | 'library' | 'import';

const STORAGE_KEY = 'beibeibei_v3_local';

const defaultWords: Word[] = [
  { id: "d1", term: "Resilience", definition: "韌性、復原力", partOfSpeech: "n.", project: "核心詞彙", masteryLevel: 0, phonetic: "/rɪˈzɪliəns/" },
  { id: "d2", term: "Abundance", definition: "豐富、充足", partOfSpeech: "n.", project: "核心詞彙", masteryLevel: 0, phonetic: "/əˈbʌndəns/" },
  { id: "d3", term: "Serendipity", definition: "意外發現的好運", partOfSpeech: "n.", project: "精選單字", masteryLevel: 0, phonetic: "/ˌserənˈdɪpəti/" }
];

// --- 工具函數 ---
const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }
};

// --- 組件: 導覽列 ---
const Navbar: React.FC<{ currentView: AppView; setView: (v: AppView) => void }> = ({ currentView, setView }) => {
  const items: { id: AppView; label: string; icon: string }[] = [
    { id: 'home', label: '學習', icon: '🏠' },
    { id: 'library', label: '庫存', icon: '📂' },
    { id: 'import', label: '新增', icon: '📥' },
  ];
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-[32px] px-2 py-2 flex justify-around items-center z-50">
      {items.map((item) => {
        const active = currentView === item.id || (item.id === 'home' && (currentView === 'flashcards' || currentView === 'quiz'));
        return (
          <button key={item.id} onClick={() => setView(item.id)} className={`flex flex-col items-center py-2 px-4 rounded-2xl transition-all ${active ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
            <span className="text-2xl">{item.icon}</span>
            <span className={`text-[10px] font-bold mt-1 transition-opacity ${active ? 'opacity-100' : 'opacity-0 h-0'}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

// --- 組件: 單字卡練習 ---
const FlashcardView: React.FC<{ words: Word[]; onFinish: () => void; onUpdate: (w: Word) => void }> = ({ words, onFinish, onUpdate }) => {
  const [idx, setIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const current = words[idx];

  useEffect(() => { if (current) speak(current.term); }, [idx, current]);

  const handleLevel = (delta: number) => {
    const nextLevel = Math.max(0, Math.min(5, (current.masteryLevel || 0) + delta));
    onUpdate({ ...current, masteryLevel: nextLevel });
    setIsFlipped(false);
    setTimeout(() => {
      if (idx < words.length - 1) setIdx(idx + 1);
      else onFinish();
    }, 250);
  };

  if (!current) return <div className="p-10 text-center">沒有單字可供練習</div>;

  return (
    <div className="flex flex-col items-center gap-8 py-4 animate-in fade-in duration-500">
      <div className="w-full flex justify-between items-center text-slate-400 px-2 font-black text-[10px] uppercase tracking-widest">
        <button onClick={onFinish} className="hover:text-slate-800 transition-colors">✕ 離開</button>
        <span className="bg-white px-3 py-1 rounded-full border border-slate-100">{idx + 1} / {words.length}</span>
      </div>
      <div className="w-full h-[450px] perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-transform duration-700 preserve-3d shadow-2xl rounded-[40px] ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute inset-0 bg-white rounded-[40px] flex flex-col items-center justify-center p-8 backface-hidden border border-slate-50">
            <h2 className="text-5xl font-black text-slate-800 text-center mb-4 tracking-tighter break-words w-full">{current.term}</h2>
            {current.phonetic && <p className="text-indigo-400 font-mono text-lg bg-indigo-50 px-4 py-1 rounded-xl">{current.phonetic}</p>}
            <p className="mt-16 text-slate-200 text-[10px] font-black uppercase tracking-[0.4em]">點擊翻面</p>
          </div>
          <div className="absolute inset-0 bg-indigo-600 rounded-[40px] flex flex-col items-center justify-center p-10 backface-hidden rotate-y-180 text-white text-center">
            <span className="bg-white/20 px-3 py-1 rounded-lg text-[10px] font-black mb-4 uppercase">{current.partOfSpeech}</span>
            <h3 className="text-3xl font-bold leading-tight">{current.definition}</h3>
          </div>
        </div>
      </div>
      <div className="flex gap-4 w-full px-2">
        <button onClick={() => handleLevel(-1)} className="flex-1 py-5 bg-white border border-slate-100 rounded-[28px] font-black text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:scale-95 transition-all">不熟</button>
        <button onClick={() => handleLevel(1)} className="flex-1 py-5 bg-slate-900 text-white rounded-[28px] font-black shadow-xl hover:bg-indigo-600 active:scale-95 transition-all">記住了</button>
      </div>
    </div>
  );
};

// --- 組件: 小測驗 ---
const QuizView: React.FC<{ targetWords: Word[]; allWords: Word[]; onFinish: () => void; onUpdate: (w: Word) => void }> = ({ targetWords, allWords, onFinish, onUpdate }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const shuffled = [...targetWords].sort(() => Math.random() - 0.5).slice(0, 10);
    const qData = shuffled.map(word => {
      const others = allWords.filter(w => w.definition !== word.definition).sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [...others, word].sort(() => Math.random() - 0.5);
      return { word, options, correctIndex: options.findIndex(o => o.id === word.id) };
    });
    setQuestions(qData);
  }, [targetWords, allWords]);

  const handleAnswer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === questions[idx].correctIndex;
    const word = questions[idx].word;
    const nextLvl = correct ? Math.min(5, (word.masteryLevel || 0) + 1) : Math.max(0, (word.masteryLevel || 0) - 1);
    onUpdate({ ...word, masteryLevel: nextLvl });
  };

  if (!questions[idx]) return null;
  const q = questions[idx];

  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center text-slate-400 font-black text-[10px]">
        <button onClick={onFinish} className="hover:text-slate-800 transition-colors uppercase tracking-widest">✕ 結束測驗</button>
        <div className="flex-1 h-1 bg-slate-100 rounded-full mx-6 overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
        </div>
        <span>{idx + 1} / {questions.length}</span>
      </div>
      <div className="bg-white rounded-[40px] p-12 shadow-sm border border-slate-100 text-center relative">
        <button onClick={() => speak(q.word.term)} className="absolute top-6 right-6 text-xl opacity-20 hover:opacity-100 transition-opacity">🔊</button>
        <h2 className="text-4xl font-black text-slate-800 break-words tracking-tight leading-tight">{q.word.term}</h2>
      </div>
      <div className="grid gap-3">
        {q.options.map((opt: Word, i: number) => {
          let style = "w-full text-left p-6 rounded-[28px] border-2 font-bold text-sm transition-all ";
          if (selected === null) style += "bg-white border-slate-50 hover:border-indigo-100";
          else if (i === q.correctIndex) style += "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm";
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
        <button onClick={() => { if (idx < questions.length - 1) { setIdx(idx + 1); setSelected(null); } else onFinish(); }} className="w-full py-5 bg-slate-900 text-white rounded-[28px] font-black shadow-lg">
          {idx < questions.length - 1 ? '下一題' : '完成'}
        </button>
      )}
    </div>
  );
};

// --- 主程式 ---
const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [importText, setImportText] = useState('');

  // 載入資料
  useEffect(() => {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      try {
        setWords(JSON.parse(local));
      } catch (e) {
        setWords(defaultWords);
      }
    } else {
      setWords(defaultWords);
    }
    setLoading(false);
  }, []);

  const saveWords = (newWords: Word[]) => {
    setWords(newWords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newWords));
  };

  const handleUpdateWord = (updated: Word) => {
    const newWords = words.map(w => w.id === updated.id ? updated : w);
    saveWords(newWords);
  };

  if (loading) return null;

  const avgMastery = words.length ? (words.reduce((a, w) => a + (w.masteryLevel || 0), 0) / (words.length * 5)) : 0;

  const renderContent = () => {
    switch (view) {
      case 'flashcards': return <FlashcardView words={words} onFinish={() => setView('home')} onUpdate={handleUpdateWord} />;
      case 'quiz': return <QuizView targetWords={words} allWords={words} onFinish={() => setView('home')} onUpdate={handleUpdateWord} />;
      case 'library': return (
        <div className="space-y-6 pb-24 animate-in fade-in duration-300">
          <header className="flex justify-between items-center">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">所有單字</h2>
            <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 uppercase">{words.length} 字</span>
          </header>
          <div className="grid gap-3">
            {words.map(w => (
              <div key={w.id} className="bg-white p-5 rounded-[28px] shadow-sm flex justify-between items-center group border border-slate-100 hover:border-indigo-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-800">{w.term}</span>
                    <button onClick={() => speak(w.term)} className="text-slate-200 group-hover:text-indigo-400 transition-colors p-1">🔊</button>
                  </div>
                  <p className="text-xs text-slate-400 font-medium truncate">{w.definition}</p>
                </div>
                <div className="flex gap-1 ml-4">
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
          <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl">
            <h2 className="text-2xl font-black mb-1">匯入新單字</h2>
            <p className="text-slate-400 text-xs mb-8">每一行一個：單字 翻譯</p>
            <textarea className="w-full h-48 p-6 rounded-3xl bg-white/10 border-none text-white font-mono text-sm mb-6 focus:ring-2 ring-indigo-500 outline-none placeholder:text-slate-600" placeholder="apple 蘋果&#10;banana 香蕉" value={importText} onChange={e => setImportText(e.target.value)} />
            <button onClick={() => {
              const lines = importText.split('\n').filter(l => l.trim());
              const newEntries: Word[] = lines.map(l => {
                const parts = l.trim().split(/\s+/);
                return { 
                  id: Math.random().toString(36).substring(2, 9), 
                  term: parts[0], 
                  definition: parts.slice(1).join(' ') || '未定義', 
                  partOfSpeech: 'n.', 
                  project: '我的匯入', 
                  masteryLevel: 0 
                };
              });
              if (newEntries.length) {
                saveWords([...words, ...newEntries]);
                setImportText('');
                setView('home');
              }
            }} className="w-full py-5 bg-indigo-600 rounded-2xl font-black shadow-xl active:scale-95 transition-all">確認匯入</button>
          </div>
        </div>
      );
      default: return (
        <div className="space-y-8 pb-24 animate-in fade-in duration-300">
          <header className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl font-black mb-2 leading-tight tracking-tight">你好！今天<br/>要背幾個字？</h1>
              <p className="text-indigo-200 text-xs font-medium mb-8">目前的總進度：{(avgMastery * 100).toFixed(0)}%</p>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-1000 ease-out" style={{ width: `${avgMastery * 100}%` }} />
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" />
          </header>
          <div className="grid gap-4">
            <button onClick={() => setView('flashcards')} className="flex items-center gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 active:scale-95 transition-all text-left">
              <div className="w-16 h-16 bg-amber-50 rounded-[24px] flex items-center justify-center text-3xl">🗂️</div>
              <div>
                <h4 className="font-black text-slate-800 text-lg">單字卡練習</h4>
                <p className="text-slate-400 text-xs font-medium">翻轉聯想記憶</p>
              </div>
            </button>
            <button onClick={() => setView('quiz')} className="flex items-center gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 active:scale-95 transition-all text-left">
              <div className="w-16 h-16 bg-emerald-50 rounded-[24px] flex items-center justify-center text-3xl">🎯</div>
              <div>
                <h4 className="font-black text-slate-800 text-lg">隨堂小測驗</h4>
                <p className="text-slate-400 text-xs font-medium">檢測學習效果</p>
              </div>
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto p-4 pt-8 relative pb-20">
      {renderContent()}
      <Navbar currentView={view} setView={setView} />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
