/**
 * Asset Detail Page
 * View individual asset with metadata and related datasets
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, TrendingUp, Database, Calendar } from 'lucide-react';
import { getAsset } from '../../services/assets';
import { getAllDatasets } from '../../services/dataset';
import { Breadcrumb } from '../../components/Breadcrumb';
import type { AssetMeta } from '../../types/assets';
import type { Dataset } from '../../types/dataset';
import './Management.css';

export default function AssetDetail() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<AssetMeta | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assetId) {
      loadAssetData();
    }
  }, [assetId]);

  const loadAssetData = async () => {
    if (!assetId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load asset - assetId in the route is the ticker
      const assetData = await getAsset(assetId);
      if (!assetData) {
        setError('Asset not found');
        return;
      }
      setAsset(assetData);
      
      // Load all datasets and filter for this asset (using ticker)
      const allDatasets = await getAllDatasets();
      const assetDatasets = allDatasets.filter(d => d.assetId === assetId);
      setDatasets(assetDatasets);
    } catch (err) {
      console.error('Error loading asset:', err);
      setError(err instanceof Error ? err.message : 'Failed to load asset');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="management-page">
        <div className="loading">Loading asset details...</div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="management-page">
        <div className="error">{error || 'Asset not found'}</div>
        <button onClick={() => navigate('/mgmt/assets')} className="action-button">
          ← Back to Assets
        </button>
      </div>
    );
  }

  return (
    <div className="management-page">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Admin', path: '/mgmt' },
        { label: 'Assets', path: '/mgmt/assets' },
        { label: asset.ticker }
      ]} />

      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <button onClick={() => navigate('/mgmt/assets')} className="back-button">
            <ArrowLeft size={18} />
            Back to Assets
          </button>
          <h1>{asset.ticker}</h1>
          <p className="subtitle">{asset.name}</p>
        </div>
        <button onClick={() => {/* TODO: Open edit modal */}} className="action-button">
          <Edit2 size={18} />
          Edit Asset
        </button>
      </div>

      {/* Asset Metadata */}
      <div className="info-cards" style={{ marginBottom: '2rem' }}>
        <div className="info-card">
          <div className="info-card-header">
            <TrendingUp size={20} />
            <h3>Asset Information</h3>
          </div>
          <div className="info-card-body">
            <div className="detail-row">
              <span className="detail-label">Ticker:</span>
              <span className="detail-value">{asset.ticker}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{asset.name}</span>
            </div>
            {asset.market && (
              <div className="detail-row">
                <span className="detail-label">Market:</span>
                <span className="detail-value">{asset.market}</span>
              </div>
            )}
            {asset.lastPrice !== null && asset.lastPrice !== undefined && (
              <div className="detail-row">
                <span className="detail-label">Last Price:</span>
                <span className="detail-value">${asset.lastPrice.toFixed(2)}</span>
              </div>
            )}
            {asset.priceChange !== undefined && (
              <div className="detail-row">
                <span className="detail-label">Price Change:</span>
                <span className={`detail-value ${asset.priceChange >= 0 ? 'text-green' : 'text-red'}`}>
                  {asset.priceChange >= 0 ? '+' : ''}{asset.priceChange.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Datasets */}
      <div className="info-card">
        <div className="info-card-header">
          <Database size={20} />
          <h3>Related Datasets ({datasets.length})</h3>
        </div>
        <div className="info-card-body">
          {datasets.length === 0 ? (
            <div className="empty-state">
              <p>No datasets found for this asset.</p>
              <button 
                onClick={() => navigate('/mgmt/datasets')} 
                className="action-button"
                style={{ marginTop: '1rem' }}
              >
                Create Dataset
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Dataset ID</th>
                    <th>Name</th>
                    <th>Date Range</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map(dataset => (
                    <tr key={dataset.datasetId}>
                      <td><code>{dataset.datasetId}</code></td>
                      <td>{dataset.name || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={14} />
                          {dataset.dateRange ? 
                            `${dataset.dateRange.start} → ${dataset.dateRange.end}` : 
                            '—'
                          }
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => navigate(`/mgmt/datasets/${dataset.datasetId}`)}
                          className="icon-button"
                          title="View Dataset"
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
