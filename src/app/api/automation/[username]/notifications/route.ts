import { NextRequest, NextResponse } from 'next/server';
import { AutomationService } from '@/lib/automation-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const { searchParams } = new URL(request.url);
    const currentStreak = parseInt(searchParams.get('currentStreak') || '1');
    const todayGoals = searchParams.get('todayGoals')?.split(',') || [];
    
    const automation = new AutomationService();
    
    // 일일 학습 알림 생성
    const notifications = automation.generateDailyNotifications(
      username,
      currentStreak,
      todayGoals
    );
    
    return NextResponse.json({
      success: true,
      data: {
        username,
        notifications,
        totalNotifications: notifications.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('학습 알림 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '학습 알림을 생성할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
