const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class AuthManager {
  constructor() {
    this.apiKeys = new Map();
    this.mcpTokens = new Map();
    this.secretKey = process.env.JWT_SECRET || this.generateSecret();
    this.tokenExpiry = 24 * 60 * 60 * 1000; // 24시간
  }

  generateSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  generateApiKey(clientId, permissions = ['read']) {
    const apiKey = `boj_${crypto.randomBytes(20).toString('hex')}`;
    
    this.apiKeys.set(apiKey, {
      clientId,
      permissions,
      createdAt: Date.now(),
      lastUsed: null,
      usageCount: 0
    });

    return apiKey;
  }

  validateApiKey(apiKey) {
    const keyData = this.apiKeys.get(apiKey);
    
    if (!keyData) {
      return { valid: false, error: 'Invalid API key' };
    }

    // 사용 통계 업데이트
    keyData.lastUsed = Date.now();
    keyData.usageCount++;

    return { 
      valid: true, 
      clientId: keyData.clientId,
      permissions: keyData.permissions
    };
  }

  generateMcpToken(clientId, permissions = ['read', 'analyze']) {
    const payload = {
      clientId,
      permissions,
      type: 'mcp_access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + this.tokenExpiry) / 1000)
    };

    const token = jwt.sign(payload, this.secretKey);
    
    this.mcpTokens.set(token, {
      clientId,
      permissions,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.tokenExpiry
    });

    return token;
  }

  validateMcpToken(token) {
    try {
      const decoded = jwt.verify(token, this.secretKey);
      const tokenData = this.mcpTokens.get(token);
      
      if (!tokenData) {
        return { valid: false, error: 'Token not found' };
      }

      if (Date.now() > tokenData.expiresAt) {
        this.mcpTokens.delete(token);
        return { valid: false, error: 'Token expired' };
      }

      return {
        valid: true,
        clientId: decoded.clientId,
        permissions: decoded.permissions
      };
    } catch (error) {
      return { valid: false, error: 'Invalid token' };
    }
  }

  hasPermission(permissions, requiredPermission) {
    return permissions.includes(requiredPermission) || permissions.includes('admin');
  }

  // API 키 인증 미들웨어
  apiKeyMiddleware() {
    return (req, res, next) => {
      const apiKey = req.headers['x-api-key'] || req.query.api_key;
      
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key required'
        });
      }

      const validation = this.validateApiKey(apiKey);
      if (!validation.valid) {
        return res.status(401).json({
          success: false,
          error: validation.error
        });
      }

      req.auth = {
        clientId: validation.clientId,
        permissions: validation.permissions
      };

      next();
    };
  }

  // MCP 토큰 인증 함수
  authenticateMcpClient(token) {
    const validation = this.validateMcpToken(token);
    
    if (!validation.valid) {
      throw new Error(`Authentication failed: ${validation.error}`);
    }

    return {
      clientId: validation.clientId,
      permissions: validation.permissions
    };
  }

  // 사용량 제한 체크
  checkRateLimit(clientId, endpoint, limit = 100, window = 3600000) {
    const key = `${clientId}:${endpoint}`;
    const now = Date.now();
    const windowStart = now - window;

    if (!this.rateLimits) {
      this.rateLimits = new Map();
    }

    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, []);
    }

    const requests = this.rateLimits.get(key);
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    this.rateLimits.set(key, validRequests);

    if (validRequests.length >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.ceil((validRequests[0] + window) / 1000)
      };
    }

    validRequests.push(now);
    this.rateLimits.set(key, validRequests);

    return {
      allowed: true,
      remaining: limit - validRequests.length,
      resetTime: Math.ceil((now + window) / 1000)
    };
  }

  // 보안 감사 로그
  logSecurityEvent(event, clientId, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      clientId,
      ip: details.ip,
      userAgent: details.userAgent,
      endpoint: details.endpoint,
      success: details.success !== false
    };

    console.log(`[SECURITY] ${JSON.stringify(logEntry)}`);
    
    // 실제 운영환경에서는 별도 보안 로그 시스템에 저장
    // 예: winston, elastic search 등
  }

  // API 키 관리
  revokeApiKey(apiKey) {
    const result = this.apiKeys.delete(apiKey);
    if (result) {
      this.logSecurityEvent('api_key_revoked', null, { apiKey });
    }
    return result;
  }

  listApiKeys(clientId = null) {
    const keys = [];
    this.apiKeys.forEach((data, key) => {
      if (!clientId || data.clientId === clientId) {
        keys.push({
          apiKey: key.substring(0, 10) + '...',
          clientId: data.clientId,
          permissions: data.permissions,
          createdAt: data.createdAt,
          lastUsed: data.lastUsed,
          usageCount: data.usageCount
        });
      }
    });
    return keys;
  }

  // 토큰 관리
  revokeMcpToken(token) {
    const result = this.mcpTokens.delete(token);
    if (result) {
      this.logSecurityEvent('mcp_token_revoked', null, { token: token.substring(0, 20) + '...' });
    }
    return result;
  }

  cleanupExpiredTokens() {
    const now = Date.now();
    let cleaned = 0;

    this.mcpTokens.forEach((data, token) => {
      if (now > data.expiresAt) {
        this.mcpTokens.delete(token);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired MCP tokens`);
    }

    return cleaned;
  }

  getStats() {
    return {
      activeApiKeys: this.apiKeys.size,
      activeMcpTokens: this.mcpTokens.size,
      rateLimitEntries: this.rateLimits?.size || 0
    };
  }
}

module.exports = AuthManager;