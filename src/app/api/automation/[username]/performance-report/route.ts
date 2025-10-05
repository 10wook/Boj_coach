import { NextRequest, NextResponse } from 'next/server';
import { AutomationService } from '@/lib/automation-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' || 'weekly';
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();
    
    const automation = new AutomationService();
    
    // 성과 리포트 생성
    const performanceReport = automation.generatePerformanceReport(
      period,
      startDate,
      endDate,
      {
        solvedCount: Math.floor(Math.random() * 50) + 10,
        accuracy: Math.floor(Math.random() * 30) + 70,
        newTags: ['구현', '그래프', 'DP'],
        streak: Math.floor(Math.random() * 10) + 1,
        tierProgress: Math.floor(Math.random() * 20) + 10,
      }
    );
    
    return NextResponse.json({
      success: true,
      data: {
        username,
        performanceReport,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('성과 리포트 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '성과 리포트를 생성할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
