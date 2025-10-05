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
    
    const routine = new LearningRoutine();
    
    // 티어별 학습 로드맵 생성
    const roadmap = routine.generateTierRoadmap();
    
    // 현재 티어에 맞는 로드맵 필터링
    const currentRoadmap = roadmap.filter(road => road.tier <= currentTier + 5);
    const nextMilestone = roadmap.find(road => road.tier > currentTier);
    
    return NextResponse.json({
      success: true,
      data: {
        username,
        currentTier,
        roadmap: currentRoadmap,
        nextMilestone,
        totalRoadmaps: roadmap.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('학습 로드맵 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '학습 로드맵을 생성할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
