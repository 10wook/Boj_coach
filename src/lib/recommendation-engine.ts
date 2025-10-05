/**
 * 추천 시스템 엔진
 * GPT와 백준 데이터를 활용한 맞춤형 추천 시스템
 */

import { GPTService, GPTRecommendation, GPTStudyPlan, GPTAnalysis } from './gpt-service';
import { SolvedAcAPI } from './solved-ac-api';
import { StatisticsAnalyzer } from './statistics-analyzer';

export interface RecommendationRequest {
  username: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  focus?: string[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  count?: number;
}

export interface RecommendationResponse {
  recommendations: GPTRecommendation[];
  studyPlan?: GPTStudyPlan;
  analysis?: GPTAnalysis;
  motivation?: string;
  metadata: {
    generatedAt: string;
    requestType: string;
    confidence: number;
  };
}

export class RecommendationEngine {
  private gptService: GPTService;
  private solvedAcAPI: SolvedAcAPI;
  private statisticsAnalyzer: StatisticsAnalyzer;

  constructor(apiKey?: string) {
    this.gptService = new GPTService(apiKey);
    this.solvedAcAPI = new SolvedAcAPI(apiKey);
    this.statisticsAnalyzer = new StatisticsAnalyzer(apiKey);
  }

  /**
   * 종합 추천 생성
   */
  async generateRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      // 사용자 데이터 수집
      const [userInfo, analytics, weakness] = await Promise.all([
        this.solvedAcAPI.getUserInfo(request.username),
        this.statisticsAnalyzer.calculateTagAccuracy(request.username),
        this.statisticsAnalyzer.identifyWeakTags(request.username),
      ]);

      // GPT 추천 생성
      const [recommendations, studyPlan, analysis, motivation] = await Promise.all([
        this.gptService.generatePersonalizedRecommendations(
          request.username,
          userInfo,
          { weakTags: weakness, weakLevels: [] }
        ),
        request.type === 'weekly' ? this.gptService.generateWeeklyStudyPlan(
          request.username,
          userInfo,
          { weakTags: weakness, weakLevels: [] }
        ) : undefined,
        this.gptService.generateLearningAnalysis(
          request.username,
          userInfo,
          { tagAccuracy: analytics }
        ),
        this.gptService.generateMotivationMessage(
          request.username,
          userInfo,
          { streak: 7, weeklySolved: 15 }
        ),
      ]);

      // 추천 필터링 및 정렬
      const filteredRecommendations = this.filterRecommendations(
        recommendations,
        request
      );

      return {
        recommendations: filteredRecommendations,
        studyPlan,
        analysis,
        motivation,
        metadata: {
          generatedAt: new Date().toISOString(),
          requestType: request.type,
          confidence: this.calculateConfidence(userInfo, analytics),
        },
      };
    } catch (error) {
      console.error('추천 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 일일 추천 생성
   */
  async generateDailyRecommendations(username: string): Promise<RecommendationResponse> {
    return this.generateRecommendations({
      username,
      type: 'daily',
      count: 5,
    });
  }

  /**
   * 주간 추천 생성
   */
  async generateWeeklyRecommendations(username: string): Promise<RecommendationResponse> {
    return this.generateRecommendations({
      username,
      type: 'weekly',
      count: 10,
    });
  }

  /**
   * 월간 추천 생성
   */
  async generateMonthlyRecommendations(username: string): Promise<RecommendationResponse> {
    return this.generateRecommendations({
      username,
      type: 'monthly',
      count: 20,
    });
  }

  /**
   * 맞춤형 추천 생성
   */
  async generateCustomRecommendations(
    username: string,
    focus: string[],
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed',
    count: number = 10
  ): Promise<RecommendationResponse> {
    return this.generateRecommendations({
      username,
      type: 'custom',
      focus,
      difficulty,
      count,
    });
  }

  /**
   * 추천 필터링
   */
  private filterRecommendations(
    recommendations: GPTRecommendation[],
    request: RecommendationRequest
  ): GPTRecommendation[] {
    let filtered = recommendations;

    // 난이도 필터링
    if (request.difficulty && request.difficulty !== 'mixed') {
      filtered = filtered.filter(rec => rec.difficulty === request.difficulty);
    }

    // 개수 제한
    if (request.count) {
      filtered = filtered.slice(0, request.count);
    }

    // 우선순위 정렬
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return filtered;
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(userInfo: any, analytics: any[]): number {
    let confidence = 0.5; // 기본 신뢰도

    // 풀이한 문제 수에 따른 신뢰도 증가
    if (userInfo.solvedCount > 100) confidence += 0.2;
    else if (userInfo.solvedCount > 50) confidence += 0.1;

    // 분석 데이터 풍부도에 따른 신뢰도 증가
    if (analytics.length > 10) confidence += 0.2;
    else if (analytics.length > 5) confidence += 0.1;

    // 티어에 따른 신뢰도 조정
    if (userInfo.tier > 20) confidence += 0.1;
    else if (userInfo.tier > 10) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  /**
   * 추천 성능 평가
   */
  async evaluateRecommendationPerformance(
    username: string,
    recommendationId: string,
    feedback: 'positive' | 'negative' | 'neutral'
  ): Promise<void> {
    // 추천 성능 평가 로직
    // 실제 구현에서는 데이터베이스에 피드백을 저장하고
    // 추천 알고리즘을 개선하는 데 사용
    console.log(`추천 ${recommendationId}에 대한 피드백: ${feedback}`);
  }

  /**
   * 추천 히스토리 조회
   */
  async getRecommendationHistory(username: string, limit: number = 10): Promise<GPTRecommendation[]> {
    // 추천 히스토리 조회 로직
    // 실제 구현에서는 데이터베이스에서 히스토리를 조회
    return [];
  }

  /**
   * 추천 통계 조회
   */
  async getRecommendationStats(username: string): Promise<{
    totalRecommendations: number;
    positiveFeedback: number;
    negativeFeedback: number;
    averageRating: number;
  }> {
    // 추천 통계 조회 로직
    return {
      totalRecommendations: 0,
      positiveFeedback: 0,
      negativeFeedback: 0,
      averageRating: 0,
    };
  }
}
