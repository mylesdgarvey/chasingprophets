/**
 * Datasets Management
 * Full CRUD for datasets
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit2, Trash2, Plus, Search, Database } from 'lucide-react';
import { getAllDatasets, deleteDataset } from '../../services/dataset';
import { EntityBadge } from '../../components/common/EntityBadge';
import DatasetFormModal from '../../components/modals/DatasetFormModal';
import type { Dataset } from '../../types/dataset';
import './Management.css';

export default function DatasetsManagement() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllDatasets();
      setDatasets(data);
    } catch (err) {
      console.error('Error loading datasets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (datasetId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete dataset "${name}"?\n\nThis will affect data slices and models using this dataset.`)) {
      return;
    }
    
    try {
      await deleteDataset(datasetId);
      await loadDatasets();
    } catch (err) {
      console.error('Error deleting dataset:', err);
      alert('Failed to delete dataset: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleModalSuccess = () => {
    setShowCreateModal(false);
    setEditingDataset(null);
    loadDatasets();
  };

  const filteredDatasets = datasets.filter(dataset => {
    if (assetFilter !== 'all' && dataset.assetId !== assetFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        dataset.datasetId.toLowerCase().includes(search) ||
        dataset.name?.toLowerCase().includes(search) ||
        dataset.assetId.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Get unique assets for filter
  const uniqueAssets = [...new Set(datasets.map(d => d.assetId))].sort();

  if (loading) {
    return (
      <div className="management-page">
        <div className="page-header">
          <div className="header-content">
            <h1>Datasets Management</h1>
          </div>
        </div>
        <div className="loading">Loading datasets...</div>
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
          <h1>Datasets Management</h1>
          <p className="subtitle">Manage asset data collections and sources</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="action-button">
          <Plus size={20} />
          New Dataset
        </button>
      </div>

      {error && (
        <div className="error">{error}</div>
      )}

      {/* Search and Filters */}
      <div className="search-filter-section">
        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Asset:</label>
          <select value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)}>
            <option value="all">All Assets</option>
            {uniqueAssets.map(assetId => (
              <option key={assetId} value={assetId}>{assetId}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Showing {filteredDatasets.length} of {datasets.length} datasets
        </div>
      </div>

      {/* Data Table */}
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Dataset ID</th>
              <th>Name</th>
              <th>Asset</th>
              <th>Source</th>
              <th>Records</th>
              <th>Date Range</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDatasets.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  {searchTerm || assetFilter !== 'all' 
                    ? 'No datasets match your filters' 
                    : 'No datasets found'}
                </td>
              </tr>
            ) : (
              filteredDatasets.map(dataset => (
                <tr key={dataset.datasetId}>
                  <td>
                    <EntityBadge
                      type="dataset"
                      id={dataset.datasetId}
                      label={dataset.datasetId}
                      size="small"
                    />
                  </td>
                  <td>{dataset.name}</td>
                  <td>
                    <EntityBadge
                      type="asset"
                      id={dataset.assetId}
                      label={dataset.assetId}
                      size="small"
                    />
                  </td>
                  <td>
                    <div style={{ 
                      maxWidth: '300px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      fontSize: '0.85em',
                      color: 'var(--text-secondary)'
                    }}>
                      {dataset.source}
                    </div>
                  </td>
                  <td>
                    {dataset.recordCount ? dataset.recordCount.toLocaleString() : '—'}
                  </td>
                  <td style={{ fontSize: '0.85em' }}>
                    {dataset.dateRange ? (
                      <div>
                        <div>{dataset.dateRange.start}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>to {dataset.dateRange.end}</div>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                    {new Date(dataset.lastUpdated).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="icon-button"
                        onClick={() => navigate(`/mgmt/datasets/${dataset.datasetId}`)}
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="icon-button"
                        onClick={() => setEditingDataset(dataset)}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="icon-button delete"
                        onClick={() => handleDelete(dataset.datasetId, dataset.name)}
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

      {/* Summary Stats */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        display: 'flex',
        gap: '2rem',
        fontSize: '0.875rem'
      }}>
        <div>
          <Database size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          <strong>{datasets.length}</strong> total datasets
        </div>
        <div>
          <strong>{uniqueAssets.length}</strong> unique assets
        </div>
        <div>
          <strong>{datasets.reduce((sum, d) => sum + (d.recordCount || 0), 0).toLocaleString()}</strong> total records
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <DatasetFormModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
      
      {editingDataset && (
        <DatasetFormModal
          mode="edit"
          dataset={editingDataset}
          onClose={() => setEditingDataset(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
