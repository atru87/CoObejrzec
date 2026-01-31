import { NextRequest, NextResponse } from 'next/server';
import { getRecommendation, getMultipleRecommendations } from '@/lib/recommendation-engine';
import { QuizAnswers } from '@/lib/types';

/**
 * POST /api/recommend
 * Zwraca 10 rekomendacji filmów na podstawie odpowiedzi z quizu
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, excludeIds = [], count = 10 } = body;

    if (!answers) {
      return NextResponse.json(
        { error: 'Missing quiz answers' },
        { status: 400 }
      );
    }

    const recommendations = await getMultipleRecommendations(answers as QuizAnswers, excludeIds, count);
    
    if (!recommendations || recommendations.length === 0) {
      return NextResponse.json(
        { error: 'No matching movies found. Try adjusting your preferences.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      movies: recommendations.map(r => r.movie),
      reasons: recommendations[0]?.reasons || [],
      count: recommendations.length
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
