/**
 * Prophet Leaderboard Page
 * 
 * Displays ranked list of prophets by performance metrics
 * Features:
 * - Sortable table by MAPE, accuracy, directional accuracy
 * - Filter by asset, time window
 * - Performance badges and rankings
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, TrendingUp, TrendingDown, Award, Filter, ArrowUpDown } from 'lucide-react';
import { Prophet } from '../../types/prophet';
import { ProphetPerformanceSummary } from '../../types/performance';
import { getAllProphets } from '../../services/prophet';
import { getAllPerformanceSummaries } from '../../services/performance';
import { EntityBadge } from '../../components/common/EntityBadge';
import './ProphetLeaderboard.css';

type SortField = 'name' | 'asset' | 'mape' | 'r2' | 'directional' | 'status';
type SortOrder = 'asc' | 'desc';

interface ProphetWithMetrics extends Prophet {
  performanceSummary?: ProphetPerformanceSummary;
}

export function ProphetLeaderboard() {
  const navigate = useNavigate();
  const [prophets, setProphets] = useState<ProphetWithMetrics[]>([]);
  const [filteredProphets, setFilteredProphets] = useState<ProphetWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [aggregationWindow, setAggregationWindow] = useState<string>('20-day');
  const [showFilters, setShowFilters] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('mape');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    loadProphets();
  }, [aggregationWindow]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [prophets, assetFilter, statusFilter, sortField, sortOrder]);

  async function loadProphets() {
    try {
      setLoading(true);
      setError(null);
      
      // Load prophets and performance summaries in parallel
      const [prophetData, performanceData] = await Promise.all([
        getAllProphets(),
        getAllPerformanceSummaries(aggregationWindow)
      ]);
      
      // Create a map of prophetId -> performance summary
      const performanceMap = new Map<string, ProphetPerformanceSummary>();
      performanceData.forEach(perf => {
        performanceMap.set(perf.prophetId, perf);
      });

      // Merge prophets with their performance data
      const prophetsWithMetrics = prophetData.map(p => ({
        ...p,
        performanceSummary: performanceMap.get(p.prophetId)
      }));

      setProphets(prophetsWithMetrics);
    } catch (err) {
      console.error('Error loading prophets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prophets');
    } finally {
      setLoading(false);
    }
  }

  function applyFiltersAndSort() {
    let filtered = [...prophets];

    // Asset filter
    if (assetFilter !== 'all') {
      filtered = filtered.filter(p => p.assetId === assetFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'name':
          aVal = a.prophetName.toLowerCase();
          bVal = b.prophetName.toLowerCase();
          break;
        case 'asset':
          aVal = a.assetId.toLowerCase();
          bVal = b.assetId.toLowerCase();
          break;
        case 'mape':
          aVal = a.performanceSummary?.mape ?? Infinity;
          bVal = b.performanceSummary?.mape ?? Infinity;
          break;
        case 'r2':
          aVal = a.performanceSummary?.r2 ?? -Infinity;
          bVal = b.performanceSummary?.r2 ?? -Infinity;
          break;
        case 'directional':
          aVal = a.performanceSummary?.directionalAccuracy ?? -Infinity;
          bVal = b.performanceSummary?.directionalAccuracy ?? -Infinity;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProphets(filtered);
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'mape' ? 'asc' : 'desc'); // Lower MAPE is better
    }
  }

  function getRankBadge(rank: number) {
    if (rank === 1) return { icon: Trophy, color: '#fbbf24', label: '🥇 1st' };
    if (rank === 2) return { icon: Award, color: '#d1d5db', label: '🥈 2nd' };
    if (rank === 3) return { icon: Award, color: '#cd7f32', label: '🥉 3rd' };
    return { icon: Award, color: 'var(--text-secondary)', label: `#${rank}` };
  }

  function getPerformanceRating(mape?: number) {
    if (!mape) return { label: 'Unknown', className: 'unknown' };
    if (mape <= 10) return { label: 'Excellent', className: 'excellent' };
    if (mape <= 30) return { label: 'Good', className: 'good' };
    if (mape <= 50) return { label: 'Fair', className: 'fair' };
    return { label: 'Baseline', className: 'baseline' };
  }

  function getUniqueAssets(): string[] {
    return Array.from(new Set(prophets.map(p => p.assetId)));
  }

  if (loading) {
    return (
      <div className="prophet-leaderboard">
        <div className="loading-state">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prophet-leaderboard">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadProphets}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="prophet-leaderboard">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="title-with-icon">
            <Trophy size={36} className="trophy-icon" />
            <div>
              <h1>Prophet Leaderboard</h1>
              <p className="subtitle">
                Top performing prediction models ranked by accuracy and performance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Explanation */}
      <div className="info-banner glass-surface" style={{ 
        padding: '12px 20px', 
        marginBottom: '20px', 
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '8px'
      }}>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
          ℹ️ <strong>Note:</strong> Metrics shown here are estimated performance summaries for quick comparison. 
          Click any prophet to view <strong>real-time inference metrics</strong> calculated from actual predictions on historical data.
        </p>
      </div>

      {/* Filters */}
      <div className="filter-section glass-surface">
        <div className="filter-panel" style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="filter-group" style={{ minWidth: '180px' }}>
            <label><strong>Time Window</strong></label>
            <select value={aggregationWindow} onChange={(e) => setAggregationWindow(e.target.value)}>
              <option value="20-day">Most Recent 20 Days</option>
              <option value="60-day">Most Recent 60 Days</option>
              <option value="120-day">Most Recent 120 Days</option>
              <option value="240-day">Most Recent 240 Days</option>
            </select>
          </div>

          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            style={{ marginBottom: '4px' }}
          >
            <Filter size={18} />
            <span>More Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="filter-panel" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="filter-group">
              <label>Asset</label>
              <select value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)}>
                <option value="all">All Assets</option>
                {getUniqueAssets().map(asset => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending_training">Pending Training</option>
              </select>
            </div>

            <button 
              className="clear-filters"
              onClick={() => {
                setAssetFilter('all');
                setStatusFilter('active');
              }}
            >
              Clear Additional Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="results-info">
        <span>
          {filteredProphets.length} prophet{filteredProphets.length !== 1 ? 's' : ''}
          {filteredProphets.length !== prophets.length && ` (${prophets.length} total)`}
        </span>
      </div>

      {/* Leaderboard Table */}
      {filteredProphets.length === 0 ? (
        <div className="no-results glass-surface">
          <p>No prophets found matching your criteria.</p>
          <button onClick={() => {
            setAssetFilter('all');
            setStatusFilter('all');
          }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="leaderboard-table glass-surface">
          <table>
            <thead>
              <tr>
                <th className="rank-col">Rank</th>
                <th className="sortable" onClick={() => handleSort('name')}>
                  <div className="th-content">
                    Prophet Name
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort('asset')}>
                  <div className="th-content">
                    Asset
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort('mape')}>
                  <div className="th-content">
                    MAPE %
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort('r2')}>
                  <div className="th-content">
                    R²
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort('directional')}>
                  <div className="th-content">
                    Direction %
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th>RMSE</th>
                <th className="sortable" onClick={() => handleSort('status')}>
                  <div className="th-content">
                    Status
                    <ArrowUpDown size={14} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProphets.map((prophet, index) => {
                const rank = index + 1;
                const badge = getRankBadge(rank);
                const mape = prophet.performanceSummary?.mape;
                const r2 = prophet.performanceSummary?.r2;
                const rmse = prophet.performanceSummary?.rmse;
                const directional = prophet.performanceSummary?.directionalAccuracy;
                const BadgeIcon = badge.icon;

                return (
                  <tr 
                    key={prophet.prophetId}
                    className="prophet-row"
                    onClick={() => navigate(`/prophets/${prophet.prophetId}`)}
                  >
                    <td className="rank-cell">
                      <div className="rank-badge" style={{ color: badge.color }}>
                        <BadgeIcon size={20} />
                        <span>{badge.label}</span>
                      </div>
                    </td>
                    <td className="name-cell">
                      <EntityBadge
                        type="prophet"
                        id={prophet.prophetId}
                        label={prophet.prophetName}
                        size="medium"
                        clickable={false}
                      />
                    </td>
                    <td className="asset-cell">
                      <EntityBadge
                        type="asset"
                        id={prophet.assetId}
                        label={prophet.assetId}
                        size="small"
                      />
                    </td>
                    <td className="metric-cell">
                      {mape !== undefined ? `${mape.toFixed(2)}%` : 'N/A'}
                    </td>
                    <td className="metric-cell">
                      {r2 !== undefined ? r2.toFixed(4) : 'N/A'}
                    </td>
                    <td className="metric-cell">
                      {directional !== undefined ? (
                        <div className="directional">
                          {directional >= 50 ? (
                            <TrendingUp size={16} className="trending-up" />
                          ) : (
                            <TrendingDown size={16} className="trending-down" />
                          )}
                          <span>{directional.toFixed(1)}%</span>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="metric-cell">
                      {rmse !== undefined ? rmse.toFixed(2) : 'N/A'}
                    </td>
                    <td>
                      <span className={`status-badge ${prophet.status}`}>
                        {prophet.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
