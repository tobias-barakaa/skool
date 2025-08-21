// 2. SCALE CONFIGURATION ENUMS & INTERFACES
export enum ScaleTier {
  SMALL = 'SMALL',     // 1K users
  MEDIUM = 'MEDIUM',   // 10K users
  LARGE = 'LARGE'      // 1M users
}

interface ScaleConfig {
  rateLimitCapacity: number;
  rateLimitRefillPerSec: number;
  queueConcurrency: number;
  cacheTimeout: number;
  asyncProcessing: boolean;
  maxQuestionsInMemory: number;
  batchSize: number;
  processingDelay: number;
}

const DEFAULT_SCALE_CONFIGS: Record<ScaleTier, ScaleConfig> = {
  [ScaleTier.SMALL]: {
    rateLimitCapacity: 15,
    rateLimitRefillPerSec: 3,
    queueConcurrency: 10,
    cacheTimeout: 60,
    asyncProcessing: false,
    maxQuestionsInMemory: 100,
    batchSize: 50,
    processingDelay: 0,
  },
  [ScaleTier.MEDIUM]: {
    rateLimitCapacity: 8,
    rateLimitRefillPerSec: 1.5,
    queueConcurrency: 50,
    cacheTimeout: 300,
    asyncProcessing: true,
    maxQuestionsInMemory: 50,
    batchSize: 25,
    processingDelay: 1000,
  },
  [ScaleTier.LARGE]: {
    rateLimitCapacity: 3,
    rateLimitRefillPerSec: 0.5,
    queueConcurrency: 100,
    cacheTimeout: 600,
    asyncProcessing: true,
    maxQuestionsInMemory: 20,
    batchSize: 10,
    processingDelay: 2000,
  },
};
