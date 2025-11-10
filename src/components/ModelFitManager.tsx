import { useEffect, useState } from 'react';
import { getAllModelScaffolds } from '../services/modelScaffold';
import { getAllDataSlices } from '../services/dataSlice';
import { validateContractMatch } from '../services/dataSlice';
import { ModelScaffold } from '../types/modelScaffold';
import { DataSlice } from '../types/dataSlice';
import { AlertCircle, CheckCircle, XCircle } from 'react-feather';
import './ModelFitManager.css';

interface ModelFitManagerProps {
  assetId: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export default function ModelFitManager({ assetId }: ModelFitManagerProps) {
  const [scaffolds, setScaffolds] = useState<ModelScaffold[]>([]);
  const [dataSlices, setDataSlices] = useState<DataSlice[]>([]);
  const [selectedScaffold, setSelectedScaffold] = useState<ModelScaffold | null>(null);
  const [selectedSlice, setSelectedSlice] = useState<DataSlice | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [scaffoldsData, allSlices] = await Promise.all([
          getAllModelScaffolds(),
          getAllDataSlices()
        ]);
        
        // Filter slices by assetId (sliceId starts with assetId_)
        const assetSlices = allSlices.filter(slice => 
          slice.dataSliceId.startsWith(`${assetId}_`)
        );
        
        setScaffolds(scaffoldsData);
        setDataSlices(assetSlices);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [assetId]);

  useEffect(() => {
    async function runValidation() {
      if (selectedScaffold && selectedSlice) {
        try {
          const result = await validateContractMatch(selectedSlice, selectedScaffold);
          setValidation(result);
        } catch (err) {
          setValidation({
            valid: false,
            errors: [err instanceof Error ? err.message : 'Validation failed']
          });
        }
      } else {
        setValidation(null);
      }
    }
    
    runValidation();
  }, [selectedScaffold, selectedSlice]);

  const handleCreateModelFit = async () => {
    if (!selectedScaffold || !selectedSlice || !validation?.valid) {
      return;
    }

    try {
      // TODO: Implement in Phase 4F
      console.log('Creating model fit:', {
        scaffoldId: selectedScaffold.scaffoldId,
        sliceId: selectedSlice.dataSliceId
      });
      alert('Model fit creation will be implemented in Phase 4F');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create model fit');
    }
  };

  if (loading) {
    return <div className="model-fit-manager loading">Loading scaffolds and data slices...</div>;
  }

  if (error) {
    return <div className="model-fit-manager error">Error: {error}</div>;
  }

  // Group slices by window size
  const slicesByWindow = dataSlices.reduce((acc, slice) => {
    const windowKey = slice.dataSliceId?.match(/(\d+)d_/)?.[1] || 'other';
    if (!acc[windowKey]) acc[windowKey] = [];
    acc[windowKey].push(slice);
    return acc;
  }, {} as Record<string, DataSlice[]>);

  return (
    <div className="model-fit-manager">
      <h2>Model Fit Creation</h2>
      <p className="description">
        Create model fits by selecting a scaffold and data slice. The system will validate
        that the data slice schema matches the scaffold's input contract.
      </p>

      <div className="selection-grid">
        {/* Scaffold Selection */}
        <div className="selection-panel">
          <h3>1. Select Model Scaffold</h3>
          <div className="scaffold-list">
            {scaffolds.map(scaffold => (
              <div
                key={scaffold.scaffoldId}
                className={`scaffold-card ${selectedScaffold?.scaffoldId === scaffold.scaffoldId ? 'selected' : ''}`}
                onClick={() => setSelectedScaffold(scaffold)}
              >
                <div className="scaffold-header">
                  <h4>{scaffold.name}</h4>
                  <span className="scaffold-id">{scaffold.scaffoldId}</span>
                </div>
                <p className="scaffold-description">{scaffold.description}</p>
                
                {selectedScaffold?.scaffoldId === scaffold.scaffoldId && (
                  <div className="contract-details">
                    <div className="contract-section">
                      <h5>Input Contract</h5>
                      <ul>
                        {scaffold.inputContract.map(field => (
                          <li key={field.name}>
                            <span className="field-name">{field.name}</span>
                            <span className="field-type">{field.type}</span>
                            {field.required && <span className="required">required</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="contract-section">
                      <h5>Output Contract</h5>
                      <ul>
                        {scaffold.outputContract.map(field => (
                          <li key={field.name}>
                            <span className="field-name">{field.name}</span>
                            <span className="field-type">{field.type}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Data Slice Selection */}
        <div className="selection-panel">
          <h3>2. Select Data Slice</h3>
          <div className="slice-list">
            {Object.keys(slicesByWindow).sort((a, b) => Number(a) - Number(b)).map(windowSize => (
              <div key={windowSize} className="window-group">
                <h4>{windowSize}-day windows ({slicesByWindow[windowSize].length})</h4>
                <div className="slices">
                  {slicesByWindow[windowSize].slice(0, 5).map(slice => (
                    <div
                      key={slice.dataSliceId}
                      className={`slice-card ${selectedSlice?.dataSliceId === slice.dataSliceId ? 'selected' : ''}`}
                      onClick={() => setSelectedSlice(slice)}
                    >
                      <div className="slice-name">{slice.dataSliceId}</div>
                      <div className="slice-dates">
                        {slice.startDate} to {slice.endDate}
                      </div>
                      <div className="slice-meta">
                        {slice.availableColumns?.length || 0} columns
                      </div>
                    </div>
                  ))}
                  {slicesByWindow[windowSize].length > 5 && (
                    <div className="more-slices">
                      +{slicesByWindow[windowSize].length - 5} more slices
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Results */}
      {validation && (
        <div className={`validation-panel ${validation.valid ? 'valid' : 'invalid'}`}>
          <div className="validation-header">
            {validation.valid ? (
              <>
                <CheckCircle size={24} />
                <h3>Validation Passed</h3>
              </>
            ) : (
              <>
                <XCircle size={24} />
                <h3>Validation Failed</h3>
              </>
            )}
          </div>
          
          {validation.valid ? (
            <div className="validation-success">
              <p>
                The data slice <strong>{selectedSlice?.dataSliceId}</strong> matches the input contract
                for <strong>{selectedScaffold?.name}</strong>.
              </p>
              <button 
                className="create-fit-button"
                onClick={handleCreateModelFit}
              >
                Create Model Fit
              </button>
            </div>
          ) : (
            <div className="validation-errors">
              <p>The following errors were found:</p>
              <ul>
                {validation.errors.map((error, idx) => (
                  <li key={idx}>
                    <AlertCircle size={16} />
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {!selectedScaffold && !selectedSlice && (
        <div className="summary-panel">
          <h3>Available Resources</h3>
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-value">{scaffolds.length}</span>
              <span className="stat-label">Model Scaffolds</span>
            </div>
            <div className="stat">
              <span className="stat-value">{dataSlices.length}</span>
              <span className="stat-label">Data Slices</span>
            </div>
            <div className="stat">
              <span className="stat-value">{Object.keys(slicesByWindow).length}</span>
              <span className="stat-label">Window Sizes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
