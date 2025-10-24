import React from 'react';
import { ChevronDown, ChevronRight } from 'react-feather';
import { PROPHET_INFO } from '../../constants/prophetData';

// Get the keys of PROPHET_INFO as a type
type ProphetKey = keyof typeof PROPHET_INFO;

interface ProphetSelectorProps {
  prophets: ProphetKey[];
  activeProphets: ProphetKey[];
  expandedProphet: ProphetKey | null;
  prophetInfo: typeof PROPHET_INFO;
  colors: { [key in ProphetKey]: string };
  onToggleProphet: (prophet: ProphetKey) => void;
  onExpandProphet: (prophet: ProphetKey) => void;
  error?: string;
}

const ProphetSelector: React.FC<ProphetSelectorProps> = ({
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
  {prophets.map((prophet) => (
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
                    borderColor: colors[prophet],
                    background: activeProphets.includes(prophet) ? colors[prophet] : 'transparent'
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

      <style>{`
        .prophet-selector {
          margin-top: var(--spacing-8);
          padding-top: var(--spacing-6);
          border-top: 1px solid var(--border);
        }

        .title {
          font-size: var(--text-xl);
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
          border: 1px solid var(--border);
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .prophet-header.active {
          background: var(--bg-hover);
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
          transition: all 0.2s ease;
        }

        .prophet-name {
          font-weight: 600;
          color: var(--text);
        }

        .expand-button {
          padding: var(--spacing-2);
          color: var(--text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .prophet-details {
          height: 0;
          overflow: hidden;
          transition: height 0.3s ease;
        }

        .prophet-details.expanded {
          height: auto;
        }

        .details-content {
          padding: var(--spacing-4) var(--spacing-4) var(--spacing-4) calc(var(--spacing-4) + 28px);
          margin-top: -1px;
          border-radius: 0 0 8px 8px;
          background: var(--bg-hover);
          font-size: 0.875rem;
        }

        .detail-section {
          margin-bottom: var(--spacing-3);
        }

        .detail-section:last-child {
          margin-bottom: 0;
        }

        .detail-text {
          margin-top: var(--spacing-1);
          color: var(--text-secondary);
        }

        .error-message {
          color: var(--error);
          margin-top: var(--spacing-4);
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default ProphetSelector;