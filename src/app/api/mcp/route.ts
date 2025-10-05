import { NextRequest, NextResponse } from 'next/server';

// MCP (Model Context Protocol) 서버 엔드포인트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // MCP 요청 처리
    const response = await handleMCPRequest(body);
    
    const mcpResponse = NextResponse.json(response);
    
    // CORS 헤더 추가
    mcpResponse.headers.set('Access-Control-Allow-Origin', '*');
    mcpResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    mcpResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return mcpResponse;
  } catch (error) {
    console.error('MCP 요청 처리 오류:', error);
    
    const errorResponse = NextResponse.json(
      {
        error: 'MCP 요청 처리 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
    
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return errorResponse;
  }
}

export async function GET(request: NextRequest) {
  // MCP 서버 정보 제공
  const mcpInfo = {
    name: 'BOJ Coach MCP Server',
    version: '1.0.0',
    capabilities: {
      tools: [
        'get_user_info',
        'get_user_stats', 
        'analyze_performance',
        'get_recommendations'
      ]
    },
    endpoints: {
      base: process.env.VERCEL_URL || 'https://boj-coach-m4pplcphv-10wooks-projects.vercel.app',
      mcp: '/api/mcp'
    }
  };
  
  const response = NextResponse.json(mcpInfo);
  
  // CORS 헤더 추가
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
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

// MCP 요청 처리 함수
async function handleMCPRequest(request: any) {
  const { method, params } = request;
  
  switch (method) {
    case 'tools/list':
      return {
        tools: [
          {
            name: 'get_user_info',
            description: '백준 사용자 기본 정보 조회',
            inputSchema: {
              type: 'object',
              properties: {
                username: { type: 'string', description: '백준 사용자명' }
              },
              required: ['username']
            }
          },
          {
            name: 'get_user_stats',
            description: '백준 사용자 상세 통계 조회',
            inputSchema: {
              type: 'object',
              properties: {
                username: { type: 'string', description: '백준 사용자명' }
              },
              required: ['username']
            }
          },
          {
            name: 'analyze_performance',
            description: '사용자 성능 분석 및 약점 진단',
            inputSchema: {
              type: 'object',
              properties: {
                username: { type: 'string', description: '백준 사용자명' }
              },
              required: ['username']
            }
          },
          {
            name: 'get_recommendations',
            description: '맞춤형 문제 추천',
            inputSchema: {
              type: 'object',
              properties: {
                username: { type: 'string', description: '백준 사용자명' },
                difficulty: { type: 'string', description: '원하는 난이도 (easy/medium/hard)' }
              },
              required: ['username']
            }
          }
        ]
      };
      
    case 'tools/call':
      return await handleToolCall(params);
      
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

// 도구 호출 처리
async function handleToolCall(params: any) {
  const { name, arguments: args } = params;
  const baseUrl = process.env.VERCEL_URL || 'https://boj-coach-m4pplcphv-10wooks-projects.vercel.app';
  
  try {
    switch (name) {
      case 'get_user_info':
        const userResponse = await fetch(`${baseUrl}/api/user/${args.username}`);
        const userData = await userResponse.json();
        return {
          content: [
            {
              type: 'text',
              text: `사용자 ${args.username}의 기본 정보:\n${JSON.stringify(userData, null, 2)}`
            }
          ]
        };
        
      case 'get_user_stats':
        const statsResponse = await fetch(`${baseUrl}/api/user/${args.username}/stats`);
        const statsData = await statsResponse.json();
        return {
          content: [
            {
              type: 'text', 
              text: `사용자 ${args.username}의 상세 통계:\n${JSON.stringify(statsData, null, 2)}`
            }
          ]
        };
        
      case 'analyze_performance':
        // 간단한 성능 분석
        const analysisResponse = await fetch(`${baseUrl}/api/user/${args.username}/stats`);
        const analysisData = await analysisResponse.json();
        
        if (analysisData.success && analysisData.data) {
          const stats = analysisData.data;
          const totalSolved = stats.reduce((sum: number, level: any) => sum + level.solved, 0);
          const totalTried = stats.reduce((sum: number, level: any) => sum + level.tried, 0);
          const successRate = totalTried > 0 ? (totalSolved / totalTried * 100).toFixed(1) : '0';
          
          return {
            content: [
              {
                type: 'text',
                text: `사용자 ${args.username}의 성능 분석:
- 총 해결 문제: ${totalSolved}개
- 총 시도 문제: ${totalTried}개  
- 성공률: ${successRate}%
- 권장 학습 방향: 현재 강점 레벨에서 더 많은 문제 해결 후 단계적 상승`
              }
            ]
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `사용자 ${args.username}의 데이터를 찾을 수 없습니다.`
            }
          ]
        };
        
      case 'get_recommendations':
        return {
          content: [
            {
              type: 'text',
              text: `사용자 ${args.username}을 위한 추천:
- 현재 강점 레벨에서 더 많은 문제 연습
- 단계별 난이도 상승 추천
- 알고리즘별 집중 학습 권장`
            }
          ]
        };
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        }
      ],
      isError: true
    };
  }
}