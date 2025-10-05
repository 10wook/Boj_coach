import { NextRequest, NextResponse } from 'next/server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// MCP 서버 설정
const server = new Server(
  {
    name: 'boj-coach',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 도구 목록 핸들러
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_user_info',
        description: '백준 사용자의 기본 정보를 조회합니다',
        inputSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: '백준 사용자명',
            },
          },
          required: ['username'],
        },
      },
      {
        name: 'get_user_stats',
        description: '백준 사용자의 상세 통계를 조회합니다',
        inputSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: '백준 사용자명',
            },
          },
          required: ['username'],
        },
      },
      {
        name: 'analyze_performance',
        description: '사용자의 성능을 분석하고 학습 조언을 제공합니다',
        inputSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: '백준 사용자명',
            },
          },
          required: ['username'],
        },
      },
    ],
  };
});

// 도구 호출 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (!args) {
    return {
      content: [
        {
          type: 'text',
          text: '❌ 필요한 매개변수가 제공되지 않았습니다.',
        },
      ],
      isError: true,
    };
  }
  const baseUrl = 'https://boj-coach-m4pplcphv-10wooks-projects.vercel.app';

  try {
    switch (name) {
      case 'get_user_info':
        const username = (args as any)?.username;
        if (!username) {
          return {
            content: [{ type: 'text', text: '❌ username 매개변수가 필요합니다.' }],
            isError: true,
          };
        }
        const userResponse = await fetch(`${baseUrl}/api/user/${username}`);
        const userData = await userResponse.json();
        
        if (userData.success) {
          return {
            content: [
              {
                type: 'text',
                text: `**${args.username} 사용자 정보**\n\n` +
                      `🏆 티어: ${userData.data.tier} (레벨 ${userData.data.tierLevel})\n` +
                      `⭐ 레이팅: ${userData.data.rating}\n` +
                      `✅ 해결한 문제: ${userData.data.solvedCount}개\n` +
                      `📊 클래스: ${userData.data.class}\n` +
                      `🔥 최대 연속 해결: ${userData.data.maxStreak}일\n` +
                      `👥 라이벌: ${userData.data.rivalCount}명\n`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 사용자 '${username}'을 찾을 수 없습니다.`,
              },
            ],
            isError: true,
          };
        }

      case 'get_user_stats':
        const statsUsername = (args as any)?.username;
        if (!statsUsername) {
          return {
            content: [{ type: 'text', text: '❌ username 매개변수가 필요합니다.' }],
            isError: true,
          };
        }
        const statsResponse = await fetch(`${baseUrl}/api/user/${statsUsername}/stats`);
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
          const stats = statsData.data;
          const totalSolved = stats.reduce((sum: number, level: any) => sum + level.solved, 0);
          const totalTried = stats.reduce((sum: number, level: any) => sum + level.tried, 0);
          const successRate = totalTried > 0 ? (totalSolved / totalTried * 100).toFixed(1) : '0';
          
          // 가장 활발한 레벨 찾기
          const mostActiveLevel = stats.reduce((max: any, current: any) => 
            current.solved > max.solved ? current : max
          );
          
          return {
            content: [
              {
                type: 'text',
                text: `**${statsUsername} 사용자 통계**\n\n` +
                      `📈 총 해결 문제: ${totalSolved}개\n` +
                      `🎯 총 시도 문제: ${totalTried}개\n` +
                      `✨ 성공률: ${successRate}%\n` +
                      `🔥 가장 활발한 레벨: 레벨 ${mostActiveLevel.level} (${mostActiveLevel.solved}문제 해결)\n\n` +
                      `**레벨별 상위 5개:**\n` +
                      stats
                        .filter((level: any) => level.solved > 0)
                        .sort((a: any, b: any) => b.solved - a.solved)
                        .slice(0, 5)
                        .map((level: any, index: number) => 
                          `${index + 1}. 레벨 ${level.level}: ${level.solved}문제 해결`
                        )
                        .join('\n'),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 사용자 '${statsUsername}'의 통계를 가져올 수 없습니다.`,
              },
            ],
            isError: true,
          };
        }

      case 'analyze_performance':
        const analysisUsername = (args as any)?.username;
        if (!analysisUsername) {
          return {
            content: [{ type: 'text', text: '❌ username 매개변수가 필요합니다.' }],
            isError: true,
          };
        }
        const analysisResponse = await fetch(`${baseUrl}/api/user/${analysisUsername}/stats`);
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
            recommendation = '📚 초급 단계입니다. 알고리즘 기초를 다지면서 레벨 6-10 문제에 도전해보세요.';
          } else if (avgLevel < 15) {
            recommendation = '💪 중급 단계입니다. 다양한 알고리즘을 학습하며 레벨 11-15 문제를 풀어보세요.';
          } else {
            recommendation = '🚀 상급 단계입니다. 고급 알고리즘과 최적화에 집중해보세요.';
          }
          
          return {
            content: [
              {
                type: 'text',
                text: `**${analysisUsername} 성능 분석 및 학습 조언**\n\n` +
                      `📊 총 해결 문제: ${totalSolved}개\n` +
                      `📈 활발한 레벨 수: ${activeLevels.length}개\n` +
                      `⚖️ 평균 레벨: ${avgLevel.toFixed(1)}\n\n` +
                      `💡 **학습 조언:**\n${recommendation}\n\n` +
                      `🎯 **다음 단계 권장사항:**\n` +
                      `• 현재 강점 레벨에서 더 많은 문제 연습\n` +
                      `• 단계적으로 한 레벨씩 난이도 상승\n` +
                      `• 약한 알고리즘 분야 집중 학습`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 사용자 '${analysisUsername}'의 데이터를 분석할 수 없습니다.`,
              },
            ],
            isError: true,
          };
        }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `❌ 알 수 없는 도구: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        },
      ],
      isError: true,
    };
  }
});

// HTTP 엔드포인트 핸들러
export async function GET(request: NextRequest) {
  const mcpInfo = {
    name: 'BOJ Coach MCP Server',
    version: '1.0.0',
    description: 'Model Context Protocol server for Baekjoon Online Judge coaching',
    sdk_version: '@modelcontextprotocol/sdk@1.19.1',
    status: 'running',
    timestamp: new Date().toISOString(),
    
    tools: [
      'get_user_info - 백준 사용자 기본 정보 조회',
      'get_user_stats - 백준 사용자 상세 통계 조회',
      'analyze_performance - 성능 분석 및 학습 조언'
    ],
    
    usage: {
      description: 'MCP 클라이언트에서 이 서버에 연결하여 백준 데이터를 분석할 수 있습니다.',
      server_url: 'https://boj-coach-m4pplcphv-10wooks-projects.vercel.app/api/mcp-sdk'
    }
  };
  
  const response = NextResponse.json(mcpInfo);
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 간단한 MCP 요청 시뮬레이션
    if (body.method === 'tools/list') {
      const tools = await server.request({ method: 'tools/list', params: {} }, ListToolsRequestSchema);
      return NextResponse.json(tools);
    }
    
    if (body.method === 'tools/call') {
      const result = await server.request(
        { 
          method: 'tools/call', 
          params: body.params 
        }, 
        CallToolRequestSchema
      );
      return NextResponse.json(result);
    }
    
    return NextResponse.json({
      error: 'Unsupported method',
      supported_methods: ['tools/list', 'tools/call']
    }, { status: 400 });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Request processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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