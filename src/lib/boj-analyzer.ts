/**
 * 백준 데이터 분석 및 통계 처리 클래스
 */

import { SolvedAcAPI, SolvedAcUser, SolvedAcProblem, SolvedAcStatistics } from './solved-ac-api';
import { SolvedAcWeakness } from '../types/solved-ac';

export class BojAnalyzer {
  private solvedAcAPI: SolvedAcAPI;

  constructor(apiKey?: string) {
    this.solvedAcAPI = new SolvedAcAPI(apiKey);
  }

  /**
   * 사용자 약점 분석
   */
  async analyzeWeakness(username: string): Promise<SolvedAcWeakness> {
    const userInfo = await this.solvedAcAPI.getUserInfo(username);
    const statistics = await this.solvedAcAPI.getUserStatistics(username);
    
    // 태그별 성공률 계산
    const tagSuccessRates: Record<string, number> = {};
    const levelSuccessRates: Record<number, number> = {};
    
    // 약점 태그 식별 (성공률이 낮은 태그들)
    const weakTags = Object.entries(statistics.tagStatistics)
      .filter(([tag, count]) => count < 5) // 5개 미만 풀이한 태그
      .map(([tag]) => tag);
    
    // 약점 난이도 식별
    const weakLevels = Object.entries(statistics.levelDistribution)
      .filter(([level, count]) => count < 3) // 3개 미만 풀이한 난이도
      .map(([level]) => parseInt(level));
    
    // 추천 문제 생성
    const recommendations = await this.generateRecommendations(
      weakTags, 
      weakLevels, 
      userInfo.tier
    );
    
    return {
      weakTags,
      weakLevels,
      recommendations,
    };
  }

  /**
   * 학습 진도 분석
   */
  async analyzeProgress(username: string): Promise<{
    currentTier: number;
    targetTier: number;
    progressPercentage: number;
    nextMilestone: string;
    recommendedActions: string[];
  }> {
    const userInfo = await this.solvedAcAPI.getUserInfo(username);
    const statistics = await this.solvedAcAPI.getUserStatistics(username);
    
    const currentTier = userInfo.tier;
    const targetTier = Math.min(currentTier + 5, 31); // 5단계 상승 목표
    const progressPercentage = Math.min((currentTier / targetTier) * 100, 100);
    
    const nextMilestone = this.getNextMilestone(currentTier);
    const recommendedActions = this.getRecommendedActions(statistics, currentTier);
    
    return {
      currentTier,
      targetTier,
      progressPercentage,
      nextMilestone,
      recommendedActions,
    };
  }

  /**
   * 맞춤형 문제 추천
   */
  async getPersonalizedRecommendations(username: string, count: number = 10): Promise<SolvedAcProblem[]> {
    const weakness = await this.analyzeWeakness(username);
    const userInfo = await this.solvedAcAPI.getUserInfo(username);
    
    const recommendations: SolvedAcProblem[] = [];
    
    // 약점 태그 기반 추천
    for (const tag of weakness.weakTags.slice(0, 3)) {
      const problems = await this.solvedAcAPI.searchProblemsByTag(tag, 1, 5);
      recommendations.push(...problems.items.slice(0, 2));
    }
    
    // 현재 티어 기반 추천
    const tierProblems = await this.solvedAcAPI.searchProblemsByLevel(
      this.getTierLevel(userInfo.tier), 
      1, 
      5
    );
    recommendations.push(...tierProblems.items.slice(0, 3));
    
    return recommendations.slice(0, count);
  }

  /**
   * 주간 학습 계획 생성
   */
  async generateWeeklyPlan(username: string): Promise<{
    weekGoal: string;
    dailyTargets: string[];
    focusAreas: string[];
    recommendedProblems: SolvedAcProblem[];
  }> {
    const weakness = await this.analyzeWeakness(username);
    const progress = await this.analyzeProgress(username);
    
    const weekGoal = `${progress.nextMilestone} 달성을 위한 ${weakness.weakTags.slice(0, 2).join(', ')} 집중 학습`;
    
    const dailyTargets = [
      '월요일: 기초 문제 3개 풀이',
      '화요일: 약점 태그 문제 2개 풀이',
      '수요일: 중급 문제 2개 풀이',
      '목요일: 약점 태그 문제 2개 풀이',
      '금요일: 고급 문제 1개 풀이',
      '토요일: 복습 및 정리',
      '일요일: 새로운 태그 도전'
    ];
    
    const focusAreas = weakness.weakTags.slice(0, 3);
    const recommendedProblems = await this.getPersonalizedRecommendations(username, 7);
    
    return {
      weekGoal,
      dailyTargets,
      focusAreas,
      recommendedProblems,
    };
  }

  /**
   * 티어별 레벨 매핑
   */
  private getTierLevel(tier: number): number {
    if (tier <= 5) return 1; // Bronze
    if (tier <= 10) return 2; // Silver
    if (tier <= 15) return 3; // Gold
    if (tier <= 20) return 4; // Platinum
    if (tier <= 25) return 5; // Diamond
    return 6; // Ruby
  }

  /**
   * 다음 마일스톤 계산
   */
  private getNextMilestone(currentTier: number): string {
    const milestones = [
      { tier: 5, name: 'Bronze V' },
      { tier: 10, name: 'Silver V' },
      { tier: 15, name: 'Gold V' },
      { tier: 20, name: 'Platinum V' },
      { tier: 25, name: 'Diamond V' },
      { tier: 30, name: 'Ruby V' }
    ];
    
    const nextMilestone = milestones.find(m => m.tier > currentTier);
    return nextMilestone ? nextMilestone.name : 'Master';
  }

  /**
   * 추천 액션 생성
   */
  private getRecommendedActions(statistics: SolvedAcStatistics, currentTier: number): string[] {
    const actions: string[] = [];
    
    if (statistics.totalSolved < 50) {
      actions.push('기초 문제를 더 많이 풀어보세요');
    }
    
    const weakTags = Object.entries(statistics.tagStatistics)
      .filter(([_, count]) => count < 3)
      .map(([tag, _]) => tag);
    
    if (weakTags.length > 0) {
      actions.push(`${weakTags.slice(0, 2).join(', ')} 태그 문제에 집중하세요`);
    }
    
    if (currentTier < 10) {
      actions.push('Silver 진입을 위해 구현 문제를 많이 풀어보세요');
    }
    
    return actions;
  }

  /**
   * 추천 문제 생성
   */
  private async generateRecommendations(
    weakTags: string[], 
    weakLevels: number[], 
    currentTier: number
  ): Promise<{
    problems: SolvedAcProblem[];
    tags: string[];
    levelRange: [number, number];
  }> {
    const problems: SolvedAcProblem[] = [];
    
    // 약점 태그 기반 추천
    for (const tag of weakTags.slice(0, 2)) {
      const tagProblems = await this.solvedAcAPI.searchProblemsByTag(tag, 1, 3);
      problems.push(...tagProblems.items);
    }
    
    // 약점 난이도 기반 추천
    for (const level of weakLevels.slice(0, 2)) {
      const levelProblems = await this.solvedAcAPI.searchProblemsByLevel(level, 1, 2);
      problems.push(...levelProblems.items);
    }
    
    return {
      problems: problems.slice(0, 10),
      tags: weakTags.slice(0, 3),
      levelRange: [Math.min(...weakLevels), Math.max(...weakLevels)] as [number, number],
    };
  }
}
