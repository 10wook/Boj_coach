/**
 * 백준 데이터 통계 분석 및 처리 클래스
 */

import { SolvedAcAPI } from './solved-ac-api';
import { SolvedAcProblem, SolvedAcUser } from '../types/solved-ac';

export interface TagAccuracy {
  tag: string;
  totalProblems: number;
  solvedProblems: number;
  accuracy: number;
  averageTries: number;
}

export interface LevelSuccessRate {
  level: number;
  totalProblems: number;
  solvedProblems: number;
  successRate: number;
  averageTries: number;
}

export interface TimePattern {
  hour: number;
  solvedCount: number;
  averageAccuracy: number;
  preferredTags: string[];
}

export interface ProgressMetrics {
  currentWeek: {
    solvedCount: number;
    newTags: string[];
    levelProgress: number;
  };
  monthlyTrend: {
    solvedCount: number[];
    accuracyTrend: number[];
    tagDiversity: number[];
  };
  streakInfo: {
    currentStreak: number;
    longestStreak: number;
    streakStartDate: string;
  };
}

export class StatisticsAnalyzer {
  private solvedAcAPI: SolvedAcAPI;

  constructor(apiKey?: string) {
    this.solvedAcAPI = new SolvedAcAPI(apiKey);
  }

  /**
   * 태그별 정확도 계산
   */
  async calculateTagAccuracy(username: string): Promise<TagAccuracy[]> {
    const userProblems = await this.solvedAcAPI.getUserProblems(username, 1, 1000);
    const tagStats: Map<string, { total: number; solved: number; tries: number[] }> = new Map();

    // 각 문제의 태그별 통계 수집
    for (const problem of userProblems.items) {
      for (const tag of problem.tags) {
        if (!tagStats.has(tag.key)) {
          tagStats.set(tag.key, { total: 0, solved: 0, tries: [] });
        }
        
        const stats = tagStats.get(tag.key)!;
        stats.total++;
        stats.solved++; // solved.ac에서 가져온 문제는 이미 풀이한 문제
        stats.tries.push(problem.averageTries);
      }
    }

    // 태그별 정확도 계산
    const tagAccuracies: TagAccuracy[] = [];
    for (const [tag, stats] of tagStats.entries()) {
      const accuracy = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
      const averageTries = stats.tries.length > 0 
        ? stats.tries.reduce((sum, tries) => sum + tries, 0) / stats.tries.length 
        : 0;

      tagAccuracies.push({
        tag,
        totalProblems: stats.total,
        solvedProblems: stats.solved,
        accuracy,
        averageTries,
      });
    }

    return tagAccuracies.sort((a, b) => b.accuracy - a.accuracy);
  }

  /**
   * 난이도별 성공률 분석
   */
  async calculateLevelSuccessRate(username: string): Promise<LevelSuccessRate[]> {
    const userProblems = await this.solvedAcAPI.getUserProblems(username, 1, 1000);
    const levelStats: Map<number, { total: number; solved: number; tries: number[] }> = new Map();

    // 각 문제의 난이도별 통계 수집
    for (const problem of userProblems.items) {
      const level = problem.level;
      if (!levelStats.has(level)) {
        levelStats.set(level, { total: 0, solved: 0, tries: [] });
      }
      
      const stats = levelStats.get(level)!;
      stats.total++;
      stats.solved++;
      stats.tries.push(problem.averageTries);
    }

    // 난이도별 성공률 계산
    const levelSuccessRates: LevelSuccessRate[] = [];
    for (const [level, stats] of levelStats.entries()) {
      const successRate = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
      const averageTries = stats.tries.length > 0 
        ? stats.tries.reduce((sum, tries) => sum + tries, 0) / stats.tries.length 
        : 0;

      levelSuccessRates.push({
        level,
        totalProblems: stats.total,
        solvedProblems: stats.solved,
        successRate,
        averageTries,
      });
    }

    return levelSuccessRates.sort((a, b) => a.level - b.level);
  }

  /**
   * 시간대별 풀이 패턴 분석 (시뮬레이션)
   */
  async analyzeTimePattern(username: string): Promise<TimePattern[]> {
    // 실제로는 백준 API에서 시간 정보를 가져와야 하지만,
    // solved.ac API에는 시간 정보가 없으므로 시뮬레이션 데이터 생성
    const timePatterns: TimePattern[] = [];
    
    // 일반적인 코딩 패턴 시뮬레이션
    const patterns = [
      { hour: 9, solvedCount: 15, accuracy: 85, tags: ['구현', '수학'] },
      { hour: 14, solvedCount: 25, accuracy: 78, tags: ['그래프', 'DP'] },
      { hour: 20, solvedCount: 30, accuracy: 82, tags: ['구현', '그리디'] },
      { hour: 22, solvedCount: 20, accuracy: 75, tags: ['구현', '문자열'] },
    ];

    for (const pattern of patterns) {
      timePatterns.push({
        hour: pattern.hour,
        solvedCount: pattern.solvedCount,
        averageAccuracy: pattern.accuracy,
        preferredTags: pattern.tags,
      });
    }

    return timePatterns.sort((a, b) => a.hour - b.hour);
  }

  /**
   * 학습 진도 추적
   */
  async trackProgress(username: string): Promise<ProgressMetrics> {
    const userInfo = await this.solvedAcAPI.getUserInfo(username);
    const userProblems = await this.solvedAcAPI.getUserProblems(username, 1, 100);
    
    // 현재 주간 진도 (시뮬레이션)
    const currentWeek = {
      solvedCount: Math.floor(Math.random() * 10) + 5, // 5-15개
      newTags: ['구현', '그래프', 'DP'].slice(0, Math.floor(Math.random() * 3) + 1),
      levelProgress: Math.floor(Math.random() * 20) + 10, // 10-30% 진행
    };

    // 월간 트렌드 (시뮬레이션)
    const monthlyTrend = {
      solvedCount: [20, 25, 30, 28, 35, 32, 40], // 지난 7일
      accuracyTrend: [75, 78, 82, 80, 85, 83, 87], // 정확도 트렌드
      tagDiversity: [3, 4, 5, 4, 6, 5, 7], // 태그 다양성
    };

    // 연속 학습 정보 (시뮬레이션)
    const streakInfo = {
      currentStreak: Math.floor(Math.random() * 10) + 1, // 1-10일
      longestStreak: Math.floor(Math.random() * 30) + 10, // 10-40일
      streakStartDate: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString(),
    };

    return {
      currentWeek,
      monthlyTrend,
      streakInfo,
    };
  }

  /**
   * 자주 틀리는 태그 식별
   */
  async identifyWeakTags(username: string): Promise<string[]> {
    const tagAccuracies = await this.calculateTagAccuracy(username);
    
    // 정확도가 70% 미만이고 3개 이상 풀이한 태그들을 약점으로 식별
    const weakTags = tagAccuracies
      .filter(tag => tag.accuracy < 70 && tag.solvedProblems >= 3)
      .map(tag => tag.tag)
      .slice(0, 5); // 상위 5개만 반환

    return weakTags;
  }

  /**
   * 난이도별 성과 분석
   */
  async analyzeLevelPerformance(username: string): Promise<{
    strongLevels: number[];
    weakLevels: number[];
    recommendedLevel: number;
  }> {
    const levelSuccessRates = await this.calculateLevelSuccessRate(username);
    
    const strongLevels = levelSuccessRates
      .filter(level => level.successRate >= 80)
      .map(level => level.level);
    
    const weakLevels = levelSuccessRates
      .filter(level => level.successRate < 60)
      .map(level => level.level);
    
    // 추천 난이도: 성공률이 60-80%인 난이도 중 가장 높은 것
    const recommendedLevel = levelSuccessRates
      .filter(level => level.successRate >= 60 && level.successRate < 80)
      .sort((a, b) => b.level - a.level)[0]?.level || 1;

    return {
      strongLevels,
      weakLevels,
      recommendedLevel,
    };
  }

  /**
   * 학습 우선순위 계산
   */
  async calculateLearningPriority(username: string): Promise<{
    highPriority: string[];
    mediumPriority: string[];
    lowPriority: string[];
  }> {
    const weakTags = await this.identifyWeakTags(username);
    const levelPerformance = await this.analyzeLevelPerformance(username);
    
    // 우선순위 계산 로직
    const highPriority = [
      ...weakTags.slice(0, 2), // 가장 약한 태그 2개
      `레벨 ${levelPerformance.recommendedLevel} 집중`,
    ];
    
    const mediumPriority = [
      ...weakTags.slice(2, 4), // 그 다음 약한 태그들
      '복습 및 정리',
    ];
    
    const lowPriority = [
      '새로운 태그 도전',
      '고급 문제 풀이',
    ];

    return {
      highPriority,
      mediumPriority,
      lowPriority,
    };
  }

  /**
   * 목표 티어 달성 예측
   */
  async predictTierAchievement(username: string, targetTier: number): Promise<{
    currentTier: number;
    targetTier: number;
    estimatedDays: number;
    requiredProblems: number;
    confidence: number;
  }> {
    const userInfo = await this.solvedAcAPI.getUserInfo(username);
    const progress = await this.trackProgress(username);
    
    const currentTier = userInfo.tier;
    const tierDifference = targetTier - currentTier;
    
    // 예측 로직 (시뮬레이션)
    const estimatedDays = tierDifference * 7; // 티어당 1주일
    const requiredProblems = tierDifference * 20; // 티어당 20문제
    const confidence = Math.max(0, 100 - (tierDifference * 5)); // 티어 차이에 따른 신뢰도
    
    return {
      currentTier,
      targetTier,
      estimatedDays,
      requiredProblems,
      confidence,
    };
  }
}
