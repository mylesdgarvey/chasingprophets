# Data Slice Architecture

## Overview
Data slices represent fixed, immutable time windows of datasets used for model training.

## Slice Types

### Simple Slices
- Single contiguous time period
- Direct data source (references dataset)
- Can be used independently for training
- Examples:
  - Training period: 2020-01-01 to 2022-12-31
  - Validation period: 2023-01-01 to 2023-06-30
  - Test period: 2023-07-01 to 2023-12-31

### Compound Slices
- Union of multiple simple slices
- **Can ONLY be formed from simple slices** (not from other compound slices)
- Date range is computed from base slices:
  - `startDate`: Earliest date among all base slices
  - `endDate`: Latest date among all base slices
- Schema validation: All base slices must have identical schemas
- Use cases:
  - Train+Validation combined: `[train_slice, validation_slice]`
  - Multi-year non-contiguous data: `[2020_data, 2022_data, 2024_data]`
  - K-fold cross-validation: Different combinations of folds

## Schema Information
All slices (simple and compound) include:
- `availableColumns`: List of column names
- `columnTypes`: Map of column name → field type (numerical, text, categorical, datetime, boolean)
- `columnRanges`: For numerical columns, min/max values

For compound slices:
- Schema is inherited from first base slice
- All base slices must have matching schemas
- Numerical ranges are merged (min of mins, max of maxes)

## Validation Rules
1. Compound slices must reference at least one base slice
2. All base slices must exist and be of type 'simple'
3. All base slices must be from the same dataset
4. All base slices must have identical column schemas
5. Base slice references cannot be circular (no compound in compound)

## Example Usage

```typescript
// Create simple slices
const trainSlice = await createDataSlice({
  dataSliceId: 'DJIA_train_2020-2022',
  datasetId: 'DJIA_OHLCV',
  sliceType: 'simple',
  startDate: '2020-01-01',
  endDate: '2022-12-31',
  availableColumns: ['date', 'open', 'high', 'low', 'close', 'volume'],
  columnTypes: { /* ... */ }
});

const validationSlice = await createDataSlice({
  dataSliceId: 'DJIA_validation_2023',
  datasetId: 'DJIA_OHLCV',
  sliceType: 'simple',
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  availableColumns: ['date', 'open', 'high', 'low', 'close', 'volume'],
  columnTypes: { /* ... */ }
});

// Create compound slice
const compoundSlice = await createCompoundSlice(
  'DJIA_train_validation_2020-2023',
  ['DJIA_train_2020-2022', 'DJIA_validation_2023'],
  'Combined training and validation data'
);

// compoundSlice.startDate === '2020-01-01' (earliest)
// compoundSlice.endDate === '2023-12-31' (latest)
// compoundSlice.baseSliceIds === ['DJIA_train_2020-2022', 'DJIA_validation_2023']
```
