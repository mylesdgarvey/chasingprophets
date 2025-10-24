import React from 'react';
import { ChevronDown } from 'react-feather';

interface ProphetControlsProps {
  timeWindow: string;
  setTimeWindow: (window: string) => void;
  scale: string;
  setScale: (scale: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

export const ProphetControls: React.FC<ProphetControlsProps> = ({ 
  timeWindow, 
  setTimeWindow, 
  scale, 
  setScale,
  expanded,
  onToggle 
}) => {
  const timeWindows = ['1M', '3M', '6M', '1Y'];
  const scales = ['Auto', 'Log'];

  return (
    <div className="prophet-card">
      <div 
        className="accordion-header" 
        onClick={onToggle}
        style={{ padding: 'var(--spacing-4)', marginBottom: expanded ? 'var(--spacing-4)' : 0 }}
      >
        <h3 className="accordion-title">
          <span>Prophet Settings</span>
        </h3>
        <ChevronDown 
          className={`accordion-icon ${expanded ? 'expanded' : ''}`} 
          size={16}
        />
      </div>
      
      <div className={`accordion-content ${expanded ? 'expanded' : ''}`}>
        <div className="controls-container">
          <div className="control-group">
            <span className="control-label">Time Window</span>
            <div className="time-controls">
              {timeWindows.map((tw) => (
                <button
                  key={tw}
                  className={`control-button ${timeWindow === tw ? 'active' : ''}`}
                  onClick={() => setTimeWindow(tw)}
                >
                  {tw}
                </button>
              ))}
            </div>
          </div>
          
          <div className="control-group">
            <span className="control-label">Scale</span>
            <div className="scale-controls">
              {scales.map((s) => (
                <button
                  key={s}
                  className={`control-button ${scale === s ? 'active' : ''}`}
                  onClick={() => setScale(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .prophet-card {
          background: white;
          border-radius: 8px;
          box-shadow: var(--shadow-md);
          overflow: hidden;
          margin-bottom: var(--spacing-4);
        }

        .accordion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .accordion-header:hover {
          background: var(--bg-hover);
        }

        .accordion-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .accordion-icon {
          transition: transform 0.3s ease;
        }

        .accordion-icon.expanded {
          transform: rotate(180deg);
        }

        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .accordion-content.expanded {
          max-height: 500px;
        }

        .controls-container {
          padding: var(--spacing-4);
        }

        .control-group {
          margin-bottom: var(--spacing-4);
        }

        .control-group:last-child {
          margin-bottom: 0;
        }

        .control-label {
          display: block;
          margin-bottom: var(--spacing-2);
          color: var(--text-secondary);
        }

        .time-controls,
        .scale-controls {
          display: flex;
          gap: var(--spacing-2);
        }

        .control-button {
          padding: var(--spacing-2) var(--spacing-4);
          border: 1px solid var(--border);
          border-radius: 4px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .control-button:hover {
          background: var(--bg-hover);
        }

        .control-button.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
};