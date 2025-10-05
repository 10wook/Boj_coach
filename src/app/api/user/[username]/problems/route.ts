import { NextRequest, NextResponse } from 'next/server';
import { SolvedAcAPI } from '@/lib/solved-ac-api';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const solvedAcAPI = new SolvedAcAPI();
    const problems = await solvedAcAPI.getUserProblems(username, page, limit);
    
    return NextResponse.json({
      success: true,
      data: {
        totalCount: problems.count,
        problems: problems.items.map(problem => ({
          problemId: problem.problemId,
          title: problem.titleKo,
          level: problem.level,
          tags: problem.tags.map(tag => ({
            key: tag.key,
            name: tag.displayNames.find(dn => dn.language === 'ko')?.name || tag.key,
          })),
          acceptedUserCount: problem.acceptedUserCount,
          averageTries: problem.averageTries,
        })),
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(problems.count / limit),
        },
      },
    });
  } catch (error) {
    console.error('사용자 문제 목록 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '사용자 문제 목록을 조회할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
