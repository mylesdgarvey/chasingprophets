/**
 * System Admin Dashboard
 * 
 * Main management hub for system administrators
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Layers, Box, BarChart2, TrendingUp, Package } from 'lucide-react';
import { getAllProphets } from '../../services/prophet';
import { getAllModelFits } from '../../services/modelFit';
import { getAllDataSlices } from '../../services/dataSlice';
import { getAllDatasets } from '../../services/dataset';
import { getAllModelScaffolds } from '../../services/modelScaffold';
import { getAllAssets } from '../../services/assets';
import '../Management/Management.css';

interface Stats {
  scaffolds: number;
  datasets: number;
  slices: number;
  prophets: number;
  fits: number;
  assets: number;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    scaffolds: 0,
    datasets: 0,
    slices: 0,
    prophets: 0,
    fits: 0,
    assets: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [prophets, fits, slices, datasets, scaffolds, assets] = await Promise.all([
        getAllProphets(),
        getAllModelFits(),
        getAllDataSlices(),
        getAllDatasets(),
        getAllModelScaffolds(),
        getAllAssets()
      ]);

      setStats({
        scaffolds: scaffolds.length,
        datasets: datasets.length,
        slices: slices.length,
        prophets: prophets.length,
        fits: fits.length,
        assets: assets.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Administration</h1>
          <p className="page-description">
            Manage all system entities, data pipelines, and configuration
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          title="Assets"
          value={loading ? '...' : stats.assets}
          subtitle="Financial instruments"
          icon={<TrendingUp size={24} />}
          color="#ec4899"
          onClick={() => navigate('/mgmt/assets')}
        />
        <StatCard
          title="Datasets"
          value={loading ? '...' : stats.datasets}
          subtitle="OHLCV data sources"
          icon={<Database size={24} />}
          color="#6366f1"
          onClick={() => navigate('/mgmt/datasets')}
        />
        <StatCard
          title="Data Slices"
          value={loading ? '...' : stats.slices}
          subtitle="Training windows"
          icon={<Layers size={24} />}
          color="#f59e0b"
          onClick={() => navigate('/mgmt/data/slices')}
        />
        <StatCard
          title="Scaffolds"
          value={loading ? '...' : stats.scaffolds}
          subtitle="Model templates"
          icon={<Package size={24} />}
          color="#3b82f6"
          onClick={() => navigate('/mgmt/models/scaffolds')}
        />
        <StatCard
          title="Model Fits"
          value={loading ? '...' : stats.fits}
          subtitle="Trained instances"
          icon={<Box size={24} />}
          color="#8b5cf6"
          onClick={() => navigate('/mgmt/models/fits')}
        />
        <StatCard
          title="Prophets"
          value={loading ? '...' : stats.prophets}
          subtitle="Active predictors"
          icon={<BarChart2 size={24} />}
          color="#10b981"
          onClick={() => navigate('/mgmt/prophets')}
        />
      </div>

      {/* Main Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        <NavSection
          title="📊 Data Management"
          description="Assets, datasets, and data slices"
          items={[
            { label: 'Manage Assets', path: '/mgmt/assets', count: stats.assets },
            { label: 'Manage Datasets', path: '/mgmt/datasets', count: stats.datasets },
            { label: 'Manage Data Slices', path: '/mgmt/data/slices', count: stats.slices }
          ]}
          navigate={navigate}
        />

        <NavSection
          title="🤖 Model Management"
          description="Scaffolds, fits, and prophets"
          items={[
            { label: 'Model Scaffolds', path: '/mgmt/models/scaffolds', count: stats.scaffolds },
            { label: 'Model Fits', path: '/mgmt/models/fits', count: stats.fits },
            { label: 'Prophets', path: '/mgmt/prophets', count: stats.prophets }
          ]}
          navigate={navigate}
        />

        <NavSection
          title="⚙️ System"
          description="Configuration and monitoring"
          items={[
            { label: 'System Metrics', path: '/mgmt/metrics' },
            { label: 'System Settings', path: '/mgmt/settings' }
          ]}
          navigate={navigate}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color, onClick }: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}) {
  return (
    <div 
      className="info-card" 
      onClick={onClick}
      style={{ 
        cursor: 'pointer', 
        transition: 'all 0.2s',
        borderLeft: `4px solid ${color}`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {title}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {value}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {subtitle}
          </div>
        </div>
        <div style={{ color, opacity: 0.8 }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function NavSection({ title, description, items, navigate }: {
  title: string;
  description: string;
  items: Array<{ label: string; path: string; count?: number }>;
  navigate: (path: string) => void;
}) {
  return (
    <div className="info-card">
      <div className="info-card-header">
        <h3>{title}</h3>
      </div>
      <div className="info-card-body">
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          {description}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((item) => (
            <button
              key={item.path}
              className="nav-item"
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.borderColor = 'var(--primary-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span style={{
                  background: 'var(--primary-color)',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
