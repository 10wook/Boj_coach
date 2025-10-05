/**
 * solved.ac API 래퍼 클래스
 * solved.ac API v3를 사용하여 백준 데이터를 조회합니다.
 */

export interface SolvedAcUser {
  handle: string;
  bio: string;
  badgeId: string;
  backgroundId: string;
  profileImageUrl: string;
  solvedCount: number;
  voteCount: number;
  class: number;
  classDecoration: string;
  tier: number;
  rating: number;
  ratingByProblemsSum: number;
  ratingByClass: number;
  ratingBySolvedCount: number;
  ratingByVoteCount: number;
  exp: number;
  rivalCount: number;
  reverseRivalCount: number;
  maxStreak: number;
  rank: number;
}

export interface SolvedAcProblem {
  problemId: number;
  titleKo: string;
  isSolvable: boolean;
  isPartial: boolean;
  acceptedUserCount: number;
  level: number;
  votedUserCount: number;
  sprout: boolean;
  givesNoRating: boolean;
  isLevelLocked: boolean;
  averageTries: number;
  official: boolean;
  tags: Array<{
    key: string;
    isMeta: boolean;
    bojTagId: number;
    problemCount: number;
    displayNames: Array<{
      language: string;
      name: string;
      short: string;
    }>;
  }>;
}

export interface SolvedAcSearchResult {
  count: number;
  items: SolvedAcProblem[];
}

export class SolvedAcAPI {
  private baseUrl: string;
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.baseUrl = process.env.SOLVED_AC_API_URL || 'https://solved.ac/api/v3';
    this.apiKey = apiKey;
  }

  /**
   * HTTP 요청을 보내는 헬퍼 메서드
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('solved.ac API 요청 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자 정보 조회
   */
  async getUserInfo(username: string): Promise<SolvedAcUser> {
    return this.request<SolvedAcUser>(`/user/show?handle=${encodeURIComponent(username)}`);
  }

  /**
   * 사용자가 풀이한 문제 목록 조회
   */
  async getUserProblems(username: string, page: number = 1, limit: number = 100): Promise<SolvedAcSearchResult> {
    return this.request<SolvedAcSearchResult>(
      `/search/problem?query=solved_by:${encodeURIComponent(username)}&page=${page}&sort=id&direction=desc`
    );
  }

  /**
   * 문제 상세 정보 조회
   */
  async getProblemInfo(problemId: number): Promise<SolvedAcProblem> {
    return this.request<SolvedAcProblem>(`/problem/show?problemId=${problemId}`);
  }

  /**
   * 태그별 문제 검색
   */
  async searchProblemsByTag(tag: string, page: number = 1, limit: number = 100): Promise<SolvedAcSearchResult> {
    return this.request<SolvedAcSearchResult>(
      `/search/problem?query=tag:${encodeURIComponent(tag)}&page=${page}&sort=id&direction=desc`
    );
  }

  /**
   * 난이도별 문제 검색
   */
  async searchProblemsByLevel(level: number, page: number = 1, limit: number = 100): Promise<SolvedAcSearchResult> {
    return this.request<SolvedAcSearchResult>(
      `/search/problem?query=level:${level}&page=${page}&sort=id&direction=desc`
    );
  }

  /**
   * 사용자 통계 정보 조회 (풀이한 문제들의 태그별 통계)
   */
  async getUserStatistics(username: string): Promise<{
    totalSolved: number;
    tagStatistics: Record<string, number>;
    levelDistribution: Record<number, number>;
  }> {
    const userInfo = await this.getUserInfo(username);
    const problems = await this.getUserProblems(username, 1, 1000); // 최대 1000개 문제 조회

    const tagStatistics: Record<string, number> = {};
    const levelDistribution: Record<number, number> = {};

    // 태그별 통계 계산
    for (const problem of problems.items) {
      for (const tag of problem.tags) {
        tagStatistics[tag.key] = (tagStatistics[tag.key] || 0) + 1;
      }
      levelDistribution[problem.level] = (levelDistribution[problem.level] || 0) + 1;
    }

    return {
      totalSolved: userInfo.solvedCount,
      tagStatistics,
      levelDistribution,
    };
  }

  /**
   * Rate limiting을 위한 지연 함수
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 재시도 로직이 포함된 요청
   */
  private async requestWithRetry<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(endpoint, options);
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Rate limiting 방지를 위한 지연
        await this.delay(1000 * attempt);
        console.log(`API 요청 재시도 ${attempt}/${maxRetries}`);
      }
    }
    
    throw new Error('최대 재시도 횟수 초과');
  }
}
