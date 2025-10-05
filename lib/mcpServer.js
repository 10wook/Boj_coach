const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const SolvedacAPI = require('./solvedac');
const DataAnalyzer = require('./analyzer');
const CacheManager = require('./cache');

class MCPServer {
  constructor() {
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

    this.solvedac = new SolvedacAPI();
    this.analyzer = new DataAnalyzer();
    this.cache = new CacheManager();
    
    this.setupHandlers();
  }

  setupHandlers() {
    // 도구 목록 제공
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_user_profile',
            description: '백준/solved.ac 사용자의 기본 프로필 정보를 조회합니다',
            inputSchema: {
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
            name: 'analyze_user_weakness',
            description: '사용자의 약점과 개선점을 분석합니다',
            inputSchema: {
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
            name: 'get_learning_recommendations',
            description: '개인 맞춤 학습 추천을 제공합니다',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: '백준 사용자명'
                },
                focus_area: {
                  type: 'string',
                  description: '집중할 영역 (예: 약점보완, 티어상승, 전반적개선)',
                  enum: ['weakness', 'tier_up', 'general']
                }
              },
              required: ['username']
            }
          },
          {
            name: 'predict_tier_progress',
            description: '다음 티어 달성 예측과 필요한 노력을 분석합니다',
            inputSchema: {
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
            name: 'get_study_plan',
            description: '주간/월간 학습 계획을 생성합니다',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: '백준 사용자명'
                },
                period: {
                  type: 'string',
                  description: '계획 기간',
                  enum: ['weekly', 'monthly']
                },
                goal: {
                  type: 'string',
                  description: '목표 (예: 티어상승, 약점보완, 실력향상)'
                }
              },
              required: ['username', 'period']
            }
          },
          {
            name: 'analyze_performance_trends',
            description: '사용자의 성과 트렌드와 학습 패턴을 분석합니다',
            inputSchema: {
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
        ]
      };
    });

    // 도구 실행 핸들러
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_user_profile':
            return await this.getUserProfile(args.username);

          case 'analyze_user_weakness':
            return await this.analyzeUserWeakness(args.username);

          case 'get_learning_recommendations':
            return await this.getLearningRecommendations(args.username, args.focus_area);

          case 'predict_tier_progress':
            return await this.predictTierProgress(args.username);

          case 'get_study_plan':
            return await this.getStudyPlan(args.username, args.period, args.goal);

          case 'analyze_performance_trends':
            return await this.analyzePerformanceTrends(args.username);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `오류가 발생했습니다: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async getUserProfile(username) {
    const userData = await this.solvedac.getUser(username);
    
    const profile = {
      username: userData.handle,
      tier: this.solvedac.getTierName(userData.tier),
      rating: userData.rating,
      solvedCount: userData.solvedCount,
      class: userData.class,
      maxStreak: userData.maxStreak
    };

    return {
      content: [
        {
          type: 'text',
          text: `**${username}님의 프로필**\n\n` +
                `🏆 현재 티어: ${profile.tier}\n` +
                `⭐ 레이팅: ${profile.rating}\n` +
                `📊 해결한 문제: ${profile.solvedCount}개\n` +
                `🎯 클래스: ${profile.class}\n` +
                `🔥 최대 연속: ${profile.maxStreak}일`
        }
      ]
    };
  }

  async analyzeUserWeakness(username) {
    const [problemStats, tagStats] = await Promise.all([
      this.solvedac.getUserStats(username),
      this.solvedac.getUserTagStats(username)
    ]);

    const weakness = this.analyzer.analyzeWeakness(problemStats, tagStats);
    const weakTags = this.analyzer.identifyWeakTags(tagStats);

    let analysisText = `**${username}님의 약점 분석**\n\n`;
    
    if (weakTags.length > 0) {
      analysisText += `🔍 **주요 약점 태그:**\n`;
      weakTags.forEach((tag, index) => {
        analysisText += `${index + 1}. ${tag.tag} - 정확률 ${tag.successRate}% (${tag.severity})\n`;
      });
    }

    if (weakness.recommendations.length > 0) {
      analysisText += `\n💡 **개선 추천사항:**\n`;
      weakness.recommendations.forEach((rec, index) => {
        analysisText += `${index + 1}. ${rec.reason}\n`;
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: analysisText
        }
      ]
    };
  }

  async getLearningRecommendations(username, focusArea = 'general') {
    const [userData, problemStats, tagStats] = await Promise.all([
      this.solvedac.getUser(username),
      this.solvedac.getUserStats(username),
      this.solvedac.getUserTagStats(username)
    ]);

    const weakness = this.analyzer.analyzeWeakness(problemStats, tagStats);
    const progress = this.analyzer.analyzeProgress(userData, problemStats);
    const priorities = this.analyzer.calculateLearningPriority(tagStats, problemStats, userData);

    let recommendationText = `**${username}님의 맞춤 학습 추천**\n\n`;

    switch (focusArea) {
      case 'weakness':
        recommendationText += `🎯 **약점 보완 중심 추천**\n\n`;
        priorities.filter(p => p.type === 'tag_improvement').forEach((priority, index) => {
          recommendationText += `${index + 1}. ${priority.reason}\n`;
          recommendationText += `   예상 소요시간: ${priority.estimatedTime}\n`;
          recommendationText += `   우선순위: ${priority.urgency}\n\n`;
        });
        break;

      case 'tier_up':
        recommendationText += `🚀 **티어 상승 중심 추천**\n\n`;
        recommendationText += `현재: ${progress.currentTier} → 목표: ${progress.nextTierGoal}\n`;
        recommendationText += `진행률: ${progress.progressToNext.toFixed(1)}%\n\n`;
        
        if (progress.readyForPromotion) {
          recommendationText += `✅ 다음 티어 도전 준비 완료!\n`;
        } else {
          recommendationText += `📚 현재 티어 마스터리 우선 필요\n`;
        }
        break;

      default:
        recommendationText += `📈 **종합 학습 추천**\n\n`;
        priorities.slice(0, 3).forEach((priority, index) => {
          recommendationText += `${index + 1}. ${priority.reason}\n`;
        });
    }

    return {
      content: [
        {
          type: 'text',
          text: recommendationText
        }
      ]
    };
  }

  async predictTierProgress(username) {
    const [userData, tagStats, problemStats] = await Promise.all([
      this.solvedac.getUser(username),
      this.solvedac.getUserTagStats(username),
      this.solvedac.getUserStats(username)
    ]);

    const prediction = this.analyzer.predictTierAchievement(userData, tagStats, problemStats);

    let predictionText = `**${username}님의 티어 달성 예측**\n\n`;
    predictionText += `🎯 목표 티어: ${prediction.nextTier}\n`;
    predictionText += `📊 현재 진행률: ${prediction.currentProgress}%\n`;
    predictionText += `⏰ 예상 달성 시간: ${prediction.estimatedTime}\n`;
    predictionText += `🎪 신뢰도: ${prediction.confidence}\n\n`;

    if (prediction.blockers.length > 0) {
      predictionText += `⚠️ **달성 방해요소:**\n`;
      prediction.blockers.forEach((blocker, index) => {
        predictionText += `${index + 1}. ${blocker}\n`;
      });
      predictionText += `\n`;
    }

    predictionText += `💡 **추천 액션:**\n`;
    prediction.recommendations.forEach((rec, index) => {
      predictionText += `${index + 1}. ${rec}\n`;
    });

    return {
      content: [
        {
          type: 'text',
          text: predictionText
        }
      ]
    };
  }

  async getStudyPlan(username, period, goal) {
    const [userData, problemStats, tagStats] = await Promise.all([
      this.solvedac.getUser(username),
      this.solvedac.getUserStats(username),
      this.solvedac.getUserTagStats(username)
    ]);

    const weakness = this.analyzer.analyzeWeakness(problemStats, tagStats);
    const progress = this.analyzer.analyzeProgress(userData, problemStats);

    let planText = `**${username}님의 ${period === 'weekly' ? '주간' : '월간'} 학습 계획**\n\n`;

    const problemsPerDay = period === 'weekly' ? 2 : Math.floor(userData.solvedCount / 365 * 7) || 2;
    const totalProblems = period === 'weekly' ? problemsPerDay * 7 : problemsPerDay * 30;

    planText += `📅 **기간**: ${period === 'weekly' ? '1주일' : '1개월'}\n`;
    planText += `🎯 **목표**: ${goal || '실력 향상'}\n`;
    planText += `📊 **문제 수**: 일일 ${problemsPerDay}개, 총 ${totalProblems}개\n\n`;

    planText += `📚 **학습 영역 배분:**\n`;
    
    if (weakness.weakestTags.length > 0) {
      planText += `• 약점 보완 (40%): ${weakness.weakestTags.slice(0, 2).map(t => t.tag).join(', ')}\n`;
    }
    
    planText += `• 현재 티어 마스터리 (40%): ${progress.currentTier} 문제\n`;
    planText += `• 새로운 도전 (20%): ${progress.nextTierGoal} 문제\n\n`;

    planText += `⏰ **일일 스케줄 제안:**\n`;
    planText += `• 오전: 새로운 문제 1개 (도전)\n`;
    planText += `• 오후: 약점 보완 문제 1개\n`;
    
    if (problemsPerDay > 2) {
      planText += `• 저녁: 복습 또는 추가 문제\n`;
    }

    return {
      content: [
        {
          type: 'text',
          text: planText
        }
      ]
    };
  }

  async analyzePerformanceTrends(username) {
    const [userData, problemStats, tagStats] = await Promise.all([
      this.solvedac.getUser(username),
      this.solvedac.getUserStats(username),
      this.solvedac.getUserTagStats(username)
    ]);

    const learningProgress = this.analyzer.trackLearningProgress(userData, tagStats, problemStats);
    const timePatterns = this.analyzer.analyzeTimePatterns(userData);

    let trendsText = `**${username}님의 성과 트렌드 분석**\n\n`;

    trendsText += `📈 **활동 패턴:**\n`;
    trendsText += `• 일평균: ${timePatterns.dailyAverage}문제\n`;
    trendsText += `• 주평균: ${timePatterns.weeklyAverage}문제\n`;
    trendsText += `• 최대 연속: ${timePatterns.streak}일\n`;
    trendsText += `• 활동 수준: ${timePatterns.estimatedActiveTime}\n\n`;

    if (learningProgress.strengthAreas.length > 0) {
      trendsText += `💪 **강점 영역:**\n`;
      learningProgress.strengthAreas.forEach((area, index) => {
        trendsText += `${index + 1}. ${area.tag} (${area.successRate}%)\n`;
      });
      trendsText += `\n`;
    }

    if (learningProgress.improvementAreas.length > 0) {
      trendsText += `📚 **개선 중인 영역:**\n`;
      learningProgress.improvementAreas.forEach((area, index) => {
        trendsText += `${index + 1}. ${area.tag} (${area.successRate}%)\n`;
      });
      trendsText += `\n`;
    }

    trendsText += `🎯 **난이도 분포:**\n`;
    const diffSummary = learningProgress.difficultyProgression.summary;
    trendsText += `• 가장 쉬운 레벨: ${diffSummary.easiest}\n`;
    trendsText += `• 가장 어려운 레벨: ${diffSummary.hardest}\n`;
    trendsText += `• 평균 난이도: ${diffSummary.averageLevel}\n`;

    return {
      content: [
        {
          type: 'text',
          text: trendsText
        }
      ]
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('BOJ Coach MCP Server started');
  }
}

module.exports = MCPServer;