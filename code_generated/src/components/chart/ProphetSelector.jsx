import React from 'react';
import { ChevronDown, ChevronRight } from 'react-feather';

const ProphetSelector = ({
  prophets,
  activeProphets,
  expandedProphet,
  prophetInfo,
  colors,
  onToggleProphet,
  onExpandProphet,
  error
}) => {
  return (
    <div className="prophet-selector">
      <h2 className="title">Prophet Selection</h2>
      <div className="prophet-list">
        {prophets.map((prophet, idx) => (
          <div key={prophet} className="prophet-item">
            {/* Prophet Header Row */}
            <div className={`prophet-header ${activeProphets.includes(prophet) ? 'active' : ''}`}>
              {/* Left side - Prophet toggle */}
              <div
                onClick={() => onToggleProphet(prophet)}
                className="prophet-toggle"
              >
                <div
                  className="checkbox"
                  style={{
                    borderColor: colors[idx],
                    background: activeProphets.includes(prophet) ? colors[idx] : 'transparent'
                  }}
                />
                <span className="prophet-name">
                  {prophetInfo[prophet].name}
                </span>
              </div>

              {/* Right side - Expand toggle */}
              <button
                onClick={() => onExpandProphet(prophet)}
                className="expand-button"
              >
                {expandedProphet === prophet ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
            </div>

            {/* Expanded Content */}
            <div className={`prophet-details ${expandedProphet === prophet ? 'expanded' : ''}`}>
              <div className="details-content">
                <div className="detail-section">
                  <strong>Description:</strong>
                  <div className="detail-text">
                    {prophetInfo[prophet].description}
                  </div>
                </div>
                <div className="detail-section">
                  <strong>Base Data Sets:</strong>
                  <div className="detail-text">
                    {prophetInfo[prophet].baseDataSets.join(", ")}
                  </div>
                </div>
                <div className="detail-section">
                  <strong>Model Type:</strong>
                  <div className="detail-text">
                    {prophetInfo[prophet].modelType}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}

      <style jsx>{`
        .prophet-selector {
          margin-top: var(--spacing-8);
          padding-top: var(--spacing-6);
          border-top: 1px solid var(--border-color);
        }

        .title {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-4);
        }

        .prophet-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-3);
        }

        .prophet-header {
          display: flex;
          align-items: center;
          padding: var(--spacing-3);
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--background-color);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .prophet-header.active {
          background: var(--hover-color);
        }

        .prophet-toggle {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
        }

        .checkbox {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 2px solid;
          transition: all var(--transition-fast);
        }

        .prophet-name {
          font-weight: 600;
          color: var(--primary-color);
        }

        .expand-button {
          padding: var(--spacing-2);
          color: var(--secondary-color);
          background: none;
          border: none;
          cursor: pointer;
          transition: transform var(--transition-fast);
        }

        .prophet-details {
          height: 0;
          overflow: hidden;
          transition: height var(--transition-normal);
        }

        .prophet-details.expanded {
          height: auto;
        }

        .details-content {
          padding: var(--spacing-4) var(--spacing-4) var(--spacing-4) calc(var(--spacing-4) + 28px);
          margin-top: -1px;
          border-radius: 0 0 8px 8px;
          background: var(--hover-color);
          font-size: var(--font-size-sm);
        }

        .detail-section {
          margin-bottom: var(--spacing-3);
        }

        .detail-section:last-child {
          margin-bottom: 0;
        }

        .detail-text {
          margin-top: var(--spacing-1);
          color: var(--secondary-color);
        }

        .error-message {
          color: red;
          margin-top: var(--spacing-4);
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default ProphetSelector;