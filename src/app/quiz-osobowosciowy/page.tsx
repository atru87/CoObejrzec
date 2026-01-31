'use client';

import { useState } from 'react';
import Link from 'next/link';

const MOVIE_PERSONALITIES = [
  {
    type: 'Akcja',
    title: 'Jesteś jak "Mad Max: Na drodze gniewu"',
    description: 'Pędzisz przez życie jak Furiosa przez pustynię. Nie lubisz nudy, jesteś dynamiczny i zawsze gotowy na wyzwania.',
    traits: ['Odważny', 'Dynamiczny', 'Nieprzewidywalny'],
    emoji: '💥'
  },
  {
    type: 'Dramat',
    title: 'Jesteś jak "Ojciec chrzestny"',
    description: 'Głęboki, refleksyjny, cenisz rodzinę i lojalność. Lubisz filozofować o życiu przy lampce wina.',
    traits: ['Refleksyjny', 'Lojalny', 'Mądry'],
    emoji: '🎭'
  },
  {
    type: 'Komedia',
    title: 'Jesteś jak "Kac Vegas"',
    description: 'Życie to impreza! Uwielbiasz śmiech, absurd i spontaniczne przygody. Nigdy nie wiesz, co przyniesie jutro.',
    traits: ['Wesoły', 'Spontaniczny', 'Towarzyski'],
    emoji: '😂'
  },
  {
    type: 'Sci-Fi',
    title: 'Jesteś jak "Interstellar"',
    description: 'Myślisz w kategoriach kosmosu. Jesteś wizjonerem, który patrzy w przyszłość i marzy o wielkości.',
    traits: ['Wizjoner', 'Analityczny', 'Ciekawy świata'],
    emoji: '🚀'
  },
  {
    type: 'Horror',
    title: 'Jesteś jak "Get Out"',
    description: 'Lubisz adrenalinę i nieoczekiwane zwroty akcji. Jesteś czujny i dostrzegasz rzeczy, których inni nie widzą.',
    traits: ['Czujny', 'Odważny', 'Przenikliwy'],
    emoji: '😱'
  }
];

export default function QuizOsobowosciowyPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<typeof MOVIE_PERSONALITIES[0] | null>(null);

  const questions = [
    {
      q: 'Jakie jest Twoje idealne piątkowe popołudnie?',
      options: [
        { text: 'Skok na spadochronie', type: 'Akcja' },
        { text: 'Czytanie filozofii przy kawie', type: 'Dramat' },
        { text: 'Impreza ze znajomymi', type: 'Komedia' },
        { text: 'Oglądanie dokumentu o kosmosie', type: 'Sci-Fi' },
        { text: 'Zwiedzanie opuszczonego budynku', type: 'Horror' }
      ]
    },
    {
      q: 'Co Cię najbardziej motywuje?',
      options: [
        { text: 'Adrenalina i wyzwania', type: 'Akcja' },
        { text: 'Głębokie relacje z ludźmi', type: 'Dramat' },
        { text: 'Śmiech i dobra zabawa', type: 'Komedia' },
        { text: 'Odkrywanie tajemnic wszechświata', type: 'Sci-Fi' },
        { text: 'Przekraczanie granic komfortu', type: 'Horror' }
      ]
    },
    {
      q: 'Jak reagujesz na stres?',
      options: [
        { text: 'Działam natychmiast', type: 'Akcja' },
        { text: 'Reflektuję i analizuję', type: 'Dramat' },
        { text: 'Żartuję sobie z tego', type: 'Komedia' },
        { text: 'Szukam logicznych rozwiązań', type: 'Sci-Fi' },
        { text: 'Staję twarzą w twarz z problemem', type: 'Horror' }
      ]
    }
  ];

  const handleAnswer = (type: string) => {
    const newAnswers = [...answers, type];
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Oblicz wynik
      const counts: { [key: string]: number } = {};
      newAnswers.forEach(a => {
        counts[a] = (counts[a] || 0) + 1;
      });
      
      const winner = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
      const personality = MOVIE_PERSONALITIES.find(p => p.type === winner) || MOVIE_PERSONALITIES[0];
      setResult(personality);
    }
  };

  const resetQuiz = () => {
    setStep(0);
    setAnswers([]);
    setResult(null);
  };

  if (result) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-12 text-white text-center shadow-2xl">
          <div className="text-8xl mb-6">{result.emoji}</div>
          <h1 className="text-4xl font-black mb-4">{result.title}</h1>
          <p className="text-xl mb-8 opacity-90">{result.description}</p>
          
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {result.traits.map((trait, i) => (
              <span key={i} className="px-4 py-2 bg-white/20 rounded-full text-sm font-bold">
                {trait}
              </span>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={resetQuiz}
              className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-opacity-90 transition-all"
            >
              Rozwiąż ponownie
            </button>
            <Link
              href="/"
              className="px-8 py-3 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition-all"
            >
              Znajdź film dla siebie
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-900 mb-4">🎬 Jakim filmem jesteś?</h1>
        <p className="text-gray-600">Odpowiedz na 3 pytania i odkryj swoją filmową osobowość</p>
        <div className="mt-6 flex gap-2 justify-center">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-16 rounded-full ${i <= step ? 'bg-indigo-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{questions[step].q}</h2>
        
        <div className="space-y-3">
          {questions[step].options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(option.type)}
              className="w-full p-4 text-left border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all font-medium"
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
