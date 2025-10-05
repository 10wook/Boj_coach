import { NextRequest, NextResponse } from 'next/server';
import { LearningRoutine } from '@/lib/learning-routine';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    
    const routine = new LearningRoutine();
    
    // 복습 시스템 생성
    const reviewSystem = routine.generateReviewSystem();
    
    return NextResponse.json({
      success: true,
      data: {
        username,
        reviewSystem,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('복습 시스템 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '복습 시스템을 생성할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
