import { NextRequest, NextResponse } from 'next/server';
import { BojAnalyzer } from '@/lib/boj-analyzer';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '10');
    
    const analyzer = new BojAnalyzer();
    
    // 맞춤형 문제 추천
    const recommendations = await analyzer.getPersonalizedRecommendations(username, count);
    
    // 주간 학습 계획
    const weeklyPlan = await analyzer.generateWeeklyPlan(username);
    
    return NextResponse.json({
      success: true,
      data: {
        recommendations: recommendations.map(problem => ({
          problemId: problem.problemId,
          title: problem.titleKo,
          level: problem.level,
          tags: problem.tags.map(tag => ({
            key: tag.key,
            name: tag.displayNames.find(dn => dn.language === 'ko')?.name || tag.key,
          })),
          acceptedUserCount: problem.acceptedUserCount,
          averageTries: problem.averageTries,
        })),
        weeklyPlan: {
          weekGoal: weeklyPlan.weekGoal,
          dailyTargets: weeklyPlan.dailyTargets,
          focusAreas: weeklyPlan.focusAreas,
        },
      },
    });
  } catch (error) {
    console.error('추천 문제 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '추천 문제를 조회할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
