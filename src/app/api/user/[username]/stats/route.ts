import { NextRequest, NextResponse } from 'next/server';
import { SolvedAcAPI } from '@/lib/solved-ac-api';
import { BojAnalyzer } from '@/lib/boj-analyzer';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const solvedAcAPI = new SolvedAcAPI();
    const analyzer = new BojAnalyzer();
    
    // 사용자 기본 정보
    const userInfo = await solvedAcAPI.getUserInfo(username);
    
    // 통계 정보
    const statistics = await solvedAcAPI.getUserStatistics(username);
    
    // 약점 분석
    const weakness = await analyzer.analyzeWeakness(username);
    
    // 학습 진도
    const progress = await analyzer.analyzeProgress(username);
    
    return NextResponse.json({
      success: true,
      data: {
        user: {
          username: userInfo.handle,
          tier: userInfo.tier,
          rating: userInfo.rating,
          solvedCount: userInfo.solvedCount,
          class: userInfo.class,
        },
        statistics: {
          totalSolved: statistics.totalSolved,
          tagStatistics: statistics.tagStatistics,
          levelDistribution: statistics.levelDistribution,
        },
        weakness: {
          weakTags: weakness.weakTags,
          weakLevels: weakness.weakLevels,
          recommendations: {
            tags: weakness.recommendations.tags,
            levelRange: weakness.recommendations.levelRange,
          },
        },
        progress: {
          currentTier: progress.currentTier,
          targetTier: progress.targetTier,
          progressPercentage: progress.progressPercentage,
          nextMilestone: progress.nextMilestone,
          recommendedActions: progress.recommendedActions,
        },
      },
    });
  } catch (error) {
    console.error('사용자 통계 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '사용자 통계를 조회할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
