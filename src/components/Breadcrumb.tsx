/**
 * Breadcrumb Navigation Component
 * Shows hierarchical navigation path in management pages
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './Breadcrumb.css';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const navigate = useNavigate();

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="breadcrumb-item">
              {item.path && !isLast ? (
                <button
                  onClick={() => navigate(item.path!)}
                  className="breadcrumb-link"
                >
                  {item.label}
                </button>
              ) : (
                <span className="breadcrumb-current">{item.label}</span>
              )}
              
              {!isLast && (
                <ChevronRight 
                  size={14} 
                  className="breadcrumb-separator" 
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
