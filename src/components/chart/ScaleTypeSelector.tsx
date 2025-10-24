import React from 'react';

interface ScaleType {
  label: string;
  type: 'linear' | 'log';
}

interface ScaleTypeSelectorProps {
  scales: ScaleType[];
  activeIndex: number;
  onChange: (index: number) => void;
}

const ScaleTypeSelector: React.FC<ScaleTypeSelectorProps> = ({
  scales,
  activeIndex,
  onChange
}) => {
  return (
    <div className="scale-selector">
      <span className="label">Scale:</span>
      <div className="button-group">
        {scales.map((scale, index) => (
          <button
            key={scale.label}
            className={`selector-button ${index === activeIndex ? 'active' : ''}`}
            onClick={() => onChange(index)}
          >
            {scale.label}
          </button>
        ))}
      </div>

      <style>{`
        .scale-selector {
          display: flex;
          align-items: center;
          gap: var(--spacing-4);
        }

        .label {
          font-weight: 500;
          color: var(--text-secondary);
        }

        .button-group {
          display: flex;
          gap: var(--spacing-1);
        }

        .selector-button {
          padding: var(--spacing-2) var(--spacing-4);
          border: 1px solid var(--border);
          background: var(--bg-primary);
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .selector-button:first-child {
          border-radius: 4px 0 0 4px;
        }

        .selector-button:last-child {
          border-radius: 0 4px 4px 0;
        }

        .selector-button.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .selector-button:hover:not(.active) {
          background: var(--bg-hover);
        }
      `}</style>
    </div>
  );
};

export default ScaleTypeSelector;