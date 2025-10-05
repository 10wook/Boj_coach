import { NextRequest, NextResponse } from 'next/server';
import { AutomationService } from '@/lib/automation-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    
    const automation = new AutomationService();
    
    // 목표 달성 추적 생성
    const goalTracking = automation.createGoalTracking(
      'weekly',
      '주간 20문제 풀이',
      20,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    );
    
    return NextResponse.json({
      success: true,
      data: {
        username,
        goalTracking,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('목표 추적 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '목표 추적을 생성할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const body = await request.json();
    const { goalId, current, target } = body;
    
    if (!goalId || current === undefined || !target) {
      return NextResponse.json(
        {
          success: false,
          error: '목표 ID, 현재 값, 목표 값이 필요합니다.',
        },
        { status: 400 }
      );
    }
    
    const automation = new AutomationService();
    
    // 목표 진행률 업데이트
    const updatedGoal = automation.updateGoalProgress(goalId, current, target);
    
    return NextResponse.json({
      success: true,
      data: {
        username,
        updatedGoal,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('목표 업데이트 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '목표를 업데이트할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
