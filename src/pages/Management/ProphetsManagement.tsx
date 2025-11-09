import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit2, Trash2, Plus } from 'lucide-react';
import { getAllProphets, deleteProphet } from '../../services/prophet';
import type { Prophet } from '../../types/prophet';
import './Management.css';

export default function ProphetsManagement() {
  const navigate = useNavigate();
  const [prophets, setProphets] = useState<Prophet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadProphets();
  }, []);

  const loadProphets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllProphets();
      setProphets(data);
    } catch (err) {
      console.error('Error loading prophets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prophets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (prophetId: string, prophetName: string) => {
    if (!confirm(`Are you sure you want to delete "${prophetName}"?`)) return;
    
    try {
      await deleteProphet(prophetId);
      await loadProphets();
    } catch (err) {
      console.error('Error deleting prophet:', err);
      alert('Failed to delete prophet');
    }
  };

  const filteredProphets = prophets.filter(prophet => {
    if (statusFilter !== 'all' && prophet.status !== statusFilter) return false;
    if (searchTerm && !prophet.prophetName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="management-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading prophets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="management-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <button onClick={() => navigate('/admin')} className="back-button">
            ← Back to Admin
          </button>
          <h1>Prophets Management</h1>
          <p className="subtitle">Manage forecasting prophets and ensemble configurations</p>
        </div>
        <button onClick={() => navigate('/mgmt/prophets/new')} className="action-button">
          <Plus size={20} />
          New Prophet
        </button>
      </div>

      {error && (
        <div className="error">{error}</div>
      )}

      {/* Controls */}
      <div className="controls">
        <input
          type="text"
          placeholder="Search prophets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending_training">Pending Training</option>
          <option value="inactive">Inactive</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        Showing {filteredProphets.length} of {prophets.length} prophets
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Prophet Name</th>
              <th>Asset</th>
              <th>Status</th>
              <th>Model Fits</th>
              <th>Ensemble</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProphets.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  <h3>No prophets found</h3>
                  <p>Try adjusting your search or filters</p>
                </td>
              </tr>
            ) : (
              filteredProphets.map((prophet) => (
                <tr key={prophet.prophetId}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{prophet.prophetName}</div>
                    {prophet.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {prophet.description.substring(0, 50)}{prophet.description.length > 50 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="monospace">{prophet.assetId}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${prophet.status}`}>
                      {prophet.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{prophet.modelFitIds?.length || 0}</td>
                  <td>{prophet.ensembleMethod || 'single'}</td>
                  <td>{new Date(prophet.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => navigate(`/prophets/${prophet.prophetId}`)}
                        className="icon-button"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/mgmt/prophets/${prophet.prophetId}/edit`)}
                        className="icon-button"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(prophet.prophetId, prophet.prophetName)}
                        className="icon-button delete"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
