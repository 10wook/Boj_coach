import { NextRequest, NextResponse } from 'next/server';
import { LearningRoutine } from '@/lib/learning-routine';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const { searchParams } = new URL(request.url);
    const currentTier = parseInt(searchParams.get('currentTier') || '1');
    const focusAreas = searchParams.get('focusAreas')?.split(',') || ['구현', '그래프'];
    const difficulty = searchParams.get('difficulty') as 'beginner' | 'intermediate' | 'advanced' || 'intermediate';
    
    const routine = new LearningRoutine();
    
    // 주간 학습 계획 생성
    const weeklyPlan = routine.generateWeeklyPlan(currentTier, focusAreas, difficulty);
    
    return NextResponse.json({
      success: true,
      data: {
        username,
        currentTier,
        weeklyPlan,
        focusAreas,
        difficulty,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('주간 학습 계획 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '주간 학습 계획을 생성할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
