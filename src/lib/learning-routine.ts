/**
 * 학습 루틴 설계 및 관리 시스템
 * 체계적인 코딩테스트 준비 루틴 제공
 */

export interface TierRoadmap {
  tier: number;
  name: string;
  description: string;
  requiredSkills: string[];
  recommendedProblems: number;
  estimatedTime: string;
  nextMilestone: string;
}

export interface WeeklyPlan {
  weekNumber: number;
  goal: string;
  focusAreas: string[];
  dailyPlans: DailyPlan[];
  expectedOutcome: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface DailyPlan {
  day: string;
  focus: string;
  problems: string[];
  estimatedTime: string;
  tips: string[];
  reviewTopics: string[];
}

export interface ReviewSystem {
  reviewSchedule: {
    immediate: string[]; // 즉시 복습
    daily: string[]; // 일일 복습
    weekly: string[]; // 주간 복습
    monthly: string[]; // 월간 복습
  };
  reviewMethods: {
    type: string;
    description: string;
    frequency: string;
  }[];
}

export interface ProgressTracking {
  currentWeek: {
    solvedCount: number;
    newTags: string[];
    levelProgress: number;
    streak: number;
  };
  monthlyTrend: {
    solvedCount: number[];
    accuracyTrend: number[];
    tagDiversity: number[];
  };
  achievements: {
    name: string;
    description: string;
    unlockedAt: string;
    category: 'streak' | 'solved' | 'tier' | 'tag';
  }[];
}

export class LearningRoutine {
  /**
   * 티어별 학습 로드맵 생성
   */
  generateTierRoadmap(): TierRoadmap[] {
    return [
      {
        tier: 1,
        name: 'Bronze V',
        description: '기초 문법과 간단한 구현 문제',
        requiredSkills: ['입출력', '기본 연산', '조건문', '반복문'],
        recommendedProblems: 50,
        estimatedTime: '2-3주',
        nextMilestone: 'Bronze IV',
      },
      {
        tier: 5,
        name: 'Bronze I',
        description: '기본 알고리즘과 자료구조',
        requiredSkills: ['배열', '문자열', '정렬', '탐색'],
        recommendedProblems: 100,
        estimatedTime: '4-6주',
        nextMilestone: 'Silver V',
      },
      {
        tier: 10,
        name: 'Silver V',
        description: '중급 알고리즘과 문제 해결',
        requiredSkills: ['그래프', 'DFS/BFS', 'DP 기초', '그리디'],
        recommendedProblems: 200,
        estimatedTime: '8-12주',
        nextMilestone: 'Silver I',
      },
      {
        tier: 15,
        name: 'Silver I',
        description: '고급 알고리즘과 최적화',
        requiredSkills: ['DP 고급', '그래프 알고리즘', '구간 쿼리', '수학'],
        recommendedProblems: 300,
        estimatedTime: '12-16주',
        nextMilestone: 'Gold V',
      },
      {
        tier: 20,
        name: 'Gold V',
        description: '전문적인 알고리즘과 복잡한 문제',
        requiredSkills: ['고급 DP', '그래프 이론', '자료구조 고급', '수학 고급'],
        recommendedProblems: 500,
        estimatedTime: '16-24주',
        nextMilestone: 'Gold I',
      },
    ];
  }

  /**
   * 주간 학습 계획 생성
   */
  generateWeeklyPlan(
    currentTier: number,
    focusAreas: string[],
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): WeeklyPlan {
    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % 52 + 1;
    
    const dailyPlans: DailyPlan[] = [
      {
        day: '월요일',
        focus: '기초 문제',
        problems: ['백준 1000', '백준 1001', '백준 1002'],
        estimatedTime: '1시간',
        tips: ['기본 문법 복습', '입출력 연습'],
        reviewTopics: ['기본 문법', '입출력'],
      },
      {
        day: '화요일',
        focus: '약점 태그',
        problems: ['백준 1463', '백준 1260', '백준 11726'],
        estimatedTime: '1.5시간',
        tips: ['알고리즘 이해', '패턴 파악'],
        reviewTopics: ['DP', '그래프'],
      },
      {
        day: '수요일',
        focus: '중급 문제',
        problems: ['백준 1931', '백준 11047', '백준 11399'],
        estimatedTime: '1.5시간',
        tips: ['그리디 알고리즘', '정렬'],
        reviewTopics: ['그리디', '정렬'],
      },
      {
        day: '목요일',
        focus: '약점 태그',
        problems: ['백준 2606', '백준 1012', '백준 7576'],
        estimatedTime: '1.5시간',
        tips: ['그래프 탐색', 'BFS/DFS'],
        reviewTopics: ['그래프', 'BFS', 'DFS'],
      },
      {
        day: '금요일',
        focus: '고급 문제',
        problems: ['백준 9251', '백준 11053', '백준 2565'],
        estimatedTime: '2시간',
        tips: ['DP 고급', '최적화'],
        reviewTopics: ['DP', '최적화'],
      },
      {
        day: '토요일',
        focus: '복습 및 정리',
        problems: ['이전 주 문제 복습'],
        estimatedTime: '1시간',
        tips: ['복습', '정리'],
        reviewTopics: ['전체 복습'],
      },
      {
        day: '일요일',
        focus: '새로운 태그 도전',
        problems: ['백준 10828', '백준 9012', '백준 10773'],
        estimatedTime: '1시간',
        tips: ['새로운 알고리즘', '도전'],
        reviewTopics: ['스택', '새로운 태그'],
      },
    ];

    return {
      weekNumber,
      goal: `${focusAreas.join(', ')} 집중 학습`,
      focusAreas,
      dailyPlans,
      expectedOutcome: '약점 태그 이해도 향상 및 새로운 알고리즘 학습',
      difficulty,
    };
  }

  /**
   * 월간 학습 계획 생성
   */
  generateMonthlyPlan(
    currentTier: number,
    targetTier: number,
    focusAreas: string[]
  ): {
    monthGoal: string;
    weeklyGoals: string[];
    focusAreas: string[];
    expectedOutcome: string;
  } {
    const monthGoal = `${targetTier}티어 달성을 위한 ${focusAreas.join(', ')} 집중 학습`;
    
    const weeklyGoals = [
      '1주차: 기초 문제 및 약점 태그 집중',
      '2주차: 중급 문제 및 새로운 알고리즘 학습',
      '3주차: 고급 문제 및 최적화 기법',
      '4주차: 종합 복습 및 실전 연습',
    ];

    return {
      monthGoal,
      weeklyGoals,
      focusAreas,
      expectedOutcome: `${targetTier}티어 달성 및 종합 실력 향상`,
    };
  }

  /**
   * 복습 시스템 설계
   */
  generateReviewSystem(): ReviewSystem {
    return {
      reviewSchedule: {
        immediate: [
          '풀이 직후 10분 내 복습',
          '틀린 문제 즉시 재풀이',
          '핵심 알고리즘 정리',
        ],
        daily: [
          '전날 풀이한 문제 1-2개 복습',
          '핵심 개념 정리',
          '약점 태그 문제 1개',
        ],
        weekly: [
          '주간 학습 내용 종합 복습',
          '약점 태그 집중 복습',
          '새로 학습한 알고리즘 정리',
        ],
        monthly: [
          '월간 학습 내용 전체 복습',
          '약점 태그 완전 정복',
          '새로운 태그 도전',
        ],
      },
      reviewMethods: [
        {
          type: '즉시 복습',
          description: '문제 풀이 직후 10분 내 핵심 개념 정리',
          frequency: '매일',
        },
        {
          type: '일일 복습',
          description: '전날 학습 내용 1-2개 문제 복습',
          frequency: '매일',
        },
        {
          type: '주간 복습',
          description: '주간 학습 내용 종합 정리',
          frequency: '주 1회',
        },
        {
          type: '월간 복습',
          description: '월간 학습 내용 전체 복습',
          frequency: '월 1회',
        },
      ],
    };
  }

  /**
   * 진도 추적 시스템
   */
  generateProgressTracking(
    username: string,
    currentTier: number,
    solvedCount: number
  ): ProgressTracking {
    return {
      currentWeek: {
        solvedCount: Math.floor(Math.random() * 10) + 5, // 5-15개
        newTags: ['구현', '그래프', 'DP'].slice(0, Math.floor(Math.random() * 3) + 1),
        levelProgress: Math.floor(Math.random() * 20) + 10, // 10-30% 진행
        streak: Math.floor(Math.random() * 10) + 1, // 1-10일
      },
      monthlyTrend: {
        solvedCount: [20, 25, 30, 28, 35, 32, 40], // 지난 7일
        accuracyTrend: [75, 78, 82, 80, 85, 83, 87], // 정확도 트렌드
        tagDiversity: [3, 4, 5, 4, 6, 5, 7], // 태그 다양성
      },
      achievements: [
        {
          name: '첫 문제 해결',
          description: '첫 번째 문제를 해결했습니다!',
          unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'solved',
        },
        {
          name: '연속 학습 7일',
          description: '7일 연속으로 학습했습니다!',
          unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'streak',
        },
        {
          name: '100문제 달성',
          description: '100문제를 해결했습니다!',
          unlockedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'solved',
        },
      ],
    };
  }

  /**
   * 학습 루틴 최적화
   */
  optimizeLearningRoutine(
    currentTier: number,
    weakTags: string[],
    strongTags: string[],
    availableTime: number // 분 단위
  ): {
    recommendedRoutine: string;
    timeAllocation: Record<string, number>;
    focusAreas: string[];
    tips: string[];
  } {
    const timeAllocation: Record<string, number> = {
      '기초 문제': Math.floor(availableTime * 0.3),
      '약점 태그': Math.floor(availableTime * 0.4),
      '새로운 태그': Math.floor(availableTime * 0.2),
      '복습': Math.floor(availableTime * 0.1),
    };

    const focusAreas = [
      ...weakTags.slice(0, 2),
      '기초 문제',
      '새로운 알고리즘',
    ];

    const tips = [
      '매일 일정한 시간 학습',
      '약점 태그에 집중',
      '기초 문제로 기본기 다지기',
      '새로운 태그 도전',
      '정기적인 복습',
    ];

    return {
      recommendedRoutine: `${availableTime}분 학습 루틴`,
      timeAllocation,
      focusAreas,
      tips,
    };
  }
}
