import { NextRequest, NextResponse } from 'next/server';
import { SolvedAcAPI } from '@/lib/solved-ac-api';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const solvedAcAPI = new SolvedAcAPI();
    
    const userInfo = await solvedAcAPI.getUserInfo(username);
    
    return NextResponse.json({
      success: true,
      data: {
        username: userInfo.handle,
        tier: userInfo.tier,
        rating: userInfo.rating,
        solvedCount: userInfo.solvedCount,
        class: userInfo.class,
        exp: userInfo.exp,
        rank: userInfo.rank,
        profileImageUrl: userInfo.profileImageUrl,
        bio: userInfo.bio,
      },
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '사용자 정보를 조회할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
