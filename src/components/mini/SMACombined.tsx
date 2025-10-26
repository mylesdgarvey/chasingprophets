import React from 'react';

interface Props {
  sma20: Array<number | null>;
  sma50: Array<number | null>;
  sma200: Array<number | null>;
  currentValue?: number | null;
  width?: number;
  height?: number;
  showScale?: boolean;
}

function toPath(data: Array<number | null>, w: number, h: number) {
  const vals = data.map(v => (v === null || v === undefined || Number.isNaN(v) ? NaN : (v as number)));
  const clean: number[] = [];
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i];
    if (!Number.isNaN(v)) clean.push(v);
  }
  if (!clean.length) return '';
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;
  const validCount = clean.length;
  const step = w / Math.max(1, validCount - 1);
  if (validCount === 1) {
    const x = w / 2;
    const y = h - ((clean[0] - min) / range) * h;
    const len = Math.min(6, w * 0.05);
    return `M ${Math.max(0, x - len)} ${y.toFixed(2)} L ${Math.min(w, x + len)} ${y.toFixed(2)}`;
  }
  let path = '';
  for (let k = 0; k < validCount; k++) {
    const v = clean[k];
    const x = k * step;
    const y = h - ((v - min) / range) * h;
    path += (path ? ' L ' : 'M ') + x.toFixed(2) + ' ' + y.toFixed(2);
  }
  return path;
}

export default function SMACombined({ sma20, sma50, sma200, currentValue, width = 220, height = 48, showScale = true }: Props) {
  // Combine all three series to compute shared min/max
  const allVals = [...sma20, ...sma50, ...sma200].filter(v => v !== null && v !== undefined && !Number.isNaN(v)) as number[];
  const hasData = allVals.length > 0;
  const globalMin = hasData ? Math.min(...allVals) : 0;
  const globalMax = hasData ? Math.max(...allVals) : 1;
  const globalRange = globalMax - globalMin || 1;

  // Helper to draw a path with shared scale
  const drawPath = (data: Array<number | null>) => {
    const vals = data.map(v => (v === null || v === undefined || Number.isNaN(v) ? NaN : (v as number)));
    const clean: number[] = [];
    for (let i = 0; i < vals.length; i++) {
      const v = vals[i];
      if (!Number.isNaN(v)) clean.push(v);
    }
    if (!clean.length) return '';
    const validCount = clean.length;
    const step = width / Math.max(1, validCount - 1);
    if (validCount === 1) {
      const x = width / 2;
      const y = height - ((clean[0] - globalMin) / globalRange) * height;
      const len = Math.min(6, width * 0.05);
      return `M ${Math.max(0, x - len)} ${y.toFixed(2)} L ${Math.min(width, x + len)} ${y.toFixed(2)}`;
    }
    let path = '';
    for (let k = 0; k < validCount; k++) {
      const v = clean[k];
      const x = k * step;
      const y = height - ((v - globalMin) / globalRange) * height;
      path += (path ? ' L ' : 'M ') + x.toFixed(2) + ' ' + y.toFixed(2);
    }
    return path;
  };

  const path20 = drawPath(sma20);
  const path50 = drawPath(sma50);
  const path200 = drawPath(sma200);

  // Get last values for display
  const getLastValue = (series: Array<number | null>) => {
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i] !== null && series[i] !== undefined && !Number.isNaN(series[i] as number)) {
        return series[i] as number;
      }
    }
    return null;
  };

  const last20 = getLastValue(sma20);
  const last50 = getLastValue(sma50);
  const last200 = getLastValue(sma200);

  const display = currentValue === null || currentValue === undefined ? '—' : (isFinite(currentValue as number) ? (currentValue as number).toFixed(2) : String(currentValue));

  return (
    <div className="mini-indicator-row" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div className="mini-label" style={{ width: 120, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>SMA(20/50/200)</div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.2 }}>
          <div style={{ color: '#ef4444' }}>20: {last20 ? last20.toFixed(1) : '—'}</div>
          <div style={{ color: '#f97316' }}>50: {last50 ? last50.toFixed(1) : '—'}</div>
          <div style={{ color: '#06b6d4' }}>200: {last200 ? last200.toFixed(1) : '—'}</div>
        </div>
      </div>
      <div className="mini-sparkline" style={{ flex: '1 1 auto', position: 'relative' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block', width: '100%', color: 'var(--text)' }}>
          {/* baseline */}
          <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(15,23,42,0.06)" strokeWidth={1} />
          
          {/* vertical gridlines if showScale is true */}
          {showScale && (
            <>
              {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
                <line key={`v${i}`} x1={frac * width} y1={0} x2={frac * width} y2={height} stroke="rgba(15,23,42,0.05)" strokeWidth={0.5} />
              ))}
            </>
          )}
          
          {/* Three SMA lines with different colors */}
          {path20 && <path d={path20} stroke="#ef4444" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          {path50 && <path d={path50} stroke="#f97316" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          {path200 && <path d={path200} stroke="#06b6d4" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
      </div>
      
      {/* Y-axis scale labels */}
      {showScale && hasData && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)', width: 28, height: height, textAlign: 'right', paddingRight: 4, lineHeight: 1 }}>
          <div>{globalMax.toFixed(0)}</div>
          <div>{((globalMin + globalMax) / 2).toFixed(0)}</div>
          <div>{globalMin.toFixed(0)}</div>
        </div>
      )}
    </div>
  );
}
