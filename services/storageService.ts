
import { Word } from '../types';

const STORAGE_KEY = 'beibeibei_words_v2';

export const apiService = {
  getWords: async (): Promise<Word[]> => {
    const data = localStorage.getItem(STORAGE_KEY);
    const localWords = data ? JSON.parse(data) : [];
    
    // 如果本地沒有資料，嘗試抓取內建的 JSON 檔案
    if (localWords.length === 0) {
      try {
        const response = await fetch('./data/words.json');
        if (response.ok) {
          const defaultWords = await response.json();
          // 將內建資料存入本地，方便後續修改
          await apiService.saveWords(defaultWords);
          return defaultWords;
        }
      } catch (err) {
        console.warn('無法載入內建單字檔，這可能是因為直接開啟 HTML 檔案而非透過伺服器。');
      }
    }
    
    return localWords;
  },

  saveWords: async (words: Word[]): Promise<void> => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  },

  addWords: async (newWords: Word[]): Promise<void> => {
    const current = await apiService.getWords();
    await apiService.saveWords([...current, ...newWords]);
  },

  updateWord: async (updatedWord: Word): Promise<void> => {
    const current = await apiService.getWords();
    const index = current.findIndex(w => w.id === updatedWord.id);
    if (index !== -1) {
      current[index] = { ...updatedWord, lastReviewed: Date.now() };
      await apiService.saveWords(current);
    }
  },

  deleteWord: async (id: string): Promise<void> => {
    const current = await apiService.getWords();
    await apiService.saveWords(current.filter(w => w.id !== id));
  },

  deleteProject: async (projectName: string): Promise<void> => {
    const current = await apiService.getWords();
    await apiService.saveWords(current.filter(w => w.project !== projectName));
  },

  exportData: async (): Promise<void> => {
    const words = await apiService.getWords();
    const dataStr = JSON.stringify(words, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `背背背_備份_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  importData: (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const words = JSON.parse(content);
          if (Array.isArray(words)) {
            await apiService.saveWords(words);
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (err) {
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }
};
