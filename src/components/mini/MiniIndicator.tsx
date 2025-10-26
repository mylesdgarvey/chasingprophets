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
  yDomain?: { min: number; max: number } | null; // fixed Y bounds (e.g., 0-100 for RSI)
}

function toPath(values: number[], w: number, h: number, min: number, max: number) {
  if (!values.length) return '';
  const range = max - min || 1;
  const count = values.length;
  const step = w / Math.max(1, count - 1);
  if (count === 1) {
    const x = w / 2;
    const y = h - ((values[0] - min) / range) * h;
    const len = Math.min(6, w * 0.05);
    return `M ${Math.max(0, x - len)} ${y.toFixed(2)} L ${Math.min(w, x + len)} ${y.toFixed(2)}`;
  }
  let path = '';
  for (let k = 0; k < count; k++) {
    const v = values[k];
    const x = k * step;
    const y = h - ((v - min) / range) * h;
    path += (path ? ' L ' : 'M ') + x.toFixed(2) + ' ' + y.toFixed(2);
  }
  return path;
}

export default function MiniIndicator({ name, value, series, width = 220, height = 48, thresholds, histogram, showScale = true, yDomain }: Props) {
  const numericSeries = series.map(v => (v === null || v === undefined || Number.isNaN(v) ? NaN : (v as number)));
  const clean: number[] = [];
  for (let i = 0; i < numericSeries.length; i++) {
    const v = numericSeries[i];
    if (!Number.isNaN(v)) clean.push(v);
  }

  const hasData = clean.length > 0;
  const domainMin = (() => {
    if (yDomain) return yDomain.min;
    if (hasData) return Math.min(...clean);
    return 0;
  })();
  const domainMax = (() => {
    if (yDomain) return yDomain.max;
    if (hasData) return Math.max(...clean);
    return 1;
  })();
  const safeMax = domainMax === domainMin ? domainMax + 1 : domainMax;
  const range = safeMax - domainMin || 1;

  const normalizedValues = clean.map(v => {
    const clamped = Math.max(domainMin, Math.min(safeMax, v));
    return clamped;
  });

  const path = histogram ? '' : toPath(normalizedValues, width, height, domainMin, safeMax);
  const display = value === null || value === undefined ? '—' : (isFinite(value as number) ? (value as number).toFixed(2) : String(value));
  const labelTop = safeMax;
  const labelMid = domainMin + range / 2;
  const labelBottom = domainMin;

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
          {thresholds && (thresholds.low !== undefined || thresholds.high !== undefined) && hasData && (
            (() => {
              const yFor = (val: number) => {
                const clamped = Math.min(safeMax, Math.max(domainMin, val));
                return height - ((clamped - domainMin) / range) * height;
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
              const validVals = clean;
              const validCount = validVals.length;
              const barW = width / Math.max(1, validCount);
              const maxAbs = (() => {
                if (yDomain) return Math.max(Math.abs(yDomain.min), Math.abs(yDomain.max)) || 1;
                const maxima = validVals.map(v => Math.abs(v));
                return maxima.length ? Math.max(...maxima) || 1 : 1;
              })();
              const zeroY = (() => {
                if (!yDomain) return height / 2;
                if (yDomain.max <= 0) return 0;
                if (yDomain.min >= 0) return height;
                const ratio = (0 - yDomain.min) / (yDomain.max - yDomain.min || 1);
                return height - ratio * height;
              })();
              return validVals.map((val, k) => {
                const magnitude = Math.min(1, Math.abs(val) / maxAbs);
                const h = magnitude * (height / 2);
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
      {showScale && hasData && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)', width: 28, height: height, textAlign: 'right', paddingRight: 4, lineHeight: 1 }}>
          <div>{labelTop.toFixed(0)}</div>
          <div>{labelMid.toFixed(0)}</div>
          <div>{labelBottom.toFixed(0)}</div>
        </div>
      )}
    </div>
  );
}
