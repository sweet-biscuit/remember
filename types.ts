
export interface Phrase {
  text: string;
  meaning: string;
  example?: string;
  exampleTranslation?: string;
}

export interface Word {
  id: string;
  term: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  project: string;
  inflections?: string;
  phrases?: Phrase[];
  notes?: string;
  example?: string;
  exampleTranslation?: string;
  learnedCount: number;
  lastReviewed?: number;
  isMastered?: boolean;
  masteryLevel: number; // 0 (陌生) 到 5 (完美掌握)
}

export type AppView = 'home' | 'flashcards' | 'quiz' | 'library' | 'import';

export interface QuizOption {
  definition: string;
  partOfSpeech: string;
}

export interface QuizQuestion {
  word: Word;
  options: QuizOption[];
  correctIndex: number;
}

export interface ProjectInfo {
  name: string;
  wordCount: number;
  averageMastery: number;
}
