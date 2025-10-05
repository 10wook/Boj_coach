/**
 * solved.ac API 관련 TypeScript 타입 정의
 */

export interface SolvedAcUser {
  handle: string;
  bio: string;
  badgeId: string;
  backgroundId: string;
  profileImageUrl: string;
  solvedCount: number;
  voteCount: number;
  class: number;
  classDecoration: string;
  tier: number;
  rating: number;
  ratingByProblemsSum: number;
  ratingByClass: number;
  ratingBySolvedCount: number;
  ratingByVoteCount: number;
  exp: number;
  rivalCount: number;
  reverseRivalCount: number;
  maxStreak: number;
  rank: number;
}

export interface SolvedAcProblem {
  problemId: number;
  titleKo: string;
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
  tags: SolvedAcTag[];
}

export interface SolvedAcTag {
  key: string;
  isMeta: boolean;
  bojTagId: number;
  problemCount: number;
  displayNames: SolvedAcTagDisplayName[];
}

export interface SolvedAcTagDisplayName {
  language: string;
  name: string;
  short: string;
}

export interface SolvedAcSearchResult {
  count: number;
  items: SolvedAcProblem[];
}

export interface SolvedAcStatistics {
  totalSolved: number;
  tagStatistics: Record<string, number>;
  levelDistribution: Record<number, number>;
  tier: number;
  rating: number;
  class: number;
}

export interface SolvedAcWeakness {
  weakTags: string[];
  weakLevels: number[];
  recommendations: {
    problems: SolvedAcProblem[];
    tags: string[];
    levelRange: [number, number];
  };
}
