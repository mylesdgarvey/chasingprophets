import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'react-feather';
import { getProphetById } from '../services/prophet';
import { getModelFitById } from '../services/modelFit';
import { getModelScaffoldById } from '../services/modelScaffold';
import { getDataSliceById } from '../services/dataSlice';
import { getAssetPrices } from '../services/assets';
import { Prophet } from '../types/prophet';
import { ModelFit } from '../types/modelFit';
import { ModelScaffold } from '../types/modelScaffold';
import { DataSlice } from '../types/dataSlice';
import { ProphetCharts } from '../components/ProphetCharts';
import { runLocalInference, Prediction, PerformanceMetrics, PriceData } from '../utils/localInference';
import './ProphetDetail.css';

export default function ProphetDetail() {
  const { prophetId } = useParams<{ prophetId: string }>();
  const navigate = useNavigate();
  
  const [prophet, setProphet] = useState<Prophet | null>(null);
  const [modelFit, setModelFit] = useState<ModelFit | null>(null);
  const [scaffold, setScaffold] = useState<ModelScaffold | null>(null);
  const [slice, setSlice] = useState<DataSlice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Inference state
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);
  const [overallMetrics, setOverallMetrics] = useState<PerformanceMetrics | null>(null);
  const [rollingMetrics, setRollingMetrics] = useState<Map<number, PerformanceMetrics> | null>(null);
  const [inferenceLoading, setInferenceLoading] = useState(false);
  const [inferenceError, setInferenceError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProphetDetails() {
      if (!prophetId) return;
      
      try {
        setLoading(true);
        setError(null);

        // Load prophet
        const prophetData = await getProphetById(prophetId);
        if (!prophetData) {
          setError('Prophet not found');
          return;
        }
        setProphet(prophetData);

        // Load first model fit
        if (prophetData.modelFitIds && prophetData.modelFitIds.length > 0) {
          const fitId = prophetData.modelFitIds[0];
          const fitData = await getModelFitById(fitId);
          if (fitData) {
            setModelFit(fitData);

            // Load scaffold
            const scaffoldData = await getModelScaffoldById(fitData.scaffoldId);
            if (scaffoldData) {
              setScaffold(scaffoldData);
            }

            // Load slice
            const sliceData = await getDataSliceById(fitData.dataSliceId);
            if (sliceData) {
              setSlice(sliceData);
            }
          }
        }
      } catch (err) {
        console.error('Error loading prophet details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load prophet details');
      } finally {
        setLoading(false);
      }
    }

    loadProphetDetails();
  }, [prophetId]);

  // Run local inference when all data is loaded
  useEffect(() => {
    async function runInference() {
      if (!prophet || !modelFit || !scaffold || !slice) {
        console.log('Waiting for data to load:', {
          prophet: !!prophet,
          modelFit: !!modelFit,
          scaffold: !!scaffold,
          slice: !!slice
        });
        return;
      }
      
      if (!modelFit.s3LocalInferenceScriptPath || !modelFit.modelParametersPath) {
        console.log('Missing inference script or parameters path:', {
          s3LocalInferenceScriptPath: modelFit.s3LocalInferenceScriptPath,
          modelParametersPath: modelFit.modelParametersPath
        });
        setInferenceError('Model inference scripts not configured');
        return;
      }

      try {
        setInferenceLoading(true);
        setInferenceError(null);

        // Load historical price data for the asset (past 1200 days for visualization)
        console.log('Loading historical data for asset:', prophet.assetId);
        
        // Calculate start date (1200 days ago)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 1200);
        
        const priceData = await getAssetPrices(
          prophet.assetId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        
        if (!priceData || priceData.length === 0) {
          setInferenceError('No historical price data available');
          return;
        }

        // Convert to format expected by inference engine
        const historicalData: PriceData[] = priceData.map(p => ({
          date: p.date,
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
          volume: p.volume
        }));

        console.log('Running local inference...');
        const result = await runLocalInference(
          modelFit.s3LocalInferenceScriptPath,
          modelFit.modelParametersPath,
          historicalData,
          prophet.targetProperty
        );

        setPredictions(result.predictions);
        setOverallMetrics(result.overallMetrics);
        setRollingMetrics(result.rollingMetrics);
        
        console.log('Inference complete:', result.overallMetrics);
      } catch (err) {
        console.error('Inference error:', err);
        setInferenceError(err instanceof Error ? err.message : 'Failed to run inference');
      } finally {
        setInferenceLoading(false);
      }
    }

    runInference();
  }, [prophet, modelFit, scaffold, slice]);

  if (loading) {
    return (
      <div className="prophet-detail">
        <div className="loading-state">Loading prophet details...</div>
      </div>
    );
  }

  if (error || !prophet) {
    return (
      <div className="prophet-detail">
        <div className="error-state">
          <p>{error || 'Prophet not found'}</p>
          <button onClick={() => navigate('/prophets')} className="back-button">
            ← Back to Prophets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="prophet-detail">
      <button className="back-nav" onClick={() => navigate('/prophets')}>
        <ArrowLeft size={18} />
        <span>Back to Prophets</span>
      </button>

      <div className="prophet-header">
        <div className="title-section">
          <h1>{prophet.prophetName}</h1>
          <div className="prophet-meta">
            <span className="prophet-asset">{prophet.assetId}</span>
            <span className={`status-badge ${prophet.status}`}>
              {prophet.status === 'pending_training' ? 'pending' : prophet.status}
            </span>
          </div>
          {prophet.description && (
            <p className="description">{prophet.description}</p>
          )}
        </div>
      </div>

      <div className="market-metrics">
        <div className="metric-card">
          <span className="metric-label">Target Property</span>
          <span className="metric-value">{prophet.targetProperty}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Ensemble Method</span>
          <span className="metric-value">{prophet.ensembleMethod}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Model Fits</span>
          <span className="metric-value">{prophet.modelFitIds.length}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Forecast Method</span>
          <span className="metric-value">{prophet.forecastMethod}</span>
        </div>
      </div>

      <div className="detail-sections">
        {/* Model Fit Section */}
        {modelFit && (
          <div className="detail-card glass-surface">
            <div className="card-header">
              <h2>Model Fit</h2>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Fit ID</span>
                  <span className="value">{modelFit.modelFitId}</span>
                </div>
                <div className="info-item">
                  <span className="label">Training Status</span>
                  <span className={`value status-${modelFit.trainingStatus}`}>
                    {modelFit.trainingStatus}
                  </span>
                </div>
                {modelFit.modelParametersPath && (
                  <div className="info-item">
                    <span className="label">Parameters</span>
                    <span className="value small">✓ Saved to S3</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="label">Created</span>
                  <span className="value">
                    {new Date(modelFit.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scaffold Section */}
        {scaffold && (
          <div className="detail-card glass-surface">
            <div className="card-header">
              <h2>Model Scaffold</h2>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Name</span>
                  <span className="value">{scaffold.name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Scaffold ID</span>
                  <span className="value">{scaffold.scaffoldId}</span>
                </div>
                {scaffold.modelCategory && (
                  <div className="info-item">
                    <span className="label">Category</span>
                    <span className="value">{scaffold.modelCategory}</span>
                  </div>
                )}
                {scaffold.learningAlgorithm && (
                  <div className="info-item">
                    <span className="label">Algorithm</span>
                    <span className="value">{scaffold.learningAlgorithm}</span>
                  </div>
                )}
              </div>
              {scaffold.description && (
                <div className="info-item full-width">
                  <span className="label">Description</span>
                  <p className="value">{scaffold.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Slice Section */}
        {slice && (
          <div className="detail-card glass-surface">
            <div className="card-header">
              <h2>Training Data</h2>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Slice ID</span>
                  <span className="value">{slice.dataSliceId}</span>
                </div>
                <div className="info-item">
                  <span className="label">Date Range</span>
                  <span className="value">
                    {slice.startDate} to {slice.endDate}
                  </span>
                </div>
                {slice.availableColumns && (
                  <div className="info-item full-width">
                    <span className="label">Columns</span>
                    <span className="value">{slice.availableColumns.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inference Visualization Section */}
      <div className="inference-section">
        {inferenceLoading && (
          <div className="inference-loading glass-surface">
            <p>🔮 Running local inference...</p>
            <p className="sub">Analyzing historical data and computing predictions</p>
          </div>
        )}

        {inferenceError && !inferenceLoading && (
          <div className="inference-error glass-surface">
            <h3>⚠️ Inference Error</h3>
            <p>{inferenceError}</p>
            <p className="sub">Local inference requires parameters and inference script to be available.</p>
          </div>
        )}

        {!inferenceLoading && !inferenceError && predictions && overallMetrics && (
          <div className="inference-results">
            <div className="inference-header glass-surface">
              <h2>📊 Performance Visualization</h2>
              <p>Historical predictions vs actual prices using local browser-based inference</p>
              {overallMetrics.mape > 50 && (
                <div className="model-warning">
                  ⚠️ This is a simple baseline model with limited predictive power (MAPE: {overallMetrics.mape.toFixed(1)}%). 
                  Future versions will include more sophisticated features and algorithms.
                </div>
              )}
            </div>
            <ProphetCharts
              predictions={predictions}
              overallMetrics={overallMetrics}
              rollingMetrics={rollingMetrics || undefined}
            />
          </div>
        )}

        {!inferenceLoading && !inferenceError && !predictions && (
          <div className="inference-unavailable glass-surface">
            <h3>📊 Inference Visualization</h3>
            <p>Inference visualization is not available for this prophet.</p>
            <p className="sub">This may be because the model is still training or inference scripts are not configured.</p>
          </div>
        )}
      </div>
    </div>
  );
}
