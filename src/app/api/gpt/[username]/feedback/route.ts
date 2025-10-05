import { NextRequest, NextResponse } from 'next/server';
import { RecommendationEngine } from '@/lib/recommendation-engine';

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const body = await request.json();
    const { recommendationId, feedback, rating } = body;
    
    if (!recommendationId || !feedback) {
      return NextResponse.json(
        {
          success: false,
          error: '추천 ID와 피드백이 필요합니다.',
        },
        { status: 400 }
      );
    }
    
    const engine = new RecommendationEngine();
    
    // 추천 성능 평가
    await engine.evaluateRecommendationPerformance(
      username,
      recommendationId,
      feedback
    );
    
    return NextResponse.json({
      success: true,
      message: '피드백이 성공적으로 저장되었습니다.',
      data: {
        recommendationId,
        feedback,
        rating,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('피드백 저장 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '피드백을 저장할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const engine = new RecommendationEngine();
    
    // 추천 히스토리 조회
    const history = await engine.getRecommendationHistory(username, limit);
    
    // 추천 통계 조회
    const stats = await engine.getRecommendationStats(username);
    
    return NextResponse.json({
      success: true,
      data: {
        history,
        stats,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('추천 히스토리 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '추천 히스토리를 조회할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
