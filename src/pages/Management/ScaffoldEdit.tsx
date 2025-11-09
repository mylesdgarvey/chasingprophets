/**
 * Scaffold Edit Page
 * 
 * Create and edit model scaffolds with code editors, contract definitions,
 * and LaTeX formula rendering
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Play, AlertCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { ModelScaffold, ScaffoldType } from '../../types/modelScaffold';
import { ContractField, FieldType } from '../../types/contractField';
import { getModelScaffoldById, createModelScaffold, updateModelScaffold, uploadScriptToS3, downloadScriptFromS3 } from '../../services/modelScaffold';
import './ScaffoldEdit.css';

export function ScaffoldEdit() {
  const navigate = useNavigate();
  const { scaffoldId } = useParams<{ scaffoldId: string }>();
  const isEditMode = scaffoldId !== 'new' && scaffoldId !== undefined;

  // Basic metadata
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scaffoldType, setScaffoldType] = useState<ScaffoldType>('context-free');
  const [modelCategory, setModelCategory] = useState<string>('');
  const [modelMajorCategory, setModelMajorCategory] = useState<string>('');
  const [learningAlgorithm, setLearningAlgorithm] = useState<string>('');
  const [isContextualized, setIsContextualized] = useState(false);
  const [inferenceMode, setInferenceMode] = useState<'local' | 'remote' | 'hybrid'>('hybrid');
  
  // Contracts
  const [inputContract, setInputContract] = useState<ContractField[]>([]);
  const [outputContract, setOutputContract] = useState<ContractField[]>([]);
  
  // Scripts
  const [trainingScript, setTrainingScript] = useState('');
  const [remoteInferenceScript, setRemoteInferenceScript] = useState('');
  const [localInferenceScript, setLocalInferenceScript] = useState('');
  
  // Formula
  const [formulaLatex, setFormulaLatex] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'train' | 'remote' | 'local'>('train');
  const [testInput, setTestInput] = useState('{}');
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) {
      loadScaffold();
    } else {
      // Set default values for new scaffold
      setInputContract([
        { name: 'close', type: 'numerical', required: true, description: 'Closing price' }
      ]);
      setOutputContract([
        { name: 'predicted', type: 'numerical', required: true, description: 'Predicted value' }
      ]);
      setTrainingScript('# Training script (Python)\n# Load data, train model, save parameters\n\nimport json\nimport sys\n\n# Your training code here\n');
      setRemoteInferenceScript('# Remote inference script (Python)\n# Load parameters, make predictions\n\nimport json\nimport sys\n\n# Your inference code here\n');
      setLocalInferenceScript('// Local inference script (JavaScript)\n// Browser-compatible prediction code\n\nfunction predict(input, parameters) {\n  // Your inference code here\n  return null;\n}\n');
    }
  }, [scaffoldId, isEditMode]);

  async function loadScaffold() {
    if (!scaffoldId || scaffoldId === 'new') return;
    
    try {
      setLoading(true);
      setError(null);
      
      const scaffold = await getModelScaffoldById(scaffoldId);
      if (!scaffold) {
        setError('Scaffold not found');
        return;
      }

      // Set metadata
      setName(scaffold.name);
      setDescription(scaffold.description || '');
      setScaffoldType(scaffold.scaffoldType || 'context-free');
      setModelCategory(scaffold.modelCategory || '');
      setModelMajorCategory(scaffold.modelMajorCategory || '');
      setLearningAlgorithm(scaffold.learningAlgorithm || '');
      setIsContextualized(scaffold.isContextualized || false);
      setInferenceMode(scaffold.inferenceMode || 'hybrid');
      setFormulaLatex(scaffold.formulaLatex || '');
      
      // Set contracts
      setInputContract(scaffold.inputContract || []);
      setOutputContract(scaffold.outputContract || []);

      // Load scripts from S3
      if (scaffold.s3TrainingScriptPath) {
        const trainScript = await downloadScriptFromS3(scaffold.s3TrainingScriptPath);
        setTrainingScript(trainScript);
      }
      if (scaffold.s3RemoteInferenceScriptPath) {
        const remoteScript = await downloadScriptFromS3(scaffold.s3RemoteInferenceScriptPath);
        setRemoteInferenceScript(remoteScript);
      }
      if (scaffold.s3LocalInferenceScriptPath) {
        const localScript = await downloadScriptFromS3(scaffold.s3LocalInferenceScriptPath);
        setLocalInferenceScript(localScript);
      }
    } catch (err) {
      console.error('Error loading scaffold:', err);
      setError(err instanceof Error ? err.message : 'Failed to load scaffold');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      // Validate required fields
      if (!name.trim()) {
        setError('Name is required');
        return;
      }

      if (inputContract.length === 0) {
        setError('At least one input field is required');
        return;
      }

      if (outputContract.length === 0) {
        setError('At least one output field is required');
        return;
      }

      // Prepare scaffold data
      const scaffoldData: Partial<ModelScaffold> = {
        name: name.trim(),
        description: description.trim(),
        scaffoldType,
        modelCategory,
        modelMajorCategory,
        learningAlgorithm,
        isContextualized,
        inferenceMode,
        inputContract,
        outputContract,
        formulaLatex: formulaLatex.trim()
      };

      let resultScaffoldId: string;

      if (isEditMode && scaffoldId) {
        // Update existing scaffold
        await updateModelScaffold(scaffoldId, scaffoldData);
        resultScaffoldId = scaffoldId;
      } else {
        // Create new scaffold - need to generate an ID
        const newScaffoldId = `scaffold-${Date.now()}`;
        const createInput = {
          ...scaffoldData,
          scaffoldId: newScaffoldId,
          s3TrainingScriptPath: '',
          s3RemoteInferenceScriptPath: '',
          inputContract: inputContract,
          outputContract: outputContract,
          scaffoldType: scaffoldType,
          learningAlgorithm: learningAlgorithm || 'custom',
          inferenceMode: inferenceMode,
          isContextualized: isContextualized
        };
        const newScaffold = await createModelScaffold(createInput as any);
        resultScaffoldId = newScaffold.scaffoldId;
      }

      // Upload scripts to S3
      if (trainingScript.trim()) {
        const s3Path = `models/scaffolds/${resultScaffoldId}/train.py`;
        await uploadScriptToS3(s3Path, trainingScript);
        scaffoldData.s3TrainingScriptPath = `s3://chasingprophets-models-us-east-1/${s3Path}`;
      }

      if (remoteInferenceScript.trim()) {
        const s3Path = `models/scaffolds/${resultScaffoldId}/inference.py`;
        await uploadScriptToS3(s3Path, remoteInferenceScript);
        scaffoldData.s3RemoteInferenceScriptPath = `s3://chasingprophets-models-us-east-1/${s3Path}`;
      }

      if (localInferenceScript.trim() && inferenceMode !== 'remote') {
        const s3Path = `models/scaffolds/${resultScaffoldId}/inference.js`;
        await uploadScriptToS3(s3Path, localInferenceScript);
        scaffoldData.s3LocalInferenceScriptPath = `s3://chasingprophets-models-us-east-1/${s3Path}`;
      }

      // Update scaffold with S3 paths if we just created it
      if (!isEditMode) {
        await updateModelScaffold(resultScaffoldId, {
          s3TrainingScriptPath: scaffoldData.s3TrainingScriptPath,
          s3RemoteInferenceScriptPath: scaffoldData.s3RemoteInferenceScriptPath,
          s3LocalInferenceScriptPath: scaffoldData.s3LocalInferenceScriptPath
        });
      }

      // Navigate to scaffold detail or list
      navigate('/mgmt/models/scaffolds');
    } catch (err) {
      console.error('Error saving scaffold:', err);
      setError(err instanceof Error ? err.message : 'Failed to save scaffold');
    } finally {
      setSaving(false);
    }
  }

  function addInputField() {
    setInputContract([
      ...inputContract,
      { name: '', type: 'numerical', required: false, description: '' }
    ]);
  }

  function removeInputField(index: number) {
    setInputContract(inputContract.filter((_, i) => i !== index));
  }

  function updateInputField(index: number, updates: Partial<ContractField>) {
    const updated = [...inputContract];
    updated[index] = { ...updated[index], ...updates };
    setInputContract(updated);
  }

  function addOutputField() {
    setOutputContract([
      ...outputContract,
      { name: '', type: 'numerical', required: false, description: '' }
    ]);
  }

  function removeOutputField(index: number) {
    setOutputContract(outputContract.filter((_, i) => i !== index));
  }

  function updateOutputField(index: number, updates: Partial<ContractField>) {
    const updated = [...outputContract];
    updated[index] = { ...updated[index], ...updates };
    setOutputContract(updated);
  }

  function testLocalInference() {
    try {
      setTestError(null);
      const input = JSON.parse(testInput);
      
      // Execute local inference script in a sandboxed way
      // WARNING: eval is dangerous - this is for demo purposes only
      const scriptWithReturn = localInferenceScript + '\n\n' + `
        const parameters = ${JSON.stringify({ /* mock parameters */ })};
        const result = predict(${JSON.stringify(input)}, parameters);
        JSON.stringify(result);
      `;
      
      const result = eval(scriptWithReturn);
      setTestOutput(result);
    } catch (err) {
      console.error('Test inference error:', err);
      setTestError(err instanceof Error ? err.message : 'Test failed');
    }
  }

  if (loading) {
    return (
      <div className="scaffold-edit">
        <div className="loading-state">Loading scaffold...</div>
      </div>
    );
  }

  return (
    <div className="scaffold-edit">
      <button className="back-nav" onClick={() => navigate('/mgmt/models/scaffolds')}>
        <ArrowLeft size={18} />
        <span>Back to Scaffolds</span>
      </button>

      <div className="page-header">
        <h1>{isEditMode ? 'Edit Scaffold' : 'Create New Scaffold'}</h1>
        <p className="subtitle">
          {isEditMode ? 'Modify scaffold configuration and scripts' : 'Define a new reusable model template'}
        </p>
      </div>

      {error && (
        <div className="error-banner glass-surface">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Basic Metadata Section */}
      <div className="section glass-surface">
        <h2>Basic Information</h2>
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Simple Linear Regression"
            />
          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the model's purpose and methodology..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Model Type *</label>
            <select value={scaffoldType} onChange={(e) => setScaffoldType(e.target.value as ScaffoldType)}>
              <option value="context-free">Context-Free</option>
              <option value="context-dependent">Context-Dependent</option>
            </select>
          </div>

          <div className="form-group">
            <label>Learning Algorithm</label>
            <input
              type="text"
              value={learningAlgorithm}
              onChange={(e) => setLearningAlgorithm(e.target.value)}
              placeholder="e.g., OLS, LSTM, ARIMA"
            />
          </div>

          <div className="form-group">
            <label>Model Category</label>
            <input
              type="text"
              value={modelCategory}
              onChange={(e) => setModelCategory(e.target.value)}
              placeholder="e.g., regression, classification"
            />
          </div>

          <div className="form-group">
            <label>Major Category</label>
            <input
              type="text"
              value={modelMajorCategory}
              onChange={(e) => setModelMajorCategory(e.target.value)}
              placeholder="e.g., supervised, unsupervised"
            />
          </div>

          <div className="form-group">
            <label>Inference Mode *</label>
            <select value={inferenceMode} onChange={(e) => setInferenceMode(e.target.value as any)}>
              <option value="local">Local (Browser only)</option>
              <option value="remote">Remote (Lambda only)</option>
              <option value="hybrid">Hybrid (Both)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isContextualized}
                onChange={(e) => setIsContextualized(e.target.checked)}
              />
              <span>Contextualized Model</span>
            </label>
          </div>
        </div>
      </div>

      {/* Formula Section */}
      <div className="section glass-surface">
        <h2>Mathematical Formula (LaTeX)</h2>
        <div className="formula-editor">
          <textarea
            value={formulaLatex}
            onChange={(e) => setFormulaLatex(e.target.value)}
            placeholder="e.g., y = \beta_0 + \beta_1 x"
            rows={3}
          />
          {formulaLatex && (
            <div className="formula-preview">
              <h4>Preview:</h4>
              <div className="latex-render">
                <BlockMath math={formulaLatex} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Contract Section */}
      <div className="section glass-surface">
        <div className="section-header">
          <h2>Input Contract</h2>
          <button className="add-field-button" onClick={addInputField}>
            + Add Field
          </button>
        </div>
        <div className="contract-table">
          <div className="contract-header">
            <span>Name</span>
            <span>Type</span>
            <span>Required</span>
            <span>Min</span>
            <span>Max</span>
            <span>Description</span>
            <span>Actions</span>
          </div>
          {inputContract.map((field, index) => (
            <div key={index} className="contract-row">
              <input
                type="text"
                value={field.name}
                onChange={(e) => updateInputField(index, { name: e.target.value })}
                placeholder="field_name"
              />
              <select
                value={field.type}
                onChange={(e) => updateInputField(index, { type: e.target.value as FieldType })}
              >
                <option value="numerical">Numerical</option>
                <option value="text">Text</option>
                <option value="categorical">Categorical</option>
                <option value="datetime">DateTime</option>
                <option value="boolean">Boolean</option>
              </select>
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={(e) => updateInputField(index, { required: e.target.checked })}
              />
              <input
                type="number"
                value={field.minValue || ''}
                onChange={(e) => updateInputField(index, { minValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="min"
              />
              <input
                type="number"
                value={field.maxValue || ''}
                onChange={(e) => updateInputField(index, { maxValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="max"
              />
              <input
                type="text"
                value={field.description || ''}
                onChange={(e) => updateInputField(index, { description: e.target.value })}
                placeholder="Description"
              />
              <button
                className="remove-button"
                onClick={() => removeInputField(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Output Contract Section */}
      <div className="section glass-surface">
        <div className="section-header">
          <h2>Output Contract</h2>
          <button className="add-field-button" onClick={addOutputField}>
            + Add Field
          </button>
        </div>
        <div className="contract-table">
          <div className="contract-header">
            <span>Name</span>
            <span>Type</span>
            <span>Required</span>
            <span>Description</span>
            <span>Actions</span>
          </div>
          {outputContract.map((field, index) => (
            <div key={index} className="contract-row output">
              <input
                type="text"
                value={field.name}
                onChange={(e) => updateOutputField(index, { name: e.target.value })}
                placeholder="field_name"
              />
              <select
                value={field.type}
                onChange={(e) => updateOutputField(index, { type: e.target.value as FieldType })}
              >
                <option value="numerical">Numerical</option>
                <option value="text">Text</option>
                <option value="categorical">Categorical</option>
                <option value="datetime">DateTime</option>
                <option value="boolean">Boolean</option>
              </select>
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={(e) => updateOutputField(index, { required: e.target.checked })}
              />
              <input
                type="text"
                value={field.description || ''}
                onChange={(e) => updateOutputField(index, { description: e.target.value })}
                placeholder="Description"
              />
              <button
                className="remove-button"
                onClick={() => removeOutputField(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Code Editors Section */}
      <div className="section glass-surface">
        <h2>Scripts</h2>
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'train' ? 'active' : ''}`}
            onClick={() => setActiveTab('train')}
          >
            Training Script (train.py)
          </button>
          <button
            className={`tab ${activeTab === 'remote' ? 'active' : ''}`}
            onClick={() => setActiveTab('remote')}
          >
            Remote Inference (inference.py)
          </button>
          {inferenceMode !== 'remote' && (
            <button
              className={`tab ${activeTab === 'local' ? 'active' : ''}`}
              onClick={() => setActiveTab('local')}
            >
              Local Inference (inference.js)
            </button>
          )}
        </div>

        <div className="editor-container">
          {activeTab === 'train' && (
            <Editor
              height="500px"
              language="python"
              value={trainingScript}
              onChange={(value) => setTrainingScript(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false
              }}
            />
          )}
          {activeTab === 'remote' && (
            <Editor
              height="500px"
              language="python"
              value={remoteInferenceScript}
              onChange={(value) => setRemoteInferenceScript(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false
              }}
            />
          )}
          {activeTab === 'local' && (
            <Editor
              height="500px"
              language="javascript"
              value={localInferenceScript}
              onChange={(value) => setLocalInferenceScript(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false
              }}
            />
          )}
        </div>
      </div>

      {/* Test Inference Section */}
      {inferenceMode !== 'remote' && (
        <div className="section glass-surface">
          <h2>Test Local Inference</h2>
          <div className="test-section">
            <div className="test-input">
              <label>Test Input (JSON)</label>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                rows={5}
                placeholder='{"close": 100.0}'
              />
            </div>
            <button className="test-button" onClick={testLocalInference}>
              <Play size={18} />
              <span>Run Test</span>
            </button>
            {testOutput && (
              <div className="test-output success">
                <h4>Output:</h4>
                <pre>{testOutput}</pre>
              </div>
            )}
            {testError && (
              <div className="test-output error">
                <h4>Error:</h4>
                <pre>{testError}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="actions">
        <button className="cancel-button" onClick={() => navigate('/mgmt/models/scaffolds')}>
          Cancel
        </button>
        <button className="save-button" onClick={handleSave} disabled={saving}>
          <Save size={18} />
          <span>{saving ? 'Saving...' : 'Save Scaffold'}</span>
        </button>
      </div>
    </div>
  );
}
