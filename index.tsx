
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Word, AppView } from './types';
import { apiService } from './services/storageService';
import Navbar from './components/Navbar';
import FlashcardView from './components/FlashcardView';
import QuizView from './components/QuizView';
import HomeView from './components/HomeView';
import LibraryView from './components/LibraryView';
import ImportView from './components/ImportView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [words, setWords] = useState<Word[]>([]);
  const [selectedWords, setSelectedWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const data = await apiService.getWords();
    setWords(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshWords = async () => {
    await loadData();
  };

  const startStudy = (view: 'flashcards' | 'quiz', filtered: Word[]) => {
    setSelectedWords(filtered);
    setCurrentView(view);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black text-xs uppercase tracking-widest">載入中...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView words={words} onStartStudy={startStudy} />;
      case 'flashcards':
        return (
          <div className="animate-in fade-in duration-300">
            <button onClick={() => setCurrentView('home')} className="mb-6 px-4 py-2 text-slate-400 hover:text-indigo-600 flex items-center gap-2 font-bold transition-colors">
              ← 返回主頁
            </button>
            <FlashcardView words={selectedWords} />
          </div>
        );
      case 'quiz':
        return (
          <div className="animate-in fade-in duration-300">
            <button onClick={() => setCurrentView('home')} className="mb-6 px-4 py-2 text-slate-400 hover:text-indigo-600 flex items-center gap-2 font-bold transition-colors">
              ← 返回主頁
            </button>
            <QuizView targetWords={selectedWords} allWords={words} />
          </div>
        );
      case 'library':
        return <LibraryView words={words} onUpdate={refreshWords} />;
      case 'import':
        return <ImportView onImport={refreshWords} />;
      default:
        return <HomeView words={words} onStartStudy={startStudy} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <main className="max-w-md mx-auto p-4 pt-6">
        {renderView()}
      </main>
      <Navbar currentView={currentView} setView={setCurrentView} />
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
