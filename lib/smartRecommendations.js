class SmartRecommendations {
  constructor(analyzer, solvedac, cache) {
    this.analyzer = analyzer;
    this.solvedac = solvedac;
    this.cache = cache;
    this.learningPatterns = new Map();
    this.adaptiveWeights = new Map();
  }

  async generateRealtimeRecommendations(username, context = {}) {
    const cacheKey = `smart_rec_${username}_${JSON.stringify(context)}`;
    
    // 단기 캐시 확인 (5분)
    let cached = await this.cache.get(cacheKey);
    if (cached) {
      return this.enrichRecommendations(cached, context);
    }

    const [userData, problemStats, tagStats] = await Promise.all([
      this.solvedac.getUser(username),
      this.solvedac.getUserStats(username),
      this.solvedac.getUserTagStats(username)
    ]);

    // 학습 패턴 분석
    await this.updateLearningPattern(username, userData, problemStats, tagStats);
    
    // 적응형 추천 생성
    const recommendations = await this.generateAdaptiveRecommendations(
      username, userData, problemStats, tagStats, context
    );

    // 캐시 저장
    this.cache.set(cacheKey, recommendations, 300);

    return this.enrichRecommendations(recommendations, context);
  }

  async updateLearningPattern(username, userData, problemStats, tagStats) {
    const pattern = this.learningPatterns.get(username) || {
      history: [],
      preferences: {},
      performance: {},
      lastUpdated: 0
    };

    const now = Date.now();
    const daysSinceLastUpdate = (now - pattern.lastUpdated) / (1000 * 60 * 60 * 24);

    // 성과 변화 추적
    if (pattern.lastUserData) {
      const progressMetrics = this.calculateProgressMetrics(pattern.lastUserData, userData);
      pattern.history.push({
        timestamp: now,
        ...progressMetrics
      });

      // 최근 30일 기록만 유지
      pattern.history = pattern.history.filter(h => (now - h.timestamp) < (30 * 24 * 60 * 60 * 1000));
    }

    // 학습 선호도 업데이트
    pattern.preferences = this.analyzePreferences(tagStats, pattern.preferences);
    
    // 성과 패턴 분석
    pattern.performance = this.analyzePerformancePattern(pattern.history, userData);

    pattern.lastUserData = userData;
    pattern.lastUpdated = now;

    this.learningPatterns.set(username, pattern);
  }

  calculateProgressMetrics(oldData, newData) {
    return {
      ratingChange: newData.rating - oldData.rating,
      solvedCountChange: newData.solvedCount - oldData.solvedCount,
      tierChange: newData.tier - oldData.tier,
      streakChange: newData.maxStreak - oldData.maxStreak
    };
  }

  analyzePreferences(tagStats, currentPreferences) {
    const preferences = { ...currentPreferences };
    
    tagStats.forEach(tag => {
      const tagName = tag.tag;
      const accuracy = tag.tried > 0 ? tag.solved / tag.tried : 0;
      const volume = tag.tried;

      // 선호도 점수 계산 (정확도 + 문제 풀이량)
      const preferenceScore = (accuracy * 0.7) + Math.min(volume / 20, 1) * 0.3;
      
      preferences[tagName] = {
        score: preferenceScore,
        accuracy,
        volume,
        lastUpdated: Date.now()
      };
    });

    return preferences;
  }

  analyzePerformancePattern(history, userData) {
    if (history.length < 2) {
      return { trend: 'insufficient_data', momentum: 0 };
    }

    const recent = history.slice(-7); // 최근 7개 기록
    const ratingChanges = recent.map(h => h.ratingChange);
    const solvedChanges = recent.map(h => h.solvedCountChange);

    const avgRatingChange = ratingChanges.reduce((a, b) => a + b, 0) / ratingChanges.length;
    const avgSolvedChange = solvedChanges.reduce((a, b) => a + b, 0) / solvedChanges.length;

    let trend = 'stable';
    if (avgRatingChange > 5) trend = 'improving';
    else if (avgRatingChange < -5) trend = 'declining';

    const momentum = this.calculateMomentum(recent);

    return { trend, momentum, avgRatingChange, avgSolvedChange };
  }

  calculateMomentum(recentHistory) {
    if (recentHistory.length < 3) return 0;

    const weights = [0.5, 0.3, 0.2]; // 최근일수록 높은 가중치
    let momentum = 0;

    for (let i = 0; i < Math.min(3, recentHistory.length); i++) {
      const entry = recentHistory[recentHistory.length - 1 - i];
      momentum += (entry.ratingChange + entry.solvedCountChange * 2) * weights[i];
    }

    return momentum;
  }

  async generateAdaptiveRecommendations(username, userData, problemStats, tagStats, context) {
    const pattern = this.learningPatterns.get(username);
    const weakness = this.analyzer.analyzeWeakness(problemStats, tagStats);
    const progress = this.analyzer.analyzeProgress(userData, problemStats);

    // 적응형 가중치 계산
    const weights = this.calculateAdaptiveWeights(pattern, context);

    const recommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      adaptive: true,
      reasoning: []
    };

    // 즉시 추천 (오늘 할 것)
    recommendations.immediate = await this.generateImmediateRecommendations(
      weakness, progress, pattern, weights
    );

    // 단기 추천 (이번 주)
    recommendations.shortTerm = await this.generateShortTermRecommendations(
      userData, weakness, progress, pattern, weights
    );

    // 장기 추천 (이번 달)
    recommendations.longTerm = await this.generateLongTermRecommendations(
      userData, progress, pattern, weights
    );

    // 추천 이유 설명
    recommendations.reasoning = this.generateReasoningExplanation(pattern, weights);

    return recommendations;
  }

  calculateAdaptiveWeights(pattern, context) {
    const defaultWeights = {
      weakness: 0.4,
      progress: 0.3,
      preference: 0.2,
      momentum: 0.1
    };

    if (!pattern || !pattern.performance) {
      return defaultWeights;
    }

    const weights = { ...defaultWeights };
    const performance = pattern.performance;

    // 성과 트렌드에 따른 가중치 조정
    if (performance.trend === 'declining') {
      weights.weakness += 0.2;
      weights.progress -= 0.1;
    } else if (performance.trend === 'improving') {
      weights.progress += 0.2;
      weights.weakness -= 0.1;
    }

    // 모멘텀에 따른 조정
    if (Math.abs(performance.momentum) > 10) {
      weights.momentum += 0.1;
      weights.preference -= 0.05;
      weights.weakness -= 0.05;
    }

    // 컨텍스트 기반 조정
    if (context.urgency === 'high') {
      weights.weakness += 0.15;
      weights.preference -= 0.15;
    }

    if (context.focus === 'tier_up') {
      weights.progress += 0.2;
      weights.weakness -= 0.1;
    }

    return weights;
  }

  async generateImmediateRecommendations(weakness, progress, pattern, weights) {
    const recommendations = [];

    // 약점 기반 즉시 추천
    if (weakness.weakestTags.length > 0 && weights.weakness > 0.3) {
      const topWeakness = weakness.weakestTags[0];
      recommendations.push({
        type: 'weakness_focus',
        priority: 'high',
        action: `${topWeakness.tag} 태그 문제 1개 풀기`,
        reason: `정확률 ${topWeakness.successRate}%로 가장 약한 영역`,
        estimatedTime: '30-45분',
        difficulty: this.suggestOptimalDifficulty(topWeakness, progress)
      });
    }

    // 진도 기반 즉시 추천
    if (progress.readyForPromotion && weights.progress > 0.25) {
      recommendations.push({
        type: 'tier_challenge',
        priority: 'medium',
        action: `${progress.nextTierGoal} 난이도 문제 도전`,
        reason: '다음 티어 승급 준비 완료',
        estimatedTime: '45-60분',
        difficulty: progress.nextTierGoal
      });
    }

    // 선호도 기반 추천
    if (pattern && pattern.preferences && weights.preference > 0.15) {
      const favoriteTag = this.getFavoriteTag(pattern.preferences);
      if (favoriteTag) {
        recommendations.push({
          type: 'preference_based',
          priority: 'low',
          action: `${favoriteTag} 태그로 워밍업`,
          reason: '선호하는 유형으로 컨디션 조절',
          estimatedTime: '20-30분',
          difficulty: progress.currentTier
        });
      }
    }

    return recommendations.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
  }

  async generateShortTermRecommendations(userData, weakness, progress, pattern, weights) {
    const recommendations = [];

    // 주간 약점 보완 계획
    if (weakness.weakestTags.length > 0) {
      weakness.weakestTags.slice(0, 2).forEach((tag, index) => {
        recommendations.push({
          type: 'weekly_weakness',
          goal: `${tag.tag} 태그 정확률 10% 향상`,
          targetProblems: Math.ceil(tag.tried * 0.3) + 3,
          currentAccuracy: tag.successRate,
          targetAccuracy: Math.min(parseFloat(tag.successRate) + 10, 90),
          timeline: '이번 주'
        });
      });
    }

    // 주간 진도 목표
    const weeklyTarget = Math.max(7, Math.floor(userData.solvedCount / 50));
    recommendations.push({
      type: 'weekly_progress',
      goal: `주간 ${weeklyTarget}문제 해결`,
      breakdown: {
        weakness: Math.ceil(weeklyTarget * weights.weakness),
        progress: Math.ceil(weeklyTarget * weights.progress),
        review: Math.floor(weeklyTarget * 0.2),
        challenge: Math.floor(weeklyTarget * 0.1)
      },
      timeline: '이번 주'
    });

    return recommendations;
  }

  async generateLongTermRecommendations(userData, progress, pattern, weights) {
    const recommendations = [];

    // 월간 티어 목표
    const monthlyRatingGain = this.estimateMonthlyRatingGain(pattern);
    recommendations.push({
      type: 'monthly_tier_goal',
      currentTier: progress.currentTier,
      targetTier: this.calculateTargetTier(userData.tier, monthlyRatingGain),
      estimatedRatingGain: monthlyRatingGain,
      requiredEffort: this.calculateRequiredEffort(monthlyRatingGain),
      timeline: '이번 달'
    });

    // 스킬셋 개발 계획
    if (pattern && pattern.preferences) {
      const underdevelopedAreas = this.identifyUnderdevelopedAreas(pattern.preferences);
      underdevelopedAreas.forEach(area => {
        recommendations.push({
          type: 'skill_development',
          area: area.tag,
          currentLevel: area.currentLevel,
          targetLevel: area.targetLevel,
          learningPath: this.generateLearningPath(area),
          timeline: '이번 달'
        });
      });
    }

    return recommendations;
  }

  generateReasoningExplanation(pattern, weights) {
    const explanations = [];

    if (weights.weakness > 0.4) {
      explanations.push('약점 보완에 집중하는 것을 권장합니다.');
    }

    if (weights.progress > 0.4) {
      explanations.push('티어 승급에 가까워 도전적인 문제를 추천합니다.');
    }

    if (pattern && pattern.performance) {
      if (pattern.performance.trend === 'improving') {
        explanations.push('최근 실력이 향상되고 있어 더 도전적인 목표를 제시합니다.');
      } else if (pattern.performance.trend === 'declining') {
        explanations.push('최근 성과가 아쉬워 기초 다지기를 우선 추천합니다.');
      }
    }

    return explanations;
  }

  enrichRecommendations(recommendations, context) {
    // 컨텍스트에 따른 실시간 조정
    if (context.timeAvailable) {
      recommendations = this.adjustForTimeConstraint(recommendations, context.timeAvailable);
    }

    if (context.currentMood) {
      recommendations = this.adjustForMood(recommendations, context.currentMood);
    }

    // 개인화된 메시지 추가
    recommendations.personalizedMessage = this.generatePersonalizedMessage(recommendations, context);

    return recommendations;
  }

  adjustForTimeConstraint(recommendations, timeAvailable) {
    const timeInMinutes = parseInt(timeAvailable);
    
    if (timeInMinutes < 30) {
      // 짧은 시간: 간단한 문제만
      recommendations.immediate = recommendations.immediate.filter(r => 
        r.estimatedTime && parseInt(r.estimatedTime) <= 30
      );
    } else if (timeInMinutes > 120) {
      // 긴 시간: 도전적인 문제 추가
      recommendations.immediate.forEach(r => {
        if (r.type === 'tier_challenge') {
          r.priority = 'high';
        }
      });
    }

    return recommendations;
  }

  adjustForMood(recommendations, mood) {
    if (mood === 'frustrated') {
      // 좌절감: 쉬운 문제로 자신감 회복
      recommendations.immediate.unshift({
        type: 'confidence_boost',
        priority: 'high',
        action: '쉬운 문제로 워밍업',
        reason: '자신감 회복을 위한 성공 경험',
        estimatedTime: '15-20분'
      });
    } else if (mood === 'motivated') {
      // 의욕적: 도전적인 문제
      recommendations.immediate.forEach(r => {
        if (r.type === 'tier_challenge') {
          r.priority = 'high';
        }
      });
    }

    return recommendations;
  }

  generatePersonalizedMessage(recommendations, context) {
    const messages = [];

    if (recommendations.immediate && recommendations.immediate.length > 0) {
      const highPriority = recommendations.immediate.filter(r => r.priority === 'high');
      if (highPriority.length > 0) {
        messages.push(`오늘은 ${highPriority[0].action}에 집중해보세요!`);
      }
    }

    if (context.streak && context.streak > 0) {
      messages.push(`${context.streak}일 연속 학습 중! 오늘도 화이팅! 🔥`);
    }

    return messages.join(' ');
  }

  // 유틸리티 메서드들
  suggestOptimalDifficulty(weakness, progress) {
    return progress.currentTier; // 현재 티어 수준에서 연습
  }

  getFavoriteTag(preferences) {
    const tags = Object.entries(preferences);
    if (tags.length === 0) return null;
    
    return tags.sort((a, b) => b[1].score - a[1].score)[0][0];
  }

  getPriorityWeight(priority) {
    const weights = { high: 3, medium: 2, low: 1 };
    return weights[priority] || 0;
  }

  estimateMonthlyRatingGain(pattern) {
    if (!pattern || !pattern.performance) return 20;
    
    const baseGain = 20;
    const momentum = pattern.performance.momentum || 0;
    
    return Math.max(5, baseGain + momentum);
  }

  calculateTargetTier(currentTier, ratingGain) {
    // 티어 승급에 필요한 대략적인 레이팅 추정
    const tierGaps = [30, 30, 30, 30, 30, 50, 100, 100, 100, 150]; // 간소화된 버전
    
    let tier = currentTier;
    let remainingGain = ratingGain;
    
    while (remainingGain > 0 && tier < 30) {
      const gapToNext = tierGaps[Math.floor(tier / 5)] || 100;
      if (remainingGain >= gapToNext) {
        tier++;
        remainingGain -= gapToNext;
      } else {
        break;
      }
    }
    
    return tier;
  }

  calculateRequiredEffort(ratingGain) {
    const problemsPerRating = 0.5; // 대략적인 추정
    return Math.ceil(ratingGain * problemsPerRating);
  }

  identifyUnderdevelopedAreas(preferences) {
    const allTags = ['구현', '수학', '그래프', 'DP', '그리디', '문자열', '정렬'];
    const underdeveloped = [];
    
    allTags.forEach(tag => {
      const pref = preferences[tag];
      if (!pref || pref.score < 0.5) {
        underdeveloped.push({
          tag,
          currentLevel: pref ? pref.score : 0,
          targetLevel: 0.7
        });
      }
    });
    
    return underdeveloped.slice(0, 3); // 상위 3개만
  }

  generateLearningPath(area) {
    return [
      `${area.tag} 기초 문제 5개`,
      `${area.tag} 중급 문제 3개`,
      `${area.tag} 복합 문제 2개`
    ];
  }
}

module.exports = SmartRecommendations;