import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { createAsset, updateAsset } from '../../services/assets';
import type { AssetMeta } from '../../types/assets';
import './Modal.css';

interface AssetFormModalProps {
  mode: 'create' | 'edit';
  asset?: AssetMeta;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssetFormModal({ mode, asset, onClose, onSuccess }: AssetFormModalProps) {
  const [formData, setFormData] = useState({
    ticker: asset?.ticker || '',
    name: asset?.name || '',
    market: asset?.market || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.ticker.trim()) {
      newErrors.ticker = 'Ticker is required';
    } else if (!/^[A-Z^\.]+$/.test(formData.ticker)) {
      newErrors.ticker = 'Ticker must contain only uppercase letters, ^, or .';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    setSubmitError(null);
    
    try {
      if (mode === 'create') {
        await createAsset({
          ticker: formData.ticker.toUpperCase(),
          name: formData.name.trim(),
          market: formData.market.trim() || undefined,
        });
      } else {
        await updateAsset(formData.ticker, {
          name: formData.name.trim(),
          market: formData.market.trim() || undefined,
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error('Failed to save asset:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'create' ? 'Create New Asset' : 'Edit Asset'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {submitError && (
              <div className="error-text" style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                <AlertCircle size={16} />
                {submitError}
              </div>
            )}
            
            <div className={`form-group ${errors.ticker ? 'error' : ''}`}>
              <label>
                Ticker Symbol <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.ticker}
                onChange={(e) => handleChange('ticker', e.target.value.toUpperCase())}
                placeholder="e.g., AAPL, ^DJI, ^GSPC"
                disabled={mode === 'edit' || loading}
                autoFocus
              />
              {errors.ticker && <div className="error-text">{errors.ticker}</div>}
              {mode === 'edit' && (
                <div className="helper-text">Ticker cannot be changed</div>
              )}
            </div>
            
            <div className={`form-group ${errors.name ? 'error' : ''}`}>
              <label>
                Name <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Apple Inc., Dow Jones Industrial Average"
                disabled={loading}
              />
              {errors.name && <div className="error-text">{errors.name}</div>}
            </div>
            
            <div className="form-group">
              <label>Market/Exchange</label>
              <input
                type="text"
                value={formData.market}
                onChange={(e) => handleChange('market', e.target.value)}
                placeholder="e.g., NASDAQ, NYSE, US"
                disabled={loading}
              />
              <div className="helper-text">Optional: Exchange or market identifier</div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading && <div className="spinner" />}
              {mode === 'create' ? 'Create Asset' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
