'use client';

import { motion } from 'framer-motion';
import { QuizQuestion, QuizOption } from '@/lib/types';

interface QuizQuestionProps {
  question: QuizQuestion;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}

export default function QuizQuestionComponent({ question, value, onChange }: QuizQuestionProps) {
  const isMultiple = question.type === 'multiple';
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const handleOptionClick = (optionValue: string) => {
    if (isMultiple) {
      // Multiple choice
      const currentValues = Array.isArray(value) ? value : [];
      
      // "Wszystko jedno" wyłącza inne opcje
      if (optionValue === 'any') {
        onChange(['any']);
        return;
      }
      
      // Kliknięcie innej opcji gdy jest "any" - usuń "any"
      const withoutAny = currentValues.filter(v => v !== 'any');
      
      if (currentValues.includes(optionValue)) {
        const newValues = withoutAny.filter(v => v !== optionValue);
        onChange(newValues.length > 0 ? newValues : []);
      } else {
        onChange([...withoutAny, optionValue]);
      }
    } else {
      // Single choice
      onChange(optionValue);
    }
  };

  const isSelected = (optionValue: string) => {
    return selectedValues.includes(optionValue);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {question.question}
        </h2>
        {question.subtitle && (
          <p className="text-gray-500 text-sm">
            {question.subtitle}
          </p>
        )}
      </div>

      <div className={`grid gap-3 ${
        question.type === 'buttons' 
          ? 'grid-cols-1' 
          : 'grid-cols-2 sm:grid-cols-3'
      }`}>
        {question.options.map((option, index) => (
          <motion.button
            key={option.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleOptionClick(option.value)}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200
              ${isSelected(option.value)
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
              }
              ${question.type === 'buttons' ? 'text-left' : 'text-center'}
            `}
          >
            {option.icon && (
              <div className={`text-3xl mb-2 ${question.type === 'buttons' ? 'inline-block mr-3' : 'block'}`}>
                {option.icon}
              </div>
            )}
            <div className={question.type === 'buttons' ? 'inline-block align-middle' : 'block'}>
              <div className="font-semibold text-gray-900">
                {option.label}
              </div>
              {option.description && (
                <div className="text-sm text-gray-500 mt-1">
                  {option.description}
                </div>
              )}
            </div>
            
            {isSelected(option.value) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-6 h-6 bg-primary-500 rounded-full 
                         flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
