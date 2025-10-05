#!/usr/bin/env tsx

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SolvedacAPI } from './lib/solvedac.js';
import { DataAnalyzer } from './lib/analyzer.js';
import { CacheManager } from './lib/cache.js';

class MCPServer {
  private server: Server;
  private solvedac: SolvedacAPI;
  private analyzer: DataAnalyzer;
  private cache: CacheManager;

  constructor() {
    // MCP 서버 초기화
    this.server = new Server(
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

    // 서비스 초기화
    this.solvedac = new SolvedacAPI();
    this.analyzer = new DataAnalyzer();
    this.cache = new CacheManager();

    this.setupHandlers();
  }

  private setupHandlers() {
    // 도구 목록 핸들러
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
          {
            name: 'get_recommendations',
            description: '사용자 맞춤형 문제 추천을 제공합니다',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: '백준 사용자명',
                },
                difficulty: {
                  type: 'string',
                  description: '원하는 난이도 (easy/medium/hard)',
                  enum: ['easy', 'medium', 'hard'],
                },
                count: {
                  type: 'number',
                  description: '추천받을 문제 수',
                  default: 5,
                },
              },
              required: ['username'],
            },
          },
        ],
      };
    });

    // 도구 호출 핸들러
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
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

      try {
        switch (name) {
          case 'get_user_info':
            return await this.handleGetUserInfo(args);
          case 'get_user_stats':
            return await this.handleGetUserStats(args);
          case 'analyze_performance':
            return await this.handleAnalyzePerformance(args);
          case 'get_recommendations':
            return await this.handleGetRecommendations(args);
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
  }

  private async handleGetUserInfo(args: any) {
    const username = args.username;
    if (!username) {
      return {
        content: [{ type: 'text', text: '❌ username 매개변수가 필요합니다.' }],
        isError: true,
      };
    }

    try {
      // 캐시 확인
      let userData = await this.cache.getUserData(username);
      if (!userData) {
        userData = await this.solvedac.getUser(username);
        this.cache.cacheUserData(username, userData, 600);
      }

      return {
        content: [
          {
            type: 'text',
            text: `🏆 **${username} 사용자 정보**\n\n` +
                  `티어: ${this.solvedac.getTierName(userData.tier)} (레벨 ${userData.tier})\n` +
                  `레이팅: ${userData.rating}\n` +
                  `해결한 문제: ${userData.solvedCount}개\n` +
                  `클래스: ${userData.class}\n` +
                  `최대 연속: ${userData.maxStreak}일\n` +
                  `라이벌: ${userData.rivalCount}명`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 사용자 '${username}'을 찾을 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleGetUserStats(args: any) {
    const username = args.username;
    if (!username) {
      return {
        content: [{ type: 'text', text: '❌ username 매개변수가 필요합니다.' }],
        isError: true,
      };
    }

    try {
      // 캐시 확인
      let statsData = await this.cache.getUserStats(username);
      if (!statsData) {
        statsData = await this.solvedac.getUserStats(username);
        this.cache.cacheUserStats(username, statsData, 300);
      }

      const totalSolved = statsData.reduce((sum: number, level: any) => sum + level.solved, 0);
      const totalTried = statsData.reduce((sum: number, level: any) => sum + level.tried, 0);
      const successRate = totalTried > 0 ? (totalSolved / totalTried * 100).toFixed(1) : '0';

      // 가장 활발한 레벨 찾기
      const mostActiveLevel = statsData.reduce((max: any, current: any) => 
        current.solved > max.solved ? current : max
      );

      return {
        content: [
          {
            type: 'text',
            text: `📊 **${username} 사용자 통계**\n\n` +
                  `총 해결 문제: ${totalSolved}개\n` +
                  `총 시도 문제: ${totalTried}개\n` +
                  `성공률: ${successRate}%\n` +
                  `가장 활발한 레벨: 레벨 ${mostActiveLevel.level} (${mostActiveLevel.solved}문제)\n\n` +
                  `**레벨별 상위 5개:**\n` +
                  statsData
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
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 사용자 '${username}'의 통계를 가져올 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleAnalyzePerformance(args: any) {
    const username = args.username;
    if (!username) {
      return {
        content: [{ type: 'text', text: '❌ username 매개변수가 필요합니다.' }],
        isError: true,
      };
    }

    try {
      // 사용자 통계 가져오기
      let statsData = await this.cache.getUserStats(username);
      if (!statsData) {
        statsData = await this.solvedac.getUserStats(username);
        this.cache.cacheUserStats(username, statsData, 300);
      }

      const totalSolved = statsData.reduce((sum: number, level: any) => sum + level.solved, 0);
      const activeLevels = statsData.filter((level: any) => level.solved > 0);
      const avgLevel = activeLevels.length > 0 ? 
        activeLevels.reduce((sum: number, level: any) => sum + level.level, 0) / activeLevels.length : 0;

      // 추천사항 결정
      let recommendation = '';
      let nextSteps = '';
      
      if (avgLevel < 5) {
        recommendation = '🔰 기초 단계입니다. 기본적인 구현 문제와 간단한 알고리즘 문제를 더 풀어보세요.';
        nextSteps = '• Bronze 티어 문제들 완전 정복\n• 기본 입출력과 조건문/반복문 연습\n• 배열과 문자열 다루기';
      } else if (avgLevel < 10) {
        recommendation = '📚 초급 단계입니다. 기본 알고리즘과 자료구조를 학습하며 실력을 다져보세요.';
        nextSteps = '• Silver 하위 티어 문제 도전\n• 정렬, 탐색 알고리즘 학습\n• 스택, 큐 자료구조 활용';
      } else if (avgLevel < 15) {
        recommendation = '💪 중급 단계입니다. 다양한 알고리즘 기법을 익히고 복잡한 문제에 도전해보세요.';
        nextSteps = '• Silver 상위 ~ Gold 하위 티어 도전\n• DFS/BFS, 동적계획법 학습\n• 그래프 이론 기초';
      } else if (avgLevel < 20) {
        recommendation = '🚀 상급 단계입니다. 고급 알고리즘과 최적화 기법에 집중해보세요.';
        nextSteps = '• Gold 상위 ~ Platinum 티어 도전\n• 고급 동적계획법, 그래프 알고리즘\n• 수학적 사고와 증명';
      } else {
        recommendation = '🏆 최고 수준입니다! 대회 수준의 문제들과 새로운 알고리즘 연구에 도전해보세요.';
        nextSteps = '• Platinum ~ Diamond 티어 문제\n• 고급 자료구조 (세그먼트 트리 등)\n• 알고리즘 경진대회 참여';
      }

      return {
        content: [
          {
            type: 'text',
            text: `🎯 **${username} 성능 분석 및 학습 조언**\n\n` +
                  `📊 **현재 실력 평가:**\n` +
                  `• 총 해결 문제: ${totalSolved}개\n` +
                  `• 활발한 레벨 수: ${activeLevels.length}개\n` +
                  `• 평균 레벨: ${avgLevel.toFixed(1)}\n\n` +
                  `💡 **학습 조언:**\n${recommendation}\n\n` +
                  `🎯 **다음 단계 권장사항:**\n${nextSteps}\n\n` +
                  `📈 **강점 분야:**\n` +
                  activeLevels
                    .sort((a: any, b: any) => b.solved - a.solved)
                    .slice(0, 3)
                    .map((level: any) => `• 레벨 ${level.level}: ${level.solved}문제 해결`)
                    .join('\n'),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 사용자 '${username}'의 데이터를 분석할 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleGetRecommendations(args: any) {
    const username = args.username;
    const difficulty = args.difficulty || 'medium';
    const count = args.count || 5;

    if (!username) {
      return {
        content: [{ type: 'text', text: '❌ username 매개변수가 필요합니다.' }],
        isError: true,
      };
    }

    try {
      // 사용자 통계 기반 추천
      let statsData = await this.cache.getUserStats(username);
      if (!statsData) {
        statsData = await this.solvedac.getUserStats(username);
        this.cache.cacheUserStats(username, statsData, 300);
      }

      const activeLevels = statsData.filter((level: any) => level.solved > 0);
      const avgLevel = activeLevels.length > 0 ? 
        activeLevels.reduce((sum: number, level: any) => sum + level.level, 0) / activeLevels.length : 0;

      // 난이도별 추천 레벨 계산
      let recommendedLevels: number[] = [];
      switch (difficulty) {
        case 'easy':
          recommendedLevels = [Math.max(1, Math.floor(avgLevel) - 1), Math.floor(avgLevel)];
          break;
        case 'medium':
          recommendedLevels = [Math.floor(avgLevel), Math.ceil(avgLevel) + 1];
          break;
        case 'hard':
          recommendedLevels = [Math.ceil(avgLevel) + 1, Math.ceil(avgLevel) + 2];
          break;
      }

      // 추천 메시지 생성
      const recommendations = [
        `🎯 ${username}님을 위한 맞춤형 문제 추천 (${difficulty} 난이도)`,
        `추천 레벨: ${recommendedLevels.join(', ')}`,
        `현재 평균 레벨: ${avgLevel.toFixed(1)}`,
        '',
        `📚 추천 학습 방향:`,
        `• 레벨 ${recommendedLevels[0]} 문제로 실력 다지기`,
        `• 레벨 ${recommendedLevels[1]} 문제로 도전하기`,
        `• 틀린 문제는 반드시 다시 풀어보기`,
        `• 비슷한 유형의 문제 여러 개 연습하기`,
        '',
        `💡 학습 팁:`,
        `• 한 번에 너무 어려운 문제보다는 단계적 접근`,
        `• 알고리즘 이론 학습과 실습의 균형`,
        `• 정기적인 복습으로 실력 유지`,
      ];

      return {
        content: [
          {
            type: 'text',
            text: recommendations.join('\n'),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 사용자 '${username}'의 추천을 생성할 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
          },
        ],
        isError: true,
      };
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('BOJ Coach MCP server running on stdio');
  }
}

async function main() {
  const server = new MCPServer();
  
  process.on('SIGINT', async () => {
    console.error('Shutting down MCP server...');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Shutting down MCP server...');
    process.exit(0);
  });

  try {
    await server.start();
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}