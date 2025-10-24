import React from 'react';
import './Controls.css';

interface TimeWindowSelectorProps {
  selectedWindow: string;
  onSelect: (window: string) => void;
}

interface ScaleTypeSelectorProps {
  selectedScale: string;
  onSelect: (scale: string) => void;
}

export const TimeWindowSelector: React.FC<TimeWindowSelectorProps> = ({
  selectedWindow,
  onSelect,
}) => {
  const windows = ['1W', '1M', '3M', 'All'];

  return (
    <div className="control-group">
      <span className="control-label">Time Window:</span>
      <div className="control-buttons">
        {windows.map((window) => (
          <button
            key={window}
            className={`control-button ${selectedWindow === window ? 'active' : ''}`}
            onClick={() => onSelect(window)}
          >
            {window}
          </button>
        ))}
      </div>
    </div>
  );
};

export const ScaleTypeSelector: React.FC<ScaleTypeSelectorProps> = ({
  selectedScale,
  onSelect,
}) => {
  const scales = ['Auto', 'Fixed', 'Log'];

  return (
    <div className="control-group">
      <span className="control-label">Scale:</span>
      <div className="control-buttons">
        {scales.map((scale) => (
          <button
            key={scale}
            className={`control-button ${selectedScale === scale ? 'active' : ''}`}
            onClick={() => onSelect(scale)}
          >
            {scale}
          </button>
        ))}
      </div>
    </div>
  );
};