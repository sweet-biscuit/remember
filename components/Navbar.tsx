
import React from 'react';
import { AppView } from '../types';

interface NavbarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const navItems: { id: AppView; label: string; icon: string }[] = [
    { id: 'home', label: '學習', icon: '🏠' },
    { id: 'library', label: '庫存', icon: '📂' },
    { id: 'import', label: '匯入', icon: '📥' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/80 backdrop-blur-lg border border-white shadow-2xl rounded-[32px] px-6 py-3 flex justify-around items-center z-[100]">
      {navItems.map((item) => {
        const isActive = currentView === item.id || (item.id === 'home' && (currentView === 'flashcards' || currentView === 'quiz'));
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${
              isActive ? 'text-indigo-600 scale-110' : 'text-slate-300'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
              {item.label}
            </span>
            {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-indigo-600 rounded-full" />}
          </button>
        );
      })}
    </nav>
  );
};

export default Navbar;
