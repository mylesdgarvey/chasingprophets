/**
 * Scaffolds List Page
 * 
 * Admin UI for browsing, filtering, and managing model scaffolds
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { ModelScaffold } from '../../types/modelScaffold';
import { getAllModelScaffolds } from '../../services/modelScaffold';
import './ScaffoldsList.css';

export function ScaffoldsList() {
  const navigate = useNavigate();
  const [scaffolds, setScaffolds] = useState<ModelScaffold[]>([]);
  const [filteredScaffolds, setFilteredScaffolds] = useState<ModelScaffold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterContextualized, setFilterContextualized] = useState<string>('all');
  const [filterInferenceMode, setFilterInferenceMode] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadScaffolds();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [scaffolds, searchTerm, filterType, filterContextualized, filterInferenceMode]);

  async function loadScaffolds() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllModelScaffolds();
      setScaffolds(data);
    } catch (err) {
      console.error('Error loading scaffolds:', err);
      setError(err instanceof Error ? err.message : 'Failed to load scaffolds');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...scaffolds];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(search) ||
        (s.description && s.description.toLowerCase().includes(search))
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(s => s.scaffoldType === filterType);
    }

    // Contextualized filter
    if (filterContextualized !== 'all') {
      const isContextualized = filterContextualized === 'true';
      filtered = filtered.filter(s => s.isContextualized === isContextualized);
    }

    // Inference mode filter
    if (filterInferenceMode !== 'all') {
      filtered = filtered.filter(s => s.inferenceMode === filterInferenceMode);
    }

    setFilteredScaffolds(filtered);
  }

  function getScaffoldTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'ML': 'Machine Learning',
      'DL': 'Deep Learning',
      'TS': 'Time Series',
      'statistical': 'Statistical'
    };
    return labels[type] || type;
  }

  if (loading) {
    return (
      <div className="scaffolds-list">
        <div className="loading-state">Loading scaffolds...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scaffolds-list">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadScaffolds}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="scaffolds-list">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <button onClick={() => navigate('/admin')} className="back-button">
            Back to Admin
          </button>
          <h1>Model Scaffolds</h1>
          <p className="subtitle">
            Manage reusable model templates with training and inference scripts
          </p>
        </div>
        <button 
          className="create-button primary-button"
          onClick={() => navigate('/mgmt/models/scaffolds/new')}
        >
          <Plus size={18} />
          <span>Create Scaffold</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-filter-section glass-surface">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search scaffolds by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          <span>Filters</span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel glass-surface">
          <div className="filter-group">
            <label>Model Type</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="ML">Machine Learning</option>
              <option value="DL">Deep Learning</option>
              <option value="TS">Time Series</option>
              <option value="statistical">Statistical</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Contextualized</label>
            <select 
              value={filterContextualized} 
              onChange={(e) => setFilterContextualized(e.target.value)}
            >
              <option value="all">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Inference Mode</label>
            <select 
              value={filterInferenceMode} 
              onChange={(e) => setFilterInferenceMode(e.target.value)}
            >
              <option value="all">All Modes</option>
              <option value="local">Local (Browser)</option>
              <option value="remote">Remote (Lambda)</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <button 
            className="clear-filters"
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterContextualized('all');
              setFilterInferenceMode('all');
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="results-info">
        <span>
          {filteredScaffolds.length} {filteredScaffolds.length === 1 ? 'scaffold' : 'scaffolds'}
          {filteredScaffolds.length !== scaffolds.length && ` (${scaffolds.length} total)`}
        </span>
      </div>

      {/* Scaffolds Grid */}
      {filteredScaffolds.length === 0 ? (
        <div className="no-results glass-surface">
          <p>No scaffolds found matching your criteria.</p>
          {(searchTerm || filterType !== 'all' || filterContextualized !== 'all' || filterInferenceMode !== 'all') && (
            <button onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterContextualized('all');
              setFilterInferenceMode('all');
            }}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="scaffolds-grid">
          {filteredScaffolds.map(scaffold => (
            <div 
              key={scaffold.scaffoldId} 
              className="scaffold-card glass-surface"
              onClick={() => navigate(`/mgmt/models/scaffolds/${scaffold.scaffoldId}/edit`)}
            >
              <div className="card-header">
                <h3>{scaffold.name}</h3>
                <div className="badges">
                  {scaffold.scaffoldType && (
                    <span className={`badge type-${scaffold.scaffoldType.toLowerCase()}`}>
                      {scaffold.scaffoldType}
                    </span>
                  )}
                  {scaffold.isContextualized && (
                    <span className="badge contextualized">
                      Contextualized
                    </span>
                  )}
                  {scaffold.inferenceMode && (
                    <span className={`badge inference-${scaffold.inferenceMode}`}>
                      {scaffold.inferenceMode}
                    </span>
                  )}
                </div>
              </div>

              {scaffold.description && (
                <p className="description">{scaffold.description}</p>
              )}

              <div className="card-meta">
                {scaffold.learningAlgorithm && (
                  <div className="meta-item">
                    <span className="label">Algorithm:</span>
                    <span className="value">{scaffold.learningAlgorithm}</span>
                  </div>
                )}
                {scaffold.modelCategory && (
                  <div className="meta-item">
                    <span className="label">Category:</span>
                    <span className="value">{scaffold.modelCategory}</span>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button 
                  className="edit-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/mgmt/models/scaffolds/${scaffold.scaffoldId}/edit`);
                  }}
                >
                  Edit
                </button>
                <button 
                  className="view-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/mgmt/models/scaffolds/${scaffold.scaffoldId}/edit`);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
