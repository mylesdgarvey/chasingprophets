import React, { useState } from 'react';
import { ChevronDown } from 'react-feather';

interface ProphetInfo {
  name: string;
  description: string;
  baseDataSets: string[];
  modelType: string;
}

interface ProphetAccordionProps {
  prophet: string;
  prophetInfo: ProphetInfo;
  isActive: boolean;
  onToggleActive: (prophet: string) => void;
  color: string;
}

const ProphetAccordion: React.FC<ProphetAccordionProps> = ({ 
  prophet, 
  prophetInfo, 
  isActive, 
  onToggleActive, 
  color 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="accordion-item">
      <div 
        className="accordion-header"
        style={{
          borderColor: isActive ? color : undefined
        }}
      >
        <div className="header-content" onClick={() => onToggleActive(prophet)}>
          <div 
            className="checkbox"
            style={{
              borderColor: color,
              backgroundColor: isActive ? color : 'transparent'
            }}
          />
          <span className="title">{prophetInfo.name}</span>
        </div>
        <button 
          className={`expand-button ${isExpanded ? 'expanded' : ''}`}
          onClick={toggleExpand}
        >
          <ChevronDown size={16} />
        </button>
      </div>
      
      <div className={`accordion-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="content-inner">
          <div className="info-section">
            <h4>Description</h4>
            <p>{prophetInfo.description}</p>
          </div>
          <div className="info-section">
            <h4>Base Data Sets</h4>
            <p>{prophetInfo.baseDataSets.join(", ")}</p>
          </div>
          <div className="info-section">
            <h4>Model Type</h4>
            <p>{prophetInfo.modelType}</p>
          </div>
        </div>
      </div>

      <style>{`
        .accordion-item {
          background: white;
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }

        .accordion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-4);
          border-left: 4px solid transparent;
          transition: all 0.3s ease;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          cursor: pointer;
        }

        .checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .title {
          font-weight: 500;
        }

        .expand-button {
          background: none;
          border: none;
          padding: var(--spacing-1);
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .expand-button.expanded {
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

        .content-inner {
          padding: var(--spacing-4);
          border-top: 1px solid var(--border);
        }

        .info-section {
          margin-bottom: var(--spacing-4);
        }

        .info-section:last-child {
          margin-bottom: 0;
        }

        .info-section h4 {
          margin: 0 0 var(--spacing-2);
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .info-section p {
          margin: 0;
          color: var(--text);
        }
      `}</style>
    </div>
  );
};

export default ProphetAccordion;