'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizAnswers, QuizQuestion } from '@/lib/types';
import QuizQuestionComponent from './QuizQuestion';
import ProgressBar from './ProgressBar';

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'genres',
    question: 'Jaki gatunek Cię interesuje?',
    subtitle: 'Możesz wybrać kilka',
    type: 'multiple',
    options: [
      { value: 'Komedia', label: 'Komedia', icon: '😄' },
      { value: 'Dramat', label: 'Dramat', icon: '🎭' },
      { value: 'Akcja', label: 'Akcja', icon: '💥' },
      { value: 'Horror', label: 'Horror', icon: '👻' },
      { value: 'Sci-Fi', label: 'Sci-Fi', icon: '🚀' },
      { value: 'Romans', label: 'Romans', icon: '💕' },
      { value: 'Thriller', label: 'Thriller', icon: '🔪' },
      { value: 'Animacja', label: 'Animacja', icon: '🎨' },
      { value: 'Przygodowy', label: 'Przygodowy', icon: '🗺️' },
      { value: 'Kryminał', label: 'Kryminał', icon: '🔎' },
      { value: 'any', label: 'Wszystko jedno', icon: '🎲' },
    ],
  },
  {
    id: 'era',
    question: 'Z jakiego okresu?',
    type: 'buttons',
    options: [
      { value: 'modern', label: 'Nowsze (2010+)', description: 'Świeże produkcje' },
      { value: 'old', label: 'Klasyki (przed 2000)', description: 'Sprawdzone filmy' },
      { value: 'any', label: 'Wszystko jedno', description: 'Każda era' },
    ],
  },
  {
    id: 'rating',
    question: 'Jak wysoko oceniane?',
    type: 'buttons',
    options: [
      { value: 'high', label: 'Wysoko (7.5+)', description: 'Tylko najlepsze' },
      { value: 'medium', label: 'Średnio (6+)', description: 'Solidne filmy' },
      { value: 'any', label: 'Wszystko jedno', description: 'Każda ocena' },
    ],
  },
  {
    id: 'popularity',
    question: 'Popularność?',
    type: 'buttons',
    options: [
      { value: 'popular', label: 'Popularne', description: 'Znane tytuły' },
      { value: 'niche', label: 'Ukryte perełki', description: 'Mniej znane' },
      { value: 'any', label: 'Wszystko jedno', description: 'Nie ma znaczenia' },
    ],
  },
  {
    id: 'origin',
    question: 'Polskie czy zagraniczne?',
    type: 'buttons',
    options: [
      { value: 'polish', label: 'Polskie', icon: '🇵🇱' },
      { value: 'foreign', label: 'Zagraniczne', icon: '🌍' },
      { value: 'any', label: 'Wszystko jedno', icon: '🎬' },
    ],
  },
];

const LOADING_MESSAGES = [
  "🎬 Wrzucam filmy na bęben...",
  "🎭 Dobieram obsadę...",
  "🎨 Przygotowuję popcorn...",
  "📽️ Ustawiam projektor...",
  "🎪 Sprawdzam co leci w kinie...",
  "🎯 Celuję w idealne dopasowanie...",
  "🔮 Konsultuję się z krytykami...",
  "🎲 Losuje z topki...",
  "🍿 Podgrzewam popcorn...",
  "🎸 Szukam najlepszego soundtracku...",
  "🌟 Przeczesuje IMDb...",
  "🎥 Nakręcam zwiastun...",
  "📚 Czytam recenzje...",
  "🎭 Przebieramy się za bohaterów...",
  "🔍 Śledzę tropy...",
  "🎬 Klapka, akcja!...",
  "🌈 Mieszam gatunki...",
  "⭐ Zliczam gwiazdki...",
  "🎪 Otwieram sezon kinowy...",
  "🎨 Maluję plakaty...",
  "📽️ Przewijam taśmę...",
  "🎯 Szukam ukrytych perełek...",
  "🍕 Zamawianie pizzy dla ekipy...",
  "🎬 Montowanie scen...",
  "🎵 Dobieranie ścieżki dźwiękowej...",
  "🏆 Sprawdzanie nagród...",
  "🎭 Czytanie scenariusza...",
  "🌟 Polerowanie Oscar'ów...",
  "📺 Sprawdzanie VOD...",
  "🎪 Rozkładanie czerwonego dywanu...",
];

interface QuizProps {
  onComplete: (answers: QuizAnswers) => void;
}

export default function Quiz({ onComplete }: QuizProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({
    genres: [],
  });

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const isLastQuestion = currentStep === QUIZ_QUESTIONS.length - 1;
  const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

  const handleAnswer = (value: string | string[]) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: value,
    };
    setAnswers(newAnswers);

    // Auto-przejście dla single choice
    if (currentQuestion.type === 'buttons' || currentQuestion.type === 'single') {
      setTimeout(() => {
        if (isLastQuestion) {
          // Upewnij się że wszystkie pola są wypełnione
          const genresValue = Array.isArray(newAnswers.genres) ? newAnswers.genres : [];
          const completeAnswers: QuizAnswers = {
            genres: genresValue.length === 0 ? ['any'] : genresValue,
            era: newAnswers.era || 'any',
            rating: newAnswers.rating || 'any',
            popularity: newAnswers.popularity || 'any',
            origin: newAnswers.origin || 'any',
          };
          onComplete(completeAnswers);
        } else {
          setCurrentStep(currentStep + 1);
        }
      }, 300);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const genresValue = Array.isArray(answers.genres) ? answers.genres : [];
      const completeAnswers: QuizAnswers = {
        genres: genresValue.length === 0 ? ['any'] : genresValue,
        era: answers.era || 'any',
        rating: answers.rating || 'any',
        popularity: answers.popularity || 'any',
        origin: answers.origin || 'any',
      };
      onComplete(completeAnswers);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    const answer = answers[currentQuestion.id];
    if (!answer) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    return true;
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <ProgressBar progress={progress} currentStep={currentStep + 1} totalSteps={QUIZ_QUESTIONS.length} />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="mt-12"
        >
          <QuizQuestionComponent
            question={currentQuestion}
            value={answers[currentQuestion.id]}
            onChange={handleAnswer}
          />
          
          <div className="flex gap-4 mt-8">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 
                         transition-all duration-200 font-medium text-gray-700"
              >
                ← Wstecz
              </button>
            )}
            {currentQuestion.type === 'multiple' && (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 
                         text-white font-medium hover:from-primary-600 hover:to-primary-700
                         disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
                         transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLastQuestion ? 'Znajdź filmy 🎬' : 'Dalej →'}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
