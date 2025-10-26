import React from 'react';

interface Props {
  name: string;
  value: number | null | undefined;
  series: Array<number | null>;
  width?: number;
  height?: number;
  thresholds?: { low?: number; high?: number } | null;
  histogram?: boolean; // render histogram bars (for MACD)
  showScale?: boolean; // show Y-axis numbers and gridlines
}

function toPath(data: Array<number | null>, w: number, h: number) {
  // Normalize X positions to the count of valid points so long lookbacks (many nulls)
  // don't squeeze the line to the right edge.
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
  // If there's only one valid point, draw a short horizontal line centered
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

export default function MiniIndicator({ name, value, series, width = 220, height = 48, thresholds, histogram, showScale = true }: Props) {
  const path = toPath(series, width, height);
  const display = value === null || value === undefined ? '—' : (isFinite(value as number) ? (value as number).toFixed(2) : String(value));
  // Normalized last point (based on valid values only)
  const vals = series.map(v => (v === null || v === undefined || Number.isNaN(v) ? NaN : (v as number)));
  const clean: number[] = [];
  for (let i = 0; i < vals.length; i++) { const v = vals[i]; if (!Number.isNaN(v)) clean.push(v); }
  const lastIndexNorm = clean.length ? clean.length - 1 : -1;
  const min = clean.length ? Math.min(...clean) : 0;
  const max = clean.length ? Math.max(...clean) : 1;
  const range = (max - min) || 1;
  const step = width / Math.max(1, clean.length - 1);
  const lastX = lastIndexNorm >= 0 ? lastIndexNorm * step : 0;
  const lastY = lastIndexNorm >= 0 ? height - ((clean[clean.length - 1] - min) / range) * height : height / 2;

  return (
    <div className="mini-indicator-row" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div className="mini-label" style={{ width: 120, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{display}</div>
      </div>
      <div className="mini-sparkline" style={{ flex: '1 1 auto', position: 'relative' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block', width: '100%', color: 'var(--text)' }}>
          {/* baseline for visibility */}
          <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(15,23,42,0.06)" strokeWidth={1} />
          
          {/* vertical gridlines if showScale is true */}
          {showScale && (
            <>
              {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
                <line key={`v${i}`} x1={frac * width} y1={0} x2={frac * width} y2={height} stroke="rgba(15,23,42,0.05)" strokeWidth={0.5} />
              ))}
            </>
          )}
          {/* shaded threshold regions for indicators like RSI */}
          {thresholds && (thresholds.low !== undefined || thresholds.high !== undefined) && clean.length > 0 && (
            (() => {
              const yFor = (val: number) => {
                const clamped = Math.min(max, Math.max(min, val));
                return height - ((clamped - min) / range) * height;
              };
              const parts: React.ReactElement[] = [];
              if (thresholds.high !== undefined) {
                const yH = yFor(thresholds.high);
                parts.push(<rect key="high" x={0} y={0} width={width} height={Math.max(0, yH)} fill="rgba(239,68,68,0.06)" />);
              }
              if (thresholds.low !== undefined) {
                const yL = yFor(thresholds.low);
                parts.push(<rect key="low" x={0} y={yL} width={width} height={Math.max(0, height - yL)} fill="rgba(16,185,129,0.06)" />);
              }
              return <>{parts}</>;
            })()
          )}
          {histogram ? (
            (() => {
              // draw bars for histogram series
              const validVals: number[] = series
                .map(v => (v === null || v === undefined || Number.isNaN(v) ? NaN : (v as number)))
                .filter(v => !Number.isNaN(v));
              const vMin = validVals.length ? Math.min(...validVals) : 0;
              const vMax = validVals.length ? Math.max(...validVals) : 1;
              const vRange = (vMax - vMin) || 1;
              const validCount = validVals.length;
              const barW = width / Math.max(1, validCount);
              const zeroY = height / 2;
              return validVals.map((val, k) => {
                const h = Math.min(height / 2, Math.abs((val - vMin) / vRange) * (height / 2));
                const x = k * barW + barW * 0.1;
                const barH = Math.max(1, h);
                const y = val >= 0 ? zeroY - barH : zeroY;
                const color = val >= 0 ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.9)';
                return <rect key={k} x={x} y={y} width={Math.max(1, barW * 0.8)} height={barH} fill={color} />;
              });
            })()
          ) : path ? (
            <>
              <path d={path} stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : null}
        </svg>
      </div>
      
      {/* Y-axis scale labels (min, mid, max) shown to the right */}
      {showScale && clean.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)', width: 28, height: height, textAlign: 'right', paddingRight: 4, lineHeight: 1 }}>
          <div>{max.toFixed(0)}</div>
          <div>{((min + max) / 2).toFixed(0)}</div>
          <div>{min.toFixed(0)}</div>
        </div>
      )}
    </div>
  );
}
