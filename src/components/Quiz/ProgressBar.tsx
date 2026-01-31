'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ progress, currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">
          Pytanie {currentStep} z {totalSteps}
        </span>
        <span className="text-sm font-medium text-primary-600">
          {Math.round(progress)}%
        </span>
      </div>
      
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
