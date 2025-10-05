import { NextRequest, NextResponse } from 'next/server';
import { RecommendationEngine } from '@/lib/recommendation-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily';
    const focus = searchParams.get('focus')?.split(',') || [];
    const difficulty = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' | 'mixed' || 'mixed';
    const count = parseInt(searchParams.get('count') || '10');
    
    const engine = new RecommendationEngine();
    
    let recommendations;
    
    switch (type) {
      case 'daily':
        recommendations = await engine.generateDailyRecommendations(username);
        break;
      case 'weekly':
        recommendations = await engine.generateWeeklyRecommendations(username);
        break;
      case 'monthly':
        recommendations = await engine.generateMonthlyRecommendations(username);
        break;
      case 'custom':
        recommendations = await engine.generateCustomRecommendations(
          username,
          focus,
          difficulty,
          count
        );
        break;
      default:
        recommendations = await engine.generateDailyRecommendations(username);
    }
    
    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('GPT 추천 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'GPT 추천을 생성할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
