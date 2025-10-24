export const PROPHET_COLORS = [
  '#4363d8', '#3cb44b', '#f58231', '#911eb4', '#e6194b',
  '#469990', '#dcbeff', '#42d4f4', '#fabed4', '#ffe119'
];

export const PROPHET_INFO = {
  prophet1: {
    name: "TimeSage AI",
    description: "Advanced neural network trained on historical market data with sentiment analysis",
    baseDataSets: ["DJIA Historical", "Federal Reserve Economic Data", "Twitter Sentiment"],
    modelType: "Hybrid LSTM-Transformer"
  },
  prophet2: {
    name: "TrendOracle",
    description: "Ensemble model combining technical analysis with macro-economic indicators",
    baseDataSets: ["S&P 500", "GDP Growth", "Interest Rates"],
    modelType: "Random Forest + XGBoost"
  },
  prophet3: {
    name: "MarketMind",
    description: "Deep learning system with real-time news integration and pattern recognition",
    baseDataSets: ["Market Order Flow", "News Headlines", "Volatility Index"],
    modelType: "Deep Neural Network"
  },
  prophet4: {
    name: "QuantumPredictor",
    description: "Quantum-inspired algorithm for complex market pattern analysis",
    baseDataSets: ["Market Microstructure", "Options Chain Data", "Sector Rotations"],
    modelType: "Quantum-Inspired Neural Network"
  },
  prophet5: {
    name: "WaveRider AI",
    description: "Specialized in detecting market cycles and Elliott Wave patterns",
    baseDataSets: ["Technical Indicators", "Market Cycles", "Volume Profiles"],
    modelType: "Wavelet Neural Network"
  },
  prophet6: {
    name: "MacroSage",
    description: "Global macro-economic factor analysis with geopolitical event correlation",
    baseDataSets: ["Global Economic Indicators", "Political Event Data", "Currency Flows"],
    modelType: "Transformer + GAN"
  },
  prophet7: {
    name: "NeuroProphet",
    description: "Biologically inspired neural architecture with adaptive learning",
    baseDataSets: ["High-Frequency Trading Data", "Market Sentiment", "Order Book Flow"],
    modelType: "Spiking Neural Network"
  },
  prophet8: {
    name: "DeepFlow",
    description: "Deep reinforcement learning system with market regime detection",
    baseDataSets: ["Asset Correlations", "Market Regimes", "Volatility Surfaces"],
    modelType: "Deep Q-Network + LSTM"
  },
  prophet9: {
    name: "AlphaMarket",
    description: "Self-improving algorithm with multi-timeframe analysis",
    baseDataSets: ["Cross-Asset Data", "Economic Calendars", "Corporate Events"],
    modelType: "Multi-Agent Reinforcement Learning"
  },
  prophet10: {
    name: "OmegaInsight",
    description: "Quantum computing enhanced prediction system with chaos theory integration",
    baseDataSets: ["Quantum Random Data", "Fractal Patterns", "Market Complexity Metrics"],
    modelType: "Quantum Neural Network"
  }
};

export const MAX_ACTIVE_PROPHETS = 5;

export const TIME_WINDOWS = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: 'All', days: null }
];

export const SCALE_TYPES = [
  { label: 'Auto', type: 'linear' },
  { label: 'Fixed', type: 'linear' },
  { label: 'Log', type: 'log' }
];