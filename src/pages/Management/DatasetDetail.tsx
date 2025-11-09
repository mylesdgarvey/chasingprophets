/**
 * Dataset Detail Page
 * View and edit a specific dataset
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Database, Calendar, BarChart2, FileText } from 'lucide-react';
import { getDataset, deleteDataset } from '../../services/dataset';
import { getAllDataSlices } from '../../services/dataSlice';
import { getAssetPrices } from '../../services/assets';
import type { Dataset } from '../../types/dataset';
import type { DataSlice } from '../../types/dataSlice';
import { DatasetVisualizations } from '../../components/DatasetVisualizations';
import DatasetFormModal from '../../components/modals/DatasetFormModal';
import DataSliceFormModal from '../../components/modals/DataSliceFormModal';
import './Management.css';

export default function DatasetDetail() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [relatedSlices, setRelatedSlices] = useState<DataSlice[]>([]);
  const [datasetData, setDatasetData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSliceModalOpen, setIsSliceModalOpen] = useState(false);

  useEffect(() => {
    if (datasetId) {
      loadDataset();
    }
  }, [datasetId]);

  const loadDataset = async () => {
    if (!datasetId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load dataset
      const data = await getDataset(datasetId);
      if (!data) {
        setError('Dataset not found');
        return;
      }
      setDataset(data);

      // Load related data slices
      const allSlices = await getAllDataSlices();
      const filtered = allSlices.filter(s => s.datasetId === datasetId);
      setRelatedSlices(filtered);

      // Load actual dataset data if it's a table type
      if (data.datasetType === 'table' || !data.datasetType) {
        loadDatasetData(data);
      }
      
    } catch (err) {
      console.error('Error loading dataset:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dataset');
    } finally {
      setLoading(false);
    }
  };

  const loadDatasetData = async (dataset: Dataset) => {
    try {
      setLoadingData(true);
      
      // Try to load from asset prices (for now, we'll use this as sample data)
      // In the future, this should load from the actual source specified in dataset.source
      const assetData = await getAssetPrices(dataset.assetId);
      if (assetData && assetData.length > 0) {
        // Limit to reasonable size for analysis (e.g., last 1000 records)
        setDatasetData(assetData.slice(-1000));
      }
    } catch (err) {
      console.error('Error loading dataset data:', err);
      // Don't set error here - data visualization is optional
    } finally {
      setLoadingData(false);
    }
  };

  const handleDelete = async () => {
    if (!dataset) return;
    
    const confirmMessage = relatedSlices.length > 0
      ? `This dataset has ${relatedSlices.length} related data slices. Are you sure you want to delete it?`
      : `Are you sure you want to delete dataset "${dataset.name}"?`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      await deleteDataset(dataset.datasetId);
      navigate('/mgmt/datasets');
    } catch (err) {
      console.error('Error deleting dataset:', err);
      alert('Failed to delete dataset: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="management-page">
        <div className="loading">Loading dataset...</div>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="management-page">
        <div className="error">{error || 'Dataset not found'}</div>
        <button onClick={() => navigate('/mgmt/datasets')} className="back-button">
          ← Back to Datasets
        </button>
      </div>
    );
  }

  return (
    <div className="management-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <button onClick={() => navigate('/mgmt/datasets')} className="back-button">
            <ArrowLeft size={16} />
            Back to Datasets
          </button>
          <h1>{dataset.name}</h1>
          <p className="subtitle">{dataset.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setIsEditModalOpen(true)} 
            className="action-button"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            <Edit2 size={20} />
            Edit Dataset
          </button>
          <button 
            onClick={handleDelete} 
            className="action-button"
            style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
          >
            <Trash2 size={20} />
            Delete
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="info-card">
          <div className="info-card-header">
            <Database size={20} />
            <h3>Dataset Info</h3>
          </div>
          <div className="info-card-body">
            <div className="info-row">
              <span className="info-label">Dataset ID:</span>
              <span className="info-value monospace">{dataset.datasetId}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Asset:</span>
              <span className="info-value">{dataset.assetId}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Source:</span>
              <span className="info-value" style={{ fontSize: '0.85em', wordBreak: 'break-all' }}>
                {dataset.source}
              </span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <BarChart2 size={20} />
            <h3>Data Statistics</h3>
          </div>
          <div className="info-card-body">
            <div className="info-row">
              <span className="info-label">Record Count:</span>
              <span className="info-value">{dataset.recordCount?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Related Slices:</span>
              <span className="info-value">{relatedSlices.length}</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <Calendar size={20} />
            <h3>Date Range</h3>
          </div>
          <div className="info-card-body">
            <div className="info-row">
              <span className="info-label">Start Date:</span>
              <span className="info-value">{dataset.dateRange?.start || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">End Date:</span>
              <span className="info-value">{dataset.dateRange?.end || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Last Updated:</span>
              <span className="info-value">
                {new Date(dataset.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Analysis & Visualizations - Only for table datasets */}
      {(dataset.datasetType === 'table' || !dataset.datasetType) && (
        <div className="section">
          <h2 style={{ marginBottom: '1rem' }}>Data Analysis</h2>
          {datasetData ? (
            <DatasetVisualizations data={datasetData} loading={loadingData} />
          ) : loadingData ? (
            <div className="loading">Loading dataset for analysis...</div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Dataset analysis not available</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Unable to load data from source: {dataset.source}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Related Data Slices */}
      <div className="section">
        <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={24} />
          Related Data Slices ({relatedSlices.length})
        </h2>
        
        {relatedSlices.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
            <p>No data slices found for this dataset</p>
            <button 
              onClick={() => setIsSliceModalOpen(true)} 
              className="action-button"
              style={{ marginTop: '1rem' }}
            >
              Create Data Slice
            </button>
          </div>
        ) : (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Slice ID</th>
                  <th>Type</th>
                  <th>Date Range</th>
                  <th>Columns</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {relatedSlices.map(slice => (
                  <tr key={slice.dataSliceId}>
                    <td>
                      <span className="monospace">{slice.dataSliceId}</span>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: slice.sliceType === 'simple' ? 'var(--success-bg)' : 'var(--warning-bg)',
                        color: slice.sliceType === 'simple' ? 'var(--success)' : 'var(--warning)'
                      }}>
                        {slice.sliceType}
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
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {isEditModalOpen && dataset && (
        <DatasetFormModal
          mode="edit"
          dataset={dataset}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            loadDataset();
          }}
        />
      )}

      {isSliceModalOpen && dataset && (
        <DataSliceFormModal
          mode="create"
          dataSlice={undefined}
          onClose={() => setIsSliceModalOpen(false)}
          onSuccess={() => {
            setIsSliceModalOpen(false);
            loadDataset();
          }}
        />
      )}
    </div>
  );
}
