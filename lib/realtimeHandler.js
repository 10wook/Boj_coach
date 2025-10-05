const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class RealtimeHandler {
  constructor(solvedacAPI, analyzer, cache) {
    this.solvedac = solvedacAPI;
    this.analyzer = analyzer;
    this.cache = cache;
    this.clients = new Map();
    this.subscriptions = new Map();
    this.wss = null;
  }

  initializeWebSocket(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/realtime'
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = uuidv4();
      console.log(`Client connected: ${clientId}`);

      this.clients.set(clientId, {
        ws,
        subscriptions: new Set(),
        lastActivity: Date.now()
      });

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleMessage(clientId, data);
        } catch (error) {
          this.sendError(clientId, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
        this.cleanupSubscriptions(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });

      // Send welcome message
      this.sendMessage(clientId, {
        type: 'welcome',
        clientId,
        timestamp: Date.now()
      });
    });

    // Heartbeat to keep connections alive
    setInterval(() => {
      this.heartbeat();
    }, 30000);

    console.log('Realtime WebSocket server initialized');
  }

  async handleMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = Date.now();

    switch (data.type) {
      case 'subscribe':
        await this.handleSubscribe(clientId, data);
        break;

      case 'unsubscribe':
        await this.handleUnsubscribe(clientId, data);
        break;

      case 'get_realtime_data':
        await this.handleGetRealtimeData(clientId, data);
        break;

      case 'ping':
        this.sendMessage(clientId, { type: 'pong', timestamp: Date.now() });
        break;

      default:
        this.sendError(clientId, `Unknown message type: ${data.type}`);
    }
  }

  async handleSubscribe(clientId, data) {
    const { username, dataType } = data;
    
    if (!username || !dataType) {
      this.sendError(clientId, 'Missing username or dataType');
      return;
    }

    const subscriptionKey = `${username}:${dataType}`;
    const client = this.clients.get(clientId);
    
    client.subscriptions.add(subscriptionKey);

    if (!this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.set(subscriptionKey, new Set());
    }
    this.subscriptions.get(subscriptionKey).add(clientId);

    this.sendMessage(clientId, {
      type: 'subscription_confirmed',
      username,
      dataType,
      timestamp: Date.now()
    });

    // Send initial data
    await this.sendInitialData(clientId, username, dataType);
  }

  async handleUnsubscribe(clientId, data) {
    const { username, dataType } = data;
    const subscriptionKey = `${username}:${dataType}`;
    
    const client = this.clients.get(clientId);
    client.subscriptions.delete(subscriptionKey);

    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey).delete(clientId);
      
      if (this.subscriptions.get(subscriptionKey).size === 0) {
        this.subscriptions.delete(subscriptionKey);
      }
    }

    this.sendMessage(clientId, {
      type: 'unsubscribed',
      username,
      dataType,
      timestamp: Date.now()
    });
  }

  async handleGetRealtimeData(clientId, data) {
    const { username, analysisType } = data;

    try {
      let result;
      
      switch (analysisType) {
        case 'quick_analysis':
          result = await this.getQuickAnalysis(username);
          break;
        case 'weakness_update':
          result = await this.getWeaknessUpdate(username);
          break;
        case 'progress_check':
          result = await this.getProgressCheck(username);
          break;
        case 'recommendation_refresh':
          result = await this.getRecommendationRefresh(username);
          break;
        default:
          this.sendError(clientId, `Unknown analysis type: ${analysisType}`);
          return;
      }

      this.sendMessage(clientId, {
        type: 'realtime_data',
        username,
        analysisType,
        data: result,
        timestamp: Date.now()
      });

    } catch (error) {
      this.sendError(clientId, `Failed to get realtime data: ${error.message}`);
    }
  }

  async sendInitialData(clientId, username, dataType) {
    try {
      let data;

      switch (dataType) {
        case 'profile':
          data = await this.solvedac.getUser(username);
          break;
        case 'stats':
          data = await this.solvedac.getUserStats(username);
          break;
        case 'progress':
          const [userData, problemStats] = await Promise.all([
            this.solvedac.getUser(username),
            this.solvedac.getUserStats(username)
          ]);
          data = this.analyzer.analyzeProgress(userData, problemStats);
          break;
        default:
          return;
      }

      this.sendMessage(clientId, {
        type: 'initial_data',
        username,
        dataType,
        data,
        timestamp: Date.now()
      });

    } catch (error) {
      this.sendError(clientId, `Failed to send initial data: ${error.message}`);
    }
  }

  async getQuickAnalysis(username) {
    // 빠른 분석을 위해 캐시된 데이터 우선 사용
    let userData = await this.cache.getUserData(username);
    if (!userData) {
      userData = await this.solvedac.getUser(username);
      this.cache.cacheUserData(username, userData, 300); // 5분 캐시
    }

    return {
      tier: this.solvedac.getTierName(userData.tier),
      rating: userData.rating,
      solvedCount: userData.solvedCount,
      lastUpdated: Date.now(),
      nextTierProgress: this.analyzer.calculateTierProgress(userData.rating, userData.tier)
    };
  }

  async getWeaknessUpdate(username) {
    const [problemStats, tagStats] = await Promise.all([
      this.solvedac.getUserStats(username),
      this.solvedac.getUserTagStats(username)
    ]);

    const weakness = this.analyzer.analyzeWeakness(problemStats, tagStats);
    const weakTags = this.analyzer.identifyWeakTags(tagStats);

    return {
      weakestTags: weakTags.slice(0, 3),
      recommendations: weakness.recommendations.slice(0, 3),
      lastUpdated: Date.now()
    };
  }

  async getProgressCheck(username) {
    const [userData, problemStats] = await Promise.all([
      this.solvedac.getUser(username),
      this.solvedac.getUserStats(username)
    ]);

    const progress = this.analyzer.analyzeProgress(userData, problemStats);
    const timePatterns = this.analyzer.analyzeTimePatterns(userData);

    return {
      currentTier: progress.currentTier,
      nextTierGoal: progress.nextTierGoal,
      progressToNext: progress.progressToNext,
      readyForPromotion: progress.readyForPromotion,
      dailyAverage: timePatterns.dailyAverage,
      lastUpdated: Date.now()
    };
  }

  async getRecommendationRefresh(username) {
    const [userData, problemStats, tagStats] = await Promise.all([
      this.solvedac.getUser(username),
      this.solvedac.getUserStats(username),
      this.solvedac.getUserTagStats(username)
    ]);

    const priorities = this.analyzer.calculateLearningPriority(tagStats, problemStats, userData);
    const prediction = this.analyzer.predictTierAchievement(userData, tagStats, problemStats);

    return {
      topPriorities: priorities.slice(0, 3),
      tierPrediction: {
        estimatedTime: prediction.estimatedTime,
        confidence: prediction.confidence,
        blockers: prediction.blockers
      },
      lastUpdated: Date.now()
    };
  }

  sendMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  sendError(clientId, error) {
    this.sendMessage(clientId, {
      type: 'error',
      error,
      timestamp: Date.now()
    });
  }

  broadcast(message, filter = null) {
    this.clients.forEach((client, clientId) => {
      if (!filter || filter(clientId, client)) {
        this.sendMessage(clientId, message);
      }
    });
  }

  broadcastToSubscribers(subscriptionKey, message) {
    const subscribers = this.subscriptions.get(subscriptionKey);
    if (subscribers) {
      subscribers.forEach(clientId => {
        this.sendMessage(clientId, message);
      });
    }
  }

  heartbeat() {
    const now = Date.now();
    const timeout = 60000; // 1분

    this.clients.forEach((client, clientId) => {
      if (now - client.lastActivity > timeout) {
        console.log(`Removing inactive client: ${clientId}`);
        client.ws.terminate();
        this.clients.delete(clientId);
        this.cleanupSubscriptions(clientId);
      }
    });
  }

  cleanupSubscriptions(clientId) {
    this.subscriptions.forEach((clients, key) => {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.subscriptions.delete(key);
      }
    });
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      activeSubscriptions: this.subscriptions.size,
      subscriptionDetails: Array.from(this.subscriptions.keys())
    };
  }

  // 외부에서 데이터 업데이트 알림을 보낼 때 사용
  notifyDataUpdate(username, dataType, data) {
    const subscriptionKey = `${username}:${dataType}`;
    this.broadcastToSubscribers(subscriptionKey, {
      type: 'data_update',
      username,
      dataType,
      data,
      timestamp: Date.now()
    });
  }
}

module.exports = RealtimeHandler;