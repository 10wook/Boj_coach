import { NextRequest, NextResponse } from 'next/server';
import { SolvedacAPI } from '../../../../../../lib/solvedac';
import { DataAnalyzer } from '@/lib/analyzer';
import { CacheManager } from '../../../../../../lib/cache';

const solvedac = new SolvedacAPI();
const analyzer = new DataAnalyzer();
const cache = new CacheManager();

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    
    let statsData = await cache.getUserStats(username);
    if (!statsData) {
      statsData = await solvedac.getUserStats(username);
      cache.cacheUserStats(username, statsData, 300);
    }
    
    const response = NextResponse.json({
      success: true,
      data: statsData
    });
    
    // CORS 헤더 추가
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('사용자 통계 조회 오류:', error);
    const err = error as any;
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: '사용자 통계를 조회할 수 없습니다.',
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
