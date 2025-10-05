import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const isMcp = url.searchParams.get('mcp') === 'true';
  
  if (isMcp) {
    // MCP 서버 정보 제공
    const mcpData = {
      name: 'BOJ Coach MCP Server',
      version: '1.0.0',
      status: 'online',
      timestamp: new Date().toISOString(),
      description: 'Model Context Protocol server for BOJ coaching',
      
      endpoints: {
        base_url: 'https://boj-coach-m4pplcphv-10wooks-projects.vercel.app',
        user_info: '/api/user/{username}',
        user_stats: '/api/user/{username}/stats',
        health: '/api/health'
      },
      
      tools: {
        get_user_info: {
          description: '백준 사용자 기본 정보 조회',
          url_template: 'https://boj-coach-m4pplcphv-10wooks-projects.vercel.app/api/user/{username}',
          method: 'GET'
        },
        get_user_stats: {
          description: '백준 사용자 상세 통계 조회',
          url_template: 'https://boj-coach-m4pplcphv-10wooks-projects.vercel.app/api/user/{username}/stats',
          method: 'GET'
        }
      },
      
      examples: {
        user_10wook: 'https://boj-coach-m4pplcphv-10wooks-projects.vercel.app/api/user/10wook',
        stats_10wook: 'https://boj-coach-m4pplcphv-10wooks-projects.vercel.app/api/user/10wook/stats'
      }
    };
    
    const response = NextResponse.json(mcpData);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
  }
  
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  
  const response = NextResponse.json(healthData);
  
  // CORS 헤더 추가
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
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