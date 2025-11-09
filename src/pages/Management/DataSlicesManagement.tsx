import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { getAllDataSlices } from '../../services/dataSlice';
import DataSliceFormModal from '../../components/modals/DataSliceFormModal';
import type { DataSlice } from '../../types/dataSlice';
import './Management.css';

export default function DataSlicesManagement() {
  const navigate = useNavigate();
  const [dataSlices, setDataSlices] = useState<DataSlice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [datasetFilter, setDatasetFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSlice, setEditingSlice] = useState<DataSlice | null>(null);

  useEffect(() => {
    loadDataSlices();
  }, []);

  const loadDataSlices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllDataSlices();
      setDataSlices(data);
    } catch (err) {
      console.error('Error loading data slices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data slices');
    } finally {
      setLoading(false);
    }
  };

  const handleModalSuccess = () => {
    setShowCreateModal(false);
    setEditingSlice(null);
    loadDataSlices();
  };

  const filteredSlices = dataSlices.filter(slice => {
    if (typeFilter !== 'all' && slice.sliceType !== typeFilter) return false;
    
    // Handle both new schema (datasetId) and legacy schema (assetId)
    const sliceDatasetOrAsset = slice.datasetId || slice.assetId || '';
    if (datasetFilter !== 'all' && sliceDatasetOrAsset !== datasetFilter) return false;
    
    if (searchTerm && !slice.dataSliceId.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Get unique datasets/assets for filter (handle both schemas)
  const uniqueDatasets = [...new Set(dataSlices.map(s => s.datasetId || s.assetId || 'unknown'))].sort();

  if (loading) {
    return (
      <div className="management-page">
        <div className="page-header">
          <div className="header-content">
            <h1>Data Slices Management</h1>
          </div>
        </div>
        <div className="loading">Loading data slices...</div>
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
          <h1>Data Slices Management</h1>
          <p className="subtitle">View and manage time-windowed data slices for training</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="action-button">
          <Plus size={20} />
          New Data Slice
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
            placeholder="Search by slice ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Dataset/Asset:</label>
          <select value={datasetFilter} onChange={(e) => setDatasetFilter(e.target.value)}>
            <option value="all">All</option>
            {uniqueDatasets.map(datasetId => (
              <option key={datasetId} value={datasetId}>{datasetId}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Type:</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="simple">Simple</option>
            <option value="compound">Compound</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Showing {filteredSlices.length} of {dataSlices.length} slices
        </div>
      </div>

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Showing {filteredSlices.length} of {dataSlices.length} data slices
        </div>

      {/* Data Table */}
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Slice ID</th>
              <th>Dataset/Asset</th>
              <th>Type</th>
              <th>Date Range</th>
              <th>Columns</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSlices.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  {searchTerm || datasetFilter !== 'all' || typeFilter !== 'all'
                    ? 'No data slices match your filters'
                    : 'No data slices found'}
                </td>
              </tr>
            ) : (
              filteredSlices.map((slice) => (
                <tr key={slice.dataSliceId}>
                  <td>
                    <span className="monospace">{slice.dataSliceId}</span>
                  </td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const datasetOrAsset = slice.datasetId || slice.assetId;
                        if (datasetOrAsset) setDatasetFilter(datasetOrAsset);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary-color)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0
                      }}
                    >
                      {slice.datasetId || slice.assetId || 'N/A'}
                    </button>
                  </td>
                  <td>
                    <span className="badge" style={{
                      background: (slice.sliceType === 'simple' || !slice.sliceType) ? 'var(--success-bg)' : 'var(--warning-bg)',
                      color: (slice.sliceType === 'simple' || !slice.sliceType) ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {slice.sliceType || 'simple'}
                    </span>
                  </td>
                  <td>
                    {slice.startDate} to {slice.endDate}
                  </td>
                  <td>
                    {slice.availableColumns?.length || 'N/A'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => navigate(`/mgmt/data/slices/${slice.dataSliceId}`)}
                        className="icon-button"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setEditingSlice(slice)}
                        className="icon-button"
                        title="Edit"
                      >
                        <Edit2 size={16} />
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
      <div className="summary-stats">
        <div className="stat-item">
          <span className="stat-label">Total Slices:</span>
          <span className="stat-value">{dataSlices.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Simple:</span>
          <span className="stat-value">{dataSlices.filter(s => s.sliceType === 'simple').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Compound:</span>
          <span className="stat-value">{dataSlices.filter(s => s.sliceType === 'compound').length}</span>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <DataSliceFormModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
      
      {editingSlice && (
        <DataSliceFormModal
          mode="edit"
          dataSlice={editingSlice}
          onClose={() => setEditingSlice(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
