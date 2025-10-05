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
    const [userInfo, progress] = await Promise.all([
      solvedAcAPI.getUserInfo(username),
      analyzer.trackProgress(username),
    ]);
    
    // GPT 동기부여 메시지 생성
    const motivation = await gptService.generateMotivationMessage(
      username,
      userInfo,
      {
        streak: progress.streakInfo.currentStreak,
        weeklySolved: progress.currentWeek.solvedCount,
      }
    );
    
    return NextResponse.json({
      success: true,
      data: {
        motivation,
        userInfo: {
          username: userInfo.handle,
          tier: userInfo.tier,
          solvedCount: userInfo.solvedCount,
        },
        progress: {
          currentStreak: progress.streakInfo.currentStreak,
          weeklySolved: progress.currentWeek.solvedCount,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('GPT 동기부여 메시지 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'GPT 동기부여 메시지를 생성할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
