import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const mcpInfo = {
    name: 'BOJ Coach MCP Server',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      base: 'https://boj-coach-m4pplcphv-10wooks-projects.vercel.app',
      userInfo: '/api/user/{username}',
      userStats: '/api/user/{username}/stats',
      health: '/api/health'
    },
    tools: [
      'get_user_info',
      'get_user_stats', 
      'analyze_performance'
    ]
  };
  
  const response = NextResponse.json(mcpInfo);
  
  // CORS 헤더 추가
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = NextResponse.json({
      message: 'MCP POST endpoint working',
      received: body,
      timestamp: new Date().toISOString()
    });
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    const errorResponse = NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}