import { Request, Response, NextFunction } from 'express';
import { RateLimitResult } from './types';

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private requests: Map<string, number[]>;
  private solvedacLimiter: Map<string, number[]>;
  private solvedacWindow: number;
  private solvedacMax: number;

  constructor(windowMs: number = 900000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
    this.solvedacLimiter = new Map();
    this.solvedacWindow = 900000; // 15분
    this.solvedacMax = 200; // solved.ac 제한보다 여유있게
  }

  isAllowed(ip: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }

    const userRequests = this.requests.get(ip)!;
    
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(ip, validRequests);

    if (validRequests.length >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.ceil((validRequests[0] + this.windowMs) / 1000)
      };
    }

    validRequests.push(now);
    this.requests.set(ip, validRequests);

    return {
      allowed: true,
      remaining: this.maxRequests - validRequests.length,
      resetTime: Math.ceil((now + this.windowMs) / 1000)
    };
  }

  checkSolvedacLimit(): { allowed: boolean; retryAfter?: number; remaining?: number } {
    const now = Date.now();
    const windowStart = now - this.solvedacWindow;
    const key = 'global';

    if (!this.solvedacLimiter.has(key)) {
      this.solvedacLimiter.set(key, []);
    }

    const apiRequests = this.solvedacLimiter.get(key)!;
    const validRequests = apiRequests.filter(timestamp => timestamp > windowStart);
    this.solvedacLimiter.set(key, validRequests);

    if (validRequests.length >= this.solvedacMax) {
      return {
        allowed: false,
        retryAfter: Math.ceil((validRequests[0] + this.solvedacWindow - now) / 1000)
      };
    }

    validRequests.push(now);
    this.solvedacLimiter.set(key, validRequests);

    return {
      allowed: true,
      remaining: this.solvedacMax - validRequests.length
    };
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
      const result = this.isAllowed(ip);

      res.set({
        'X-RateLimit-Limit': this.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString()
      });

      if (!result.allowed) {
        res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: result.resetTime
        });
        return;
      }

      next();
    };
  }

  getStats(): { activeIPs: number; solvedacRequests: number } {
    return {
      activeIPs: this.requests.size,
      solvedacRequests: this.solvedacLimiter.get('global')?.length || 0
    };
  }
}