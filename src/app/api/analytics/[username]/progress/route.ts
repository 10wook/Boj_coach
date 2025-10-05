import { NextRequest, NextResponse } from 'next/server';
import { StatisticsAnalyzer } from '@/lib/statistics-analyzer';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const { searchParams } = new URL(request.url);
    const targetTier = parseInt(searchParams.get('targetTier') || '20');
    
    const analyzer = new StatisticsAnalyzer();
    
    // 진도 분석
    const [
      progressMetrics,
      tierPrediction,
      learningPriority,
    ] = await Promise.all([
      analyzer.trackProgress(username),
      analyzer.predictTierAchievement(username, targetTier),
      analyzer.calculateLearningPriority(username),
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        currentProgress: {
          week: progressMetrics.currentWeek,
          monthlyTrend: progressMetrics.monthlyTrend,
          streak: progressMetrics.streakInfo,
        },
        tierPrediction: {
          current: tierPrediction.currentTier,
          target: tierPrediction.targetTier,
          estimatedDays: tierPrediction.estimatedDays,
          requiredProblems: tierPrediction.requiredProblems,
          confidence: tierPrediction.confidence,
        },
        learningPlan: {
          priority: learningPriority,
          weeklyGoal: `${progressMetrics.currentWeek.solvedCount + 5}문제 풀이`,
          focusAreas: learningPriority.highPriority.slice(0, 3),
        },
        insights: {
          strengths: [
            `연속 ${progressMetrics.streakInfo.currentStreak}일 학습 중`,
            `${progressMetrics.currentWeek.newTags.length}개 새 태그 학습`,
            '꾸준한 진도 유지',
          ],
          improvements: [
            '약점 태그 집중 학습',
            '다양한 난이도 도전',
            '체계적인 복습 계획',
          ],
          recommendations: [
            '매일 일정한 시간 학습',
            '주간 목표 설정 및 달성',
            '월간 진도 점검',
          ],
        },
      },
    });
  } catch (error) {
    console.error('진도 분석 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '진도 분석을 수행할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
