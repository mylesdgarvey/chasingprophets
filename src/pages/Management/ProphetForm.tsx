/**
 * ProphetForm - Multi-step wizard for creating/editing prophets
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, AlertCircle, Check, X } from 'lucide-react';
import { createProphet, updateProphet, getProphet } from '../../services/prophet';
import { getAllAssets } from '../../services/assets';
import { getAllModelFits } from '../../services/modelFit';
import type { Prophet, EnsembleMethod, ForecastMethodType } from '../../types/prophet';
import type { AssetMeta } from '../../types/assets';
import type { ModelFit } from '../../types/modelFit';
import './ProphetForm.css';

type Step = 'basic' | 'models' | 'ensemble' | 'scripts' | 'forecast' | 'review';

const STEPS: { id: Step; label: string; description: string }[] = [
  { id: 'basic', label: 'Basic Info', description: 'Prophet name and asset' },
  { id: 'models', label: 'Model Fits', description: 'Select trained models' },
  { id: 'ensemble', label: 'Ensemble', description: 'Configure ensemble method' },
  { id: 'scripts', label: 'Transform Scripts', description: 'Input/output transforms' },
  { id: 'forecast', label: 'Forecast Config', description: 'Method and parameters' },
  { id: 'review', label: 'Review', description: 'Confirm and create' },
];

export default function ProphetForm() {
  const navigate = useNavigate();
  const { prophetId } = useParams<{ prophetId?: string }>();
  const isEditMode = !!prophetId;

  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [assets, setAssets] = useState<AssetMeta[]>([]);
  const [modelFits, setModelFits] = useState<ModelFit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    prophetId: '',
    prophetName: '',
    description: '',
    assetId: '',
    targetProperty: 'close',
    modelFitIds: [] as string[],
    ensembleMethod: 'single' as EnsembleMethod,
    ensembleWeights: [] as number[],
    s3InputTransformScriptPath: '',
    s3OutputTransformScriptPath: '',
    forecastMethod: 'direct' as ForecastMethodType,
    forecastParams: {
      seed: undefined as number | undefined,
      distribution: 'normal' as 'normal' | 'lognormal',
      errorModel: 'additive' as 'additive' | 'multiplicative',
    },
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isEditMode && prophetId) {
      loadProphet(prophetId);
    }
  }, [isEditMode, prophetId]);

  const loadData = async () => {
    try {
      const [assetsData, fitsData] = await Promise.all([
        getAllAssets(),
        getAllModelFits(),
      ]);
      setAssets(assetsData);
      setModelFits(fitsData.filter(f => f.trainingStatus === 'fit'));
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load form data');
    }
  };

  const loadProphet = async (id: string) => {
    try {
      const prophet = await getProphet(id);
      if (prophet) {
        setFormData({
          prophetId: prophet.prophetId,
          prophetName: prophet.prophetName,
          description: prophet.description || '',
          assetId: prophet.assetId,
          targetProperty: prophet.targetProperty,
          modelFitIds: prophet.modelFitIds,
          ensembleMethod: prophet.ensembleMethod,
          ensembleWeights: prophet.ensembleWeights || [],
          s3InputTransformScriptPath: prophet.s3InputTransformScriptPath || '',
          s3OutputTransformScriptPath: prophet.s3OutputTransformScriptPath,
          forecastMethod: prophet.forecastMethod,
          forecastParams: {
            seed: prophet.forecastParams?.seed as number | undefined,
            distribution: prophet.forecastParams?.distribution || 'normal',
            errorModel: prophet.forecastParams?.errorModel || 'additive',
          },
        });
      }
    } catch (err) {
      console.error('Error loading prophet:', err);
      setError('Failed to load prophet');
    }
  };

  const validateStep = (step: Step): boolean => {
    const errors: Record<string, string> = {};

    if (step === 'basic') {
      if (!formData.prophetId.trim()) {
        errors.prophetId = 'Prophet ID is required';
      } else if (!isEditMode && !/^prophet-[a-z0-9-]+$/.test(formData.prophetId)) {
        errors.prophetId = 'ID must start with "prophet-" and contain only lowercase letters, numbers, and hyphens';
      }
      if (!formData.prophetName.trim()) {
        errors.prophetName = 'Prophet name is required';
      }
      if (!formData.assetId) {
        errors.assetId = 'Asset selection is required';
      }
      if (!formData.targetProperty.trim()) {
        errors.targetProperty = 'Target property is required';
      }
    }

    if (step === 'models') {
      if (formData.modelFitIds.length === 0) {
        errors.modelFitIds = 'At least one model fit must be selected';
      }
    }

    if (step === 'ensemble') {
      if (formData.ensembleMethod === 'weighted_average') {
        if (formData.ensembleWeights.length !== formData.modelFitIds.length) {
          errors.ensembleWeights = 'Must provide weights for each model fit';
        } else {
          const sum = formData.ensembleWeights.reduce((a, b) => a + b, 0);
          if (Math.abs(sum - 1.0) > 0.001) {
            errors.ensembleWeights = 'Weights must sum to 1.0';
          }
        }
      }
    }

    if (step === 'scripts') {
      if (!formData.s3OutputTransformScriptPath.trim()) {
        errors.s3OutputTransformScriptPath = 'Output transform script is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep('review')) return;

    setLoading(true);
    setError(null);

    try {
      const prophetData = {
        prophetId: formData.prophetId,
        prophetName: formData.prophetName,
        description: formData.description,
        assetId: formData.assetId,
        targetProperty: formData.targetProperty,
        modelFitIds: formData.modelFitIds,
        ensembleMethod: formData.ensembleMethod,
        ensembleWeights: formData.ensembleMethod === 'weighted_average' ? formData.ensembleWeights : undefined,
        s3InputTransformScriptPath: formData.s3InputTransformScriptPath || undefined,
        s3OutputTransformScriptPath: formData.s3OutputTransformScriptPath,
        forecastMethod: formData.forecastMethod,
        forecastParams: formData.forecastParams,
      };

      if (isEditMode) {
        await updateProphet({ ...prophetData });
      } else {
        await createProphet(prophetData);
      }

      navigate('/mgmt/prophets');
    } catch (err) {
      console.error('Error saving prophet:', err);
      setError(err instanceof Error ? err.message : 'Failed to save prophet');
    } finally {
      setLoading(false);
    }
  };

  const toggleModelFit = (fitId: string) => {
    setFormData(prev => ({
      ...prev,
      modelFitIds: prev.modelFitIds.includes(fitId)
        ? prev.modelFitIds.filter(id => id !== fitId)
        : [...prev.modelFitIds, fitId],
      ensembleWeights: [], // Reset weights when selection changes
    }));
  };

  const updateWeight = (index: number, value: number) => {
    const newWeights = [...formData.ensembleWeights];
    newWeights[index] = value;
    setFormData(prev => ({ ...prev, ensembleWeights: newWeights }));
  };

  const normalizeWeights = () => {
    const sum = formData.ensembleWeights.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      const normalized = formData.ensembleWeights.map(w => w / sum);
      setFormData(prev => ({ ...prev, ensembleWeights: normalized }));
    }
  };

  const availableModelFits = modelFits.filter(fit => 
    !formData.assetId || fit.assetId === formData.assetId
  );

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="prophet-form-container">
      <div className="prophet-form">
        {/* Header */}
        <div className="form-header">
          <button onClick={() => navigate('/mgmt/prophets')} className="back-button">
            ← Back to Prophets
          </button>
          <h1>{isEditMode ? 'Edit Prophet' : 'Create New Prophet'}</h1>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="step-progress">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`step-item ${index === currentStepIndex ? 'active' : ''} ${
                index < currentStepIndex ? 'completed' : ''
              }`}
            >
              <div className="step-number">
                {index < currentStepIndex ? <Check size={16} /> : index + 1}
              </div>
              <div className="step-info">
                <div className="step-label">{step.label}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="form-content">
          {currentStep === 'basic' && (
            <div className="form-step">
              <h2>Basic Information</h2>
              
              <div className="form-group">
                <label>Prophet ID *</label>
                <input
                  type="text"
                  value={formData.prophetId}
                  onChange={(e) => setFormData({ ...formData, prophetId: e.target.value.toLowerCase() })}
                  placeholder="prophet-djia-ensemble-v1"
                  disabled={isEditMode}
                  className={validationErrors.prophetId ? 'error' : ''}
                />
                {validationErrors.prophetId && (
                  <span className="error-text">{validationErrors.prophetId}</span>
                )}
              </div>

              <div className="form-group">
                <label>Prophet Name *</label>
                <input
                  type="text"
                  value={formData.prophetName}
                  onChange={(e) => setFormData({ ...formData, prophetName: e.target.value })}
                  placeholder="DJIA Ensemble Forecast v1"
                  className={validationErrors.prophetName ? 'error' : ''}
                />
                {validationErrors.prophetName && (
                  <span className="error-text">{validationErrors.prophetName}</span>
                )}
              </div>

              <div className="form-group">
                <label>Asset *</label>
                <select
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value, modelFitIds: [] })}
                  className={validationErrors.assetId ? 'error' : ''}
                >
                  <option value="">Select an asset...</option>
                  {assets.map(asset => (
                    <option key={asset.ticker} value={asset.ticker}>
                      {asset.ticker} - {asset.name}
                    </option>
                  ))}
                </select>
                {validationErrors.assetId && (
                  <span className="error-text">{validationErrors.assetId}</span>
                )}
              </div>

              <div className="form-group">
                <label>Target Property *</label>
                <input
                  type="text"
                  value={formData.targetProperty}
                  onChange={(e) => setFormData({ ...formData, targetProperty: e.target.value })}
                  placeholder="close"
                  className={validationErrors.targetProperty ? 'error' : ''}
                />
                {validationErrors.targetProperty && (
                  <span className="error-text">{validationErrors.targetProperty}</span>
                )}
                <span className="help-text">The asset property to forecast (e.g., close, volume)</span>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ensemble model combining LSTM and Prophet for DJIA closing price prediction"
                  rows={3}
                />
              </div>
            </div>
          )}

          {currentStep === 'models' && (
            <div className="form-step">
              <h2>Select Model Fits</h2>
              <p className="step-intro">Choose one or more trained model fits to use for forecasting</p>

              {validationErrors.modelFitIds && (
                <div className="error-banner">
                  <AlertCircle size={16} />
                  <span>{validationErrors.modelFitIds}</span>
                </div>
              )}

              {availableModelFits.length === 0 ? (
                <div className="empty-state">
                  No trained model fits available{formData.assetId && ` for ${formData.assetId}`}
                </div>
              ) : (
                <div className="model-fits-grid">
                  {availableModelFits.map(fit => (
                    <div
                      key={fit.modelFitId}
                      className={`model-fit-card ${
                        formData.modelFitIds.includes(fit.modelFitId) ? 'selected' : ''
                      }`}
                      onClick={() => toggleModelFit(fit.modelFitId)}
                    >
                      <div className="card-header">
                        <div className="checkbox">
                          {formData.modelFitIds.includes(fit.modelFitId) && <Check size={16} />}
                        </div>
                        <h3>{fit.modelFitId}</h3>
                      </div>
                      <div className="card-body">
                        <div className="info-row">
                          <span className="label">Scaffold:</span>
                          <span className="value">{fit.scaffoldId}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Data Slice:</span>
                          <span className="value">{fit.dataSliceId}</span>
                        </div>
                        {fit.trainingMetrics && (
                          <div className="metrics">
                            {fit.trainingMetrics.mape && (
                              <span className="metric">MAPE: {fit.trainingMetrics.mape.toFixed(2)}%</span>
                            )}
                            {fit.trainingMetrics.rmse && (
                              <span className="metric">RMSE: {fit.trainingMetrics.rmse.toFixed(4)}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="selection-summary">
                {formData.modelFitIds.length} model fit{formData.modelFitIds.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          )}

          {currentStep === 'ensemble' && (
            <div className="form-step">
              <h2>Ensemble Configuration</h2>
              <p className="step-intro">Configure how multiple models should be combined</p>

              <div className="form-group">
                <label>Ensemble Method *</label>
                <div className="radio-group-vertical">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="ensembleMethod"
                      value="single"
                      checked={formData.ensembleMethod === 'single'}
                      onChange={(e) => setFormData({ ...formData, ensembleMethod: 'single' })}
                      disabled={formData.modelFitIds.length > 1}
                    />
                    <div>
                      <strong>Single Model</strong>
                      <p>Use only the first selected model</p>
                    </div>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="ensembleMethod"
                      value="average"
                      checked={formData.ensembleMethod === 'average'}
                      onChange={(e) => setFormData({ ...formData, ensembleMethod: 'average' })}
                      disabled={formData.modelFitIds.length < 2}
                    />
                    <div>
                      <strong>Simple Average</strong>
                      <p>Average predictions from all models equally</p>
                    </div>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="ensembleMethod"
                      value="weighted_average"
                      checked={formData.ensembleMethod === 'weighted_average'}
                      onChange={(e) => {
                        const weights = formData.modelFitIds.map(() => 1 / formData.modelFitIds.length);
                        setFormData({ ...formData, ensembleMethod: 'weighted_average', ensembleWeights: weights });
                      }}
                      disabled={formData.modelFitIds.length < 2}
                    />
                    <div>
                      <strong>Weighted Average</strong>
                      <p>Custom weights for each model's contribution</p>
                    </div>
                  </label>
                </div>
              </div>

              {formData.ensembleMethod === 'weighted_average' && (
                <div className="form-group">
                  <label>Model Weights</label>
                  {validationErrors.ensembleWeights && (
                    <span className="error-text">{validationErrors.ensembleWeights}</span>
                  )}
                  <div className="weights-editor">
                    {formData.modelFitIds.map((fitId, index) => (
                      <div key={fitId} className="weight-row">
                        <span className="model-name">{fitId}</span>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={formData.ensembleWeights[index] || 0}
                          onChange={(e) => updateWeight(index, parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={normalizeWeights} className="btn-secondary">
                    Normalize Weights
                  </button>
                  <div className="weight-sum">
                    Sum: {formData.ensembleWeights.reduce((a, b) => a + b, 0).toFixed(3)}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'scripts' && (
            <div className="form-step">
              <h2>Transform Scripts</h2>
              <p className="step-intro">S3 paths to transformation scripts</p>

              <div className="form-group">
                <label>Input Transform Script (Optional)</label>
                <input
                  type="text"
                  value={formData.s3InputTransformScriptPath}
                  onChange={(e) => setFormData({ ...formData, s3InputTransformScriptPath: e.target.value })}
                  placeholder="s3://bucket/scripts/input-transform.py"
                />
                <span className="help-text">Transforms asset data to model input format</span>
              </div>

              <div className="form-group">
                <label>Output Transform Script *</label>
                <input
                  type="text"
                  value={formData.s3OutputTransformScriptPath}
                  onChange={(e) => setFormData({ ...formData, s3OutputTransformScriptPath: e.target.value })}
                  placeholder="s3://bucket/scripts/output-transform.py"
                  className={validationErrors.s3OutputTransformScriptPath ? 'error' : ''}
                />
                {validationErrors.s3OutputTransformScriptPath && (
                  <span className="error-text">{validationErrors.s3OutputTransformScriptPath}</span>
                )}
                <span className="help-text">Transforms model output to asset property</span>
              </div>
            </div>
          )}

          {currentStep === 'forecast' && (
            <div className="form-step">
              <h2>Forecast Configuration</h2>

              <div className="form-group">
                <label>Forecast Method *</label>
                <select
                  value={formData.forecastMethod}
                  onChange={(e) => setFormData({ ...formData, forecastMethod: e.target.value as ForecastMethodType })}
                >
                  <option value="direct">Direct (point estimate)</option>
                  <option value="stochastic">Stochastic (Monte Carlo)</option>
                  <option value="confidence_interval">Confidence Interval</option>
                </select>
              </div>

              {formData.forecastMethod === 'stochastic' && (
                <>
                  <div className="form-group">
                    <label>Random Seed</label>
                    <input
                      type="number"
                      value={formData.forecastParams.seed || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        forecastParams: { ...formData.forecastParams, seed: (parseInt(e.target.value) || undefined) as number | undefined }
                      })}
                      placeholder="42"
                    />
                  </div>

                  <div className="form-group">
                    <label>Distribution</label>
                    <select
                      value={formData.forecastParams.distribution}
                      onChange={(e) => setFormData({
                        ...formData,
                        forecastParams: { ...formData.forecastParams, distribution: e.target.value as any }
                      })}
                    >
                      <option value="normal">Normal</option>
                      <option value="lognormal">Log-Normal</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Error Model</label>
                    <select
                      value={formData.forecastParams.errorModel}
                      onChange={(e) => setFormData({
                        ...formData,
                        forecastParams: { ...formData.forecastParams, errorModel: e.target.value as any }
                      })}
                    >
                      <option value="additive">Additive</option>
                      <option value="multiplicative">Multiplicative</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {currentStep === 'review' && (
            <div className="form-step">
              <h2>Review & Confirm</h2>
              
              <div className="review-section">
                <h3>Basic Information</h3>
                <div className="review-grid">
                  <div className="review-item">
                    <span className="label">Prophet ID:</span>
                    <span className="value">{formData.prophetId}</span>
                  </div>
                  <div className="review-item">
                    <span className="label">Name:</span>
                    <span className="value">{formData.prophetName}</span>
                  </div>
                  <div className="review-item">
                    <span className="label">Asset:</span>
                    <span className="value">{formData.assetId}</span>
                  </div>
                  <div className="review-item">
                    <span className="label">Target Property:</span>
                    <span className="value">{formData.targetProperty}</span>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h3>Model Configuration</h3>
                <div className="review-grid">
                  <div className="review-item">
                    <span className="label">Model Fits:</span>
                    <span className="value">{formData.modelFitIds.length} selected</span>
                  </div>
                  <div className="review-item">
                    <span className="label">Ensemble Method:</span>
                    <span className="value">{formData.ensembleMethod}</span>
                  </div>
                  {formData.ensembleMethod === 'weighted_average' && (
                    <div className="review-item full-width">
                      <span className="label">Weights:</span>
                      <div className="value weights-list">
                        {formData.modelFitIds.map((id, i) => (
                          <div key={id}>{id}: {formData.ensembleWeights[i]?.toFixed(3) || 0}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="review-section">
                <h3>Scripts & Forecast</h3>
                <div className="review-grid">
                  <div className="review-item full-width">
                    <span className="label">Output Transform:</span>
                    <span className="value monospace">{formData.s3OutputTransformScriptPath}</span>
                  </div>
                  {formData.s3InputTransformScriptPath && (
                    <div className="review-item full-width">
                      <span className="label">Input Transform:</span>
                      <span className="value monospace">{formData.s3InputTransformScriptPath}</span>
                    </div>
                  )}
                  <div className="review-item">
                    <span className="label">Forecast Method:</span>
                    <span className="value">{formData.forecastMethod}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="form-footer">
          <button
            type="button"
            onClick={handleBack}
            className="btn-secondary"
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <div className="step-indicator">
            Step {currentStepIndex + 1} of {STEPS.length}
          </div>

          {currentStepIndex < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary"
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditMode ? 'Update' : 'Create'} Prophet
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
