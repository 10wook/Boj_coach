/**
 * GPT API 연동 서비스
 * OpenAI GPT를 활용한 맞춤형 학습 추천 시스템
 */

export interface GPTRecommendation {
  type: 'problem' | 'study_plan' | 'analysis' | 'motivation';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GPTStudyPlan {
  weekGoal: string;
  dailyPlans: Array<{
    day: string;
    focus: string;
    problems: string[];
    estimatedTime: string;
    tips: string[];
  }>;
  focusAreas: string[];
  expectedOutcome: string;
}

export interface GPTAnalysis {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  insights: string[];
  nextSteps: string[];
}

export class GPTService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1';
  }

  /**
   * GPT API 요청 헬퍼
   */
  private async makeRequest(messages: any[], model: string = 'gpt-3.5-turbo'): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`GPT API 요청 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('GPT API 요청 오류:', error);
      throw error;
    }
  }

  /**
   * 맞춤형 학습 추천 생성
   */
  async generatePersonalizedRecommendations(
    username: string,
    userStats: any,
    weakness: any
  ): Promise<GPTRecommendation[]> {
    const prompt = `
당신은 백준 코딩테스트 준비를 도와주는 AI 코치입니다.

사용자 정보:
- 사용자명: ${username}
- 현재 티어: ${userStats.tier}
- 풀이한 문제 수: ${userStats.solvedCount}
- 약점 태그: ${weakness.weakTags.join(', ')}
- 약점 난이도: ${weakness.weakLevels.join(', ')}

위 정보를 바탕으로 맞춤형 학습 추천을 JSON 형식으로 제공해주세요.
다음 형식으로 응답해주세요:

{
  "recommendations": [
    {
      "type": "problem",
      "title": "추천 제목",
      "content": "구체적인 추천 내용",
      "priority": "high",
      "estimatedTime": "30분",
      "difficulty": "medium"
    }
  ]
}

추천 유형: problem, study_plan, analysis, motivation
우선순위: high, medium, low
난이도: easy, medium, hard
`;

    try {
      const response = await this.makeRequest([
        { role: 'system', content: '당신은 백준 코딩테스트 준비를 도와주는 전문 AI 코치입니다.' },
        { role: 'user', content: prompt }
      ]);

      // JSON 파싱 시도
      try {
        const parsed = JSON.parse(response);
        return parsed.recommendations || [];
      } catch {
        // JSON 파싱 실패 시 기본 추천 생성
        return this.generateDefaultRecommendations(weakness);
      }
    } catch (error) {
      console.error('GPT 추천 생성 오류:', error);
      return this.generateDefaultRecommendations(weakness);
    }
  }

  /**
   * 주간 학습 계획 생성
   */
  async generateWeeklyStudyPlan(
    username: string,
    userStats: any,
    weakness: any
  ): Promise<GPTStudyPlan> {
    const prompt = `
당신은 백준 코딩테스트 준비를 도와주는 AI 코치입니다.

사용자 정보:
- 사용자명: ${username}
- 현재 티어: ${userStats.tier}
- 약점 태그: ${weakness.weakTags.join(', ')}
- 약점 난이도: ${weakness.weakLevels.join(', ')}

위 정보를 바탕으로 1주일 학습 계획을 JSON 형식으로 제공해주세요.
다음 형식으로 응답해주세요:

{
  "weekGoal": "주간 목표",
  "dailyPlans": [
    {
      "day": "월요일",
      "focus": "집중 영역",
      "problems": ["문제1", "문제2"],
      "estimatedTime": "2시간",
      "tips": ["팁1", "팁2"]
    }
  ],
  "focusAreas": ["집중 영역1", "집중 영역2"],
  "expectedOutcome": "예상 결과"
}
`;

    try {
      const response = await this.makeRequest([
        { role: 'system', content: '당신은 백준 코딩테스트 준비를 도와주는 전문 AI 코치입니다.' },
        { role: 'user', content: prompt }
      ]);

      try {
        const parsed = JSON.parse(response);
        return parsed;
      } catch {
        return this.generateDefaultWeeklyPlan(weakness);
      }
    } catch (error) {
      console.error('GPT 주간 계획 생성 오류:', error);
      return this.generateDefaultWeeklyPlan(weakness);
    }
  }

  /**
   * 학습 분석 및 인사이트 제공
   */
  async generateLearningAnalysis(
    username: string,
    userStats: any,
    analytics: any
  ): Promise<GPTAnalysis> {
    const prompt = `
당신은 백준 코딩테스트 준비를 도와주는 AI 코치입니다.

사용자 정보:
- 사용자명: ${username}
- 현재 티어: ${userStats.tier}
- 풀이한 문제 수: ${userStats.solvedCount}
- 태그별 정확도: ${JSON.stringify(analytics.tagAccuracy?.slice(0, 5) || [])}
- 난이도별 성공률: ${JSON.stringify(analytics.levelSuccessRate?.slice(0, 5) || [])}

위 정보를 바탕으로 학습 분석 및 인사이트를 JSON 형식으로 제공해주세요.
다음 형식으로 응답해주세요:

{
  "strengths": ["강점1", "강점2"],
  "weaknesses": ["약점1", "약점2"],
  "recommendations": ["추천1", "추천2"],
  "insights": ["인사이트1", "인사이트2"],
  "nextSteps": ["다음 단계1", "다음 단계2"]
}
`;

    try {
      const response = await this.makeRequest([
        { role: 'system', content: '당신은 백준 코딩테스트 준비를 도와주는 전문 AI 코치입니다.' },
        { role: 'user', content: prompt }
      ]);

      try {
        const parsed = JSON.parse(response);
        return parsed;
      } catch {
        return this.generateDefaultAnalysis(userStats);
      }
    } catch (error) {
      console.error('GPT 분석 생성 오류:', error);
      return this.generateDefaultAnalysis(userStats);
    }
  }

  /**
   * 동기부여 메시지 생성
   */
  async generateMotivationMessage(
    username: string,
    userStats: any,
    progress: any
  ): Promise<string> {
    const prompt = `
당신은 백준 코딩테스트 준비를 도와주는 AI 코치입니다.

사용자 정보:
- 사용자명: ${username}
- 현재 티어: ${userStats.tier}
- 풀이한 문제 수: ${userStats.solvedCount}
- 연속 학습: ${progress.streak}일
- 주간 진도: ${progress.weeklySolved}문제

위 정보를 바탕으로 동기부여 메시지를 생성해주세요.
격려와 함께 구체적인 다음 단계를 제시해주세요.
`;

    try {
      const response = await this.makeRequest([
        { role: 'system', content: '당신은 백준 코딩테스트 준비를 도와주는 전문 AI 코치입니다.' },
        { role: 'user', content: prompt }
      ]);

      return response || this.generateDefaultMotivation(userStats);
    } catch (error) {
      console.error('GPT 동기부여 메시지 생성 오류:', error);
      return this.generateDefaultMotivation(userStats);
    }
  }

  /**
   * 기본 추천 생성 (GPT 실패 시)
   */
  private generateDefaultRecommendations(weakness: any): GPTRecommendation[] {
    return [
      {
        type: 'problem',
        title: `${weakness.weakTags[0] || '구현'} 태그 집중 학습`,
        content: `${weakness.weakTags[0] || '구현'} 태그 문제를 5개 풀어보세요.`,
        priority: 'high',
        estimatedTime: '1시간',
        difficulty: 'medium',
      },
      {
        type: 'study_plan',
        title: '주간 학습 계획',
        content: '매일 1시간씩 코딩테스트 문제를 풀어보세요.',
        priority: 'high',
        estimatedTime: '7시간',
        difficulty: 'easy',
      },
    ];
  }

  /**
   * 기본 주간 계획 생성
   */
  private generateDefaultWeeklyPlan(weakness: any): GPTStudyPlan {
    return {
      weekGoal: `${weakness.weakTags[0] || '구현'} 태그 집중 학습`,
      dailyPlans: [
        {
          day: '월요일',
          focus: '기초 문제',
          problems: ['백준 1000', '백준 1001'],
          estimatedTime: '1시간',
          tips: ['기본 문법 복습', '입출력 연습'],
        },
        {
          day: '화요일',
          focus: '약점 태그',
          problems: ['백준 1463', '백준 1260'],
          estimatedTime: '1시간',
          tips: ['알고리즘 이해', '패턴 파악'],
        },
      ],
      focusAreas: weakness.weakTags.slice(0, 3),
      expectedOutcome: '약점 태그 이해도 향상',
    };
  }

  /**
   * 기본 분석 생성
   */
  private generateDefaultAnalysis(userStats: any): GPTAnalysis {
    return {
      strengths: ['꾸준한 학습', '기본기 탄탄'],
      weaknesses: ['고급 알고리즘', '최적화'],
      recommendations: ['기초 문제 더 풀기', '알고리즘 공부'],
      insights: ['점진적 발전 중', '지속적인 학습 필요'],
      nextSteps: ['다음 단계 문제 도전', '복습 계획 수립'],
    };
  }

  /**
   * 기본 동기부여 메시지
   */
  private generateDefaultMotivation(userStats: any): string {
    return `안녕하세요 ${userStats.username || '학습자'}님! 현재 ${userStats.tier || 0}티어에 계시는군요. 꾸준한 학습으로 더 높은 단계에 도전해보세요! 💪`;
  }
}
