class RateLimiter {
  constructor(windowMs = 900000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
    this.solvedacLimiter = new Map();
    this.solvedacWindow = 900000; // 15분
    this.solvedacMax = 200; // solved.ac 제한보다 여유있게
  }

  isAllowed(ip) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }

    const userRequests = this.requests.get(ip);
    
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

  checkSolvedacLimit() {
    const now = Date.now();
    const windowStart = now - this.solvedacWindow;
    const key = 'global';

    if (!this.solvedacLimiter.has(key)) {
      this.solvedacLimiter.set(key, []);
    }

    const apiRequests = this.solvedacLimiter.get(key);
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
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0];
      const result = this.isAllowed(ip);

      res.set({
        'X-RateLimit-Limit': this.maxRequests,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': result.resetTime
      });

      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: result.resetTime
        });
      }

      next();
    };
  }

  getStats() {
    return {
      activeIPs: this.requests.size,
      solvedacRequests: this.solvedacLimiter.get('global')?.length || 0
    };
  }
}

module.exports = RateLimiter;