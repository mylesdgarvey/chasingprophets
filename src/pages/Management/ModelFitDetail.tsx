/**
 * Model Fit Detail Page
 * View training results, metrics, and model artifacts
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Box, Package, Layers, TrendingUp, BarChart2, Download } from 'lucide-react';
import { getModelFit } from '../../services/modelFit';
import { getModelScaffold } from '../../services/modelScaffold';
import { getDataSlice } from '../../services/dataSlice';
import { getAllProphets } from '../../services/prophet';
import { Breadcrumb } from '../../components/Breadcrumb';
import type { ModelFit } from '../../types/modelFit';
import type { ModelScaffold } from '../../types/modelScaffold';
import type { DataSlice } from '../../types/dataSlice';
import type { Prophet } from '../../types/prophet';
import './Management.css';

export default function ModelFitDetail() {
  const { fitId } = useParams<{ fitId: string }>();
  const navigate = useNavigate();
  const [fit, setFit] = useState<ModelFit | null>(null);
  const [scaffold, setScaffold] = useState<ModelScaffold | null>(null);
  const [dataSlice, setDataSlice] = useState<DataSlice | null>(null);
  const [prophets, setProphets] = useState<Prophet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fitId) {
      loadFitData();
    }
  }, [fitId]);

  const loadFitData = async () => {
    if (!fitId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load model fit
      const fitData = await getModelFit(fitId);
      if (!fitData) {
        throw new Error('Model fit not found');
      }
      setFit(fitData);
      
      // Load scaffold
      try {
        const scaffoldData = await getModelScaffold(fitData.scaffoldId);
        setScaffold(scaffoldData);
      } catch (err) {
        console.warn('Could not load scaffold:', err);
      }
      
      // Load data slice
      try {
        const sliceData = await getDataSlice(fitData.dataSliceId);
        setDataSlice(sliceData);
      } catch (err) {
        console.warn('Could not load data slice:', err);
      }
      
      // Load prophets using this fit
      const allProphets = await getAllProphets();
      const fitProphets = allProphets.filter(p => p.modelFitIds.includes(fitId));
      setProphets(fitProphets);
    } catch (err) {
      console.error('Error loading model fit:', err);
      setError(err instanceof Error ? err.message : 'Failed to load model fit');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="management-page">
        <div className="loading">Loading model fit details...</div>
      </div>
    );
  }

  if (error || !fit) {
    return (
      <div className="management-page">
        <div className="error">{error || 'Model fit not found'}</div>
        <button onClick={() => navigate('/mgmt/models/fits')} className="action-button">
          ← Back to Model Fits
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fit': return 'badge-success';
      case 'fitting': return 'badge-info';
      case 'failed': return 'badge-error';
      default: return 'badge-warning';
    }
  };

  return (
    <div className="management-page">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Admin', path: '/mgmt' },
        { label: 'Model Fits', path: '/mgmt/models/fits' },
        { label: fit.modelFitId }
      ]} />

      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <button onClick={() => navigate('/mgmt/models/fits')} className="back-button">
            <ArrowLeft size={18} />
            Back to Model Fits
          </button>
          <h1>{fit.modelFitId}</h1>
          <p className="subtitle">
            Trained model instance
            <span className={`badge ${getStatusColor(fit.trainingStatus)}`} style={{ marginLeft: '1rem' }}>
              {fit.trainingStatus}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => {/* TODO: Retrain */}} className="action-button">
            Retrain Model
          </button>
          {fit.trainingStatus === 'fit' && (
            <button onClick={() => {/* TODO: Create prophet */}} className="action-button">
              Create Prophet
            </button>
          )}
        </div>
      </div>

      {/* Fit Metadata */}
      <div className="info-cards">
        <div className="info-card">
          <div className="info-card-header">
            <Box size={20} />
            <h3>Model Fit Information</h3>
          </div>
          <div className="info-card-body">
            <div className="detail-row">
              <span className="detail-label">Fit ID:</span>
              <span className="detail-value"><code>{fit.modelFitId}</code></span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Asset:</span>
              <span className="detail-value">{fit.assetId}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className="detail-value">
                <span className={`badge ${getStatusColor(fit.trainingStatus)}`}>
                  {fit.trainingStatus}
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Created:</span>
              <span className="detail-value">
                {new Date(fit.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Last Updated:</span>
              <span className="detail-value">
                {new Date(fit.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Training Metrics */}
        {fit.trainingMetrics && Object.keys(fit.trainingMetrics).length > 0 && (
          <div className="info-card">
            <div className="info-card-header">
              <TrendingUp size={20} />
              <h3>Training Metrics</h3>
            </div>
            <div className="info-card-body">
              {fit.trainingMetrics.r2 !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">R² Score:</span>
                  <span className={`detail-value ${fit.trainingMetrics.r2 >= 0.7 ? 'text-green' : fit.trainingMetrics.r2 >= 0.5 ? 'text-yellow' : 'text-red'}`}>
                    {fit.trainingMetrics.r2.toFixed(4)}
                  </span>
                </div>
              )}
              {fit.trainingMetrics.mape !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">MAPE:</span>
                  <span className={`detail-value ${fit.trainingMetrics.mape <= 10 ? 'text-green' : fit.trainingMetrics.mape <= 20 ? 'text-yellow' : 'text-red'}`}>
                    {fit.trainingMetrics.mape.toFixed(2)}%
                  </span>
                </div>
              )}
              {fit.trainingMetrics.rmse !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">RMSE:</span>
                  <span className="detail-value">{fit.trainingMetrics.rmse.toFixed(4)}</span>
                </div>
              )}
              {Object.entries(fit.trainingMetrics).map(([key, value]) => {
                if (!['r2', 'mape', 'rmse'].includes(key) && value !== undefined) {
                  return (
                    <div key={key} className="detail-row">
                      <span className="detail-label">{key}:</span>
                      <span className="detail-value">{value.toFixed(4)}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Scaffold & Data Slice */}
      <div className="info-cards" style={{ marginTop: '1.5rem' }}>
        {scaffold && (
          <div className="info-card">
            <div className="info-card-header">
              <Package size={20} />
              <h3>Model Scaffold</h3>
            </div>
            <div className="info-card-body">
              <div className="detail-row">
                <span className="detail-label">Scaffold ID:</span>
                <span className="detail-value"><code>{scaffold.scaffoldId}</code></span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{scaffold.name}</span>
              </div>
              {scaffold.description && (
                <div className="detail-row">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">{scaffold.description}</span>
                </div>
              )}
              <button
                onClick={() => navigate(`/mgmt/models/scaffolds/${scaffold.scaffoldId}/edit`)}
                className="action-button"
                style={{ marginTop: '1rem', width: '100%' }}
              >
                View Scaffold Details
              </button>
            </div>
          </div>
        )}

        {dataSlice && (
          <div className="info-card">
            <div className="info-card-header">
              <Layers size={20} />
              <h3>Training Data Slice</h3>
            </div>
            <div className="info-card-body">
              <div className="detail-row">
                <span className="detail-label">Slice ID:</span>
                <span className="detail-value"><code>{dataSlice.dataSliceId}</code></span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span className="detail-value">
                  <span className={`badge ${dataSlice.sliceType === 'compound' ? 'badge-warning' : 'badge-info'}`}>
                    {dataSlice.sliceType || 'simple'}
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date Range:</span>
                <span className="detail-value">
                  {dataSlice.startDate} → {dataSlice.endDate}
                </span>
              </div>
              {dataSlice.recordCount && (
                <div className="detail-row">
                  <span className="detail-label">Records:</span>
                  <span className="detail-value">{dataSlice.recordCount.toLocaleString()}</span>
                </div>
              )}
              <button
                onClick={() => navigate(`/mgmt/data/slices/${dataSlice.dataSliceId}`)}
                className="action-button"
                style={{ marginTop: '1rem', width: '100%' }}
              >
                View Slice Details
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Model Artifacts */}
      <div className="info-card" style={{ marginTop: '1.5rem' }}>
        <div className="info-card-header">
          <Download size={20} />
          <h3>Model Artifacts</h3>
        </div>
        <div className="info-card-body">
          <div className="detail-row">
            <span className="detail-label">Parameters Path:</span>
            <span className="detail-value">
              <code style={{ fontSize: '0.75rem' }}>{fit.modelParametersPath}</code>
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Remote Inference Script:</span>
            <span className="detail-value">
              <code style={{ fontSize: '0.75rem' }}>{fit.s3RemoteInferenceScriptPath}</code>
            </span>
          </div>
          {fit.s3LocalInferenceScriptPath && (
            <div className="detail-row">
              <span className="detail-label">Local Inference Script:</span>
              <span className="detail-value">
                <code style={{ fontSize: '0.75rem' }}>{fit.s3LocalInferenceScriptPath}</code>
              </span>
            </div>
          )}
          {fit.modelUrl && (
            <div className="detail-row">
              <span className="detail-label">Base Model URL:</span>
              <span className="detail-value">
                <code style={{ fontSize: '0.75rem' }}>{fit.modelUrl}</code>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Prophets Using This Fit */}
      <div className="info-card" style={{ marginTop: '1.5rem' }}>
        <div className="info-card-header">
          <BarChart2 size={20} />
          <h3>Prophets Using This Fit ({prophets.length})</h3>
        </div>
        <div className="info-card-body">
          {prophets.length === 0 ? (
            <div className="empty-state">
              <p>No prophets have been created from this model fit yet.</p>
              {fit.trainingStatus === 'fit' && (
                <button 
                  onClick={() => {/* TODO: Create prophet modal */}} 
                  className="action-button"
                  style={{ marginTop: '1rem' }}
                >
                  Create Prophet
                </button>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Prophet ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prophets.map(prophet => (
                    <tr key={prophet.prophetId}>
                      <td><code>{prophet.prophetId}</code></td>
                      <td>{prophet.prophetName || '—'}</td>
                      <td>
                        <span className={`badge ${prophet.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                          {prophet.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => navigate(`/prophets/${prophet.prophetId}`)}
                          className="icon-button"
                          title="View Prophet"
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
