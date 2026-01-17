
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Word, AppView, QuizQuestion } from './types';

// --- Services ---

const STORAGE_KEY = 'beibeibei_words_v2';

const defaultData: Word[] = [
  {
    id: "init-1",
    term: "Enthusiasm",
    phonetic: "/ɪnˈθuːziæzəm/",
    partOfSpeech: "n.",
    definition: "熱情，熱忱",
    project: "基礎必備",
    example: "She has a great enthusiasm for learning new things.",
    masteryLevel: 0,
    learnedCount: 0
  },
  {
    id: "init-2",
    term: "Serendipity",
    phonetic: "/ˌserənˈdɪpəti/",
    partOfSpeech: "n.",
    definition: "意外發現的好運",
    project: "進階單字",
    example: "Finding this book was a complete serendipity.",
    masteryLevel: 0,
    learnedCount: 0
  },
  {
    id: "init-3",
    term: "Persistence",
    phonetic: "/pərˈsɪstəns/",
    partOfSpeech: "n.",
    definition: "堅持，毅力",
    project: "基礎必備",
    example: "Success is the result of persistence and hard work.",
    masteryLevel: 0,
    learnedCount: 0
  }
];

const apiService = {
  getWords: async (): Promise<Word[]> => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
    
    // 如果本地沒資料，先用內建的，並嘗試抓取遠端
    try {
      const response = await fetch('./data/words.json');
      if (response.ok) {
        const words = await response.json();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
        return words;
      }
    } catch (e) {
      console.warn("無法取得 words.json，使用內建資料。");
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return defaultData;
  },
  saveWords: async (words: Word[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  },
  updateWord: async (updated: Word) => {
    const words = await apiService.getWords();
    const index = words.findIndex(w => w.id === updated.id);
    if (index !== -1) {
      words[index] = { ...updated, lastReviewed: Date.now() };
      await apiService.saveWords(words);
    }
  }
};

const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
};

// --- Components ---

const Navbar: React.FC<{ currentView: AppView; setView: (v: AppView) => void }> = ({ currentView, setView }) => {
  const items: { id: AppView; label: string; icon: string }[] = [
    { id: 'home', label: '學習', icon: '📖' },
    { id: 'library', label: '清單', icon: '📂' },
    { id: 'import', label: '新增', icon: '➕' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/90 backdrop-blur-xl border border-white shadow-2xl rounded-[32px] px-4 py-2 flex justify-around items-center z-50">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className={`flex flex-col items-center p-2 rounded-2xl transition-all duration-300 ${
            currentView === item.id || (item.id === 'home' && (currentView === 'flashcards' || currentView === 'quiz'))
              ? 'bg-indigo-50 text-indigo-600 scale-105'
              : 'text-slate-400'
          }`}
        >
          <span className="text-xl">{item.icon}</span>
          <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

const FlashcardView: React.FC<{ words: Word[]; onFinish: () => void }> = ({ words, onFinish }) => {
  const [idx, setIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (words[idx]) speak(words[idx].term);
  }, [idx, words]);

  const handleLevel = async (delta: number) => {
    const word = words[idx];
    const nextLevel = Math.max(0, Math.min(5, (word.masteryLevel || 0) + delta));
    await apiService.updateWord({ ...word, masteryLevel: nextLevel, isMastered: nextLevel === 5 });
    
    setIsFlipped(false);
    setTimeout(() => {
      if (idx < words.length - 1) setIdx(idx + 1);
      else onFinish();
    }, 300);
  };

  if (words.length === 0) return null;
  const current = words[idx];

  return (
    <div className="flex flex-col items-center gap-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full flex justify-between items-center text-slate-400 px-2">
        <button onClick={onFinish} className="font-bold text-sm">✕ 結束</button>
        <span className="text-xs font-black bg-white px-3 py-1 rounded-full shadow-sm">{idx + 1} / {words.length}</span>
      </div>

      <div 
        className="w-full h-[460px] perspective-1000 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full transition-transform duration-700 preserve-3d shadow-2xl rounded-[40px] ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 bg-white rounded-[40px] flex flex-col items-center justify-center p-8 backface-hidden border border-slate-50">
            <h2 className="text-5xl font-black text-slate-800 text-center break-words">{current.term}</h2>
            {current.phonetic && <p className="text-indigo-400 font-mono mt-4 text-lg">{current.phonetic}</p>}
            <div className="mt-20 text-slate-200 text-xs font-bold uppercase tracking-widest group-hover:text-indigo-200 transition-colors">點擊翻面</div>
          </div>
          {/* Back */}
          <div className="absolute inset-0 bg-indigo-600 rounded-[40px] flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180 text-white text-center">
            <span className="bg-white/20 px-3 py-1 rounded-lg text-[10px] font-black mb-4">{current.partOfSpeech}</span>
            <h3 className="text-4xl font-bold mb-4">{current.definition}</h3>
            {current.example && <p className="text-white/70 italic text-sm px-4">"{current.example}"</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-4 w-full px-2">
        <button onClick={() => handleLevel(-1)} className="flex-1 py-5 bg-white border border-slate-100 rounded-[28px] font-black text-slate-400 hover:text-rose-500 active:scale-95 transition-all">不熟</button>
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
    const qCount = Math.min(targetWords.length, 10);
    const shuffled = [...targetWords].sort(() => Math.random() - 0.5).slice(0, qCount);
    const generated = shuffled.map(word => {
      const distractors = allWords
        .filter(w => w.definition !== word.definition)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const options = [...distractors, word].sort(() => Math.random() - 0.5);
      return { 
        word, 
        options: options.map(o => ({ definition: o.definition, partOfSpeech: o.partOfSpeech })), 
        correctIndex: options.findIndex(o => o.definition === word.definition) 
      };
    });
    setQuestions(generated);
  }, [targetWords, allWords]);

  const handleAnswer = async (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === questions[idx].correctIndex;
    const word = questions[idx].word;
    const nextLevel = correct ? Math.min(5, (word.masteryLevel || 0) + 1) : Math.max(0, (word.masteryLevel || 0) - 1);
    await apiService.updateWord({ ...word, masteryLevel: nextLevel, isMastered: nextLevel === 5 });
  };

  if (questions.length === 0) return null;
  const q = questions[idx];

  return (
    <div className="space-y-8 py-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center text-slate-400">
        <button onClick={onFinish} className="font-bold text-sm">✕ 結束</button>
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full mx-6 overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
        </div>
        <span className="text-[10px] font-black">{idx + 1} / {questions.length}</span>
      </div>

      <div className="bg-white rounded-[40px] p-12 shadow-sm border border-slate-50 text-center relative group">
        <button onClick={() => speak(q.word.term)} className="absolute top-6 right-6 text-xl text-slate-200 hover:text-indigo-400 transition-colors">🔊</button>
        <h2 className="text-4xl font-black text-slate-800 break-words leading-tight">{q.word.term}</h2>
      </div>

      <div className="grid gap-3">
        {q.options.map((opt, i) => {
          let style = "w-full text-left p-5 rounded-3xl border-2 font-bold text-sm transition-all ";
          if (selected === null) style += "bg-white border-slate-50 hover:border-indigo-100";
          else if (i === q.correctIndex) style += "bg-emerald-50 border-emerald-500 text-emerald-700";
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
        <button 
          onClick={() => {
            if (idx < questions.length - 1) { setIdx(idx + 1); setSelected(null); }
            else onFinish();
          }} 
          className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black animate-in slide-in-from-bottom"
        >
          {idx < questions.length - 1 ? '下一題' : '查看結果'}
        </button>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [words, setWords] = useState<Word[]>([]);
  const [selectedWords, setSelectedWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [importText, setImportText] = useState('');
  const [importProj, setImportProj] = useState('新單字集');

  const load = async () => {
    setIsLoading(true);
    const data = await apiService.getWords();
    setWords(data);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleImport = async () => {
    const lines = importText.split('\n').filter(l => l.trim());
    const newWords: Word[] = lines.map(line => {
      const parts = line.split(/\s+/);
      return {
        id: Math.random().toString(36).substring(2, 11),
        term: parts[0],
        definition: parts.slice(1).join(' ') || '未定義',
        partOfSpeech: 'v/n.',
        project: importProj,
        masteryLevel: 0,
        learnedCount: 0,
        lastReviewed: Date.now()
      };
    }).filter(w => w.term);

    if (newWords.length) {
      const all = [...words, ...newWords];
      await apiService.saveWords(all);
      setWords(all);
      setImportText('');
      alert(`成功匯入 ${newWords.length} 個單字！`);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">載入中...</p>
    </div>
  );

  const projects = Array.from(new Set(words.map(w => w.project || '未分類')));
  const avgMastery = words.length ? (words.reduce((a, w) => a + (w.masteryLevel || 0), 0) / (words.length * 5)) : 0;

  const renderContent = () => {
    if (view === 'flashcards') return <FlashcardView words={selectedWords} onFinish={() => setView('home')} />;
    if (view === 'quiz') return <QuizView targetWords={selectedWords} allWords={words} onFinish={() => setView('home')} />;
    
    if (view === 'library') {
      const filtered = words.filter(w => w.term.toLowerCase().includes(searchTerm.toLowerCase()) || w.definition.includes(searchTerm));
      return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-300">
          <h2 className="text-3xl font-black text-slate-800">單字庫存</h2>
          <input 
            className="w-full px-6 py-4 rounded-3xl border-none bg-white shadow-sm font-bold text-sm"
            placeholder="搜尋單字或翻譯..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className="grid gap-3">
            {filtered.map(w => (
              <div key={w.id} className="bg-white p-5 rounded-[28px] shadow-sm flex justify-between items-center group">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-800">{w.term}</span>
                    <button onClick={() => speak(w.term)} className="text-slate-200 group-hover:text-indigo-400">🔊</button>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{w.definition}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-black text-slate-300 uppercase">{w.project}</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i < (w.masteryLevel || 0) ? 'bg-indigo-500' : 'bg-slate-100'}`} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (view === 'import') {
      return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-300">
          <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl">
            <h2 className="text-2xl font-black mb-1">批次新增</h2>
            <p className="text-slate-400 text-xs font-medium mb-6">每行一個單字，格式：單字 翻譯</p>
            <input 
              className="w-full px-5 py-3 rounded-2xl bg-white/10 border-none text-white font-bold mb-4" 
              placeholder="單字集名稱" 
              value={importProj} 
              onChange={e => setImportProj(e.target.value)} 
            />
            <textarea 
              className="w-full h-40 p-5 rounded-3xl bg-white/10 border-none text-white font-mono text-sm mb-4"
              placeholder="apple 蘋果&#10;banana 香蕉"
              value={importText}
              onChange={e => setImportText(e.target.value)}
            />
            <button onClick={handleImport} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg">開始匯入</button>
          </div>
        </div>
      );
    }

    // Default Home
    return (
      <div className="space-y-8 pb-20 animate-in fade-in duration-300">
        <header className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-black mb-2">Hello! Keep learning.</h1>
            <p className="text-indigo-200 text-xs font-medium mb-8">今天已經掌握了 {(avgMastery * 100).toFixed(0)}% 的進度。</p>
            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-1000 ease-out" style={{ width: `${avgMastery * 100}%` }} />
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </header>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-slate-800 px-2">單字集分類</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-2">
            {projects.map(p => (
              <div key={p} className="flex-shrink-0 bg-white px-6 py-5 rounded-[32px] border border-slate-100 shadow-sm min-w-[140px]">
                <div className="font-black text-slate-800">{p}</div>
                <div className="text-[10px] text-slate-400 font-bold mt-1">{words.filter(w => w.project === p).length} CARDS</div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 px-2">
          <button 
            onClick={() => { setSelectedWords(words); setView('flashcards'); }}
            className="flex items-center gap-6 bg-white p-7 rounded-[40px] shadow-sm border border-slate-50 hover:shadow-md transition-all active:scale-95"
          >
            <div className="w-16 h-16 bg-amber-50 rounded-[24px] flex items-center justify-center text-3xl">🗂️</div>
            <div className="text-left">
              <h4 className="text-lg font-black text-slate-800">單字卡練習</h4>
              <p className="text-slate-400 text-xs font-medium">翻轉記憶，強化印象</p>
            </div>
          </button>
          <button 
            disabled={words.length < 4}
            onClick={() => { setSelectedWords(words); setView('quiz'); }}
            className="flex items-center gap-6 bg-white p-7 rounded-[40px] shadow-sm border border-slate-50 hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <div className="w-16 h-16 bg-emerald-50 rounded-[24px] flex items-center justify-center text-3xl">🎯</div>
            <div className="text-left">
              <h4 className="text-lg font-black text-slate-800">自我挑戰測驗</h4>
              <p className="text-slate-400 text-xs font-medium">檢驗學習成效</p>
            </div>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100">
      <main className="max-w-md mx-auto p-4 pt-8">
        {renderContent()}
      </main>
      <Navbar currentView={view} setView={setView} />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
