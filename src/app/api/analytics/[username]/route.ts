import { NextRequest, NextResponse } from 'next/server';
import { StatisticsAnalyzer } from '@/lib/statistics-analyzer';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const analyzer = new StatisticsAnalyzer();
    
    // 모든 통계 분석을 병렬로 실행
    const [
      tagAccuracy,
      levelSuccessRate,
      timePattern,
      progressMetrics,
      weakTags,
      levelPerformance,
      learningPriority,
      tierPrediction,
    ] = await Promise.all([
      analyzer.calculateTagAccuracy(username),
      analyzer.calculateLevelSuccessRate(username),
      analyzer.analyzeTimePattern(username),
      analyzer.trackProgress(username),
      analyzer.identifyWeakTags(username),
      analyzer.analyzeLevelPerformance(username),
      analyzer.calculateLearningPriority(username),
      analyzer.predictTierAchievement(username, 20), // 목표 티어 20
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        tagAccuracy: tagAccuracy.slice(0, 10), // 상위 10개만
        levelSuccessRate: levelSuccessRate.slice(0, 10), // 상위 10개만
        timePattern,
        progressMetrics,
        weakness: {
          weakTags,
          weakLevels: levelPerformance.weakLevels,
          strongLevels: levelPerformance.strongLevels,
          recommendedLevel: levelPerformance.recommendedLevel,
        },
        learningPriority,
        tierPrediction,
        summary: {
          totalAnalyzed: tagAccuracy.length + levelSuccessRate.length,
          weakAreas: weakTags.length,
          strongAreas: levelPerformance.strongLevels.length,
          recommendedFocus: learningPriority.highPriority.slice(0, 3),
        },
      },
    });
  } catch (error) {
    console.error('통계 분석 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '통계 분석을 수행할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
