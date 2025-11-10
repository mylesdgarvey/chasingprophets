/**
 * DatasetFormModal
 * Modal for creating or editing datasets with CSV upload to S3
 */

import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle, Loader } from 'lucide-react';
import { createDataset, updateDataset } from '../../services/dataset';
import { getAllAssets } from '../../services/assets';
import type { Dataset } from '../../types/dataset';
import type { AssetMeta } from '../../types/assets';
import './Modal.css';

interface DatasetFormModalProps {
  mode: 'create' | 'edit';
  dataset?: Dataset;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DatasetFormModal({ mode, dataset, onClose, onSuccess }: DatasetFormModalProps) {
  const [assets, setAssets] = useState<AssetMeta[]>([]);
  const [formData, setFormData] = useState({
    datasetId: dataset?.datasetId || '',
    assetId: dataset?.assetId || '',
    name: dataset?.name || '',
    description: dataset?.description || '',
    source: dataset?.source || '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    recordCount: number;
    dateRange: { start: string; end: string } | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const data = await getAllAssets();
      setAssets(data);
    } catch (err) {
      console.error('Error loading assets:', err);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.datasetId.trim()) {
      errors.datasetId = 'Dataset ID is required';
    } else if (mode === 'create' && !/^dataset-[a-z0-9-]+$/.test(formData.datasetId)) {
      errors.datasetId = 'Dataset ID must start with "dataset-" and contain only lowercase letters, numbers, and hyphens';
    }

    if (!formData.assetId) {
      errors.assetId = 'Asset selection is required';
    }

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (mode === 'create' && !file && !formData.source) {
      errors.file = 'Please upload a CSV file or provide an S3 source path';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Only CSV files are supported');
      return;
    }

    setFile(selectedFile);
    setError(null);
    
    // Analyze the CSV file
    await analyzeCSV(selectedFile);
  };

  const analyzeCSV = async (file: File) => {
    setAnalyzing(true);
    try {
      const text = await file.text();
      const lines = text.trim().split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setError('CSV file must have at least a header and one data row');
        setFileInfo(null);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const dataLines = lines.slice(1);
      
      // Try to detect date range if there's a date/timestamp column
      let dateRange: { start: string; end: string } | null = null;
      const dateColIndex = headers.findIndex(h => 
        h.includes('date') || h.includes('time') || h === 'timestamp'
      );

      if (dateColIndex !== -1) {
        const dates = dataLines
          .map(line => {
            const cols = line.split(',');
            return cols[dateColIndex]?.trim();
          })
          .filter(Boolean)
          .map(d => new Date(d))
          .filter(d => !isNaN(d.getTime()))
          .sort((a, b) => a.getTime() - b.getTime());

        if (dates.length > 0) {
          dateRange = {
            start: dates[0].toISOString().split('T')[0],
            end: dates[dates.length - 1].toISOString().split('T')[0],
          };
        }
      }

      setFileInfo({
        recordCount: dataLines.length,
        dateRange,
      });
    } catch (err) {
      console.error('Error analyzing CSV:', err);
      setError('Failed to analyze CSV file');
      setFileInfo(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const uploadToS3 = async (file: File): Promise<string> => {
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const s3Client = new S3Client({
        region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
          secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || ''
        }
      });

      const bucket = import.meta.env.VITE_S3_DATA_BUCKET || 'chasingprophets-data-us-east-1';
      const key = `datasets/${formData.assetId}/${formData.datasetId}.csv`;
      
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: new Uint8Array(await file.arrayBuffer()),
        ContentType: 'text/csv'
      });

      await s3Client.send(command);
      return `s3://${bucket}/${key}`;
    } catch (err) {
      console.error('Error uploading to S3:', err);
      throw new Error('Failed to upload file to S3');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let s3Path = formData.source;

      // Upload file to S3 if provided
      if (file) {
        s3Path = await uploadToS3(file);
      }

      const datasetData = {
        ...formData,
        source: s3Path,
        recordCount: fileInfo?.recordCount,
        dateRange: fileInfo?.dateRange || undefined,
      };

      if (mode === 'create') {
        await createDataset(datasetData);
      } else {
        await updateDataset(formData.datasetId, datasetData);
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving dataset:', err);
      setError(err instanceof Error ? err.message : 'Failed to save dataset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'create' ? 'Create Dataset' : 'Edit Dataset'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label>Dataset ID *</label>
              <input
                type="text"
                value={formData.datasetId}
                onChange={(e) => setFormData({ ...formData, datasetId: e.target.value.toLowerCase() })}
                placeholder="dataset-djia-historical"
                disabled={mode === 'edit'}
                className={validationErrors.datasetId ? 'error' : ''}
              />
              {validationErrors.datasetId && (
                <span className="error-text">{validationErrors.datasetId}</span>
              )}
              {mode === 'create' && (
                <span className="help-text">Must start with "dataset-" followed by lowercase letters, numbers, and hyphens</span>
              )}
            </div>

            <div className="form-group">
              <label>Asset *</label>
              <select
                value={formData.assetId}
                onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                className={validationErrors.assetId ? 'error' : ''}
                disabled={mode === 'edit'}
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
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="DJIA Historical Daily Prices"
                className={validationErrors.name ? 'error' : ''}
              />
              {validationErrors.name && (
                <span className="error-text">{validationErrors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Historical daily OHLCV data for the Dow Jones Industrial Average"
                rows={3}
                className={validationErrors.description ? 'error' : ''}
              />
              {validationErrors.description && (
                <span className="error-text">{validationErrors.description}</span>
              )}
            </div>

            {mode === 'create' && (
              <div className="form-group">
                <label>CSV File Upload *</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    id="csv-file"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="csv-file" className="file-upload-label">
                    <Upload size={24} />
                    <span>{file ? file.name : 'Click to upload CSV file'}</span>
                  </label>
                  {validationErrors.file && (
                    <span className="error-text">{validationErrors.file}</span>
                  )}
                </div>
                
                {analyzing && (
                  <div className="analyzing-indicator">
                    <Loader className="spinner" size={16} />
                    <span>Analyzing CSV...</span>
                  </div>
                )}

                {fileInfo && !analyzing && (
                  <div className="file-info">
                    <div className="info-row">
                      <strong>Records:</strong> {fileInfo.recordCount.toLocaleString()}
                    </div>
                    {fileInfo.dateRange && (
                      <div className="info-row">
                        <strong>Date Range:</strong> {fileInfo.dateRange.start} to {fileInfo.dateRange.end}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {mode === 'edit' && (
              <div className="form-group">
                <label>S3 Source Path</label>
                <input
                  type="text"
                  value={formData.source}
                  disabled
                  className="read-only"
                />
                <span className="help-text">Source path cannot be changed after creation</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || analyzing}>
              {loading ? (
                <>
                  <Loader className="spinner" size={16} />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Dataset' : 'Update Dataset'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
