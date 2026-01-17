
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
  const [status, setStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projectStats = words.reduce((acc, word) => {
    const proj = word.project || '未分類';
    acc[proj] = (acc[proj] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const projects = Object.entries(projectStats).map(([name, count]) => ({ name, count }));

  const handleExport = async () => {
    await apiService.exportData();
    setStatus({ msg: '備份檔案已下載', type: 'success' });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const success = await apiService.importData(file);
    if (success) {
      setStatus({ msg: '資料還原成功！', type: 'success' });
      onUpdate();
    } else {
      setStatus({ msg: '檔案格式錯誤', type: 'error' });
    }
    setTimeout(() => setStatus(null), 3000);
    if (e.target) e.target.value = '';
  };

  const handleClearAll = async () => {
    if (confirm('危險操作：這將會永久刪除所有單字與專案，確定嗎？')) {
      await apiService.clearAllData();
      onUpdate();
      setShowDataCenter(false);
      setStatus({ msg: '所有資料已清空', type: 'success' });
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleUpdateWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWord) {
      await apiService.updateWord(editingWord);
      setEditingWord(null);
      onUpdate();
    }
  };

  const toggleMastered = async (word: Word) => {
    await apiService.updateWord({ ...word, isMastered: !word.isMastered });
    onUpdate();
  };

  const handleRenameProject = async (oldName: string) => {
    const newName = prompt('請輸入新的專案名稱：', oldName);
    if (newName && newName !== oldName) {
      await apiService.renameProject(oldName, newName);
      setSelectedProject(newName);
      onUpdate();
    }
  };

  if (!selectedProject) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <header className="px-2 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">單字倉庫</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Data Storage</p>
          </div>
          <button 
            onClick={() => setShowDataCenter(true)}
            className="w-14 h-14 bg-slate-900 rounded-[24px] shadow-xl shadow-slate-200 flex items-center justify-center text-2xl active:scale-90 transition-all text-white"
          >
            💾
          </button>
        </header>

        {status && (
          <div className={`mx-2 p-4 rounded-[24px] text-sm font-black text-center shadow-lg animate-in slide-in-from-top duration-300 ${
            status.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}>
            {status.msg}
          </div>
        )}

        <div className="grid gap-4">
          {projects.length === 0 ? (
            <div className="bg-white rounded-[40px] p-16 text-center border-2 border-dashed border-slate-100 mx-2">
              <span className="text-5xl block mb-6 opacity-20">📂</span>
              <p className="text-slate-400 font-bold mb-6">目前沒有資料</p>
              <button 
                onClick={() => setShowDataCenter(true)}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm"
              >
                匯入備份檔
              </button>
            </div>
          ) : (
            projects.map(proj => (
              <div key={proj.name} className="mx-2 bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm flex items-center justify-between group active:bg-slate-50 transition-colors">
                <button onClick={() => setSelectedProject(proj.name)} className="flex-1 text-left">
                  <h4 className="text-xl font-black text-slate-800">{proj.name}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                      {proj.count} 個單字
                    </span>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleRenameProject(proj.name)} className="p-3 text-slate-300 hover:text-indigo-500 transition-colors">✏️</button>
                  <button onClick={() => { if(confirm('要刪除這個專案嗎？')) apiService.deleteProject(proj.name).then(onUpdate); }} className="p-3 text-slate-300 hover:text-rose-500 transition-colors">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 個人資料中心 */}
        {showDataCenter && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[150] flex items-end md:items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[48px] p-10 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
              <h3 className="text-2xl font-black text-slate-800 mb-2">個人資料中心</h3>
              <p className="text-xs text-slate-400 font-medium mb-10 leading-relaxed">
                這是您的專屬資料庫。您可以隨時匯出備份，或匯入之前的存檔來恢復單字與專案分類。
              </p>

              <div className="grid gap-4">
                <button onClick={handleExport} className="w-full flex items-center gap-6 p-6 bg-slate-50 rounded-[32px] hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
                  <span className="text-3xl">📤</span>
                  <div className="text-left"><p className="font-black text-sm">匯出所有單字</p><p className="text-[10px] opacity-50 uppercase font-bold tracking-widest">Download Backup (JSON)</p></div>
                </button>
                <button onClick={handleImportClick} className="w-full flex items-center gap-6 p-6 bg-slate-50 rounded-[32px] hover:bg-emerald-50 hover:text-emerald-600 transition-all group">
                  <span className="text-3xl">📥</span>
                  <div className="text-left"><p className="font-black text-sm">還原/匯入檔案</p><p className="text-[10px] opacity-50 uppercase font-bold tracking-widest">Restore from file</p></div>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                
                <div className="border-t border-slate-100 my-4 pt-4">
                  <button onClick={handleClearAll} className="w-full flex items-center gap-6 p-6 bg-rose-50 rounded-[32px] text-rose-600 hover:bg-rose-100 transition-all group">
                    <span className="text-3xl">🧨</span>
                    <div className="text-left"><p className="font-black text-sm">清空所有資料</p><p className="text-[10px] opacity-50 uppercase font-bold tracking-widest">Reset Database</p></div>
                  </button>
                </div>
              </div>
              <button onClick={() => setShowDataCenter(false)} className="w-full mt-10 py-4 font-black text-slate-400 text-sm">關閉</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const projectWords = words.filter(w => (w.project || '未分類') === selectedProject)
    .filter(w => w.term.toLowerCase().includes(searchTerm.toLowerCase()) || w.definition.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <header className="flex items-center gap-4 px-2">
        <button onClick={() => setSelectedProject(null)} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 text-xl active:scale-90 transition-all">←</button>
        <div className="overflow-hidden">
          <h2 className="text-2xl font-black text-slate-800 truncate">{selectedProject}</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">單字列表</p>
        </div>
      </header>

      <div className="px-2">
        <div className="relative">
          <input 
            type="text"
            placeholder="搜尋單字..."
            className="w-full pl-12 pr-6 py-4 rounded-3xl border border-slate-100 focus:outline-none bg-white font-bold text-sm shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-5 top-4 opacity-20">🔍</span>
        </div>
      </div>

      <div className="grid gap-3 px-2 pb-10">
        {projectWords.length > 0 ? projectWords.map(word => (
          <div 
            key={word.id} 
            onClick={() => setEditingWord(word)}
            className={`bg-white p-5 rounded-[28px] border border-slate-50 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all cursor-pointer ${word.isMastered ? 'opacity-50 grayscale-[0.5]' : ''}`}
          >
            <div className="flex-1 mr-4 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-800">{word.term}</span>
                {word.isMastered && <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-md">掌握</span>}
                <button onClick={(e) => { e.stopPropagation(); speak(word.term); }} className="text-indigo-400 p-1">🔊</button>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate">
                <span className="text-[10px] font-black uppercase text-indigo-400 mr-2">{word.partOfSpeech}</span>
                {word.definition}
              </p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); if(confirm('要刪除這個單字嗎？')) apiService.deleteWord(word.id).then(onUpdate); }}
              className="text-slate-200 hover:text-rose-500 p-2"
            >
              ✕
            </button>
          </div>
        )) : (
          <div className="py-24 text-center text-slate-300 font-bold text-sm">找不到相關單字</div>
        )}
      </div>

      {/* 單字編輯器彈窗 */}
      {editingWord && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-10 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <h3 className="text-2xl font-black text-slate-800 mb-6">編輯單字</h3>
            <form onSubmit={handleUpdateWord} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">單字</label>
                  <input className="w-full px-4 py-3 rounded-2xl bg-slate-50 font-bold" value={editingWord.term} onChange={e => setEditingWord({...editingWord, term: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">詞性</label>
                  <input className="w-full px-4 py-3 rounded-2xl bg-slate-50 font-bold" value={editingWord.partOfSpeech} onChange={e => setEditingWord({...editingWord, partOfSpeech: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">定義</label>
                <input className="w-full px-4 py-3 rounded-2xl bg-slate-50 font-bold" value={editingWord.definition} onChange={e => setEditingWord({...editingWord, definition: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">備註</label>
                <textarea className="w-full px-4 py-3 rounded-2xl bg-slate-50 font-medium text-xs h-20" value={editingWord.notes || ''} onChange={e => setEditingWord({...editingWord, notes: e.target.value})} />
              </div>

              <div className="flex items-center gap-4 py-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => toggleMastered(editingWord).then(() => setEditingWord(null))}
                  className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${editingWord.isMastered ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}
                >
                  {editingWord.isMastered ? '取消標記掌握' : '標記為已掌握 ✨'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button type="button" onClick={() => setEditingWord(null)} className="py-4 font-black text-slate-400 text-sm">取消</button>
                <button type="submit" className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg">儲存修改</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryView;
