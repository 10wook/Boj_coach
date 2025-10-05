import { NextRequest, NextResponse } from 'next/server';
import { StatisticsAnalyzer } from '@/lib/statistics-analyzer';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const analyzer = new StatisticsAnalyzer();
    
    // 종합 인사이트 분석
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
      analyzer.predictTierAchievement(username, 20),
    ]);
    
    // 인사이트 생성
    const insights = {
      performance: {
        bestTag: tagAccuracy[0]?.tag || '없음',
        bestTagAccuracy: tagAccuracy[0]?.accuracy || 0,
        worstTag: tagAccuracy[tagAccuracy.length - 1]?.tag || '없음',
        worstTagAccuracy: tagAccuracy[tagAccuracy.length - 1]?.accuracy || 0,
        strongestLevel: levelPerformance.strongLevels[0] || 0,
        weakestLevel: levelPerformance.weakLevels[0] || 0,
      },
      patterns: {
        mostProductiveHour: timePattern.reduce((max, current) => 
          current.solvedCount > max.solvedCount ? current : max
        ).hour,
        preferredTags: timePattern.reduce((acc, current) => {
          current.preferredTags.forEach(tag => {
            acc[tag] = (acc[tag] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>),
        learningStreak: progressMetrics.streakInfo.currentStreak,
        weeklyConsistency: progressMetrics.monthlyTrend.solvedCount.slice(-7),
      },
      recommendations: {
        immediate: [
          `${weakTags.slice(0, 2).join(', ')} 태그 집중 학습`,
          `레벨 ${levelPerformance.recommendedLevel} 문제 풀이`,
          '기초 문제 복습',
        ],
        weekly: [
          '약점 태그별 5문제씩 풀이',
          '새로운 태그 1개 도전',
          '복습 및 정리 시간 확보',
        ],
        monthly: [
          '전체적인 실력 향상',
          '고급 문제 도전',
          '다양한 태그 경험',
        ],
      },
      goals: {
        shortTerm: {
          target: '1주일 내 약점 태그 2개 개선',
          problems: 15,
          focus: weakTags.slice(0, 2),
        },
        mediumTerm: {
          target: '1개월 내 목표 티어 달성',
          problems: tierPrediction.requiredProblems,
          focus: learningPriority.highPriority,
        },
        longTerm: {
          target: '3개월 내 종합 실력 향상',
          problems: tierPrediction.requiredProblems * 3,
          focus: '다양한 태그와 난이도',
        },
      },
    };
    
    return NextResponse.json({
      success: true,
      data: {
        insights,
        summary: {
          totalAnalyzed: tagAccuracy.length + levelSuccessRate.length,
          weakAreas: weakTags.length,
          strongAreas: levelPerformance.strongLevels.length,
          recommendedFocus: learningPriority.highPriority.slice(0, 3),
          confidence: tierPrediction.confidence,
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('인사이트 분석 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '인사이트 분석을 수행할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
