import React from 'react';
import { FaChevronDown } from 'react-icons/fa';

export const ProphetControls = ({ 
  timeWindow, 
  setTimeWindow, 
  scale, 
  setScale,
  expanded,
  onToggle 
}) => {
  const timeWindows = ['1Y', '2Y', '5Y', '10Y'];
  const scales = ['Linear', 'Log'];

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
        <FaChevronDown 
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
    </div>
  );
};