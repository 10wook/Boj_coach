import { NextRequest, NextResponse } from 'next/server';
import { SolvedacAPI } from '../../../../../lib/solvedac';
import { CacheManager } from '../../../../../lib/cache';

const solvedac = new SolvedacAPI();
const cache = new CacheManager();

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    
    // 캐시 확인
    let userData = await cache.getUserData(username);
    if (!userData) {
      userData = await solvedac.getUser(username);
      cache.cacheUserData(username, userData, 600);
    }
    
    const response = NextResponse.json({
      success: true,
      data: {
        username: userData.handle,
        tier: solvedac.getTierName(userData.tier),
        tierLevel: userData.tier,
        rating: userData.rating,
        ratingByProblemsSum: userData.ratingByProblemsSum,
        ratingByClass: userData.ratingByClass,
        solvedCount: userData.solvedCount,
        voteCount: userData.voteCount,
        class: userData.class,
        classDecoration: userData.classDecoration,
        rivalCount: userData.rivalCount,
        reverseRivalCount: userData.reverseRivalCount,
        maxStreak: userData.maxStreak,
        profileImageUrl: userData.profileImageUrl,
        backgroundId: userData.backgroundId
      }
    });
    
    // CORS 헤더 추가
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    const err = error as any;
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: '사용자 정보를 조회할 수 없습니다.',
        details: err.message
      },
      { status: err.response?.status || 500 }
    );
    
    // CORS 헤더 추가
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return errorResponse;
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
