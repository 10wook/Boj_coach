import { NextRequest, NextResponse } from 'next/server';
import { GPTService } from '@/lib/gpt-service';
import { SolvedAcAPI } from '@/lib/solved-ac-api';
import { StatisticsAnalyzer } from '@/lib/statistics-analyzer';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const { searchParams } = new URL(request.url);
    const planType = searchParams.get('type') || 'weekly';
    
    const gptService = new GPTService();
    const solvedAcAPI = new SolvedAcAPI();
    const analyzer = new StatisticsAnalyzer();
    
    // 사용자 데이터 수집
    const [userInfo, weakness] = await Promise.all([
      solvedAcAPI.getUserInfo(username),
      analyzer.identifyWeakTags(username),
    ]);
    
    // GPT 학습 계획 생성
    const studyPlan = await gptService.generateWeeklyStudyPlan(
      username,
      userInfo,
      { weakTags: weakness, weakLevels: [] }
    );
    
    return NextResponse.json({
      success: true,
      data: {
        planType,
        studyPlan,
        userInfo: {
          username: userInfo.handle,
          tier: userInfo.tier,
          solvedCount: userInfo.solvedCount,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('GPT 학습 계획 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'GPT 학습 계획을 생성할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
