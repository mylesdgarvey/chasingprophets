import { PriceData } from '../types/price';

function generateTestData(symbol: string, startDate: Date, days: number): PriceData[] {
  const data: PriceData[] = [];
  let currentDate = startDate;
  let lastClose = symbol === 'DJIA' ? 46000 : 4600; // Starting values

  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.48) * (lastClose * 0.02); // Slight upward bias
    const close = lastClose + change;
    const high = close + (Math.random() * close * 0.01);
    const low = close - (Math.random() * close * 0.01);
    const open = low + (Math.random() * (high - low));
    const volume = Math.floor(Math.random() * 1000000) + 500000;

    // Generate prophet predictions (slightly different from actual close)
    const timeSage = close * (1 + (Math.random() - 0.45) * 0.05);
    const trendOracle = close * (1 + (Math.random() - 0.48) * 0.04);
    const marketMind = close * (1 + (Math.random() - 0.47) * 0.06);
    const quantumPredictor = close * (1 + (Math.random() - 0.46) * 0.05);

    data.push({
      ticker: symbol,
      date: currentDate.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume,
      timeSage,
      trendOracle,
      marketMind,
      quantumPredictor
    });

    lastClose = close;
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
  }

  return data;
}

// Generate 5 years of daily data
const endDate = new Date();
const startDate = new Date(endDate.getFullYear() - 5, endDate.getMonth(), endDate.getDate());
const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

export const DJIA_DATA = generateTestData('DJIA', startDate, days);
export const SPX_DATA = generateTestData('SPX', startDate, days);