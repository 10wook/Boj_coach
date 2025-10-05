import { NextRequest, NextResponse } from 'next/server';
import { StatisticsAnalyzer } from '@/lib/statistics-analyzer';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const analyzer = new StatisticsAnalyzer();
    
    // 약점 분석
    const [
      weakTags,
      levelPerformance,
      learningPriority,
    ] = await Promise.all([
      analyzer.identifyWeakTags(username),
      analyzer.analyzeLevelPerformance(username),
      analyzer.calculateLearningPriority(username),
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        weakTags: {
          tags: weakTags,
          count: weakTags.length,
          severity: weakTags.length > 3 ? 'high' : weakTags.length > 1 ? 'medium' : 'low',
        },
        weakLevels: {
          levels: levelPerformance.weakLevels,
          count: levelPerformance.weakLevels.length,
          recommendedLevel: levelPerformance.recommendedLevel,
        },
        strongAreas: {
          levels: levelPerformance.strongLevels,
          count: levelPerformance.strongLevels.length,
        },
        learningPriority: {
          high: learningPriority.highPriority,
          medium: learningPriority.mediumPriority,
          low: learningPriority.lowPriority,
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
      },
    });
  } catch (error) {
    console.error('약점 분석 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '약점 분석을 수행할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
