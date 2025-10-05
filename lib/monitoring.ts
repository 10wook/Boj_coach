import { Request, Response, NextFunction } from 'express';
import { PerformanceMetrics, RequestMetrics, PerformanceStats, CacheStats, ApiCallStats, MemoryStats } from './types';

interface MemoryEntry {
  timestamp: number;
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

export class PerformanceMonitor {
  private metrics: {
    requests: number;
    errors: number;
    responseTime: number[];
    apiCalls: {
      solvedac: number;
      cache: { hits: number; misses: number };
    };
    memory: MemoryEntry[];
    startTime: number;
  };

  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      apiCalls: {
        solvedac: 0,
        cache: { hits: 0, misses: 0 }
      },
      memory: [],
      startTime: Date.now()
    };
    
    this.startMemoryMonitoring();
  }

  recordRequest(duration: number, success: boolean = true): void {
    this.metrics.requests++;
    if (!success) this.metrics.errors++;
    
    this.metrics.responseTime.push(duration);
    
    // 최근 1000개 요청만 유지
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
    }
  }

  recordSolvedacCall(): void {
    this.metrics.apiCalls.solvedac++;
  }

  recordCacheHit(): void {
    this.metrics.apiCalls.cache.hits++;
  }

  recordCacheMiss(): void {
    this.metrics.apiCalls.cache.misses++;
  }

  private startMemoryMonitoring(): void {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.metrics.memory.push({
        timestamp: Date.now(),
        ...memUsage
      });
      
      // 최근 100개 메모리 측정값만 유지
      if (this.metrics.memory.length > 100) {
        this.metrics.memory = this.metrics.memory.slice(-100);
      }
    }, 60000); // 1분마다
  }

  getMetrics(): PerformanceMetrics {
    const now = Date.now();
    const uptime = now - this.metrics.startTime;
    const responseTimes = this.metrics.responseTime;
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    
    const p95ResponseTime = responseTimes.length > 0
      ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)]
      : 0;

    const errorRate = this.metrics.requests > 0
      ? (this.metrics.errors / this.metrics.requests) * 100
      : 0;

    const cacheHitRate = (this.metrics.apiCalls.cache.hits + this.metrics.apiCalls.cache.misses) > 0
      ? (this.metrics.apiCalls.cache.hits / (this.metrics.apiCalls.cache.hits + this.metrics.apiCalls.cache.misses)) * 100
      : 0;

    const currentMemory = process.memoryUsage();

    const requests: RequestMetrics = {
      total: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: errorRate.toFixed(2),
      requestsPerMinute: this.metrics.requests / (uptime / 60000)
    };

    const performance: PerformanceStats = {
      avgResponseTime: avgResponseTime.toFixed(2),
      p95ResponseTime: p95ResponseTime.toFixed(2)
    };

    const cache: CacheStats = {
      hitRate: cacheHitRate.toFixed(2),
      hits: this.metrics.apiCalls.cache.hits,
      misses: this.metrics.apiCalls.cache.misses
    };

    const apiCalls: ApiCallStats = {
      solvedac: this.metrics.apiCalls.solvedac
    };

    const memory: MemoryStats = {
      current: currentMemory,
      peak: this.metrics.memory.reduce((max, curr) => 
        curr.heapUsed > max ? curr.heapUsed : max, 0)
    };

    return {
      uptime: Math.floor(uptime / 1000),
      requests,
      performance,
      cache,
      apiCalls,
      memory
    };
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const success = res.statusCode < 400;
        this.recordRequest(duration, success);
      });
      
      next();
    };
  }

  logMetrics(): void {
    const metrics = this.getMetrics();
    console.log('=== Performance Metrics ===');
    console.log(`Uptime: ${metrics.uptime}s`);
    console.log(`Requests: ${metrics.requests.total} (${metrics.requests.requestsPerMinute.toFixed(1)}/min)`);
    console.log(`Error Rate: ${metrics.requests.errorRate}%`);
    console.log(`Avg Response Time: ${metrics.performance.avgResponseTime}ms`);
    console.log(`Cache Hit Rate: ${metrics.cache.hitRate}%`);
    console.log(`Memory Usage: ${(metrics.memory.current.heapUsed / 1024 / 1024).toFixed(1)}MB`);
    console.log('=========================');
  }

  startPeriodicLogging(intervalMinutes: number = 15): void {
    setInterval(() => {
      this.logMetrics();
    }, intervalMinutes * 60 * 1000);
  }
}