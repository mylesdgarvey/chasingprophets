/**
 * Data Slice Detail Page
 * View individual data slice with metadata and related entities
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Layers, Database, Calendar, Box, BarChart2 } from 'lucide-react';
import { getDataSlice } from '../../services/dataSlice';
import { getDataset } from '../../services/dataset';
import { getAllModelFits } from '../../services/modelFit';
import { Breadcrumb } from '../../components/Breadcrumb';
import type { DataSlice } from '../../types/dataSlice';
import type { Dataset } from '../../types/dataset';
import type { ModelFit } from '../../types/modelFit';
import './Management.css';

export default function DataSliceDetail() {
  const { sliceId } = useParams<{ sliceId: string }>();
  const navigate = useNavigate();
  const [slice, setSlice] = useState<DataSlice | null>(null);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [modelFits, setModelFits] = useState<ModelFit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sliceId) {
      loadSliceData();
    }
  }, [sliceId]);

  const loadSliceData = async () => {
    if (!sliceId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load slice
      const sliceData = await getDataSlice(sliceId);
      if (!sliceData) {
        throw new Error('Data slice not found');
      }
      setSlice(sliceData);
      
      // Load parent dataset
      const datasetId = sliceData.datasetId || sliceData.assetId;
      if (datasetId) {
        try {
          const datasetData = await getDataset(datasetId);
          setDataset(datasetData);
        } catch (err) {
          console.warn('Could not load parent dataset:', err);
        }
      }
      
      // Load model fits using this slice
      const allFits = await getAllModelFits();
      const sliceFits = allFits.filter(f => f.dataSliceId === sliceId);
      setModelFits(sliceFits);
    } catch (err) {
      console.error('Error loading slice:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data slice');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="management-page">
        <div className="loading">Loading data slice details...</div>
      </div>
    );
  }

  if (error || !slice) {
    return (
      <div className="management-page">
        <div className="error">{error || 'Data slice not found'}</div>
        <button onClick={() => navigate('/mgmt/data/slices')} className="action-button">
          ← Back to Data Slices
        </button>
      </div>
    );
  }

  const sliceType = slice.sliceType || 'simple';
  const windowDays = slice.windowDays || 
    Math.ceil((new Date(slice.endDate).getTime() - new Date(slice.startDate).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="management-page">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Admin', path: '/mgmt' },
        { label: 'Data Slices', path: '/mgmt/data/slices' },
        { label: slice.dataSliceId }
      ]} />

      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <button onClick={() => navigate('/mgmt/data/slices')} className="back-button">
            <ArrowLeft size={18} />
            Back to Data Slices
          </button>
          <h1>{slice.dataSliceId}</h1>
          <p className="subtitle">{slice.description || 'Data slice for model training'}</p>
        </div>
        <button onClick={() => {/* TODO: Open edit modal */}} className="action-button">
          <Edit2 size={18} />
          Edit Slice
        </button>
      </div>

      {/* Slice Metadata */}
      <div className="info-cards">
        <div className="info-card">
          <div className="info-card-header">
            <Layers size={20} />
            <h3>Slice Information</h3>
          </div>
          <div className="info-card-body">
            <div className="detail-row">
              <span className="detail-label">Slice ID:</span>
              <span className="detail-value"><code>{slice.dataSliceId}</code></span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Type:</span>
              <span className="detail-value">
                <span className={`badge ${sliceType === 'compound' ? 'badge-warning' : 'badge-info'}`}>
                  {sliceType}
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date Range:</span>
              <span className="detail-value">
                <Calendar size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                {slice.startDate} → {slice.endDate}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Window:</span>
              <span className="detail-value">{windowDays} days</span>
            </div>
            {slice.recordCount && (
              <div className="detail-row">
                <span className="detail-label">Records:</span>
                <span className="detail-value">{slice.recordCount.toLocaleString()}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Created:</span>
              <span className="detail-value">
                {new Date(slice.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Parent Dataset */}
        {dataset && (
          <div className="info-card">
            <div className="info-card-header">
              <Database size={20} />
              <h3>Parent Dataset</h3>
            </div>
            <div className="info-card-body">
              <div className="detail-row">
                <span className="detail-label">Dataset:</span>
                <span className="detail-value"><code>{dataset.datasetId}</code></span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{dataset.name || '—'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Asset:</span>
                <span className="detail-value">{dataset.assetId}</span>
              </div>
              <button
                onClick={() => navigate(`/mgmt/datasets/${dataset.datasetId}`)}
                className="action-button"
                style={{ marginTop: '1rem', width: '100%' }}
              >
                View Dataset Details
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Schema Information */}
      {slice.availableColumns && slice.availableColumns.length > 0 && (
        <div className="info-card" style={{ marginTop: '1.5rem' }}>
          <div className="info-card-header">
            <BarChart2 size={20} />
            <h3>Schema ({slice.availableColumns.length} columns)</h3>
          </div>
          <div className="info-card-body">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Type</th>
                    <th>Range</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.availableColumns.map(col => {
                    const type = slice.columnTypes?.[col] || 'unknown';
                    const range = slice.columnRanges?.[col];
                    return (
                      <tr key={col}>
                        <td><code>{col}</code></td>
                        <td>
                          <span className="badge badge-info">{type}</span>
                        </td>
                        <td>
                          {range ? (
                            `${range.min.toFixed(2)} — ${range.max.toFixed(2)}`
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Compound Slice Composition */}
      {sliceType === 'compound' && slice.baseSliceIds && slice.baseSliceIds.length > 0 && (
        <div className="info-card" style={{ marginTop: '1.5rem' }}>
          <div className="info-card-header">
            <Layers size={20} />
            <h3>Base Slices ({slice.baseSliceIds.length})</h3>
          </div>
          <div className="info-card-body">
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              This compound slice is composed of the following simple slices:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {slice.baseSliceIds.map(baseId => (
                <div 
                  key={baseId}
                  style={{
                    padding: '0.75rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <code>{baseId}</code>
                  <button
                    onClick={() => navigate(`/mgmt/data/slices/${baseId}`)}
                    style={{ marginLeft: '1rem', fontSize: '0.875rem' }}
                    className="text-button"
                  >
                    View →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Model Fits Using This Slice */}
      <div className="info-card" style={{ marginTop: '1.5rem' }}>
        <div className="info-card-header">
          <Box size={20} />
          <h3>Model Fits Using This Slice ({modelFits.length})</h3>
        </div>
        <div className="info-card-body">
          {modelFits.length === 0 ? (
            <div className="empty-state">
              <p>No model fits have been trained using this data slice.</p>
              <button 
                onClick={() => navigate('/mgmt/models/fits')} 
                className="action-button"
                style={{ marginTop: '1rem' }}
              >
                Train Model
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Model Fit ID</th>
                    <th>Scaffold</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {modelFits.map(fit => (
                    <tr key={fit.modelFitId}>
                      <td><code>{fit.modelFitId}</code></td>
                      <td><code>{fit.scaffoldId}</code></td>
                      <td>
                        <span className={`badge ${
                          fit.trainingStatus === 'fit' ? 'badge-success' :
                          fit.trainingStatus === 'fitting' ? 'badge-info' :
                          fit.trainingStatus === 'failed' ? 'badge-error' :
                          'badge-warning'
                        }`}>
                          {fit.trainingStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => navigate(`/mgmt/models/fits/${fit.modelFitId}`)}
                          className="icon-button"
                          title="View Fit"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
