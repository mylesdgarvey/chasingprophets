/**
 * DataSliceFormModal
 * Modal for creating or editing data slices with schema detection
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader, Plus, X } from 'lucide-react';
import { createDataSlice, updateDataSlice, getAllDataSlices } from '../../services/dataSlice';
import { getAllDatasets } from '../../services/dataset';
import type { DataSlice, SliceType } from '../../types/dataSlice';
import type { Dataset } from '../../types/dataset';
import type { FieldType } from '../../types/contractField';
import './Modal.css';

interface DataSliceFormModalProps {
  mode: 'create' | 'edit';
  dataSlice?: DataSlice;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DataSliceFormModal({ mode, dataSlice, onClose, onSuccess }: DataSliceFormModalProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [allSlices, setAllSlices] = useState<DataSlice[]>([]);
  const [formData, setFormData] = useState({
    dataSliceId: dataSlice?.dataSliceId || '',
    datasetId: dataSlice?.datasetId || '',
    startDate: dataSlice?.startDate || '',
    endDate: dataSlice?.endDate || '',
    description: dataSlice?.description || '',
    sliceType: (dataSlice?.sliceType || 'simple') as SliceType,
  });
  const [baseSliceIds, setBaseSliceIds] = useState<string[]>(dataSlice?.baseSliceIds || []);
  const [columns, setColumns] = useState<string[]>(dataSlice?.availableColumns || []);
  const [columnInput, setColumnInput] = useState('');
  const [columnTypes, setColumnTypes] = useState<Record<string, FieldType>>(dataSlice?.columnTypes || {});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [datasetsData, slicesData] = await Promise.all([
        getAllDatasets(),
        getAllDataSlices()
      ]);
      setDatasets(datasetsData);
      setAllSlices(slicesData.filter(s => s.sliceType === 'simple'));
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.dataSliceId.trim()) {
      errors.dataSliceId = 'Data slice ID is required';
    } else if (mode === 'create' && !/^slice-[a-z0-9-]+$/.test(formData.dataSliceId)) {
      errors.dataSliceId = 'ID must start with "slice-" and contain only lowercase letters, numbers, and hyphens';
    }

    if (!formData.datasetId) {
      errors.datasetId = 'Dataset selection is required';
    }

    if (formData.sliceType === 'simple') {
      if (!formData.startDate) {
        errors.startDate = 'Start date is required';
      }
      if (!formData.endDate) {
        errors.endDate = 'End date is required';
      }
      if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        errors.endDate = 'End date must be after start date';
      }
      if (columns.length === 0) {
        errors.columns = 'At least one column must be defined';
      }
    } else {
      // Compound slice validation
      if (baseSliceIds.length < 2) {
        errors.baseSliceIds = 'Compound slice must reference at least 2 simple slices';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddColumn = () => {
    if (columnInput.trim() && !columns.includes(columnInput.trim())) {
      const newColumn = columnInput.trim();
      setColumns([...columns, newColumn]);
      // Default to 'numerical' type
      setColumnTypes({ ...columnTypes, [newColumn]: 'numerical' as FieldType });
      setColumnInput('');
    }
  };

  const handleRemoveColumn = (column: string) => {
    setColumns(columns.filter(c => c !== column));
    const newTypes = { ...columnTypes };
    delete newTypes[column];
    setColumnTypes(newTypes);
  };

  const handleColumnTypeChange = (column: string, type: FieldType) => {
    setColumnTypes({ ...columnTypes, [column]: type });
  };

  const handleAddBaseSlice = (sliceId: string) => {
    if (!baseSliceIds.includes(sliceId)) {
      setBaseSliceIds([...baseSliceIds, sliceId]);
    }
  };

  const handleRemoveBaseSlice = (sliceId: string) => {
    setBaseSliceIds(baseSliceIds.filter(id => id !== sliceId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalStartDate = formData.startDate;
      let finalEndDate = formData.endDate;
      let finalColumns = columns;
      let finalColumnTypes = columnTypes;

      // For compound slices, compute aggregate metadata
      if (formData.sliceType === 'compound') {
        const baseSlices = allSlices.filter(s => baseSliceIds.includes(s.dataSliceId));
        
        // Find earliest start and latest end
        const dates = baseSlices.map(s => ({ start: s.startDate, end: s.endDate }));
        finalStartDate = dates.reduce((min, d) => d.start < min ? d.start : min, dates[0].start);
        finalEndDate = dates.reduce((max, d) => d.end > max ? d.end : max, dates[0].end);
        
        // Merge columns (intersection for safety)
        const columnSets = baseSlices.map(s => new Set(s.availableColumns || []));
        const commonColumns = columnSets.reduce((acc, set) => 
          new Set([...acc].filter(x => set.has(x))), 
          columnSets[0]
        );
        finalColumns = Array.from(commonColumns);
        
        // Merge column types
        finalColumnTypes = {};
        for (const col of finalColumns) {
          const types = baseSlices.map(s => s.columnTypes?.[col]).filter(Boolean);
          finalColumnTypes[col] = (types[0] || 'numerical') as FieldType; // Use first type found
        }
      }

      const sliceData = {
        dataSliceId: formData.dataSliceId,
        datasetId: formData.datasetId,
        startDate: finalStartDate,
        endDate: finalEndDate,
        description: formData.description,
        sliceType: formData.sliceType,
        baseSliceIds: formData.sliceType === 'compound' ? baseSliceIds : undefined,
        availableColumns: finalColumns,
        columnTypes: finalColumnTypes,
      };

      if (mode === 'create') {
        await createDataSlice(sliceData);
      } else {
        await updateDataSlice(formData.dataSliceId, sliceData);
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving data slice:', err);
      setError(err instanceof Error ? err.message : 'Failed to save data slice');
    } finally {
      setLoading(false);
    }
  };

  const availableBaseSlices = allSlices.filter(s => 
    s.datasetId === formData.datasetId && 
    !baseSliceIds.includes(s.dataSliceId)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'create' ? 'Create Data Slice' : 'Edit Data Slice'}</h2>
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
              <label>Data Slice ID *</label>
              <input
                type="text"
                value={formData.dataSliceId}
                onChange={(e) => setFormData({ ...formData, dataSliceId: e.target.value.toLowerCase() })}
                placeholder="slice-djia-train-2020-2023"
                disabled={mode === 'edit'}
                className={validationErrors.dataSliceId ? 'error' : ''}
              />
              {validationErrors.dataSliceId && (
                <span className="error-text">{validationErrors.dataSliceId}</span>
              )}
            </div>

            <div className="form-group">
              <label>Dataset *</label>
              <select
                value={formData.datasetId}
                onChange={(e) => setFormData({ ...formData, datasetId: e.target.value })}
                className={validationErrors.datasetId ? 'error' : ''}
                disabled={mode === 'edit'}
              >
                <option value="">Select a dataset...</option>
                {datasets.map(ds => (
                  <option key={ds.datasetId} value={ds.datasetId}>
                    {ds.name} ({ds.datasetId})
                  </option>
                ))}
              </select>
              {validationErrors.datasetId && (
                <span className="error-text">{validationErrors.datasetId}</span>
              )}
            </div>

            <div className="form-group">
              <label>Slice Type *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="sliceType"
                    value="simple"
                    checked={formData.sliceType === 'simple'}
                    onChange={(e) => setFormData({ ...formData, sliceType: 'simple' })}
                  />
                  <span>Simple (single date range)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="sliceType"
                    value="compound"
                    checked={formData.sliceType === 'compound'}
                    onChange={(e) => setFormData({ ...formData, sliceType: 'compound' })}
                  />
                  <span>Compound (union of multiple slices)</span>
                </label>
              </div>
            </div>

            {formData.sliceType === 'simple' ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className={validationErrors.startDate ? 'error' : ''}
                    />
                    {validationErrors.startDate && (
                      <span className="error-text">{validationErrors.startDate}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className={validationErrors.endDate ? 'error' : ''}
                    />
                    {validationErrors.endDate && (
                      <span className="error-text">{validationErrors.endDate}</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Available Columns *</label>
                  <div className="column-input">
                    <input
                      type="text"
                      value={columnInput}
                      onChange={(e) => setColumnInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColumn())}
                      placeholder="Enter column name and press Enter"
                    />
                    <button type="button" onClick={handleAddColumn} className="btn-secondary">
                      <Plus size={16} /> Add
                    </button>
                  </div>
                  {validationErrors.columns && (
                    <span className="error-text">{validationErrors.columns}</span>
                  )}
                  
                  {columns.length > 0 && (
                    <div className="columns-list">
                      {columns.map(col => (
                        <div key={col} className="column-item">
                          <span className="column-name">{col}</span>
                          <select
                            value={columnTypes[col] || 'numerical'}
                            onChange={(e) => handleColumnTypeChange(col, e.target.value as FieldType)}
                            className="column-type-select"
                          >
                            <option value="numerical">Numerical</option>
                            <option value="text">Text</option>
                            <option value="categorical">Categorical</option>
                            <option value="datetime">DateTime</option>
                            <option value="boolean">Boolean</option>
                          </select>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveColumn(col)}
                            className="btn-icon-danger"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="form-group">
                <label>Base Slices * (select at least 2)</label>
                {baseSliceIds.length > 0 && (
                  <div className="selected-slices">
                    {baseSliceIds.map(id => {
                      const slice = allSlices.find(s => s.dataSliceId === id);
                      return (
                        <div key={id} className="slice-tag">
                          <span>{slice?.dataSliceId || id}</span>
                          <button type="button" onClick={() => handleRemoveBaseSlice(id)}>
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <select 
                  onChange={(e) => { handleAddBaseSlice(e.target.value); e.target.value = ''; }}
                  value=""
                  disabled={!formData.datasetId}
                >
                  <option value="">Add a slice...</option>
                  {availableBaseSlices.map(slice => (
                    <option key={slice.dataSliceId} value={slice.dataSliceId}>
                      {slice.dataSliceId} ({slice.startDate} to {slice.endDate})
                    </option>
                  ))}
                </select>
                {validationErrors.baseSliceIds && (
                  <span className="error-text">{validationErrors.baseSliceIds}</span>
                )}
              </div>
            )}

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Training data from 2020-2023 with OHLCV columns"
                rows={2}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="spinner" size={16} />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Slice' : 'Update Slice'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
