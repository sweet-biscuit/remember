
import React, { useState } from 'react';
import { Word } from '../types';
import { apiService } from '../services/storageService';

interface ImportViewProps {
  onImport: () => void;
}

const ImportView: React.FC<ImportViewProps> = ({ onImport }) => {
  const [inputText, setInputText] = useState('');
  const [projectName, setProjectName] = useState('我的新單字');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const resetToDefault = async () => {
    if (confirm('這將會覆蓋您目前的所有修改，恢復到 GitHub 上的內建單字庫，確定嗎？')) {
      try {
        const response = await fetch('./data/words.json');
        if (response.ok) {
          const defaultWords = await response.json();
          await apiService.saveWords(defaultWords);
          onImport();
          setStatus({ type: 'success', message: '已恢復為內建單字庫！' });
        }
      } catch (err) {
        setStatus({ type: 'error', message: '無法連接到伺服器。' });
      }
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleBulkImport = async () => {
    const lines = inputText.split(/\n/).filter(l => l.trim() !== '');
    const newWords: Word[] = lines.map(line => {
      const parts = line.split(/\s+/);
      return {
        id: Math.random().toString(36).substr(2, 9),
        term: parts[0] || 'Unknown',
        definition: parts.slice(1).join(' ') || '未定義',
        partOfSpeech: 'n.',
        project: projectName,
        masteryLevel: 0,
        learnedCount: 0,
        lastReviewed: Date.now()
      };
    });

    if (newWords.length === 0) return;
    await apiService.addWords(newWords);
    onImport();
    setInputText('');
    setStatus({ type: 'success', message: `成功新增 ${newWords.length} 個單字！` });
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl">
        <h2 className="text-2xl font-black mb-2">☁️ 雲端同步</h2>
        <p className="text-slate-400 text-xs mb-6 font-medium">如果您在 GitHub 上更新了資料檔案，可以點擊下方按鈕同步。</p>
        <button onClick={resetToDefault} className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl font-black text-sm transition-all">
          同步內建單字庫
        </button>
      </div>

      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 mb-6">手動新增</h2>
        <div className="space-y-4">
          <input className="w-full px-6 py-4 rounded-2xl border border-slate-100 font-bold bg-slate-50" placeholder="專案名稱" value={projectName} onChange={e => setProjectName(e.target.value)} />
          <textarea className="w-full h-40 p-6 rounded-3xl border border-slate-100 font-mono text-sm bg-slate-50" value={inputText} onChange={e => setInputText(e.target.value)} placeholder="apple 蘋果&#10;banana 香蕉" />
          {status && <div className={`p-4 rounded-2xl text-xs font-bold ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{status.message}</div>}
          <button onClick={handleBulkImport} className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl">開始匯入</button>
        </div>
      </div>
    </div>
  );
};

export default ImportView;
