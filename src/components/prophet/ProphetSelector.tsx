import React from 'react';
import './ProphetSelector.css';

const prophets = [
  { id: 'timesage', name: 'TimeSage AI', color: 'var(--prophet-timesage)' },
  { id: 'trendoracle', name: 'TrendOracle', color: 'var(--prophet-trendoracle)' },
  { id: 'marketmind', name: 'MarketMind', color: 'var(--prophet-marketmind)' },
  { id: 'quantum', name: 'QuantumPredictor', color: 'var(--prophet-quantum)' },
  { id: 'waverider', name: 'WaveRider AI', color: 'var(--prophet-waverider)' },
  { id: 'macrosage', name: 'MacroSage', color: 'var(--prophet-macrosage)' },
  { id: 'sentiment', name: 'SentimentScope', color: 'var(--prophet-sentiment)' },
  { id: 'fractal', name: 'FractalForecast', color: 'var(--prophet-fractal)' },
  { id: 'neuroflow', name: 'NeuroFlow', color: 'var(--prophet-neuroflow)' },
  { id: 'cyclevision', name: 'CycleVision', color: 'var(--prophet-cyclevision)' },
];

interface ProphetSelectorProps {
  selectedProphets: string[];
  onSelectProphet: (prophetId: string) => void;
}

export const ProphetSelector: React.FC<ProphetSelectorProps> = ({
  selectedProphets,
  onSelectProphet,
}) => {
  return (
    <div className="prophet-selector">
      <h2 className="selector-title">Prophet Selection</h2>
      <div className="prophet-list">
        {prophets.map((prophet) => (
          <button
            key={prophet.id}
            className={`prophet-item ${selectedProphets.includes(prophet.id) ? 'active' : ''}`}
            onClick={() => onSelectProphet(prophet.id)}
            style={{ '--prophet-color': prophet.color } as React.CSSProperties}
          >
            <div className="prophet-indicator"></div>
            <span className="prophet-name">{prophet.name}</span>
            <div className="expand-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 3L11 8L6 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};