/**
 * Dataset Visualizations Component
 * Complete visual and numerical descriptive analysis
 * - Correlation matrices
 * - Box plots by categorical variables
 * - Histograms and distributions
 * - Summary statistics
 */

import React, { useMemo, useState } from 'react';
import { BarChart3, Table2, TrendingUp, Activity, GitCompare, Box } from 'lucide-react';
import { analyzeDataset } from '../utils/dataAnalysis';

interface Props {
  data: any[];
  loading?: boolean;
}

export function DatasetVisualizations({ data, loading }: Props) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'distributions' | 'correlations' | 'comparisons' | 'data'>('overview');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategorical, setSelectedCategorical] = useState<string>('');
  const rowsPerPage = 50;

  const analysis = useMemo(() => {
    if (!data || data.length === 0) return null;
    return analyzeDataset(data);
  }, [data]);

  if (loading) {
    return <div className="loading">Analyzing dataset...</div>;
  }

  if (!analysis || analysis.rowCount === 0) {
    return (
      <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
        <p>No data available for analysis</p>
      </div>
    );
  }

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const paginatedData = data.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);
  const columns = Object.keys(data[0] || {});
  const numericalCols = analysis.columns.filter(c => c.type === 'numerical');
  const categoricalCols = analysis.columns.filter(c => c.type === 'categorical' || c.type === 'boolean');

  // Initialize selected categorical if not set
  if (!selectedCategorical && categoricalCols.length > 0) {
    setSelectedCategorical(categoricalCols[0].name);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem',
        borderBottom: '2px solid var(--border-color)',
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <TabButton 
          active={selectedTab === 'overview'} 
          onClick={() => setSelectedTab('overview')}
          icon={<Activity size={18} />}
          label="Overview"
        />
        <TabButton 
          active={selectedTab === 'distributions'} 
          onClick={() => setSelectedTab('distributions')}
          icon={<BarChart3 size={18} />}
          label="Distributions"
        />
        <TabButton 
          active={selectedTab === 'correlations'} 
          onClick={() => setSelectedTab('correlations')}
          icon={<GitCompare size={18} />}
          label="Correlations"
        />
        <TabButton 
          active={selectedTab === 'comparisons'} 
          onClick={() => setSelectedTab('comparisons')}
          icon={<Box size={18} />}
          label="Comparisons"
        />
        <TabButton 
          active={selectedTab === 'data'} 
          onClick={() => setSelectedTab('data')}
          icon={<Table2 size={18} />}
          label="Raw Data"
        />
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Summary Stats */}
          <div className="info-cards">
            <div className="info-card">
              <div className="info-card-header">
                <Activity size={20} />
                <h3>Dataset Summary</h3>
              </div>
              <div className="info-card-body">
                <div className="detail-row">
                  <span className="detail-label">Total Rows:</span>
                  <span className="detail-value">{analysis.rowCount.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total Columns:</span>
                  <span className="detail-value">{analysis.columnCount}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Numerical Columns:</span>
                  <span className="detail-value">{analysis.numericalColumns.length}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Text Columns:</span>
                  <span className="detail-value">{analysis.categoricalColumns.length}</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-header">
                <TrendingUp size={20} />
                <h3>Data Quality</h3>
              </div>
              <div className="info-card-body">
                <div className="detail-row">
                  <span className="detail-label">Total Values:</span>
                  <span className="detail-value">
                    {(analysis.rowCount * analysis.columnCount).toLocaleString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Columns Analyzed:</span>
                  <span className="detail-value">{analysis.columnCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column Statistics */}
          <div className="info-card">
            <div className="info-card-header">
              <BarChart3 size={20} />
              <h3>Column Statistics</h3>
            </div>
            <div className="info-card-body">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Type</th>
                      <th>Min</th>
                      <th>Max</th>
                      <th>Mean</th>
                      <th>Median</th>
                      <th>Std Dev</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.columns.filter(c => c.type === 'numerical').map(col => (
                      <tr key={col.name}>
                        <td><code>{col.name}</code></td>
                        <td><span className="badge badge-info">{col.type}</span></td>
                        <td>{col.min?.toFixed(2) || '—'}</td>
                        <td>{col.max?.toFixed(2) || '—'}</td>
                        <td>{col.mean?.toFixed(2) || '—'}</td>
                        <td>{col.median?.toFixed(2) || '—'}</td>
                        <td>{col.std?.toFixed(2) || '—'}</td>
                      </tr>
                    ))}
                    {analysis.columns.filter(c => c.type !== 'numerical').map(col => (
                      <tr key={col.name}>
                        <td><code>{col.name}</code></td>
                        <td><span className="badge badge-warning">{col.type}</span></td>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                          {col.uniqueCount ? `${col.uniqueCount} unique values` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distributions Tab */}
      {selectedTab === 'distributions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Histograms for Numerical Variables */}
          <div className="info-card">
            <div className="info-card-header">
              <BarChart3 size={20} />
              <h3>Numerical Distributions</h3>
            </div>
            <div className="info-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                {numericalCols.map(col => (
                  <div key={col.name}>
                    <h4 style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>{col.name}</h4>
                    <Histogram 
                      data={data.map(row => row[col.name]).filter(v => v !== null && v !== undefined && !isNaN(Number(v)))}
                      label={col.name}
                    />
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Min: {col.min?.toFixed(2)}</span>
                      <span>Mean: {col.mean?.toFixed(2)}</span>
                      <span>Max: {col.max?.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Categorical Distributions */}
          {categoricalCols.length > 0 && (
            <div className="info-card">
              <div className="info-card-header">
                <BarChart3 size={20} />
                <h3>Categorical Distributions</h3>
              </div>
              <div className="info-card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                  {categoricalCols.map(col => {
                    const valueCounts = data.reduce((acc: Record<string, number>, row) => {
                      const val = String(row[col.name] ?? 'null');
                      acc[val] = (acc[val] || 0) + 1;
                      return acc;
                    }, {});
                    const topValues = Object.entries(valueCounts)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 10);

                    return (
                      <div key={col.name}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>{col.name}</h4>
                        <BarChart 
                          data={topValues}
                          total={data.length}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Correlations Tab */}
      {selectedTab === 'correlations' && (
        <div className="info-card">
          <div className="info-card-header">
            <GitCompare size={20} />
            <h3>Correlation Matrix</h3>
          </div>
          <div className="info-card-body">
            {analysis.correlations && numericalCols.length > 1 ? (
              <>
                <CorrelationMatrix 
                  correlations={analysis.correlations}
                  labels={numericalCols.map(c => c.name)}
                />
                
                {/* Top Correlations */}
                <div style={{ marginTop: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>Strongest Correlations</h4>
                  <TopCorrelationsList 
                    correlations={analysis.correlations}
                    labels={numericalCols.map(c => c.name)}
                  />
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>Need at least 2 numerical columns for correlation analysis</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparisons Tab - Box plots by categorical */}
      {selectedTab === 'comparisons' && (
        <div className="info-card">
          <div className="info-card-header">
            <Box size={20} />
            <h3>Numerical Comparisons by Category</h3>
          </div>
          <div className="info-card-body">
            {categoricalCols.length > 0 && numericalCols.length > 0 ? (
              <>
                {/* Category Selector */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                    Group by:
                  </label>
                  <select 
                    value={selectedCategorical}
                    onChange={(e) => setSelectedCategorical(e.target.value)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  >
                    {categoricalCols.map(col => (
                      <option key={col.name} value={col.name}>{col.name}</option>
                    ))}
                  </select>
                </div>

                {/* Box plots for each numerical variable */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                  {numericalCols.map(numCol => {
                    const groupedData = data.reduce((acc: Record<string, number[]>, row) => {
                      const category = String(row[selectedCategorical] ?? 'null');
                      const value = Number(row[numCol.name]);
                      if (!isNaN(value)) {
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(value);
                      }
                      return acc;
                    }, {});

                    return (
                      <div key={numCol.name}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
                          {numCol.name} by {selectedCategorical}
                        </h4>
                        <BoxPlotComparison 
                          groupedData={groupedData}
                          label={numCol.name}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>Need both categorical and numerical columns for comparison analysis</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'data' && (
        <div className="info-card">
          <div className="info-card-header">
            <Table2 size={20} />
            <h3>Raw Data Preview</h3>
          </div>
          <div className="info-card-body">
            <div className="table-container" style={{ maxHeight: '600px', overflow: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, i) => (
                    <tr key={i}>
                      {columns.map(col => (
                        <td key={col}>
                          {row[col] !== null && row[col] !== undefined 
                            ? String(row[col]) 
                            : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)'
              }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="action-button"
                  style={{ opacity: currentPage === 0 ? 0.5 : 1 }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="action-button"
                  style={{ opacity: currentPage === totalPages - 1 ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        background: active ? 'var(--primary-color)' : 'transparent',
        color: active ? 'white' : 'var(--text-primary)',
        border: 'none',
        borderRadius: '8px 8px 0 0',
        cursor: 'pointer',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.2s'
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// Histogram Component
function Histogram({ data, label }: { data: number[]; label: string }) {
  if (data.length === 0) return <div className="empty-state">No data</div>;

  const bins = 25;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;
  
  const histogram = Array(bins).fill(0);
  data.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
    histogram[binIndex]++;
  });
  
  const maxCount = Math.max(...histogram);
  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = chartWidth / bins;
  
  return (
    <svg width={width} height={height} style={{ background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
      {/* Y-axis */}
      <line 
        x1={padding.left} 
        y1={padding.top} 
        x2={padding.left} 
        y2={height - padding.bottom}
        stroke="var(--text-secondary)"
        strokeWidth="1"
      />
      {/* X-axis */}
      <line 
        x1={padding.left} 
        y1={height - padding.bottom} 
        x2={width - padding.right} 
        y2={height - padding.bottom}
        stroke="var(--text-secondary)"
        strokeWidth="1"
      />
      
      {/* Y-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map(tick => (
        <g key={tick}>
          <line
            x1={padding.left - 5}
            y1={height - padding.bottom - (tick * chartHeight)}
            x2={padding.left}
            y2={height - padding.bottom - (tick * chartHeight)}
            stroke="var(--text-secondary)"
            strokeWidth="1"
          />
          <text
            x={padding.left - 10}
            y={height - padding.bottom - (tick * chartHeight)}
            textAnchor="end"
            alignmentBaseline="middle"
            fill="var(--text-secondary)"
            fontSize="10"
          >
            {Math.round(tick * maxCount)}
          </text>
        </g>
      ))}
      
      {/* Bars */}
      {histogram.map((count, i) => {
        const barHeight = (count / maxCount) * chartHeight;
        return (
          <g key={i}>
            <rect
              x={padding.left + i * barWidth + 1}
              y={height - padding.bottom - barHeight}
              width={barWidth - 2}
              height={barHeight}
              fill="url(#gradient)"
              opacity="0.9"
            />
            <title>{`${(min + i * binWidth).toFixed(2)} - ${(min + (i + 1) * binWidth).toFixed(2)}\nCount: ${count}`}</title>
          </g>
        );
      })}
      
      {/* X-axis labels */}
      <text
        x={padding.left}
        y={height - 10}
        fill="var(--text-secondary)"
        fontSize="10"
      >
        {min.toFixed(1)}
      </text>
      <text
        x={width - padding.right}
        y={height - 10}
        textAnchor="end"
        fill="var(--text-secondary)"
        fontSize="10"
      >
        {max.toFixed(1)}
      </text>
      
      {/* Gradient */}
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#1d4ed8', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Bar Chart Component for Categorical
function BarChart({ data, total }: { data: [string, number][]; total: number }) {
  const maxCount = Math.max(...data.map(([, count]) => count));
  const width = 500;
  const height = Math.max(200, data.length * 30);
  const padding = { top: 20, right: 80, bottom: 20, left: 120 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barHeight = chartHeight / data.length;
  
  return (
    <svg width={width} height={height} style={{ background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
      {data.map(([value, count], i) => {
        const barWidth = (count / maxCount) * chartWidth;
        const y = padding.top + i * barHeight;
        
        return (
          <g key={i}>
            {/* Bar */}
            <rect
              x={padding.left}
              y={y + 2}
              width={barWidth}
              height={barHeight - 4}
              fill="#3b82f6"
              opacity="0.8"
              rx="4"
            />
            
            {/* Label */}
            <text
              x={padding.left - 10}
              y={y + barHeight / 2}
              textAnchor="end"
              alignmentBaseline="middle"
              fill="var(--text-primary)"
              fontSize="11"
              fontWeight="500"
            >
              {value.length > 15 ? value.substring(0, 15) + '...' : value}
            </text>
            
            {/* Count & Percentage */}
            <text
              x={padding.left + barWidth + 10}
              y={y + barHeight / 2}
              alignmentBaseline="middle"
              fill="var(--text-secondary)"
              fontSize="10"
            >
              {count} ({((count / total) * 100).toFixed(1)}%)
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Correlation Matrix Component
function CorrelationMatrix({ correlations, labels }: { correlations: number[][]; labels: string[] }) {
  const getColor = (value: number) => {
    if (value > 0.7) return '#10b981'; // strong positive
    if (value > 0.3) return '#34d399'; // moderate positive
    if (value > -0.3) return '#6b7280'; // weak
    if (value > -0.7) return '#f59e0b'; // moderate negative
    return '#ef4444'; // strong negative
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: '0.75rem', margin: '0 auto' }}>
        <thead>
          <tr>
            <th style={{ padding: '0.5rem', border: '1px solid var(--border-color)' }}></th>
            {labels.map((label, i) => (
              <th key={i} style={{ 
                padding: '0.5rem', 
                border: '1px solid var(--border-color)',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                minWidth: '40px'
              }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {correlations.map((row, i) => (
            <tr key={i}>
              <th style={{ padding: '0.5rem', border: '1px solid var(--border-color)', textAlign: 'left' }}>
                {labels[i]}
              </th>
              {row.map((value, j) => (
                <td
                  key={j}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    background: i === j ? 'var(--bg-tertiary)' : `${getColor(value)}22`,
                    color: getColor(value),
                    fontWeight: Math.abs(value) > 0.5 ? 'bold' : 'normal',
                    textAlign: 'center',
                    minWidth: '50px'
                  }}
                >
                  {value.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Top Correlations List
function TopCorrelationsList({ correlations, labels }: { correlations: number[][]; labels: string[] }) {
  const pairs: Array<{ var1: string; var2: string; corr: number }> = [];
  
  for (let i = 0; i < correlations.length; i++) {
    for (let j = i + 1; j < correlations[i].length; j++) {
      pairs.push({
        var1: labels[i],
        var2: labels[j],
        corr: correlations[i][j]
      });
    }
  }
  
  pairs.sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));
  const top10 = pairs.slice(0, 10);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {top10.map((pair, i) => (
        <div key={i} style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '0.75rem',
          background: 'var(--bg-tertiary)',
          borderRadius: '8px',
          fontSize: '0.875rem'
        }}>
          <span><code>{pair.var1}</code> ↔ <code>{pair.var2}</code></span>
          <span style={{
            fontWeight: 'bold',
            color: pair.corr > 0.7 ? '#10b981' : pair.corr < -0.7 ? '#ef4444' : 'var(--text-secondary)'
          }}>
            {pair.corr > 0 ? '+' : ''}{pair.corr.toFixed(3)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Box Plot Comparison Component
function BoxPlotComparison({ groupedData, label }: { groupedData: Record<string, number[]>; label: string }) {
  const categories = Object.keys(groupedData).slice(0, 15); // Show up to 15 categories
  
  const stats = categories.map(cat => {
    const values = groupedData[cat].sort((a, b) => a - b);
    const n = values.length;
    if (n === 0) return null;
    
    return {
      category: cat,
      min: values[0],
      q25: values[Math.floor(n * 0.25)],
      median: values[Math.floor(n * 0.5)],
      q75: values[Math.floor(n * 0.75)],
      max: values[n - 1],
      count: n
    };
  }).filter(Boolean) as Array<{ category: string; min: number; q25: number; median: number; q75: number; max: number; count: number }>;
  
  if (stats.length === 0) return <div className="empty-state">No data to display</div>;
  
  const globalMin = Math.min(...stats.map(s => s.min));
  const globalMax = Math.max(...stats.map(s => s.max));
  const range = globalMax - globalMin;
  
  const width = 700;
  const height = Math.max(300, stats.length * 40);
  const padding = { top: 20, right: 100, bottom: 40, left: 150 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const boxHeight = Math.min(30, chartHeight / stats.length - 10);
  
  const getX = (value: number) => padding.left + ((value - globalMin) / range) * chartWidth;
  
  return (
    <svg width={width} height={height} style={{ background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
      {/* X-axis */}
      <line
        x1={padding.left}
        y1={height - padding.bottom}
        x2={width - padding.right}
        y2={height - padding.bottom}
        stroke="var(--text-secondary)"
        strokeWidth="1"
      />
      
      {/* X-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map(tick => {
        const value = globalMin + tick * range;
        const x = getX(value);
        return (
          <g key={tick}>
            <line
              x1={x}
              y1={height - padding.bottom}
              x2={x}
              y2={height - padding.bottom + 5}
              stroke="var(--text-secondary)"
              strokeWidth="1"
            />
            <text
              x={x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              fill="var(--text-secondary)"
              fontSize="10"
            >
              {value.toFixed(1)}
            </text>
          </g>
        );
      })}
      
      {/* Box plots */}
      {stats.map((stat, i) => {
        const y = padding.top + (i * chartHeight / stats.length) + (chartHeight / stats.length) / 2;
        
        return (
          <g key={i}>
            {/* Category label */}
            <text
              x={padding.left - 10}
              y={y}
              textAnchor="end"
              alignmentBaseline="middle"
              fill="var(--text-primary)"
              fontSize="11"
              fontWeight="500"
            >
              {stat.category.length > 20 ? stat.category.substring(0, 20) + '...' : stat.category}
            </text>
            
            {/* Min-Max whiskers */}
            <line
              x1={getX(stat.min)}
              y1={y}
              x2={getX(stat.max)}
              y2={y}
              stroke="#6b7280"
              strokeWidth="2"
            />
            
            {/* Min whisker */}
            <line
              x1={getX(stat.min)}
              y1={y - boxHeight/4}
              x2={getX(stat.min)}
              y2={y + boxHeight/4}
              stroke="#6b7280"
              strokeWidth="2"
            />
            
            {/* Max whisker */}
            <line
              x1={getX(stat.max)}
              y1={y - boxHeight/4}
              x2={getX(stat.max)}
              y2={y + boxHeight/4}
              stroke="#6b7280"
              strokeWidth="2"
            />
            
            {/* IQR box */}
            <rect
              x={getX(stat.q25)}
              y={y - boxHeight/2}
              width={getX(stat.q75) - getX(stat.q25)}
              height={boxHeight}
              fill="#3b82f6"
              stroke="#1d4ed8"
              strokeWidth="2"
              opacity="0.7"
              rx="3"
            />
            
            {/* Median line */}
            <line
              x1={getX(stat.median)}
              y1={y - boxHeight/2}
              x2={getX(stat.median)}
              y2={y + boxHeight/2}
              stroke="white"
              strokeWidth="3"
            />
            
            {/* Count label */}
            <text
              x={width - padding.right + 10}
              y={y}
              alignmentBaseline="middle"
              fill="var(--text-secondary)"
              fontSize="10"
            >
              n={stat.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
