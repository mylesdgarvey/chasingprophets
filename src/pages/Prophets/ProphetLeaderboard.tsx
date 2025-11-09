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
import './ProphetLeaderboard.css';

type SortField = 'name' | 'asset' | 'mape' | 'accuracy' | 'directional' | 'status';
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
        case 'accuracy':
          // Calculate accuracy from MAPE: accuracy = 100 - MAPE
          aVal = a.performanceSummary?.mape ? (100 - a.performanceSummary.mape) : -Infinity;
          bVal = b.performanceSummary?.mape ? (100 - b.performanceSummary.mape) : -Infinity;
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

      {/* Filters */}
      <div className="filter-section glass-surface">
        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          <span>Filters</span>
        </button>

        {showFilters && (
          <div className="filter-panel">
            <div className="filter-group">
              <label>Time Window</label>
              <select value={aggregationWindow} onChange={(e) => setAggregationWindow(e.target.value)}>
                <option value="20-day">20 Days</option>
                <option value="60-day">60 Days</option>
                <option value="120-day">120 Days</option>
                <option value="240-day">240 Days</option>
              </select>
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
                setAggregationWindow('20-day');
              }}
            >
              Clear Filters
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
                    MAPE
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th>Accuracy</th>
                <th>Directional</th>
                <th>Performance</th>
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
                const accuracy = mape ? (100 - mape) : undefined;
                const directional = prophet.performanceSummary?.directionalAccuracy;
                const rating = getPerformanceRating(mape);
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
                      <div className="prophet-name">
                        {prophet.prophetName}
                      </div>
                    </td>
                    <td className="asset-cell">{prophet.assetId}</td>
                    <td className="metric-cell">
                      {mape !== undefined ? `${mape.toFixed(2)}%` : 'N/A'}
                    </td>
                    <td className="metric-cell">
                      {accuracy !== undefined ? `${accuracy.toFixed(1)}%` : 'N/A'}
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
                    <td>
                      <span className={`performance-badge ${rating.className}`}>
                        {rating.label}
                      </span>
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
