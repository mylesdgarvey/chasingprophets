/**
 * System Metrics Dashboard
 * 
 * Monitor system-wide performance, health, and usage metrics:
 * - Prophet training status
 * - Model performance metrics
 * - Data pipeline health
 * - API/Service usage
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, TrendingUp, Database, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { getAllProphets } from '../../services/prophet';
import { getAllModelFits } from '../../services/modelFit';
import { getAllDataSlices } from '../../services/dataSlice';
import type { Prophet } from '../../types/prophet';
import type { ModelFit } from '../../types/modelFit';
import type { DataSlice } from '../../types/dataSlice';
import '../Admin/AdminDashboard.css';
import './Management.css';

interface SystemMetrics {
  prophets: {
    total: number;
    active: number;
    training: number;
    failed: number;
    inactive: number;
  };
  models: {
    total: number;
    fit: number;
    unfit: number;
    fitting: number;
    failed: number;
  };
  data: {
    totalSlices: number;
    simpleSlices: number;
    compoundSlices: number;
  };
}

export function SystemMetrics() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const [prophets, modelFits, dataSlices] = await Promise.all([
        getAllProphets(),
        getAllModelFits(),
        getAllDataSlices()
      ]);

      // Calculate prophet metrics
      const prophetMetrics = {
        total: prophets.length,
        active: prophets.filter(p => p.status === 'active').length,
        training: prophets.filter(p => p.status === 'pending_training').length,
        failed: prophets.filter(p => p.status === 'failed').length,
        inactive: prophets.filter(p => p.status === 'inactive').length
      };

      // Calculate model metrics
      const modelMetrics = {
        total: modelFits.length,
        fit: modelFits.filter(m => m.trainingStatus === 'fit').length,
        unfit: modelFits.filter(m => m.trainingStatus === 'unfit').length,
        fitting: modelFits.filter(m => m.trainingStatus === 'fitting').length,
        failed: modelFits.filter(m => m.trainingStatus === 'failed').length
      };

      // Calculate data metrics
      const dataMetrics = {
        totalSlices: dataSlices.length,
        simpleSlices: dataSlices.filter(s => s.sliceType === 'simple').length,
        compoundSlices: dataSlices.filter(s => s.sliceType === 'compound').length
      };

      setMetrics({
        prophets: prophetMetrics,
        models: modelMetrics,
        data: dataMetrics
      });
    } catch (error) {
      console.error('Failed to load system metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="management-page">
        <div className="page-header">
          <h1>System Metrics</h1>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading metrics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="management-page">
        <div className="page-header">
          <h1>System Metrics</h1>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
          Failed to load metrics
        </div>
      </div>
    );
  }

  const healthScore = Math.round(
    ((metrics.prophets.active / metrics.prophets.total) * 40) +
    ((metrics.models.fit / metrics.models.total) * 60)
  );

  return (
    <div className="management-page">
      <div className="page-header">
        <div className="header-content">
          <button onClick={() => navigate('/admin')} className="back-button">
            ← Back to Admin
          </button>
          <h1>System Metrics</h1>
          <p className="subtitle">Monitor system health, performance, and resource usage</p>
        </div>
      </div>

      {/* Health Overview */}
      <div className="metrics-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="metric-card" style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Activity size={24} style={{ color: healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444' }} />
            <h3>System Health</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444' }}>
            {healthScore}%
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Attention'}
          </div>
        </div>

        <div className="metric-card" style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <TrendingUp size={24} style={{ color: '#3b82f6' }} />
            <h3>Active Prophets</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {metrics.prophets.active}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            of {metrics.prophets.total} total prophets
          </div>
        </div>

        <div className="metric-card" style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <CheckCircle size={24} style={{ color: '#10b981' }} />
            <h3>Fitted Models</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {metrics.models.fit}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            of {metrics.models.total} model instances
          </div>
        </div>

        <div className="metric-card" style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Database size={24} style={{ color: '#8b5cf6' }} />
            <h3>Data Slices</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {metrics.data.totalSlices}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Simple: {metrics.data.simpleSlices} | Compound: {metrics.data.compoundSlices}
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {/* Prophet Status Breakdown */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '1.5rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Prophet Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <MetricRow label="Active" value={metrics.prophets.active} color="#10b981" />
            <MetricRow label="Training" value={metrics.prophets.training} color="#f59e0b" />
            <MetricRow label="Inactive" value={metrics.prophets.inactive} color="#6b7280" />
            <MetricRow label="Failed" value={metrics.prophets.failed} color="#ef4444" />
          </div>
        </div>

        {/* Model Training Status */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '1.5rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Model Training Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <MetricRow label="Fit" value={metrics.models.fit} color="#10b981" />
            <MetricRow label="Unfit" value={metrics.models.unfit} color="#6b7280" />
            <MetricRow label="Fitting" value={metrics.models.fitting} color="#f59e0b" />
            <MetricRow label="Failed" value={metrics.models.failed} color="#ef4444" />
          </div>
        </div>

        {/* Data Pipeline */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '1.5rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Data Pipeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <MetricRow label="Simple Slices" value={metrics.data.simpleSlices} color="#3b82f6" />
            <MetricRow label="Compound Slices" value={metrics.data.compoundSlices} color="#8b5cf6" />
            <MetricRow label="Total Slices" value={metrics.data.totalSlices} color="#ec4899" />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <Zap size={16} />
          <span>Metrics refresh automatically when page loads. Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
        <span>{label}</span>
      </div>
      <span style={{ fontWeight: 'bold', color }}>{value}</span>
    </div>
  );
}
