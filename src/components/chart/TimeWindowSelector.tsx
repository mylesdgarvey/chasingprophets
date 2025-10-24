import React from 'react';
import './TimeWindowSelector.css';

interface TimeWindow {
  label: string;
  days: number | null;
}

interface TimeWindowSelectorProps {
  windows: TimeWindow[];
  activeIndex: number;
  onChange: (index: number) => void;
}

const TimeWindowSelector: React.FC<TimeWindowSelectorProps> = ({
  windows,
  activeIndex,
  onChange
}) => {
  return (
    <div className="time-selector">
      <span className="label">Time Window:</span>
      <div className="button-group">
        {windows.map((window, index) => (
          <button
            key={window.label}
            className={`selector-button ${index === activeIndex ? 'active' : ''}`}
            onClick={() => onChange(index)}
          >
            {window.label}
          </button>
        ))}
      </div>


    </div>
  );
};

export default TimeWindowSelector;