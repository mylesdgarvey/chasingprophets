/**
 * Performance type definitions
 * Stores daily performance metrics for prophets
 */

export interface Performance {
  prophetId: string;
  date: string;       // YYYY-MM-DD (sort key)
  predicted: number;
  actual: number;
  error: number;
  absoluteError?: number;
  percentageError?: number;
  createdAt: string;
}

export interface CreatePerformanceInput {
  prophetId: string;
  date: string;
  predicted: number;
  actual: number;
  error: number;
  absoluteError?: number;
  percentageError?: number;
}

/**
 * ProphetPerformanceSummary type definitions
 * Stores aggregated, rolling-window metrics for the leaderboard
 */

export interface ProphetPerformanceSummary {
  prophetId: string;
  aggregationWindow: string;  // e.g., "20-day", "240-day" (sort key)
  mape: number;               // Mean Absolute Percentage Error
  percentileError75?: number;
  percentileError90?: number;
  directionalAccuracy?: number;
  lastUpdated: string;
}

export interface CreatePerformanceSummaryInput {
  prophetId: string;
  aggregationWindow: string;
  mape: number;
  percentileError75?: number;
  percentileError90?: number;
  directionalAccuracy?: number;
}
