import axios, { AxiosInstance, AxiosError } from 'axios';
import { SolvedacUser, SolvedacProblemStats, SolvedacTagStats, SolvedacProblem, ApiError } from './types';
import type { RateLimiter } from './rateLimiter';

export class SolvedacAPI {
  private baseURL: string;
  private client: AxiosInstance;
  private rateLimiter?: RateLimiter;

  constructor(rateLimiter?: RateLimiter) {
    this.baseURL = process.env.SOLVEDAC_API_URL || 'https://solved.ac/api/v3';
    this.rateLimiter = rateLimiter;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: parseInt(process.env.API_TIMEOUT || '10000'),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BOJ-Coach/1.0'
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        if (this.rateLimiter) {
          const limitCheck = this.rateLimiter.checkSolvedacLimit();
          if (!limitCheck.allowed) {
            const error = new Error('Solved.ac API rate limit exceeded') as ApiError;
            error.retryAfter = limitCheck.retryAfter;
            throw error;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`Solved.ac API: ${response.config.url} - ${response.status}`);
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 429) {
          console.warn('Solved.ac API rate limit hit');
          const retryAfter = error.response.headers['retry-after'] || 60;
          await this.delay(parseInt(retryAfter.toString()) * 1000);
          return this.client.request(error.config!);
        }
        
        console.error('Solvedac API Error:', {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url
        });
        
        const apiError = new Error(error.message) as ApiError;
        apiError.response = error.response;
        throw apiError;
      }
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getUser(username: string): Promise<SolvedacUser> {
    try {
      const response = await this.client.get<SolvedacUser>(`/user/show?handle=${username}`);
      return response.data;
    } catch (error) {
      if ((error as ApiError).response?.status === 404) {
        throw new Error(`User '${username}' not found`);
      }
      throw error;
    }
  }

  async getUserProblems(username: string): Promise<{ items: SolvedacProblem[]; count: number; page: number }> {
    try {
      const response = await this.client.get(`/search/problem?query=solved_by:${username}&sort=level&direction=asc`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getUserStats(username: string): Promise<SolvedacProblemStats[]> {
    try {
      const response = await this.client.get<SolvedacProblemStats[]>(`/user/problem_stats?handle=${username}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getUserTagStats(username: string): Promise<SolvedacTagStats[]> {
    try {
      const response = await this.client.get<SolvedacTagStats[]>(`/user/problem_tag_stats?handle=${username}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getProblems(query: string = '', page: number = 1): Promise<{ items: SolvedacProblem[]; count: number }> {
    try {
      const response = await this.client.get(`/search/problem?query=${query}&page=${page}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getUserSolvedProblems(username: string, page: number = 1, sort: string = 'id'): Promise<{ count: number; items: number[] }> {
    try {
      const response = await this.client.get(`/search/problem?query=solved_by:${username}&sort=${sort}&page=${page}`);
      
      // 문제 ID만 추출
      const problemIds = response.data.items.map((problem: any) => problem.problemId);
      
      return {
        count: response.data.count,
        items: problemIds
      };
    } catch (error) {
      this.handleError(error, `Failed to get solved problems for ${username}`);
      throw error;
    }
  }

  async getAllUserSolvedProblems(username: string): Promise<number[]> {
    try {
      const allProblems: number[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const result = await this.getUserSolvedProblems(username, page, 'id');
        allProblems.push(...result.items);
        
        // 더 이상 가져올 문제가 없으면 중단
        if (result.items.length === 0 || allProblems.length >= result.count) {
          hasMore = false;
        } else {
          page++;
        }
        
        // API 호출 제한을 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return allProblems.sort((a, b) => a - b);
    } catch (error) {
      this.handleError(error, `Failed to get all solved problems for ${username}`);
      throw error;
    }
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