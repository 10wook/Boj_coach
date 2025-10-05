const express = require('express');
const cors = require('cors');
const SolvedacAPI = require('../lib/solvedac');
const DataAnalyzer = require('../lib/analyzer');
const CacheManager = require('../lib/cache');
const RateLimiter = require('../lib/rateLimiter');
const PerformanceMonitor = require('../lib/monitoring');

const app = express();
const cache = new CacheManager();
const rateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW) || 900000,
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
);
const monitor = new PerformanceMonitor();
const solvedac = new SolvedacAPI(rateLimiter);
const analyzer = new DataAnalyzer();

// 주기적 모니터링 시작
monitor.startPeriodicLogging(15);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://your-domain.vercel.app'] : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter.middleware());
app.use(monitor.middleware());

app.use((req, res, next) => {
  const start = Date.now();
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cache: cache.getStats(),
    rateLimiter: rateLimiter.getStats(),
    performance: monitor.getMetrics(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  
  res.json(healthData);
});

app.get('/api/metrics', (req, res) => {
  res.json({
    success: true,
    data: monitor.getMetrics()
  });
});

app.get('/api/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // 캐시 확인
    let userData = await cache.getUserData(username);
    if (!userData) {
      monitor.recordCacheMiss();
      monitor.recordSolvedacCall();
      userData = await solvedac.getUser(username);
      cache.cacheUserData(username, userData, 600);
    } else {
      monitor.recordCacheHit();
    }
    
    res.json({
      success: true,
      data: {
        username: userData.handle,
        tier: solvedac.getTierName(userData.tier),
        tierLevel: userData.tier,
        rating: userData.rating,
        ratingByProblemsSum: userData.ratingByProblemsSum,
        ratingByClass: userData.ratingByClass,
        solvedCount: userData.solvedCount,
        voteCount: userData.voteCount,
        class: userData.class,
        classDecoration: userData.classDecoration,
        rivalCount: userData.rivalCount,
        reverseRivalCount: userData.reverseRivalCount,
        maxStreak: userData.maxStreak,
        profileImageUrl: userData.profileImageUrl,
        backgroundId: userData.backgroundId
      }
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/user/:username/problems', async (req, res) => {
  try {
    const { username } = req.params;
    const problemsData = await solvedac.getUserProblems(username);
    
    res.json({
      success: true,
      data: {
        problems: problemsData.items || [],
        count: problemsData.count || 0,
        page: problemsData.page || 1
      }
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/user/:username/tier', async (req, res) => {
  try {
    const { username } = req.params;
    const userData = await solvedac.getUser(username);
    
    res.json({
      success: true,
      data: {
        username: userData.handle,
        tier: solvedac.getTierName(userData.tier),
        tierLevel: userData.tier,
        rating: userData.rating,
        class: userData.class,
        classDecoration: userData.classDecoration
      }
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/user/:username/stats', async (req, res) => {
  try {
    const { username } = req.params;
    
    let statsData = await cache.getUserStats(username);
    if (!statsData) {
      monitor.recordCacheMiss();
      monitor.recordSolvedacCall();
      statsData = await solvedac.getUserStats(username);
      cache.cacheUserStats(username, statsData, 300);
    } else {
      monitor.recordCacheHit();
    }
    
    res.json({
      success: true,
      data: statsData
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/user/:username/tags', async (req, res) => {
  try {
    const { username } = req.params;
    
    let tagStats = await cache.getUserTags(username);
    if (!tagStats) {
      monitor.recordCacheMiss();
      monitor.recordSolvedacCall();
      tagStats = await solvedac.getUserTagStats(username);
      cache.cacheUserTags(username, tagStats, 600);
    } else {
      monitor.recordCacheHit();
    }
    
    res.json({
      success: true,
      data: tagStats
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/user/:username/weakness', async (req, res) => {
  try {
    const { username } = req.params;
    const [problemStats, tagStats] = await Promise.all([
      solvedac.getUserStats(username),
      solvedac.getUserTagStats(username)
    ]);
    
    const analysis = analyzer.analyzeWeakness(problemStats, tagStats);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/user/:username/analytics', async (req, res) => {
  try {
    const { username } = req.params;
    
    // 복합 분석 데이터 캐시 확인
    let analytics = await cache.getAnalytics(username);
    if (!analytics) {
      monitor.recordCacheMiss();
      monitor.recordSolvedacCall();
      monitor.recordSolvedacCall();
      monitor.recordSolvedacCall();
      
      const [userData, problemStats, tagStats] = await Promise.all([
        solvedac.getUser(username),
        solvedac.getUserStats(username),
        solvedac.getUserTagStats(username)
      ]);
      
      analytics = {
        tagAccuracy: analyzer.calculateTagAccuracy(tagStats),
        difficultyAnalysis: analyzer.analyzeDifficultySuccess(problemStats),
        learningProgress: analyzer.trackLearningProgress(userData, tagStats, problemStats),
        weaknessAnalysis: analyzer.identifyWeakTags(tagStats),
        difficultyPerformance: analyzer.analyzeDifficultyPerformance(problemStats, userData),
        learningPriorities: analyzer.calculateLearningPriority(tagStats, problemStats, userData),
        tierPrediction: analyzer.predictTierAchievement(userData, tagStats, problemStats)
      };
      
      cache.cacheAnalytics(username, analytics, 900);
    } else {
      monitor.recordCacheHit();
    }
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/user/:username/progress', async (req, res) => {
  try {
    const { username } = req.params;
    const [userData, problemStats] = await Promise.all([
      solvedac.getUser(username),
      solvedac.getUserStats(username)
    ]);
    
    const progress = analyzer.analyzeProgress(userData, problemStats);
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/user/:username/recommendations', async (req, res) => {
  try {
    const { username } = req.params;
    const [userData, problemStats, tagStats] = await Promise.all([
      solvedac.getUser(username),
      solvedac.getUserStats(username),
      solvedac.getUserTagStats(username)
    ]);
    
    const weakness = analyzer.analyzeWeakness(problemStats, tagStats);
    const progress = analyzer.analyzeProgress(userData, problemStats);
    
    const recommendations = {
      weeklyGoal: {
        problemCount: Math.max(5, Math.floor(userData.solvedCount / 50)),
        focusTags: weakness.weakestTags.slice(0, 2).map(t => t.tag),
        targetTier: progress.nextTierGoal
      },
      priorityProblems: weakness.recommendations,
      studyPlan: {
        daily: '2-3 problems',
        weekly: '15-20 problems',
        focus: 'Weak tags improvement'
      }
    };
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message
    });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

module.exports = app;