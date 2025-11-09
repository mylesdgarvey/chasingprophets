/**
 * Prophet Comparison Page
 * 
 * Compare multiple prophets side-by-side with synchronized metrics and charts
 * Features:
 * - Multi-select prophet picker (2-4 prophets)
 * - Side-by-side metric comparison cards
 * - Synchronized performance charts
 * - Filter by asset to narrow prophet selection
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GitCompare, X, Plus, TrendingUp, Award, Target, Activity } from 'lucide-react';
import Plot from 'react-plotly.js';
import { Prophet } from '../../types/prophet';
import { ProphetPerformanceSummary } from '../../types/performance';
import { getAllProphets } from '../../services/prophet';
import { getPerformanceSummariesByProphet } from '../../services/performance';
import './ProphetComparison.css';

const MAX_PROPHETS = 4;
const MIN_PROPHETS = 2;

interface ProphetWithMetrics {
  prophet: Prophet;
  summaries: ProphetPerformanceSummary[];
}

export function ProphetComparison() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [allProphets, setAllProphets] = useState<Prophet[]>([]);
  const [selectedProphetIds, setSelectedProphetIds] = useState<string[]>([]);
  const [selectedProphetsData, setSelectedProphetsData] = useState<ProphetWithMetrics[]>([]);
  const [aggregationWindow, setAggregationWindow] = useState<string>('20-day');
  
  const [loading, setLoading] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters for prophet picker
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProphets();
  }, []);

  // Load initial prophet IDs from URL params
  useEffect(() => {
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const ids = idsParam.split(',').slice(0, MAX_PROPHETS);
      setSelectedProphetIds(ids);
    }
  }, [searchParams]);

  // Load metrics when selection changes
  useEffect(() => {
    if (selectedProphetIds.length >= MIN_PROPHETS) {
      loadSelectedProphetsData();
    } else {
      setSelectedProphetsData([]);
    }
  }, [selectedProphetIds, aggregationWindow]);

  async function loadProphets() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllProphets();
      setAllProphets(data);
    } catch (err) {
      console.error('Error loading prophets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prophets');
    } finally {
      setLoading(false);
    }
  }

  async function loadSelectedProphetsData() {
    try {
      setLoadingMetrics(true);
      
      const dataPromises = selectedProphetIds.map(async (id) => {
        const prophet = allProphets.find(p => p.prophetId === id);
        if (!prophet) return null;
        
        const summaries = await getPerformanceSummariesByProphet(id);
        return { prophet, summaries };
      });

      const results = await Promise.all(dataPromises);
      setSelectedProphetsData(results.filter(r => r !== null) as ProphetWithMetrics[]);
    } catch (err) {
      console.error('Error loading prophet metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoadingMetrics(false);
    }
  }

  function toggleProphetSelection(prophetId: string) {
    setSelectedProphetIds(prev => {
      if (prev.includes(prophetId)) {
        return prev.filter(id => id !== prophetId);
      } else if (prev.length < MAX_PROPHETS) {
        return [...prev, prophetId];
      }
      return prev;
    });
  }

  function clearSelection() {
    setSelectedProphetIds([]);
    setSelectedProphetsData([]);
  }

  function getFilteredProphets(): Prophet[] {
    let filtered = allProphets;

    // Asset filter
    if (assetFilter !== 'all') {
      filtered = filtered.filter(p => p.assetId === assetFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.prophetName.toLowerCase().includes(query) ||
        p.assetId.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  function getUniqueAssets(): string[] {
    return Array.from(new Set(allProphets.map(p => p.assetId)));
  }

  function getSummaryForWindow(summaries: ProphetPerformanceSummary[]): ProphetPerformanceSummary | undefined {
    return summaries.find(s => s.aggregationWindow === aggregationWindow);
  }

  // Generate chart data for performance trends
  const chartData = useMemo(() => {
    if (selectedProphetsData.length < MIN_PROPHETS) return null;

    const windows = ['20-day', '60-day', '120-day', '240-day'];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    const traces = selectedProphetsData.map((data, index) => {
      const mapeValues = windows.map(window => {
        const summary = data.summaries.find(s => s.aggregationWindow === window);
        return summary?.mape ?? null;
      });

      const directionalValues = windows.map(window => {
        const summary = data.summaries.find(s => s.aggregationWindow === window);
        return summary?.directionalAccuracy ?? null;
      });

      return {
        mape: {
          x: windows,
          y: mapeValues,
          name: data.prophet.prophetName,
          type: 'scatter',
          mode: 'lines+markers',
          line: { color: colors[index % colors.length], width: 3 },
          marker: { size: 8 }
        } as any,
        directional: {
          x: windows,
          y: directionalValues,
          name: data.prophet.prophetName,
          type: 'scatter',
          mode: 'lines+markers',
          line: { color: colors[index % colors.length], width: 3 },
          marker: { size: 8 }
        } as any
      };
    });

    return traces;
  }, [selectedProphetsData]);

  function getPerformanceRating(mape?: number): { label: string; className: string } {
    if (!mape) return { label: 'Unknown', className: 'unknown' };
    if (mape <= 10) return { label: 'Excellent', className: 'excellent' };
    if (mape <= 30) return { label: 'Good', className: 'good' };
    if (mape <= 50) return { label: 'Fair', className: 'fair' };
    return { label: 'Baseline', className: 'baseline' };
  }

  const filteredProphets = getFilteredProphets();
  const canCompare = selectedProphetIds.length >= MIN_PROPHETS;

  if (loading) {
    return (
      <div className="prophet-comparison">
        <div className="loading-state">Loading prophets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prophet-comparison">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadProphets}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="prophet-comparison">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="title-with-icon">
            <GitCompare size={36} className="compare-icon" />
            <div>
              <h1>Compare Prophets</h1>
              <p className="subtitle">
                Select 2-4 prophets to compare their performance metrics side-by-side
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      <div className="selection-summary glass-surface">
        <div className="summary-header">
          <span className="selection-count">
            {selectedProphetIds.length} / {MAX_PROPHETS} selected
          </span>
          {selectedProphetIds.length > 0 && (
            <button className="clear-btn" onClick={clearSelection}>
              <X size={16} />
              Clear All
            </button>
          )}
        </div>

        {selectedProphetIds.length > 0 && (
          <div className="selected-prophets">
            {selectedProphetIds.map(id => {
              const prophet = allProphets.find(p => p.prophetId === id);
              if (!prophet) return null;
              
              return (
                <div key={id} className="selected-chip">
                  <span className="prophet-name">{prophet.prophetName}</span>
                  <span className="prophet-asset">{prophet.assetId}</span>
                  <button 
                    className="remove-btn"
                    onClick={() => toggleProphetSelection(id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!canCompare && (
          <div className="selection-hint">
            Select at least {MIN_PROPHETS} prophets to begin comparison
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="comparison-workspace">
        {/* Prophet Picker Sidebar */}
        <aside className="prophet-picker glass-surface">
          <div className="picker-header">
            <h2>Select Prophets</h2>
            <p>Choose up to {MAX_PROPHETS} prophets to compare</p>
          </div>

          {/* Filters */}
          <div className="picker-filters">
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Prophet name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <label>Asset</label>
              <select value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)}>
                <option value="all">All Assets</option>
                {getUniqueAssets().map(asset => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Prophet List */}
          <div className="prophet-list">
            {filteredProphets.length === 0 ? (
              <div className="no-results">
                No prophets found
              </div>
            ) : (
              filteredProphets.map(prophet => {
                const isSelected = selectedProphetIds.includes(prophet.prophetId);
                const canSelect = isSelected || selectedProphetIds.length < MAX_PROPHETS;

                return (
                  <button
                    key={prophet.prophetId}
                    className={`prophet-card ${isSelected ? 'selected' : ''} ${!canSelect ? 'disabled' : ''}`}
                    onClick={() => canSelect && toggleProphetSelection(prophet.prophetId)}
                    disabled={!canSelect}
                  >
                    <div className="prophet-info">
                      <span className="prophet-name">{prophet.prophetName}</span>
                      <span className="prophet-asset">{prophet.assetId}</span>
                    </div>
                    {isSelected && (
                      <div className="selected-indicator">
                        <Activity size={16} />
                      </div>
                    )}
                    {!isSelected && canSelect && (
                      <div className="add-indicator">
                        <Plus size={16} />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Comparison Display */}
        <main className="comparison-display">
          {!canCompare ? (
            <div className="comparison-placeholder glass-surface">
              <GitCompare size={64} className="placeholder-icon" />
              <h3>No Comparison Yet</h3>
              <p>Select at least {MIN_PROPHETS} prophets from the list to begin comparing their performance.</p>
            </div>
          ) : loadingMetrics ? (
            <div className="loading-state">Loading metrics...</div>
          ) : (
            <>
              {/* Time Window Selector */}
              <div className="window-selector glass-surface">
                <label>Time Window:</label>
                <div className="window-buttons">
                  {['20-day', '60-day', '120-day', '240-day'].map(window => (
                    <button
                      key={window}
                      className={`window-btn ${aggregationWindow === window ? 'active' : ''}`}
                      onClick={() => setAggregationWindow(window)}
                    >
                      {window}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comparison Grid */}
              <div className="comparison-grid">
                {selectedProphetsData.map(({ prophet, summaries }) => {
                  const summary = getSummaryForWindow(summaries);
                  const mape = summary?.mape;
                  const accuracy = mape !== undefined ? (100 - mape) : undefined;
                  const directional = summary?.directionalAccuracy;
                  const rating = getPerformanceRating(mape);

                  return (
                    <div key={prophet.prophetId} className="prophet-comparison-card glass-surface">
                      {/* Card Header */}
                      <div className="card-header">
                        <div className="prophet-title">
                          <h3>{prophet.prophetName}</h3>
                          <span className="asset-badge">{prophet.assetId}</span>
                        </div>
                        <span className={`performance-badge ${rating.className}`}>
                          {rating.label}
                        </span>
                      </div>

                      {/* Metrics Grid */}
                      <div className="metrics-grid">
                        <div className="metric-card">
                          <div className="metric-icon mape-icon">
                            <Target size={24} />
                          </div>
                          <div className="metric-content">
                            <span className="metric-label">MAPE</span>
                            <span className="metric-value">
                              {mape !== undefined ? `${mape.toFixed(2)}%` : 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="metric-card">
                          <div className="metric-icon accuracy-icon">
                            <Award size={24} />
                          </div>
                          <div className="metric-content">
                            <span className="metric-label">Accuracy</span>
                            <span className="metric-value">
                              {accuracy !== undefined ? `${accuracy.toFixed(1)}%` : 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="metric-card">
                          <div className="metric-icon directional-icon">
                            <TrendingUp size={24} />
                          </div>
                          <div className="metric-content">
                            <span className="metric-label">Directional</span>
                            <span className="metric-value">
                              {directional !== undefined ? `${directional.toFixed(1)}%` : 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="metric-card">
                          <div className="metric-icon status-icon">
                            <Activity size={24} />
                          </div>
                          <div className="metric-content">
                            <span className="metric-label">Status</span>
                            <span className={`status-value ${prophet.status}`}>
                              {prophet.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* View Details Link */}
                      <button 
                        className="view-details-btn"
                        onClick={() => navigate(`/prophets/${prophet.prophetId}`)}
                      >
                        View Full Details →
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Performance Trend Charts */}
              {chartData && (
                <div className="performance-charts">
                  <div className="chart-section glass-surface">
                    <h3>MAPE Across Time Windows</h3>
                    <p className="chart-description">
                      Compare prediction error (MAPE) across different aggregation periods. Lower is better.
                    </p>
                    <Plot
                      data={chartData.map(d => d.mape)}
                      layout={{
                        autosize: true,
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'transparent',
                        font: { color: '#e5e7eb', family: 'Inter, system-ui, sans-serif' },
                        xaxis: {
                          title: { text: 'Time Window' },
                          gridcolor: 'rgba(255, 255, 255, 0.1)',
                          zeroline: false
                        },
                        yaxis: {
                          title: { text: 'MAPE (%)' },
                          gridcolor: 'rgba(255, 255, 255, 0.1)',
                          zeroline: false
                        },
                        legend: {
                          orientation: 'h',
                          y: -0.2
                        },
                        margin: { t: 20, r: 20, b: 80, l: 60 },
                        hovermode: 'closest'
                      }}
                      config={{
                        displayModeBar: false,
                        responsive: true
                      }}
                      style={{ width: '100%', height: '400px' }}
                    />
                  </div>

                  <div className="chart-section glass-surface">
                    <h3>Directional Accuracy Across Time Windows</h3>
                    <p className="chart-description">
                      Compare how often prophets correctly predict market direction. Higher is better.
                    </p>
                    <Plot
                      data={chartData.map(d => d.directional)}
                      layout={{
                        autosize: true,
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'transparent',
                        font: { color: '#e5e7eb', family: 'Inter, system-ui, sans-serif' },
                        xaxis: {
                          title: { text: 'Time Window' },
                          gridcolor: 'rgba(255, 255, 255, 0.1)',
                          zeroline: false
                        },
                        yaxis: {
                          title: { text: 'Directional Accuracy (%)' },
                          gridcolor: 'rgba(255, 255, 255, 0.1)',
                          zeroline: false,
                          range: [0, 100]
                        },
                        legend: {
                          orientation: 'h',
                          y: -0.2
                        },
                        margin: { t: 20, r: 20, b: 80, l: 60 },
                        hovermode: 'closest'
                      }}
                      config={{
                        displayModeBar: false,
                        responsive: true
                      }}
                      style={{ width: '100%', height: '400px' }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
