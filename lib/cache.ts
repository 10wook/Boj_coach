import { CacheItem } from './types';

export class CacheManager {
  private cache: Map<string, CacheItem<any>>;
  private ttl: number;

  constructor() {
    this.cache = new Map();
    this.ttl = parseInt(process.env.CACHE_TTL || '300'); // 5분 기본값
  }

  generateKey(type: string, params: string | Record<string, any>): string {
    const paramString = typeof params === 'object' ? JSON.stringify(params) : params;
    return `${type}:${paramString}`;
  }

  set<T>(key: string, value: T, customTtl?: number): void {
    const ttl = customTtl || this.ttl;
    const expiresAt = Date.now() + (ttl * 1000);
    
    this.cache.set(key, {
      value,
      expiresAt
    });

    setTimeout(() => {
      this.cache.delete(key);
    }, ttl * 1000);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  async getUserData(username: string): Promise<any | null> {
    const key = this.generateKey('user', username);
    return this.get(key);
  }

  cacheUserData(username: string, data: any, ttl: number = 600): void {
    const key = this.generateKey('user', username);
    this.set(key, data, ttl);
  }

  async getUserStats(username: string): Promise<any | null> {
    const key = this.generateKey('stats', username);
    return this.get(key);
  }

  cacheUserStats(username: string, data: any, ttl: number = 300): void {
    const key = this.generateKey('stats', username);
    this.set(key, data, ttl);
  }

  async getUserTags(username: string): Promise<any | null> {
    const key = this.generateKey('tags', username);
    return this.get(key);
  }

  cacheUserTags(username: string, data: any, ttl: number = 600): void {
    const key = this.generateKey('tags', username);
    this.set(key, data, ttl);
  }

  async getAnalytics(username: string): Promise<any | null> {
    const key = this.generateKey('analytics', username);
    return this.get(key);
  }

  cacheAnalytics(username: string, data: any, ttl: number = 900): void {
    const key = this.generateKey('analytics', username);
    this.set(key, data, ttl);
  }
}