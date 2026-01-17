
import React, { useState, useRef } from 'react';
import { Word } from '../types';
import { apiService } from '../services/storageService';
import { speak } from '../services/ttsService';

interface LibraryViewProps {
  words: Word[];
  onUpdate: () => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ words, onUpdate }) => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDataCenter, setShowDataCenter] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projects = Object.entries(words.reduce((acc, word) => {
    const proj = word.project || '未分類';
    acc[proj] = (acc[proj] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)).map(([name, count]) => ({ name, count }));

  const handleUpdateWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWord) {
      await apiService.updateWord({ ...editingWord, isMastered: editingWord.masteryLevel === 5 });
      setEditingWord(null);
      onUpdate();
    }
  };

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <header className="px-2 flex justify-between items-center">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">我的庫存</h2>
          <button onClick={() => setShowDataCenter(true)} className="w-14 h-14 bg-slate-900 rounded-[24px] text-white flex items-center justify-center">💾</button>
        </header>

        <div className="grid gap-4">
          {projects.map(proj => (
            <button key={proj.name} onClick={() => setSelectedProject(proj.name)} className="mx-2 bg-white p-7 rounded-[32px] border border-slate-50 shadow-sm flex items-center justify-between text-left group active:bg-slate-50 transition-all">
              <div>
                <h4 className="text-xl font-black text-slate-800">{proj.name}</h4>
                <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{proj.count} 張卡片</p>
              </div>
              <span className="text-slate-200 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all">→</span>
            </button>
          ))}
        </div>

        {showDataCenter && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[48px] p-10 animate-in zoom-in duration-300">
              <h3 className="text-2xl font-black mb-6">資料備份</h3>
              <div className="grid gap-4">
                <button onClick={() => apiService.exportData()} className="w-full p-6 bg-slate-50 rounded-[32px] font-black text-left flex items-center gap-4 hover:bg-indigo-50 transition-colors">📤 匯出資料檔案</button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full p-6 bg-slate-50 rounded-[32px] font-black text-left flex items-center gap-4 hover:bg-indigo-50 transition-colors">📥 從檔案還原</button>
                <input type="file" ref={fileInputRef} onChange={async (e) => { if(e.target.files?.[0] && await apiService.importData(e.target.files[0])) { onUpdate(); setShowDataCenter(false); } }} accept=".json" className="hidden" />
              </div>
              <button onClick={() => setShowDataCenter(false)} className="w-full mt-8 py-4 font-black text-slate-400 text-sm">關閉窗口</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const filtered = words.filter(w => (w.project || '未分類') === selectedProject && (w.term.toLowerCase().includes(searchTerm.toLowerCase()) || w.definition.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4 px-2">
        <button onClick={() => setSelectedProject(null)} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100">←</button>
        <h2 className="text-2xl font-black text-slate-800 truncate">{selectedProject}</h2>
      </header>

      <div className="px-2">
        <input type="text" placeholder="尋找單字..." className="w-full px-6 py-4 rounded-3xl border border-slate-100 bg-white font-bold text-sm focus:outline-none focus:ring-2 ring-indigo-500/10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid gap-3 px-2 pb-10">
        {filtered.map(word => {
          const isMastered = (word.masteryLevel || 0) >= 5;
          return (
            <div 
              key={word.id} 
              onClick={() => setEditingWord(word)} 
              className={`bg-white p-5 rounded-[28px] border border-slate-50 shadow-sm cursor-pointer relative transition-all ${isMastered ? 'opacity-40' : 'opacity-100'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-800">{word.term}</span>
                  <button onClick={(e) => { e.stopPropagation(); speak(word.term); }} className="text-indigo-400 p-1">🔊</button>
                </div>
                {isMastered && <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">已熟悉</span>}
              </div>
              <p className="text-xs text-slate-500 truncate font-medium">{word.definition}</p>
            </div>
          );
        })}
      </div>

      {editingWord && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleUpdateWord} className="bg-white w-full max-w-sm rounded-[48px] p-10 space-y-6 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-2xl font-black text-slate-800">編輯卡片內容</h3>
            <div className="space-y-4">
              <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 font-bold border-none" value={editingWord.term} onChange={e => setEditingWord({...editingWord, term: e.target.value})} placeholder="單字" />
              <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 font-bold border-none" value={editingWord.definition} onChange={e => setEditingWord({...editingWord, definition: e.target.value})} placeholder="定義" />
            </div>
            
            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button type="button" onClick={() => setEditingWord(null)} className="flex-1 font-black text-slate-400 text-sm">取消</button>
              <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100">儲存</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LibraryView;
