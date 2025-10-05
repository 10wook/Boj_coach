import { NextRequest, NextResponse } from 'next/server';
import { AutomationService } from '@/lib/automation-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const automation = new AutomationService();
    
    // 진도 체크 수행
    const progressCheck = await automation.performProgressCheck(username, date);
    
    return NextResponse.json({
      success: true,
      data: {
        username,
        progressCheck,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('진도 체크 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '진도 체크를 수행할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
