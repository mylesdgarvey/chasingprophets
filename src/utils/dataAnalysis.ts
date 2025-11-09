/**
 * Data Analysis Utilities
 * Analyzes tabular datasets and generates statistics
 */

export interface ColumnStats {
  name: string;
  type: 'numerical' | 'categorical' | 'datetime' | 'boolean';
  count: number;
  nullCount: number;
  uniqueCount: number;
  
  // Numerical stats
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  q25?: number;
  q75?: number;
  
  // Categorical stats
  topValues?: Array<{ value: any; count: number; percentage: number }>;
  
  // Datetime stats
  minDate?: string;
  maxDate?: string;
}

export interface DatasetAnalysis {
  rowCount: number;
  columnCount: number;
  columns: ColumnStats[];
  correlations?: number[][];  // Correlation matrix for numerical columns
  numericalColumns: string[];
  categoricalColumns: string[];
  datetimeColumns: string[];
}

/**
 * Infer column type from sample values
 */
function inferColumnType(values: any[]): 'numerical' | 'categorical' | 'datetime' | 'boolean' {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'categorical';
  
  const sample = nonNullValues.slice(0, 100);
  
  // Check for boolean
  const uniqueVals = new Set(sample.map(v => String(v).toLowerCase()));
  if (uniqueVals.size <= 2 && 
      [...uniqueVals].every(v => ['true', 'false', '0', '1', 'yes', 'no'].includes(v))) {
    return 'boolean';
  }
  
  // Check for datetime
  const datePattern = /^\d{4}-\d{2}-\d{2}/;
  if (sample.every(v => datePattern.test(String(v)) || !isNaN(Date.parse(String(v))))) {
    return 'datetime';
  }
  
  // Check for numerical
  const numericCount = sample.filter(v => !isNaN(Number(v)) && String(v).trim() !== '').length;
  if (numericCount / sample.length > 0.8) {
    return 'numerical';
  }
  
  return 'categorical';
}

/**
 * Calculate basic statistics for numerical array
 */
function calculateNumericalStats(values: number[]): Partial<ColumnStats> {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  
  const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const std = Math.sqrt(variance);
  
  const median = n % 2 === 0 
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
    : sorted[Math.floor(n / 2)];
  
  const q25 = sorted[Math.floor(n * 0.25)];
  const q75 = sorted[Math.floor(n * 0.75)];
  
  return {
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    std: Number(std.toFixed(4)),
    min: sorted[0],
    max: sorted[n - 1],
    q25,
    q75
  };
}

/**
 * Calculate top values for categorical column
 */
function calculateTopValues(values: any[], maxTop: number = 10): Array<{ value: any; count: number; percentage: number }> {
  const counts = new Map<any, number>();
  values.forEach(v => {
    const val = v === null || v === undefined ? 'null' : String(v);
    counts.set(val, (counts.get(val) || 0) + 1);
  });
  
  const total = values.length;
  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      count,
      percentage: Number(((count / total) * 100).toFixed(2))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxTop);
}

/**
 * Calculate Pearson correlation coefficient
 */
function correlation(x: number[], y: number[]): number {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
  const sumX2 = x.reduce((acc, val) => acc + val * val, 0);
  const sumY2 = y.reduce((acc, val) => acc + val * val, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Analyze a tabular dataset
 */
export function analyzeDataset(data: any[]): DatasetAnalysis {
  if (!data || data.length === 0) {
    return {
      rowCount: 0,
      columnCount: 0,
      columns: [],
      numericalColumns: [],
      categoricalColumns: [],
      datetimeColumns: []
    };
  }
  
  const rowCount = data.length;
  const columnNames = Object.keys(data[0]);
  const columnCount = columnNames.length;
  
  // Analyze each column
  const columns: ColumnStats[] = columnNames.map(colName => {
    const values = data.map(row => row[colName]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const nullCount = values.length - nonNullValues.length;
    const uniqueCount = new Set(nonNullValues).size;
    
    const type = inferColumnType(values);
    
    const stats: ColumnStats = {
      name: colName,
      type,
      count: values.length,
      nullCount,
      uniqueCount
    };
    
    if (type === 'numerical') {
      const numValues = nonNullValues.map(v => Number(v)).filter(v => !isNaN(v));
      Object.assign(stats, calculateNumericalStats(numValues));
    } else if (type === 'categorical' || type === 'boolean') {
      stats.topValues = calculateTopValues(values);
    } else if (type === 'datetime') {
      const dates = nonNullValues.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
      if (dates.length > 0) {
        stats.minDate = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString();
        stats.maxDate = new Date(Math.max(...dates.map(d => d.getTime()))).toISOString();
      }
    }
    
    return stats;
  });
  
  // Group columns by type
  const numericalColumns = columns.filter(c => c.type === 'numerical').map(c => c.name);
  const categoricalColumns = columns.filter(c => c.type === 'categorical' || c.type === 'boolean').map(c => c.name);
  const datetimeColumns = columns.filter(c => c.type === 'datetime').map(c => c.name);
  
  // Calculate correlation matrix for numerical columns
  let correlations: number[][] | undefined;
  if (numericalColumns.length > 1) {
    correlations = numericalColumns.map(col1 => 
      numericalColumns.map(col2 => {
        if (col1 === col2) return 1;
        const values1 = data.map(row => Number(row[col1])).filter(v => !isNaN(v));
        const values2 = data.map(row => Number(row[col2])).filter(v => !isNaN(v));
        const minLen = Math.min(values1.length, values2.length);
        return Number(correlation(values1.slice(0, minLen), values2.slice(0, minLen)).toFixed(3));
      })
    );
  }
  
  return {
    rowCount,
    columnCount,
    columns,
    correlations,
    numericalColumns,
    categoricalColumns,
    datetimeColumns
  };
}
