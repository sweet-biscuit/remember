
import React, { useState } from 'react';
import { Word, Phrase } from '../types';
// Fix: Import apiService instead of storageService as it's the exported member in the service file
import { apiService } from '../services/storageService';

interface ImportViewProps {
  onImport: () => void;
}

const ImportView: React.FC<ImportViewProps> = ({ onImport }) => {
  const [inputText, setInputText] = useState('');
  const [projectName, setProjectName] = useState('預設專案');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const parseLine = (line: string): Word | null => {
    const text = line.trim();
    if (!text) return null;

    try {
      const mainMatch = text.match(/^(\S+)\s+\/([^\/]+)\/\s+([\w]+\.)\s+([^\[\{#\n]+)/);
      
      if (!mainMatch) return null;

      const [, term, phonetic, partOfSpeech, rawDefinition] = mainMatch;
      const definition = rawDefinition.trim();

      const remaining = text.substring(mainMatch[0].length);

      let inflections = '';
      const inflMatch = remaining.match(/\[([^\]]+)\]/);
      if (inflMatch) inflections = inflMatch[1];

      const phrases: Phrase[] = [];
      const phraseBlockMatch = remaining.match(/\{([^\}]+)\}/);
      if (phraseBlockMatch) {
        const pLines = phraseBlockMatch[1].split(/[;；]/);
        pLines.forEach(p => {
          const m = p.match(/"([^"]+)"\s*[=＝]\s*([^｜|]+)(?:\s*[｜|]\s*([^｜|]+))?(?:\s*[｜|]\s*([^｜|]+))?/);
          if (m) {
            phrases.push({
              text: m[1].trim(),
              meaning: m[2].trim(),
              example: m[3]?.trim(),
              exampleTranslation: m[4]?.trim()
            });
          }
        });
      }

      let notes = '';
      const notesMatch = remaining.match(/#備註：\s*([^#\n]*)/);
      if (notesMatch) notes = notesMatch[1].trim();

      let example = '';
      let exampleTranslation = '';
      const exampleMatch = remaining.match(/#例句：\s*([^#\n]*)/);
      if (exampleMatch) {
        const parts = exampleMatch[1].split(/[｜|]/);
        example = parts[0]?.trim() || '';
        exampleTranslation = parts[1]?.trim() || '';
      }

      return {
        id: Math.random().toString(36).substr(2, 9),
        term,
        phonetic,
        partOfSpeech,
        definition,
        project: projectName.trim() || '未分類', // 使用填寫的專案名稱
        inflections,
        phrases: phrases.length > 0 ? phrases : undefined,
        notes,
        example,
        exampleTranslation,
        learnedCount: 0,
        lastReviewed: Date.now()
      };
    } catch (e) {
      console.error("解析錯誤:", e);
      return null;
    }
  };

  // Fix: Make handleBulkImport async to handle the async addWords call
  const handleBulkImport = async () => {
    const lines = inputText.split(/\n/).filter(l => l.trim() !== '');
    const newWords: Word[] = [];
    
    lines.forEach(line => {
      const parsed = parseLine(line);
      if (parsed) newWords.push(parsed);
    });

    if (newWords.length === 0) {
      setStatus({ 
        type: 'error', 
        message: '解析失敗。請確保格式正確，且單字內容不為空。' 
      });
      return;
    }

    // Fix: Use apiService and await the async call
    await apiService.addWords(newWords);
    onImport();
    setInputText('');
    setStatus({ type: 'success', message: `成功將 ${newWords.length} 個單字匯入至專案「${projectName}」！` });
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
        <h2 className="text-3xl font-black text-slate-800 mb-2">批次匯入資源</h2>
        <p className="text-slate-400 text-sm mb-8 font-medium">請在下方填寫專案名稱，並貼上符合格式的資料。</p>
        
        <div className="mb-6">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">所屬專案名稱</label>
          <input 
            type="text"
            className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
            placeholder="例如：多益單字 第一週"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">單字資料 (每行一條)</label>
          <textarea
            className="w-full h-80 p-6 rounded-3xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none font-mono text-sm leading-relaxed bg-slate-50/50 transition-all"
            placeholder={`submit /səbˈmɪt/ vt. 提交 [submitted/submitting] { "submit to" = 屈服於 } #備註：正式用語 #例句：Please submit your report.`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>

        {status && (
          <div className={`mt-6 p-5 rounded-2xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <span className="text-xl">{status.type === 'success' ? '✨' : '⚠️'}</span>
            <div>
              <p className="font-bold">{status.type === 'success' ? '匯入成功' : '匯入發生錯誤'}</p>
              <p className="opacity-80 mt-1">{status.message}</p>
            </div>
          </div>
        )}

        <button 
          onClick={handleBulkImport}
          disabled={!inputText.trim() || !projectName.trim()}
          className="w-full mt-8 py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3"
        >
          <span>📥</span> 建立專案並匯入
        </button>
      </div>
    </div>
  );
};

export default ImportView;
