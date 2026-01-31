'use client';

import { useEffect, useState } from 'react';

interface ViewCounterProps {
  page: string; // 'home', 'quiz', 'recommendation'
}

export default function ViewCounter({ page }: ViewCounterProps) {
  const [views, setViews] = useState<number>(0);
  const [isUnique, setIsUnique] = useState<boolean>(false);

  useEffect(() => {
    // Klucz dla tej strony
    const view