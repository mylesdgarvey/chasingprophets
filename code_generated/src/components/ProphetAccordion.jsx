import React, { useState } from 'react';
import { ChevronDown } from 'react-feather';
import './ProphetAccordion.css';

const ProphetAccordion = ({ 
  prophet, 
  prophetInfo, 
  isActive, 
  onToggleActive, 
  color 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = (e) => {
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
    </div>
  );
};

export default ProphetAccordion;