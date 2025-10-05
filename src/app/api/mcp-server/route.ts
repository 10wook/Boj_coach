import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // MCP 서버 정보
  const mcpInfo = {
    name: 'BOJ Coach MCP Server',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    description: 'Model Context Protocol server for BOJ (Baekjoon Online Judge) coaching',
    
    // 사용 가능한 도구들
    tools: {
      get_user_info: {
        description: '백준 사용자 기본 정보 조회',
        endpoint: '/api/user/{username}',
        method: 'GET'
      },
      get_user_stats: {
        description: '백준 사용자 상세 통계 조회', 
        endpoint: '/api/user/{username}/stats',
        method: 'GET'
      }
    },
    
    // 기본 엔드포인트들
    endpoints: {
      base_url: 'https://boj-coach-m4pplcphv-10wooks-projects.vercel.app',
      health_check: '/api/health',
      user_info: '/api/user/{username}',
      user_stats: '/api/user/{username}/stats'
    },
    
    // 사용 예시
    examples: {
      user_info: '/api/user/10wook',
      user_stats: '/api/user/10wook/stats'
    }
  };
  
  const response = NextResponse.json(mcpInfo);
  
  // CORS 헤더
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // MCP 요청 처리 로직
    let responseData = {};
    
    if (body.method === 'get_user_info' && body.username) {
      // 사용자 정보 API 호출
      const userApiUrl = `https://boj-coach-m4pplcphv-10wooks-projects.vercel.app/api/user/${body.username}`;
      const userResponse = await fetch(userApiUrl);
      responseData = await userResponse.json();
    } 
    else if (body.method === 'get_user_stats' && body.username) {
      // 사용자 통계 API 호출
      const statsApiUrl = `https://boj-coach-m4pplcphv-10wooks-projects.vercel.app/api/user/${body.username}/stats`;
      const statsResponse = await fetch(statsApiUrl);
      responseData = await statsResponse.json();
    }
    else {
      responseData = {
        error: 'Invalid method or missing parameters',
        available_methods: ['get_user_info', 'get_user_stats'],
        required_params: { username: 'string' }
      };
    }
    
    const response = NextResponse.json({
      mcp_response: true,
      timestamp: new Date().toISOString(),
      request: body,
      data: responseData
    });
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
    
  } catch (error) {
    const errorResponse = NextResponse.json(
      {
        error: 'MCP request processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
    
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}