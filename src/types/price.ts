// Base price data (raw JSON format)
export type BasePriceData = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

// Extended price data with predictions
export type PriceData = BasePriceData & {
  ticker: string;
  timeSage?: number;
  trendOracle?: number;
  marketMind?: number;
  quantumPredictor?: number;
};