// Solved.ac API 타입 정의
export interface SolvedacUser {
  handle: string;
  bio: string;
  badgeId?: string;
  backgroundId: string;
  profileImageUrl?: string;
  solvedCount: number;
  voteCount: number;
  class: number;
  classDecoration: string;
  rivalCount: number;
  reverseRivalCount: number;
  tier: number;
  rating: number;
  ratingByProblemsSum: number;
  ratingByClass: number;
  ratingByVoteCount: number;
  arenaTier: number;
  arenaRating: number;
  arenaMaxTier: number;
  arenaMaxRating: number;
  arenaCompetedRoundCount: number;
  maxStreak: number;
  coins: number;
  stardusts: number;
  joinedAt: string;
  bannedUntil?: string;
  proUntil?: string;
  rank: number;
}

export interface SolvedacTag {
  key: string;
  isMeta: boolean;
  bojTagId: number;
  problemCount: number;
  displayNames: Record<string, string>;
  aliases: SolvedacAlias[];
}

export interface SolvedacAlias {
  alias: string;
}

export interface SolvedacProblemStats {
  level: number;
  total: number;
  solved: number;
  partial: number;
  tried: number;
  exp: number;
}

export interface SolvedacTagStats {
  tag: SolvedacTag;
  solved: number;
  tried: number;
  exp: number;
}

export interface SolvedacProblem {
  problemId: number;
  titleKo: string;
  titles: SolvedacTitle[];
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
  tags: SolvedacTag[];
}

export interface SolvedacTitle {
  language: string;
  languageDisplayName: string;
  title: string;
  isOriginal: boolean;
}

// 분석 결과 타입
export interface WeaknessAnalysis {
  weakestTags: WeakTag[];
  recommendations: Recommendation[];
}

export interface WeakTag {
  tag: string;
  tagDisplayNames?: Record<string, string>;
  solved: number;
  tried: number;
  accuracy: number;
  successRate: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  improvementPotential: 'High' | 'Medium' | 'Low';
  estimatedTime?: string;
}

export interface Recommendation {
  type: string;
  tag?: string;
  reason: string;
  severity?: string;
  suggestedDifficulty?: string;
  estimatedTime?: string;
  priority?: string;
  message?: string;
}

export interface ProgressAnalysis {
  currentTier: string;
  nextTierGoal: string;
  progressToNext: number;
  recentPerformance: string;
  solvedCount: number;
  rating: number;
  difficultyProgression?: DifficultyAnalysis;
  activityPatterns?: TimePatterns;
  readyForPromotion?: boolean;
}

export interface DifficultyAnalysis {
  byLevel: Record<number, DifficultyLevel>;
  summary: DifficultyAnalysisSummary;
}

export interface DifficultyLevel {
  tierName: string;
  solved: number;
  total: number;
}

export interface DifficultyAnalysisSummary {
  easiest: string;
  hardest: string;
  averageLevel: string;
  totalSolved: number;
}

export interface TimePatterns {
  dailyAverage: string;
  weeklyAverage: string;
  monthlyAverage: string;
  streak: number;
  estimatedActiveTime: string;
}

// 캐시 관련 타입
export interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

// Rate Limiting 타입
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// 모니터링 타입
export interface PerformanceMetrics {
  uptime: number;
  requests: RequestMetrics;
  performance: PerformanceStats;
  cache: CacheStats;
  apiCalls: ApiCallStats;
  memory: MemoryStats;
}

export interface RequestMetrics {
  total: number;
  errors: number;
  errorRate: string;
  requestsPerMinute: number;
}

export interface PerformanceStats {
  avgResponseTime: string;
  p95ResponseTime: string;
}

export interface CacheStats {
  hitRate: string;
  hits: number;
  misses: number;
}

export interface ApiCallStats {
  solvedac: number;
}

export interface MemoryStats {
  current: NodeJS.MemoryUsage;
  peak: number;
}

// MCP 관련 타입
export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface McpToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface McpResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

// 인증 관련 타입
export interface ApiKeyData {
  clientId: string;
  permissions: string[];
  createdAt: number;
  lastUsed: number | null;
  usageCount: number;
}

export interface McpTokenData {
  clientId: string;
  permissions: string[];
  createdAt: number;
  expiresAt: number;
}

export interface AuthValidation {
  valid: boolean;
  error?: string;
  clientId?: string;
  permissions?: string[];
}

// 실시간 WebSocket 타입
export interface WebSocketClient {
  ws: any; // WebSocket type
  subscriptions: Set<string>;
  lastActivity: number;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface RealtimeSubscription {
  username: string;
  dataType: string;
}

// 스마트 추천 타입
export interface LearningPattern {
  history: ProgressEntry[];
  preferences: Record<string, PreferenceData>;
  performance: PerformancePattern;
  lastUpdated: number;
  lastUserData?: SolvedacUser;
}

export interface ProgressEntry {
  timestamp: number;
  ratingChange: number;
  solvedCountChange: number;
  tierChange: number;
  streakChange: number;
  averageDifficulty?: number;
}

export interface PreferenceData {
  score: number;
  accuracy: number;
  volume: number;
  lastUpdated: number;
}

export interface PerformancePattern {
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  momentum: number;
  avgRatingChange?: number;
  avgSolvedChange?: number;
}

export interface SmartRecommendations {
  immediate: ImmediateRecommendation[];
  shortTerm: ShortTermRecommendation[];
  longTerm: LongTermRecommendation[];
  adaptive: boolean;
  reasoning: string[];
  personalizedMessage?: string;
}

export interface ImmediateRecommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
  estimatedTime: string;
  difficulty?: string;
}

export interface ShortTermRecommendation {
  type: string;
  goal: string;
  targetProblems?: number;
  currentAccuracy?: string;
  targetAccuracy?: number;
  timeline: string;
  breakdown?: Record<string, number>;
}

export interface LongTermRecommendation {
  type: string;
  currentTier?: string;
  targetTier?: string;
  estimatedRatingGain?: number;
  requiredEffort?: number;
  timeline: string;
  area?: string;
  currentLevel?: number;
  targetLevel?: number;
  learningPath?: string[];
}

export interface AdaptiveWeights {
  weakness: number;
  progress: number;
  preference: number;
  momentum: number;
}

export interface RecommendationContext {
  timeAvailable?: string;
  currentMood?: 'motivated' | 'frustrated' | 'neutral';
  urgency?: 'high' | 'medium' | 'low';
  focus?: 'weakness' | 'tier_up' | 'general';
  streak?: number;
}

// 성과 예측 타입
export interface PerformancePrediction {
  timeframe: string;
  current: {
    tier: string;
    rating: number;
    solvedCount: number;
  };
  predicted: {
    ratingChange: number;
    newRating: number;
    solvedCountIncrease: number;
    newSolvedCount: number;
    tierChange?: {
      from: string;
      to: string;
      probability: number;
    };
  };
  confidence: number;
  trends: {
    rating: 'increasing' | 'decreasing' | 'stable';
    activity: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface Alert {
  type: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  data: any;
}

export interface AlertSubscriber {
  callback: (alert: Alert) => void;
  types: string[];
  subscribedAt: number;
}

// 에러 타입
export interface ApiError extends Error {
  response?: {
    status: number;
    data?: any;
  };
  retryAfter?: number;
}

// 환경 변수 타입
export interface EnvConfig {
  NODE_ENV: string;
  SOLVEDAC_API_URL: string;
  API_TIMEOUT: number;
  CACHE_TTL: number;
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  JWT_SECRET: string;
  MCP_PORT?: number;
}

export default {};