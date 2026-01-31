// Typy dla całej aplikacji

export interface Movie {
  id: number;
  title: string;
  title_pl: string | null;
  title_original: string;
  description: string;
  poster: string | null;
  backdrop: string | null;
  year: number | null;
  rating: number;
  vote_count: number;
  popularity: number;
  runtime: number | null;
  is_polish: boolean;
  genres: string[];
  countries: string[];
  keywords?: string[];
}

export interface QuizAnswers {
  genres: string[];
  era: 'old' | 'modern' | 'any';
  rating: 'high' | 'medium' | 'any';
  popularity: 'popular' | 'niche' | 'any';
  origin: 'polish' | 'foreign' | 'any';
}

export interface QuizQuestion {
  id: keyof QuizAnswers;
  question: string;
  subtitle?: string;
  type: 'single' | 'multiple' | 'buttons';
  options: QuizOption[];
}

export interface QuizOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

export interface RecommendationResult {
  movie: Movie;
  score: number;
  reasons: string[];
}

export interface SessionState {
  quizAnswers: Partial<QuizAnswers> | null;
  rejectedMovies: number[];
  watchLater: Movie[];
  currentRecommendation: Movie | null;
  recommendationCount: number;
  
  setQuizAnswers: (answers: QuizAnswers) => void;
  rejectMovie: (movieId: number) => void;
  addToWatchLater: (movie: Movie) => void;
  removeFromWatchLater: (movieId: number) => void;
  setCurrentRecommendation: (movie: Movie | null) => void;
  incrementRecommendationCount: () => void;
  resetSession: () => void;
}
