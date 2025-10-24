import React from 'react';

const TimeWindowSelector = ({ windows, activeIndex, onChange }) => {
  return (
    <div className="time-window-selector">
      <span className="label">Time Window:</span>
      <div className="button-group">
        {windows.map((window, idx) => (
          <button
            key={window.label}
            onClick={() => onChange(idx)}
            className={`selector-button ${activeIndex === idx ? 'active' : ''}`}
          >
            {window.label}
          </button>
        ))}
      </div>

      <style jsx>{`
        .time-window-selector {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
        }

        .label {
          color: var(--secondary-color);
          font-size: var(--font-size-sm);
        }

        .button-group {
          display: flex;
          gap: var(--spacing-2);
        }

        .selector-button {
          padding: var(--spacing-2) var(--spacing-4);
          border-radius: 20px;
          border: 1px solid var(--border-color);
          background: var(--background-color);
          color: var(--primary-color);
          font-weight: 600;
          transition: all var(--transition-fast);
        }

        .selector-button:hover {
          background: var(--hover-color);
        }

        .selector-button.active {
          background: var(--primary-color);
          color: var(--background-color);
          border-color: var(--primary-color);
        }
      `}</style>
    </div>
  );
};

export default TimeWindowSelector;