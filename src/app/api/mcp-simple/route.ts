import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const mcpInfo = {
    name: 'BOJ Coach MCP Server',
    version: '1.0.0',
    description: 'Simple MCP-compatible server for Baekjoon Online Judge coaching',
    status: 'running',
    timestamp: new Date().toISOString(),
    
    capabilities: {
      tools: true
    },
    
    tools: [
      {
        name: 'get_user_info',
        description: '백준 사용자의 기본 정보를 조회합니다',
        parameters: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: '백준 사용자명'
            }
          },
          required: ['username']
        }
      },
      {
        name: 'get_user_stats',
        description: '백준 사용자의 상세 통계를 조회합니다',
        parameters: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: '백준 사용자명'
            }
          },
          required: ['username']
        }
      },
      {
        name: 'analyze_performance',
        description: '사용자의 성능을 분석하고 학습 조언을 제공합니다',
        parameters: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: '백준 사용자명'
            }
          },
          required: ['username']
        }
      }
    ],
    
    endpoints: {
      base_url: 'https://boj-coach-m4pplcphv-10wooks-projects.vercel.app',
      tools_list: '/api/mcp-simple?action=tools',
      tool_call: '/api/mcp-simple?action=call'
    }
  };
  
  const action = request.nextUrl.searchParams.get('action');
  
  if (action === 'tools') {
    // 도구 목록 반환
    return NextResponse.json({
      tools: mcpInfo.tools
    });
  }
  
  // 기본 서버 정보 반환
  const response = NextResponse.json(mcpInfo);
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = request.nextUrl.searchParams.get('action');
    
    if (action === 'call' || body.action === 'call') {
      // 도구 호출 처리
      const { tool, arguments: args } = body;
      const toolName = tool || body.name;
      const toolArgs = args || body.arguments;
      
      if (!toolName || !toolArgs?.username) {
        return NextResponse.json({
          success: false,
          error: 'Tool name and username are required'
        }, { status: 400 });
      }
      
      const baseUrl = 'http://localhost:3000'; // 로컬 테스트용
      const username = toolArgs.username;
      
      try {
        switch (toolName) {
          case 'get_user_info':
            const userResponse = await fetch(`${baseUrl}/api/user/${username}`);
            const userData = await userResponse.json();
            
            if (userData.success) {
              return NextResponse.json({
                success: true,
                tool: toolName,
                result: {
                  type: 'text',
                  content: `🏆 **${username} 사용자 정보**\n\n` +
                          `티어: ${userData.data.tier} (레벨 ${userData.data.tierLevel})\n` +
                          `레이팅: ${userData.data.rating}\n` +
                          `해결한 문제: ${userData.data.solvedCount}개\n` +
                          `클래스: ${userData.data.class}\n` +
                          `최대 연속: ${userData.data.maxStreak}일`
                }
              });
            } else {
              throw new Error('사용자를 찾을 수 없습니다');
            }
            
          case 'get_user_stats':
            const statsResponse = await fetch(`${baseUrl}/api/user/${username}/stats`);
            const statsData = await statsResponse.json();
            
            if (statsData.success) {
              const stats = statsData.data;
              const totalSolved = stats.reduce((sum: number, level: any) => sum + level.solved, 0);
              const totalTried = stats.reduce((sum: number, level: any) => sum + level.tried, 0);
              const successRate = totalTried > 0 ? (totalSolved / totalTried * 100).toFixed(1) : '0';
              
              return NextResponse.json({
                success: true,
                tool: toolName,
                result: {
                  type: 'text',
                  content: `📊 **${username} 사용자 통계**\n\n` +
                          `총 해결 문제: ${totalSolved}개\n` +
                          `총 시도 문제: ${totalTried}개\n` +
                          `성공률: ${successRate}%\n\n` +
                          `레벨별 해결 현황:\n` +
                          stats
                            .filter((level: any) => level.solved > 0)
                            .sort((a: any, b: any) => b.solved - a.solved)
                            .slice(0, 5)
                            .map((level: any, index: number) => 
                              `${index + 1}. 레벨 ${level.level}: ${level.solved}문제`
                            )
                            .join('\n')
                }
              });
            } else {
              throw new Error('통계를 가져올 수 없습니다');
            }
            
          case 'analyze_performance':
            const analysisResponse = await fetch(`${baseUrl}/api/user/${username}/stats`);
            const analysisData = await analysisResponse.json();
            
            if (analysisData.success) {
              const stats = analysisData.data;
              const totalSolved = stats.reduce((sum: number, level: any) => sum + level.solved, 0);
              const activeLevels = stats.filter((level: any) => level.solved > 0);
              const avgLevel = activeLevels.length > 0 ? 
                activeLevels.reduce((sum: number, level: any) => sum + level.level, 0) / activeLevels.length : 0;
              
              let recommendation = '';
              if (avgLevel < 5) {
                recommendation = '🔰 기초 단계입니다. 레벨 1-5 문제를 더 많이 풀어보세요.';
              } else if (avgLevel < 10) {
                recommendation = '📚 초급 단계입니다. 레벨 6-10 문제에 도전해보세요.';
              } else if (avgLevel < 15) {
                recommendation = '💪 중급 단계입니다. 레벨 11-15 문제를 풀어보세요.';
              } else {
                recommendation = '🚀 상급 단계입니다. 고급 알고리즘에 집중해보세요.';
              }
              
              return NextResponse.json({
                success: true,
                tool: toolName,
                result: {
                  type: 'text',
                  content: `🎯 **${username} 성능 분석**\n\n` +
                          `총 해결 문제: ${totalSolved}개\n` +
                          `활발한 레벨 수: ${activeLevels.length}개\n` +
                          `평균 레벨: ${avgLevel.toFixed(1)}\n\n` +
                          `💡 학습 조언:\n${recommendation}\n\n` +
                          `다음 단계:\n• 현재 강점 레벨에서 더 많은 연습\n• 단계적 난이도 상승\n• 약한 분야 집중 학습`
                }
              });
            } else {
              throw new Error('분석 데이터를 가져올 수 없습니다');
            }
            
          default:
            return NextResponse.json({
              success: false,
              error: `Unknown tool: ${toolName}`
            }, { status: 400 });
        }
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          tool: toolName
        }, { status: 500 });
      }
    }
    
    // 기본 응답
    return NextResponse.json({
      message: 'MCP Simple Server',
      available_actions: ['call'],
      usage: 'POST with {"action": "call", "tool": "tool_name", "arguments": {"username": "username"}}'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Invalid request format'
    }, { status: 400 });
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