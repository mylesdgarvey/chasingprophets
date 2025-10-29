import React, { useState } from 'react';
import './Widget.css';

export interface WidgetProps {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
  onExpand?: (expanded: boolean) => void;
  className?: string;
}

export const Widget: React.FC<WidgetProps> = ({
  id,
  title,
  subtitle,
  children,
  expandable = true,
  defaultExpanded = false,
  onExpand,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpand?.(newExpanded);
  };

  return (
    <>
      <article 
        className={`widget glass-surface ${isExpanded ? 'widget-expanded' : ''} ${className}`}
        data-widget-id={id}
      >
        <div className="widget-header">
          <div className="widget-title">
            <h3>{title}</h3>
            {subtitle && <span className="widget-subtitle">{subtitle}</span>}
          </div>
          {expandable && (
            <button 
              className="widget-expand-btn"
              onClick={handleExpand}
              aria-label={isExpanded ? 'Minimize' : 'Expand'}
              title={isExpanded ? 'Minimize' : 'Expand fullscreen'}
            >
              {isExpanded ? '✕' : '⛶'}
            </button>
          )}
        </div>
        <div className="widget-content">
          {children}
        </div>
      </article>

      {/* Fullscreen overlay when expanded */}
      {isExpanded && (
        <div className="widget-overlay" onClick={handleExpand}>
          <article 
            className="widget widget-fullscreen glass-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="widget-header">
              <div className="widget-title">
                <h3>{title}</h3>
                {subtitle && <span className="widget-subtitle">{subtitle}</span>}
              </div>
              <button 
                className="widget-expand-btn"
                onClick={handleExpand}
                aria-label="Minimize"
              >
                ✕
              </button>
            </div>
            <div className="widget-content widget-content-expanded">
              {children}
            </div>
          </article>
        </div>
      )}
    </>
  );
};

export default Widget;
