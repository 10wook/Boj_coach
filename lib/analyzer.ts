import { 
  SolvedacUser, 
  SolvedacProblemStats, 
  SolvedacTagStats, 
  WeaknessAnalysis, 
  WeakTag, 
  Recommendation,
  ProgressAnalysis,
  DifficultyAnalysis,
  TimePatterns
} from './types';

interface TagAccuracy {
  tag: string;
  tagDisplayNames: Record<string, string>;
  solved: number;
  tried: number;
  accuracy: number;
  successRate: string;
}

interface LearningProgress {
  overallProgress: {
    currentTier: string;
    solvedCount: number;
    rating: number;
    progressToNextTier: number;
  };
  strengthAreas: TagAccuracy[];
  improvementAreas: TagAccuracy[];
  difficultyProgression: DifficultyAnalysis;
  activityPatterns: TimePatterns;
  recommendations: Recommendation[];
}

export class DataAnalyzer {
  calculateTagAccuracy(tagStats: SolvedacTagStats[]): TagAccuracy[] {
    if (!tagStats || !Array.isArray(tagStats)) {
      return [];
    }

    return tagStats.map(tag => ({
      tag: tag.tag.key,
      tagDisplayNames: tag.tag.displayNames || {},
      solved: tag.solved,
      tried: tag.tried,
      accuracy: tag.tried > 0 ? (tag.solved / tag.tried) : 0,
      successRate: tag.tried > 0 ? ((tag.solved / tag.tried) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.accuracy - a.accuracy);
  }

  analyzeDifficultySuccess(problemStats: SolvedacProblemStats[]): DifficultyAnalysis {
    if (!problemStats || !Array.isArray(problemStats)) {
      return {
        byLevel: {},
        summary: {
          easiest: 'N/A',
          hardest: 'N/A',
          averageLevel: '0',
          totalSolved: 0
        }
      };
    }

    const levelGroups: Record<number, { tierName: string; solved: number; total: number }> = {};
    let totalLevel = 0;
    let totalCount = 0;

    problemStats.forEach(stat => {
      const level = stat.level || 0;
      const count = stat.solved || 0;
      
      if (level > 0 && count > 0) {
        if (!levelGroups[level]) {
          levelGroups[level] = {
            tierName: this.getTierName(level),
            solved: 0,
            total: 0
          };
        }
        levelGroups[level].solved += count;
        levelGroups[level].total += count;
        totalLevel += level * count;
        totalCount += count;
      }
    });

    const levels = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);
    
    return {
      byLevel: levelGroups,
      summary: {
        easiest: levels.length > 0 ? this.getTierName(levels[0]) : 'N/A',
        hardest: levels.length > 0 ? this.getTierName(levels[levels.length - 1]) : 'N/A',
        averageLevel: totalCount > 0 ? (totalLevel / totalCount).toFixed(1) : '0',
        totalSolved: totalCount
      }
    };
  }

  analyzeTimePatterns(userData: SolvedacUser): TimePatterns {
    return {
      dailyAverage: userData.solvedCount > 0 ? (userData.solvedCount / 365).toFixed(1) : '0.0',
      weeklyAverage: userData.solvedCount > 0 ? (userData.solvedCount / 52).toFixed(1) : '0.0',
      monthlyAverage: userData.solvedCount > 0 ? (userData.solvedCount / 12).toFixed(1) : '0.0',
      streak: userData.maxStreak || 0,
      estimatedActiveTime: this.estimateActiveTime(userData.solvedCount)
    };
  }

  private estimateActiveTime(solvedCount: number): string {
    if (solvedCount === 0) return '신규 사용자';
    if (solvedCount < 50) return '초급자 (< 3개월)';
    if (solvedCount < 200) return '중급자 (3-12개월)';
    if (solvedCount < 500) return '상급자 (1-2년)';
    return '고급자 (2년+)';
  }

  trackLearningProgress(userData: SolvedacUser, tagStats: SolvedacTagStats[], problemStats: SolvedacProblemStats[]): LearningProgress {
    const tagAccuracy = this.calculateTagAccuracy(tagStats);
    const difficultyAnalysis = this.analyzeDifficultySuccess(problemStats);
    const timePatterns = this.analyzeTimePatterns(userData);

    const strongTags = tagAccuracy
      .filter(t => t.tried >= 5 && t.accuracy >= 0.8)
      .slice(0, 5);

    const improvingTags = tagAccuracy
      .filter(t => t.tried >= 3 && t.accuracy >= 0.5 && t.accuracy < 0.8)
      .slice(0, 5);

    return {
      overallProgress: {
        currentTier: this.getTierName(userData.tier),
        solvedCount: userData.solvedCount,
        rating: userData.rating,
        progressToNextTier: this.calculateTierProgress(userData.rating, userData.tier)
      },
      strengthAreas: strongTags,
      improvementAreas: improvingTags,
      difficultyProgression: difficultyAnalysis,
      activityPatterns: timePatterns,
      recommendations: this.generateProgressRecommendations(strongTags, improvingTags, userData)
    };
  }

  identifyWeakTags(tagStats: SolvedacTagStats[]): WeakTag[] {
    const tagAccuracy = this.calculateTagAccuracy(tagStats);
    
    return tagAccuracy
      .filter(t => t.tried >= 3 && t.accuracy < 0.6)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5)
      .map(tag => ({
        ...tag,
        severity: this.calculateWeaknessSeverity(tag.accuracy, tag.tried),
        improvementPotential: this.calculateImprovementPotential(tag),
        estimatedTime: this.estimateImprovementTime({
          severity: this.calculateWeaknessSeverity(tag.accuracy, tag.tried)
        })
      }));
  }

  private calculateWeaknessSeverity(accuracy: number, tried: number): 'Critical' | 'High' | 'Medium' | 'Low' {
    if (accuracy < 0.3) return 'Critical';
    if (accuracy < 0.5) return 'High';
    if (accuracy < 0.6) return 'Medium';
    return 'Low';
  }

  private calculateImprovementPotential(tag: TagAccuracy): 'High' | 'Medium' | 'Low' {
    const baseScore = (1 - tag.accuracy) * tag.tried;
    if (baseScore > 10) return 'High';
    if (baseScore > 5) return 'Medium';
    return 'Low';
  }

  analyzeDifficultyPerformance(problemStats: SolvedacProblemStats[], userData: SolvedacUser) {
    const difficultyAnalysis = this.analyzeDifficultySuccess(problemStats);
    const currentTier = userData.tier;
    
    return {
      currentLevelMastery: this.calculateLevelMastery(currentTier, difficultyAnalysis.byLevel),
      readyForNextLevel: this.isReadyForNextLevel(currentTier, difficultyAnalysis.byLevel),
      strugglingLevels: this.findStrugglingLevels(difficultyAnalysis.byLevel),
      recommendation: this.generateDifficultyRecommendation(currentTier, difficultyAnalysis)
    };
  }

  private calculateLevelMastery(currentTier: number, levelData: Record<number, any>): number {
    const currentLevelData = levelData[currentTier];
    if (!currentLevelData || currentLevelData.total === 0) {
      return 0;
    }
    return (currentLevelData.solved / Math.max(currentLevelData.total, 10)) * 100;
  }

  private isReadyForNextLevel(currentTier: number, levelData: Record<number, any>): boolean {
    const mastery = this.calculateLevelMastery(currentTier, levelData);
    const solved = levelData[currentTier]?.solved || 0;
    return mastery >= 70 && solved >= 10;
  }

  private findStrugglingLevels(levelData: Record<number, any>): Array<{
    level: number;
    tierName: string;
    mastery: string;
  }> {
    return Object.entries(levelData)
      .filter(([level, data]) => {
        const mastery = (data.solved / Math.max(data.total, 1)) * 100;
        return data.total >= 3 && mastery < 50;
      })
      .map(([level, data]) => ({
        level: parseInt(level),
        tierName: this.getTierName(parseInt(level)),
        mastery: ((data.solved / data.total) * 100).toFixed(1)
      }));
  }

  private generateDifficultyRecommendation(currentTier: number, difficultyAnalysis: DifficultyAnalysis): string {
    const mastery = this.calculateLevelMastery(currentTier, difficultyAnalysis.byLevel);
    
    if (mastery < 50) {
      return `현재 티어 (${this.getTierName(currentTier)}) 문제를 더 연습하세요`;
    } else if (mastery >= 70) {
      return `다음 티어 (${this.getTierName(currentTier + 1)}) 문제에 도전해보세요`;
    } else {
      return `현재 티어 문제를 마스터한 후 다음 단계로 진행하세요`;
    }
  }

  calculateLearningPriority(tagStats: SolvedacTagStats[], problemStats: SolvedacProblemStats[], userData: SolvedacUser) {
    const weakTags = this.identifyWeakTags(tagStats);
    const difficultyPerformance = this.analyzeDifficultyPerformance(problemStats, userData);
    
    const priorities: Array<{
      type: string;
      priority: number;
      tag?: string;
      reason: string;
      urgency: string;
      estimatedTime: string;
    }> = [];

    weakTags.forEach((tag, index) => {
      priorities.push({
        type: 'tag_improvement',
        priority: this.calculateTagPriority(tag, index),
        tag: tag.tag,
        reason: `${tag.tag} 태그 정확률 ${tag.successRate}% 개선 필요`,
        urgency: tag.severity,
        estimatedTime: this.estimateImprovementTime(tag)
      });
    });

    if (!difficultyPerformance.readyForNextLevel) {
      priorities.push({
        type: 'tier_consolidation',
        priority: 5,
        reason: `현재 티어 (${this.getTierName(userData.tier)}) 마스터리 필요`,
        urgency: 'Medium',
        estimatedTime: '2-3주'
      });
    }

    return priorities.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }

  private calculateTagPriority(tag: WeakTag, baseIndex: number): number {
    let priority = 10 - baseIndex;
    
    if (tag.severity === 'Critical') priority += 3;
    else if (tag.severity === 'High') priority += 2;
    else if (tag.severity === 'Medium') priority += 1;
    
    if (tag.improvementPotential === 'High') priority += 2;
    else if (tag.improvementPotential === 'Medium') priority += 1;
    
    return Math.min(10, priority);
  }

  private estimateImprovementTime(tag: { severity: string }): string {
    if (tag.severity === 'Critical') return '3-4주';
    if (tag.severity === 'High') return '2-3주';
    if (tag.severity === 'Medium') return '1-2주';
    return '1주';
  }

  predictTierAchievement(userData: SolvedacUser, tagStats: SolvedacTagStats[], problemStats: SolvedacProblemStats[]) {
    const currentProgress = this.calculateTierProgress(userData.rating, userData.tier);
    const weaknessCount = this.identifyWeakTags(tagStats).length;
    const difficultyPerformance = this.analyzeDifficultyPerformance(problemStats, userData);
    
    let timeEstimate = '알 수 없음';
    let confidence: 'High' | 'Medium' | 'Low' = 'Low';
    let blockers: string[] = [];
    
    if (currentProgress >= 80 && weaknessCount <= 2 && difficultyPerformance.readyForNextLevel) {
      timeEstimate = '1-2주';
      confidence = 'High';
    } else if (currentProgress >= 50 && weaknessCount <= 3) {
      timeEstimate = '1-2개월';
      confidence = 'Medium';
      if (weaknessCount > 0) {
        blockers.push('태그별 약점 개선 필요');
      }
      if (!difficultyPerformance.readyForNextLevel) {
        blockers.push('현재 티어 마스터리 부족');
      }
    } else {
      timeEstimate = '2-3개월';
      confidence = 'Low';
      blockers.push('기초 실력 향상 필요');
    }
    
    return {
      nextTier: this.getTierName(userData.tier + 1),
      currentProgress: currentProgress.toFixed(1),
      estimatedTime: timeEstimate,
      confidence,
      blockers,
      recommendations: this.generateTierProgressRecommendations(userData, weaknessCount, difficultyPerformance)
    };
  }

  private generateTierProgressRecommendations(userData: SolvedacUser, weaknessCount: number, difficultyPerformance: any): string[] {
    const recommendations: string[] = [];
    
    if (weaknessCount > 3) {
      recommendations.push('약점 태그 집중 학습 (주 3-4개 문제)');
    }
    
    if (!difficultyPerformance.readyForNextLevel) {
      recommendations.push(`현재 티어 (${this.getTierName(userData.tier)}) 문제 추가 연습`);
    }
    
    if (userData.solvedCount < 100) {
      recommendations.push('기본 문제 해결 능력 향상 필요');
    }
    
    recommendations.push('꾸준한 일일 학습 (하루 2-3문제)');
    
    return recommendations;
  }

  analyzeWeakness(problemStats: SolvedacProblemStats[], tagStats: SolvedacTagStats[]): WeaknessAnalysis {
    if (!problemStats || !tagStats) {
      return {
        weakestTags: [],
        recommendations: []
      };
    }

    const weakestTags = this.identifyWeakTags(tagStats);

    return {
      weakestTags,
      recommendations: this.generateRecommendations(weakestTags, problemStats)
    };
  }

  private generateRecommendations(weakestTags: WeakTag[], problemStats: SolvedacProblemStats[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    weakestTags.forEach(tag => {
      recommendations.push({
        type: 'weakness_improvement',
        tag: tag.tag,
        reason: `정확률 ${tag.successRate}%로 개선이 필요합니다`,
        severity: tag.severity,
        suggestedDifficulty: this.suggestDifficulty(problemStats),
        estimatedTime: tag.estimatedTime || this.estimateImprovementTime(tag)
      });
    });

    return recommendations.slice(0, 3);
  }

  private generateProgressRecommendations(strongTags: TagAccuracy[], improvingTags: TagAccuracy[], userData: SolvedacUser): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    if (strongTags.length > 0) {
      recommendations.push({
        type: 'strength_leverage',
        message: `강점 태그(${strongTags.slice(0, 2).map(t => t.tag).join(', ')})를 활용한 고난이도 문제 도전`,
        priority: 'Medium'
      });
    }
    
    if (improvingTags.length > 0) {
      recommendations.push({
        type: 'improvement_focus',
        message: `개선 중인 태그(${improvingTags.slice(0, 2).map(t => t.tag).join(', ')}) 집중 학습`,
        priority: 'High'
      });
    }
    
    const tierProgress = this.calculateTierProgress(userData.rating, userData.tier);
    if (tierProgress > 70) {
      recommendations.push({
        type: 'tier_advancement',
        message: `다음 티어 (${this.getTierName(userData.tier + 1)}) 도전 준비`,
        priority: 'High'
      });
    }
    
    return recommendations;
  }

  analyzeProgress(userData: SolvedacUser, problemStats: SolvedacProblemStats[]): ProgressAnalysis {
    if (!userData || !problemStats) {
      return {
        currentTier: 'Unknown',
        nextTierGoal: 'Unknown',
        progressToNext: 0,
        recentPerformance: 'No data',
        solvedCount: 0,
        rating: 0
      };
    }

    const currentTier = userData.tier;
    const nextTier = Math.min(currentTier + 1, 30);
    const progressToNext = this.calculateTierProgress(userData.rating, currentTier);
    const difficultyAnalysis = this.analyzeDifficultySuccess(problemStats);
    const timePatterns = this.analyzeTimePatterns(userData);

    return {
      currentTier: this.getTierName(currentTier),
      nextTierGoal: this.getTierName(nextTier),
      progressToNext,
      recentPerformance: this.analyzeRecentPerformance(problemStats),
      solvedCount: userData.solvedCount,
      rating: userData.rating,
      difficultyProgression: difficultyAnalysis,
      activityPatterns: timePatterns,
      readyForPromotion: this.isReadyForNextLevel(currentTier, difficultyAnalysis.byLevel)
    };
  }

  calculateTierProgress(rating: number, currentTier: number): number {
    const tierThresholds = [
      0, 30, 60, 90, 120, 150,
      200, 300, 400, 500, 650,
      800, 950, 1100, 1250, 1400,
      1600, 1750, 1900, 2000, 2100,
      2200, 2300, 2400, 2500, 2600,
      2700, 2800, 2850, 2900, 2950
    ];

    const currentThreshold = tierThresholds[currentTier] || 0;
    const nextThreshold = tierThresholds[currentTier + 1] || tierThresholds[30];
    
    const progress = (rating - currentThreshold) / (nextThreshold - currentThreshold);
    return Math.max(0, Math.min(100, progress * 100));
  }

  private suggestDifficulty(problemStats: SolvedacProblemStats[]): string {
    if (!problemStats || problemStats.length === 0) {
      return 'Bronze I - Silver V';
    }

    const levels = problemStats.map(p => p.level).filter(l => l > 0);
    if (levels.length === 0) {
      return 'Bronze I - Silver V';
    }

    const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
    const suggestedLevel = Math.max(1, Math.min(30, Math.round(avgLevel + 1)));
    
    return this.getTierName(suggestedLevel);
  }

  private analyzeRecentPerformance(problemStats: SolvedacProblemStats[]): string {
    if (!problemStats || problemStats.length === 0) {
      return 'No recent activity';
    }

    return 'Active';
  }

  getTierName(tier: number): string {
    const tiers = [
      'Unrated', 'Bronze V', 'Bronze IV', 'Bronze III', 'Bronze II', 'Bronze I',
      'Silver V', 'Silver IV', 'Silver III', 'Silver II', 'Silver I',
      'Gold V', 'Gold IV', 'Gold III', 'Gold II', 'Gold I',
      'Platinum V', 'Platinum IV', 'Platinum III', 'Platinum II', 'Platinum I',
      'Diamond V', 'Diamond IV', 'Diamond III', 'Diamond II', 'Diamond I',
      'Ruby V', 'Ruby IV', 'Ruby III', 'Ruby II', 'Ruby I'
    ];
    return tiers[tier] || 'Unknown';
  }
}