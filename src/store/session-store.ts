import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SessionState, QuizAnswers, Movie } from '@/lib/types';

/**
 * Globalny stan sesji użytkownika
 * Używa localStorage do persystencji
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      quizAnswers: null,
      rejectedMovies: [],
      watchLater: [],
      currentRecommendation: null,
      recommendationCount: 0,
      
      setQuizAnswers: (answers: QuizAnswers) => {
        set({ quizAnswers: answers });
      },
      
      rejectMovie: (movieId: number) => {
        set((state) => ({
          rejectedMovies: [...state.rejectedMovies, movieId],
          recommendationCount: state.recommendationCount + 1
        }));
      },
      
      addToWatchLater: (movie: Movie) => {
        set((state) => {
          // Sprawdź czy już nie ma
          if (state.watchLater.some(m => m.id === movie.id)) {
            return state;
          }
          return {
            watchLater: [...state.watchLater, movie]
          };
        });
      },
      
      removeFromWatchLater: (movieId: number) => {
        set((state) => ({
          watchLater: state.watchLater.filter(m => m.id !== movieId)
        }));
      },
      
      setCurrentRecommendation: (movie: Movie | null) => {
        set({ currentRecommendation: movie });
      },
      
      incrementRecommendationCount: () => {
        set((state) => ({
          recommendationCount: state.recommendationCount + 1
        }));
      },
      
      resetSession: () => {
        set({
          quizAnswers: null,
          rejectedMovies: [],
          currentRecommendation: null,
          recommendationCount: 0
        });
      },
    }),
    {
      name: 'film-match-session',
      // Serializuj tylko proste typy (watchLater zostaje w localStorage)
      partialize: (state) => ({
        watchLater: state.watchLater,
      }),
    }
  )
);
