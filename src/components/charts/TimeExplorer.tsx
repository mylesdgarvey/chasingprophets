import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
// @ts-ignore
import Plotly from 'plotly.js-dist-min';
import { PriceData } from '../../types/price';
import { usePlotlyTheme } from '../../hooks/usePlotlyTheme';

interface TimeExplorerProps {
  prices: PriceData[];
  height?: number;
}

type Window = 'week' | 'month' | 'quarter' | 'year';
type Measure = 'open' | 'close' | 'high' | 'low';

const windowLengths: Record<Window, number> = {
  week: 5,
  month: 21,
  quarter: 63,
  year: 252
};

function getYearColor(index: number, total: number, chartColors: string[]): string {
  // Cycle through theme colors based on year index
  return chartColors[index % chartColors.length];
}

function getISOWeekNumber(date: Date): number {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  return Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getQuarterFromMonth(monthIndex: number): number {
  return Math.floor(monthIndex / 3) + 1;
}

export default function TimeExplorer({ prices, height = 400 }: TimeExplorerProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const plotlyTheme = usePlotlyTheme();
  const [windowType, setWindowType] = useState<Window>('week');
  const [measure, setMeasure] = useState<Measure>('close');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [hiddenYears, setHiddenYears] = useState<number[]>([]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const now = useMemo(() => new Date(), []);

  const filteredPrices = useMemo(() => {
    return prices.filter(price => new Date(price.date) <= now);
  }, [prices, now]);

  const sortedPrices = useMemo(() => {
    return [...filteredPrices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredPrices]);

  const yearBuckets = useMemo(() => {
    if (!sortedPrices.length) return [] as Array<[number, PriceData[]]>;
    const buckets = new Map<number, PriceData[]>();
    sortedPrices.forEach(price => {
      const year = new Date(price.date).getFullYear();
      const list = buckets.get(year);
      if (list) {
        list.push(price);
      } else {
        buckets.set(year, [price]);
      }
    });
    return Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);
  }, [sortedPrices]);

  const chartData = useMemo(() => {
    if (!yearBuckets.length) return [] as any[];

    const expectedLength = windowLengths[windowType];
    const xValues = Array.from({ length: expectedLength }, (_, idx) => idx + 1);
    const traces: any[] = [];
    const totalYears = yearBuckets.length;

    yearBuckets.forEach(([year, data], idx) => {
      const filtered = (() => {
        if (windowType === 'week') {
          return data.filter(entry => getISOWeekNumber(new Date(entry.date)) === selectedWeek);
        }
        if (windowType === 'month') {
          return data.filter(entry => new Date(entry.date).getMonth() === selectedMonth);
        }
        if (windowType === 'quarter') {
          return data.filter(entry => getQuarterFromMonth(new Date(entry.date).getMonth()) === selectedQuarter);
        }
        return data;
      })().slice(0, expectedLength);

      if (!filtered.length) return;

      // Get baseline from the PREVIOUS period's last value
      const firstFilteredDate = new Date(filtered[0].date);
      const baseline = (() => {
        // Find all data points before the current period
        const priorData = data.filter(entry => new Date(entry.date) < firstFilteredDate);
        
        if (!priorData.length) {
          // If no prior data exists, use the first value of current period
          return filtered[0][measure];
        }
        
        // Get the last (most recent) prior data point
        const sortedPrior = priorData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return sortedPrior[0][measure];
      })();
      
      if (baseline === undefined || baseline === null || baseline === 0) return;

      const yValues: Array<number | null> = new Array(expectedLength).fill(null);
      const customDates: string[] = new Array(expectedLength).fill('');

      filtered.forEach((entry, dayIndex) => {
        if (dayIndex >= expectedLength) return;
        const pctChange = ((entry[measure] - baseline) / baseline) * 100;
        yValues[dayIndex] = pctChange;
        customDates[dayIndex] = entry.date;
      });

      traces.push({
        x: xValues,
        y: yValues,
        type: 'scatter',
        mode: 'lines+markers',
        name: `${year}`,
        line: {
          color: getYearColor(idx, totalYears, plotlyTheme.chartColors),
          width: 2
        },
        marker: { size: 6 },
        customdata: customDates,
        hovertemplate: 'Day %{x}<br>%{customdata}<br>%{y:.2f}%<extra></extra>',
        visible: hiddenYears.includes(year) ? 'legendonly' : true
      });
    });

    return traces;
  }, [yearBuckets, windowType, selectedWeek, selectedMonth, selectedQuarter, measure, hiddenYears, plotlyTheme]);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartData.length === 0) {
      Plotly.purge(chartRef.current);
      return;
    }

    const expectedLength = windowLengths[windowType];
    const layout = {
      height,
      margin: { t: 110, r: 10, l: 60, b: 40 },
      ...plotlyTheme,
      hovermode: 'x unified' as const,
      showlegend: false,
      xaxis: {
        title: { text: 'Day', font: { color: plotlyTheme.font.color } },
        ...plotlyTheme.xaxis,
        range: [0.5, expectedLength + 0.5]
      },
      yaxis: {
        title: { text: '% Change from Previous Period', font: { color: plotlyTheme.font.color } },
        ...plotlyTheme.yaxis
      }
    };

    Plotly.react(chartRef.current, chartData, layout, { responsive: true }).catch(console.error);

    return () => {
      if (chartRef.current) {
        Plotly.purge(chartRef.current);
      }
    };
  }, [chartData, height, windowType, plotlyTheme]);

  useEffect(() => {
    setHiddenYears([]);
  }, [prices]);

  const legendEntries = useMemo(() => {
    const totalYears = yearBuckets.length;
    return yearBuckets.map(([year], idx) => ({
      year,
      color: getYearColor(idx, totalYears, plotlyTheme.chartColors),
      hidden: hiddenYears.includes(year)
    }));
  }, [yearBuckets, hiddenYears, plotlyTheme]);

  const toggleYear = useCallback((year: number) => {
    setHiddenYears(prev => (
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    ));
  }, []);

  const legendCells = useMemo(() => {
    const columns = 6;
    const rows = 2;
    const totalCells = columns * rows;
    const entries = legendEntries.slice(0, totalCells);
    const padded: Array<typeof entries[number] | null> = [...entries];
    while (padded.length < totalCells) {
      padded.push(null);
    }
    return padded;
  }, [legendEntries]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        {(['week', 'month', 'quarter', 'year'] as const).map(w => (
          <button
            key={w}
            onClick={() => setWindowType(w)}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: windowType === w ? 'var(--primary)' : 'transparent',
              color: windowType === w ? 'white' : 'var(--text)',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
              fontWeight: windowType === w ? '600' : '500',
              fontSize: '13px',
              textTransform: 'capitalize'
            }}
          >
            By {w}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Measure:</label>
          <select
            value={measure}
            onChange={(e) => setMeasure(e.target.value as Measure)}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(0,0,0,0.2)',
              background: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            <option value="open">Open</option>
            <option value="close">Close</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
        </div>

        {windowType === 'week' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Week:</label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(0,0,0,0.2)',
                background: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {Array.from({ length: 52 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </div>
        )}

        {windowType === 'month' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(0,0,0,0.2)',
                background: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {monthNames.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
        )}

        {windowType === 'quarter' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Quarter:</label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(Number(e.target.value))}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(0,0,0,0.2)',
                background: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {[1, 2, 3, 4].map(q => (
                <option key={q} value={q}>Q{q}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {legendCells.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: '8px 12px',
            padding: '6px 0 4px',
            background: 'rgba(0,0,0,0)'
          }}
        >
          {legendCells.map((entry, idx) => (
            entry ? (
              <button
                key={entry.year}
                onClick={() => toggleYear(entry.year)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  justifyContent: 'center',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: entry.hidden ? '1px dashed rgba(37,99,235,0.6)' : '1px solid rgba(15,23,42,0.12)',
                  background: 'rgba(0,0,0,0)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  opacity: entry.hidden ? 0.45 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: entry.color,
                    boxShadow: entry.hidden ? 'none' : '0 0 0 2px rgba(15,23,42,0.08)'
                  }}
                ></span>
                <span>{entry.year}</span>
              </button>
            ) : (
              <div key={`legend-spacer-${idx}`} />
            )
          ))}
        </div>
      )}

      <div ref={chartRef} style={{ width: '100%', height }}></div>
    </div>
  );
}
