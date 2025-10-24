import fs from 'fs';

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateStockData(ticker: string, startPrice: number, seed = 42) {
  const startDate = new Date('2015-01-01T00:00:00Z');
  const endDate = new Date('2025-12-31T00:00:00Z');
  const rand = seededRandom(seed + ticker.length);
  const data: any[] = [];

  const mu = 0.08;
  const sigma = 0.25;
  const msPerDay = 24 * 60 * 60 * 1000;

  let prevClose = startPrice;
  for (let d = startDate; d <= endDate; d = new Date(d.getTime() + msPerDay)) {
    const day = d.getUTCDay();
    if (day === 0 || day === 6) continue;

    const u1 = rand();
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1 || 1e-9)) * Math.cos(2 * Math.PI * u2);
    const dt = 1 / 252;
    const dailyReturn = mu * dt + sigma * Math.sqrt(dt) * z;

    const open = prevClose * (1 + (rand() - 0.5) * 0.01);
    const close = Math.max(0.01, prevClose * Math.exp(dailyReturn));
    const high = Math.max(open, close) * (1 + rand() * 0.02);
    const low = Math.min(open, close) * (1 - rand() * 0.02);
    const volume = Math.floor(100000 + rand() * 900000);

    data.push({ date: d.toISOString(), open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2), volume });
    prevClose = close;
  }
  return data;
}

const sampleStocks = [
  { ticker: 'AAPL', name: 'Apple Inc.', lastPrice: 175 },
  { ticker: 'MSFT', name: 'Microsoft Corporation', lastPrice: 330 },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', lastPrice: 130 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', lastPrice: 130 },
  { ticker: 'GS', name: 'Goldman Sachs', lastPrice: 310 }
];

const out: Record<string, any> = {};
for (let i = 0; i < sampleStocks.length; i++) {
  const s = sampleStocks[i];
  out[s.ticker] = {
    metadata: { ticker: s.ticker, name: s.name },
    prices: generateStockData(s.ticker, s.lastPrice, 2000 + i)
  };
}

const outPath = './src/data/generatedPrices.json';
fs.mkdirSync('./src/data', { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`Wrote generated prices to ${outPath}`);
