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
    
    return NextResponse.json({
      success: true,
      data: statsData
    });
  } catch (error) {
    console.error('사용자 통계 조회 오류:', error);
    const err = error as any;
    return NextResponse.json(
      {
        success: false,
        error: '사용자 통계를 조회할 수 없습니다.',
        details: err.message
      },
      { status: err.response?.status || 500 }
    );
  }
}
