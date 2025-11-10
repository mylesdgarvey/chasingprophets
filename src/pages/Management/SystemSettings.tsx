/**
 * System Settings Management
 * 
 * Configure system-wide admin settings:
 * - Model training defaults
 * - Data pipeline configuration
 * - Lambda/automation settings
 * - Performance thresholds
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RefreshCw, AlertTriangle } from 'lucide-react';
import './Management.css';
import '../Admin/AdminDashboard.css';

interface SystemSettings {
  modelTraining: {
    defaultScaffoldId: string;
    autoRetrain: boolean;
    retrainThresholdDays: number;
    maxParallelTraining: number;
  };
  dataPipeline: {
    defaultTrainRatio: number;
    defaultTestRatio: number;
    defaultValidationRatio: number;
    minDataPoints: number;
  };
  automation: {
    dailyPredictionsEnabled: boolean;
    dailyPredictionsTime: string; // HH:MM format
    performanceTrackingEnabled: boolean;
  };
  performance: {
    minAcceptableR2: number;
    minAcceptableMAPE: number;
    autoDeactivateUnderperformers: boolean;
  };
}

const DEFAULT_SETTINGS: SystemSettings = {
  modelTraining: {
    defaultScaffoldId: '',
    autoRetrain: false,
    retrainThresholdDays: 30,
    maxParallelTraining: 5
  },
  dataPipeline: {
    defaultTrainRatio: 0.7,
    defaultTestRatio: 0.2,
    defaultValidationRatio: 0.1,
    minDataPoints: 100
  },
  automation: {
    dailyPredictionsEnabled: false,
    dailyPredictionsTime: '00:00',
    performanceTrackingEnabled: true
  },
  performance: {
    minAcceptableR2: 0.5,
    minAcceptableMAPE: 0.15,
    autoDeactivateUnderperformers: false
  }
};

export function SystemSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: Implement actual save to DynamoDB config table
    console.log('Saving settings:', settings);
    setSaved(true);
    setHasChanges(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(false);
  };

  const updateSetting = (category: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
    setSaved(false);
  };

  return (
    <div className="management-page">
      <div className="page-header">
        <div className="header-content">
          <button onClick={() => navigate('/admin')} className="back-button">
            ← Back to Admin
          </button>
          <h1>System Settings</h1>
          <p className="subtitle">Configure system-wide administrator settings</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              opacity: hasChanges ? 1 : 0.5
            }}
          >
            <RefreshCw size={16} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: hasChanges ? '#3b82f6' : 'var(--bg-secondary)',
              color: hasChanges ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              opacity: hasChanges ? 1 : 0.5
            }}
          >
            <Save size={16} />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div style={{
        background: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
        <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
          These settings affect all system operations. Changes may impact active prophets and scheduled jobs.
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {/* Model Training Settings */}
        <SettingsSection title="Model Training">
          <SettingField
            label="Default Scaffold ID"
            type="text"
            value={settings.modelTraining.defaultScaffoldId}
            onChange={(val) => updateSetting('modelTraining', 'defaultScaffoldId', val)}
            description="Default model scaffold for new prophets"
          />
          <SettingField
            label="Auto-retrain"
            type="checkbox"
            value={settings.modelTraining.autoRetrain}
            onChange={(val) => updateSetting('modelTraining', 'autoRetrain', val)}
            description="Automatically retrain models when new data is available"
          />
          <SettingField
            label="Retrain Threshold (days)"
            type="number"
            value={settings.modelTraining.retrainThresholdDays}
            onChange={(val) => updateSetting('modelTraining', 'retrainThresholdDays', Number(val))}
            description="Days before triggering automatic retraining"
            min={1}
            max={365}
          />
          <SettingField
            label="Max Parallel Training Jobs"
            type="number"
            value={settings.modelTraining.maxParallelTraining}
            onChange={(val) => updateSetting('modelTraining', 'maxParallelTraining', Number(val))}
            description="Maximum simultaneous model training operations"
            min={1}
            max={20}
          />
        </SettingsSection>

        {/* Data Pipeline Settings */}
        <SettingsSection title="Data Pipeline">
          <SettingField
            label="Training Data Ratio"
            type="number"
            value={settings.dataPipeline.defaultTrainRatio}
            onChange={(val) => updateSetting('dataPipeline', 'defaultTrainRatio', Number(val))}
            description="Default proportion of data for training (0-1)"
            min={0}
            max={1}
            step={0.05}
          />
          <SettingField
            label="Test Data Ratio"
            type="number"
            value={settings.dataPipeline.defaultTestRatio}
            onChange={(val) => updateSetting('dataPipeline', 'defaultTestRatio', Number(val))}
            description="Default proportion of data for testing (0-1)"
            min={0}
            max={1}
            step={0.05}
          />
          <SettingField
            label="Validation Data Ratio"
            type="number"
            value={settings.dataPipeline.defaultValidationRatio}
            onChange={(val) => updateSetting('dataPipeline', 'defaultValidationRatio', Number(val))}
            description="Default proportion of data for validation (0-1)"
            min={0}
            max={1}
            step={0.05}
          />
          <SettingField
            label="Minimum Data Points"
            type="number"
            value={settings.dataPipeline.minDataPoints}
            onChange={(val) => updateSetting('dataPipeline', 'minDataPoints', Number(val))}
            description="Minimum required data points for training"
            min={10}
            max={10000}
          />
        </SettingsSection>

        {/* Automation Settings */}
        <SettingsSection title="Automation (Lambda)">
          <SettingField
            label="Daily Predictions"
            type="checkbox"
            value={settings.automation.dailyPredictionsEnabled}
            onChange={(val) => updateSetting('automation', 'dailyPredictionsEnabled', val)}
            description="Enable automated daily prediction generation"
          />
          <SettingField
            label="Predictions Time (UTC)"
            type="time"
            value={settings.automation.dailyPredictionsTime}
            onChange={(val) => updateSetting('automation', 'dailyPredictionsTime', val)}
            description="Time to run daily predictions (24-hour format)"
            disabled={!settings.automation.dailyPredictionsEnabled}
          />
          <SettingField
            label="Performance Tracking"
            type="checkbox"
            value={settings.automation.performanceTrackingEnabled}
            onChange={(val) => updateSetting('automation', 'performanceTrackingEnabled', val)}
            description="Track and log prophet performance metrics"
          />
        </SettingsSection>

        {/* Performance Thresholds */}
        <SettingsSection title="Performance Thresholds">
          <SettingField
            label="Minimum R² Score"
            type="number"
            value={settings.performance.minAcceptableR2}
            onChange={(val) => updateSetting('performance', 'minAcceptableR2', Number(val))}
            description="Minimum acceptable R² coefficient (0-1)"
            min={0}
            max={1}
            step={0.05}
          />
          <SettingField
            label="Maximum MAPE"
            type="number"
            value={settings.performance.minAcceptableMAPE}
            onChange={(val) => updateSetting('performance', 'minAcceptableMAPE', Number(val))}
            description="Maximum acceptable Mean Absolute Percentage Error"
            min={0}
            max={1}
            step={0.01}
          />
          <SettingField
            label="Auto-deactivate Underperformers"
            type="checkbox"
            value={settings.performance.autoDeactivateUnderperformers}
            onChange={(val) => updateSetting('performance', 'autoDeactivateUnderperformers', val)}
            description="Automatically deactivate prophets below performance thresholds"
          />
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '1.5rem'
    }}>
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {children}
      </div>
    </div>
  );
}

interface SettingFieldProps {
  label: string;
  type: 'text' | 'number' | 'checkbox' | 'time';
  value: any;
  onChange: (value: any) => void;
  description?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

function SettingField({ label, type, value, onChange, description, disabled, min, max, step }: SettingFieldProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{label}</div>
        {description && (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{description}</div>
        )}
      </div>
      <div style={{ minWidth: type === 'checkbox' ? 'auto' : '200px' }}>
        {type === 'checkbox' ? (
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            style={{ width: '20px', height: '20px', cursor: disabled ? 'not-allowed' : 'pointer' }}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              fontSize: '0.875rem',
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? 'not-allowed' : 'text'
            }}
          />
        )}
      </div>
    </div>
  );
}
