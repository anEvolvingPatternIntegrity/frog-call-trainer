export interface PhotoCredit {
  url: string;           // path (/photos/...) or external CC-licensed URL
  attribution: string;   // e.g. "© John Smith / iNaturalist, CC-BY 4.0"
  license: string;       // "CC0" | "CC-BY" | "CC-BY-SA"
}

export interface AudioCredit {
  file: string;          // path relative to /audio/, e.g. "roanoke-valley/american-bullfrog-1.mp3"
  attribution?: string;  // required for CC-BY recordings from iNaturalist
}

export interface Species {
  id: string;            // kebab-case, e.g. "american-bullfrog"
  commonName: string;
  scientificName: string;
  audio: AudioCredit[];  // min 1; 2–3 ideally
  photos: PhotoCredit[]; // min 1
  funFact?: string;
}

export interface Region {
  id: string;
  name: string;          // e.g. "Roanoke Valley, VA"
  species: Species[];
}

export type QuizMode = 'training' | 'test';

export interface Question {
  species: Species;       // correct answer
  audioFile: AudioCredit; // randomly selected from species.audio
}

export interface Answer {
  question: Question;
  selectedId: string | null;
  correct: boolean;
}

export interface QuizSession {
  mode: QuizMode;
  hostName?: string;
  testerName?: string;
  region: Region;
  questions: Question[];
  currentIndex: number;
  answers: Answer[];
}
