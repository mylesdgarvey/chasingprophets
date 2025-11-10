/**
 * EntityBadge Component
 * Clickable, bubble-style badge for database entities (prophets, models, slices, etc.)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Cpu, 
  Database, 
  Layers, 
  Target,
  TrendingUp,
  Box
} from 'lucide-react';
import './EntityBadge.css';

export type EntityType = 
  | 'prophet' 
  | 'model-fit' 
  | 'data-slice' 
  | 'dataset'
  | 'scaffold'
  | 'asset'
  | 'forecast';

interface EntityBadgeProps {
  type: EntityType;
  id: string;
  label: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  clickable?: boolean;
}

const ENTITY_CONFIG = {
  'prophet': {
    icon: Target,
    color: '#3b82f6',
    route: (id: string) => `/prophets/${id}`
  },
  'model-fit': {
    icon: Cpu,
    color: '#8b5cf6',
    route: (id: string) => `/mgmt/models/fits/${id}`
  },
  'data-slice': {
    icon: Layers,
    color: '#10b981',
    route: (id: string) => `/mgmt/data/slices/${id}`
  },
  'dataset': {
    icon: Database,
    color: '#14b8a6',
    route: (id: string) => `/mgmt/datasets/${id}`
  },
  'scaffold': {
    icon: Box,
    color: '#f59e0b',
    route: (id: string) => `/mgmt/models/scaffolds/${id}/edit`
  },
  'asset': {
    icon: TrendingUp,
    color: '#06b6d4',
    route: (id: string) => `/assets/${id}`
  },
  'forecast': {
    icon: User,
    color: '#ec4899',
    route: (id: string) => `/forecasts/${id}`
  }
};

export function EntityBadge({ 
  type, 
  id, 
  label, 
  size = 'medium',
  showIcon = true,
  clickable = true
}: EntityBadgeProps) {
  const navigate = useNavigate();
  const config = ENTITY_CONFIG[type];
  const Icon = config.icon;

  const handleClick = (e: React.MouseEvent) => {
    if (clickable) {
      e.stopPropagation();
      navigate(config.route(id));
    }
  };

  return (
    <div 
      className={`entity-badge entity-badge--${size} entity-badge--${type} ${clickable ? 'entity-badge--clickable' : ''}`}
      onClick={handleClick}
      style={{ 
        '--badge-color': config.color,
        borderColor: config.color,
        color: config.color
      } as React.CSSProperties}
      title={`${type}: ${id}`}
    >
      {showIcon && <Icon size={size === 'small' ? 12 : size === 'medium' ? 14 : 16} />}
      <span className="entity-badge__label">{label}</span>
    </div>
  );
}

/**
 * EntityBadgeList - Display multiple badges in a row
 */
interface EntityBadgeListProps {
  entities: Array<{
    type: EntityType;
    id: string;
    label: string;
  }>;
  size?: 'small' | 'medium' | 'large';
  maxVisible?: number;
}

export function EntityBadgeList({ entities, size = 'small', maxVisible = 3 }: EntityBadgeListProps) {
  const visible = entities.slice(0, maxVisible);
  const remaining = entities.length - maxVisible;

  return (
    <div className="entity-badge-list">
      {visible.map((entity, i) => (
        <EntityBadge
          key={`${entity.type}-${entity.id}`}
          type={entity.type}
          id={entity.id}
          label={entity.label}
          size={size}
        />
      ))}
      {remaining > 0 && (
        <div className={`entity-badge entity-badge--${size} entity-badge--more`}>
          +{remaining} more
        </div>
      )}
    </div>
  );
}
