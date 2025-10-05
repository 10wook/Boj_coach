class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttl = parseInt(process.env.CACHE_TTL) || 300; // 5분 기본값
  }

  generateKey(type, params) {
    const paramString = typeof params === 'object' ? JSON.stringify(params) : params;
    return `${type}:${paramString}`;
  }

  set(key, value, customTtl = null) {
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

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  async getUserData(username) {
    const key = this.generateKey('user', username);
    return this.get(key);
  }

  cacheUserData(username, data, ttl = 600) {
    const key = this.generateKey('user', username);
    this.set(key, data, ttl);
  }

  async getUserStats(username) {
    const key = this.generateKey('stats', username);
    return this.get(key);
  }

  cacheUserStats(username, data, ttl = 300) {
    const key = this.generateKey('stats', username);
    this.set(key, data, ttl);
  }

  async getUserTags(username) {
    const key = this.generateKey('tags', username);
    return this.get(key);
  }

  cacheUserTags(username, data, ttl = 600) {
    const key = this.generateKey('tags', username);
    this.set(key, data, ttl);
  }

  async getAnalytics(username) {
    const key = this.generateKey('analytics', username);
    return this.get(key);
  }

  cacheAnalytics(username, data, ttl = 900) {
    const key = this.generateKey('analytics', username);
    this.set(key, data, ttl);
  }
}

module.exports = CacheManager;