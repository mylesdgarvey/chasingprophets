import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, BarChart2 } from 'lucide-react';
import { getAllProphets } from '../../services/prophet';
import { Prophet } from '../../types/prophet';
import '../ProphetsList.css';

export default function ProphetsList() {
  const navigate = useNavigate();
  const [prophets, setProphets] = useState<Prophet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProphets();
  }, []);

  const loadProphets = async () => {
    try {
      setLoading(true);
      const prophetsData = await getAllProphets();
      prophetsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setProphets(prophetsData);
    } catch (error) {
      console.error('Error loading prophets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProphets = prophets.filter(p => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'active' ? p.status === 'active' :
      p.status !== 'active';
    
    const matchesSearch = search.trim() === '' || 
      p.prophetName.toLowerCase().includes(search.toLowerCase()) ||
      p.prophetId.toLowerCase().includes(search.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: prophets.length,
    active: prophets.filter(p => p.status === 'active').length,
    inactive: prophets.filter(p => p.status !== 'active').length
  };

  if (loading) {
    return <div className="loading">Loading prophets...</div>;
  }

  return (
    <div className="prophets-screen">
      {/* Hero Section */}
      <div className="prophets-hero">
        <div>
          <h1>Prophets</h1>
          <p>
            Your AI-powered market forecasters. Each prophet combines trained models 
            with prediction algorithms to generate live market forecasts.
          </p>
          <div className="hero-actions">
            <button 
              className="leaderboard-link-btn"
              onClick={() => navigate('/prophets/leaderboard')}
            >
              <Award className="trophy-icon" size={18} />
              View Leaderboard
            </button>
            <button 
              className="compare-link-btn"
              onClick={() => navigate('/prophets/compare')}
            >
              <BarChart2 className="compare-icon" size={18} />
              Compare Prophets
            </button>
          </div>
        </div>
        
        <div className="hero-stats-card">
          <div className="stat-row">
            <span className="stat-label">Total Prophets</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Active</span>
            <span className="stat-value active">{stats.active}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Inactive</span>
            <span className="stat-value inactive">{stats.inactive}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="prophets-workspace">
        {/* Left Panel - Filters & Controls */}
        <div className="prophets-panel">
          <div className="panel-header">
            <div>
              <h2>Filters</h2>
              <p>Refine your prophet list</p>
            </div>
          </div>
          
          <div className="panel-body">
            {/* Search */}
            <div className="control-group">
              <label className="control-label">Search</label>
              <input
                type="text"
                className="search-input"
                placeholder="Search by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="control-group">
              <label className="control-label">Status</label>
              <div className="filter-grid">
                <button
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  <span className="filter-count">{stats.total}</span>
                  <span className="filter-label">All</span>
                </button>
                <button
                  className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                  onClick={() => setFilter('active')}
                >
                  <span className="filter-count">{stats.active}</span>
                  <span className="filter-label">Active</span>
                </button>
                <button
                  className={`filter-btn ${filter === 'inactive' ? 'active' : ''}`}
                  onClick={() => setFilter('inactive')}
                >
                  <span className="filter-count">{stats.inactive}</span>
                  <span className="filter-label">Inactive</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Prophets Grid */}
        <div className="prophets-panel">
          <div className="panel-header">
            <div>
              <h2>Your Prophets</h2>
              <p>
                {filteredProphets.length} prophet{filteredProphets.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
          
          <div className="panel-body scrollable">
            {filteredProphets.length === 0 ? (
              <div className="empty-state">
                <p>No prophets match your filters</p>
              </div>
            ) : (
              <div className="prophets-grid refined">
                {filteredProphets.map(prophet => (
                  <div
                    key={prophet.prophetId}
                    className="prophet-card refined"
                    onClick={() => navigate(`/prophets/${prophet.prophetId}`)}
                  >
                    <div className="prophet-card-header">
                      <div>
                        <h3 className="prophet-name">{prophet.prophetName}</h3>
                        <p className="prophet-asset">{prophet.assetId}</p>
                      </div>
                      <span className={`status-badge ${prophet.status}`}>
                        {prophet.status}
                      </span>
                    </div>
                    
                    <div className="prophet-card-body">
                      <div className="stat">
                        <span className="stat-label">Model Fits</span>
                        <span className="stat-value">{prophet.modelFitIds?.length || 0}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Target</span>
                        <span className="stat-value">{prophet.targetProperty}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Ensemble</span>
                        <span className="stat-value">{prophet.ensembleMethod}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Forecast</span>
                        <span className="stat-value">{prophet.forecastMethod}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
