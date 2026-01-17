
import { Word } from '../types';

const STORAGE_KEY = 'beibeibei_words_v2'; // 更新儲存 Key 名稱以符合新品牌

export const apiService = {
  getWords: async (): Promise<Word[]> => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
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

  renameProject: async (oldName: string, newName: string): Promise<void> => {
    const current = await apiService.getWords();
    const updated = current.map(w => w.project === oldName ? { ...w, project: newName } : w);
    await apiService.saveWords(updated);
  },

  clearAllData: async (): Promise<void> => {
    localStorage.removeItem(STORAGE_KEY);
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
            const currentWords = await apiService.getWords();
            const existingIds = new Set(currentWords.map(w => w.id));
            const newUniqueWords = words.filter(w => !existingIds.has(w.id));
            
            await apiService.saveWords([...currentWords, ...newUniqueWords]);
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (err) {
          console.error('Import error:', err);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }
};
