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
    
    const gptService = new GPTService();
    const solvedAcAPI = new SolvedAcAPI();
    const analyzer = new StatisticsAnalyzer();
    
    // 사용자 데이터 수집
    const [userInfo, analytics] = await Promise.all([
      solvedAcAPI.getUserInfo(username),
      analyzer.calculateTagAccuracy(username),
    ]);
    
    // GPT 분석 생성
    const analysis = await gptService.generateLearningAnalysis(
      username,
      userInfo,
      { tagAccuracy: analytics }
    );
    
    return NextResponse.json({
      success: true,
      data: {
        analysis,
        userInfo: {
          username: userInfo.handle,
          tier: userInfo.tier,
          solvedCount: userInfo.solvedCount,
        },
        analytics: {
          tagAccuracy: analytics.slice(0, 10),
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('GPT 분석 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'GPT 분석을 생성할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
