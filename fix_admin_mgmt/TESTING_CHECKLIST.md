# Admin Console CRUD Testing Checklist

This document tracks testing status for all CRUD operations implemented in the admin management console.

## Testing Overview

**Test Date**: November 9, 2025  
**Testing Scope**: Create, Read, Update, Delete operations for all entities  
**Access URL**: `/mgmt` (Management Dashboard)

---

## 1. Assets Management (`/mgmt/assets`)

### Create Asset
- [ ] Click "New Asset" button
- [ ] Modal opens with empty form
- [ ] Test validation:
  - [ ] Empty ticker shows error
  - [ ] Invalid ticker format (not uppercase) shows error
  - [ ] Empty name shows error
- [ ] Fill valid data:
  - Ticker: `TEST`
  - Name: `Test Asset`
  - Market: `NYSE`
- [ ] Click "Create Asset"
- [ ] Asset appears in list
- [ ] Success feedback shown

### Read Assets
- [ ] Asset list displays all assets
- [ ] Search by ticker works
- [ ] Search by name works
- [ ] Asset details show (ticker, name, market, lastPrice)

### Update Asset
- [ ] Click Edit button on an asset
- [ ] Modal opens pre-filled with asset data
- [ ] Ticker field is disabled (cannot change ID)
- [ ] Modify name and market
- [ ] Click "Update Asset"
- [ ] Changes reflected in list
- [ ] Success feedback shown

### Delete Asset
- [ ] Delete button exists (via service, not in UI yet)
- [ ] Can test via `deleteAsset('TEST')` in console

**Status**: ⚠️ **Needs Manual Testing**

---

## 2. Datasets Management (`/mgmt/datasets`)

### Create Dataset
- [ ] Click "New Dataset" button
- [ ] Modal opens with empty form
- [ ] Test validation:
  - [ ] Empty dataset ID shows error
  - [ ] Invalid ID format shows error
  - [ ] Empty asset selection shows error
  - [ ] Empty name shows error
  - [ ] Empty description shows error
  - [ ] No file upload shows error
- [ ] Select an asset from dropdown
- [ ] Upload a CSV file
- [ ] File analysis shows:
  - [ ] Record count
  - [ ] Date range (if date column exists)
- [ ] Fill dataset details:
  - Dataset ID: `dataset-test-data`
  - Name: `Test Dataset`
  - Description: `Test dataset for validation`
- [ ] Click "Create Dataset"
- [ ] File uploads to S3
- [ ] Dataset appears in list
- [ ] Success feedback shown

### Read Datasets
- [ ] Dataset list displays all datasets
- [ ] Search by dataset ID works
- [ ] Search by name works
- [ ] Filter by asset works
- [ ] Summary stats show (total datasets, unique assets, total records)
- [ ] Dataset details display:
  - [ ] Dataset ID
  - [ ] Name
  - [ ] Asset
  - [ ] Source (S3 path)
  - [ ] Record count
  - [ ] Date range
  - [ ] Last updated

### Update Dataset
- [ ] Click Edit button on a dataset
- [ ] Modal opens pre-filled with dataset data
- [ ] Dataset ID is disabled
- [ ] Asset is disabled
- [ ] S3 source path is read-only
- [ ] Modify name and description
- [ ] Click "Update Dataset"
- [ ] Changes reflected in list
- [ ] Success feedback shown

### Delete Dataset
- [ ] Click Delete button on a dataset
- [ ] Confirmation dialog appears
- [ ] Warning about affected data slices and models
- [ ] Confirm deletion
- [ ] Dataset removed from list
- [ ] Success feedback shown

**Status**: ⚠️ **Needs Manual Testing**

---

## 3. Data Slices Management (`/mgmt/data/slices`)

### Create Simple Slice
- [ ] Click "New Data Slice" button
- [ ] Modal opens with empty form
- [ ] Select "Simple" slice type
- [ ] Test validation:
  - [ ] Empty slice ID shows error
  - [ ] Invalid ID format shows error
  - [ ] Empty dataset selection shows error
  - [ ] Empty start date shows error
  - [ ] Empty end date shows error
  - [ ] End date before start date shows error
  - [ ] No columns defined shows error
- [ ] Fill slice details:
  - Slice ID: `slice-test-simple`
  - Dataset: Select from dropdown
  - Start Date: `2020-01-01`
  - End Date: `2023-12-31`
- [ ] Add columns:
  - [ ] Enter "open", select "Numerical"
  - [ ] Enter "close", select "Numerical"
  - [ ] Enter "volume", select "Numerical"
  - [ ] Remove a column (test delete)
- [ ] Add description
- [ ] Click "Create Slice"
- [ ] Slice appears in list
- [ ] Success feedback shown

### Create Compound Slice
- [ ] Click "New Data Slice" button
- [ ] Select "Compound" slice type
- [ ] Select dataset
- [ ] Add 2+ simple slices from dropdown
- [ ] Test validation:
  - [ ] Less than 2 slices shows error
- [ ] Remove a slice (test tag deletion)
- [ ] Add description
- [ ] Click "Create Slice"
- [ ] Compound slice appears in list
- [ ] Columns auto-merged from base slices
- [ ] Date range spans all base slices
- [ ] Success feedback shown

### Read Data Slices
- [ ] Slice list displays all slices
- [ ] Search by slice ID works
- [ ] Filter by dataset works
- [ ] Filter by type (simple/compound) works
- [ ] Slice details display:
  - [ ] Slice ID
  - [ ] Dataset/Asset
  - [ ] Type badge (simple/compound)
  - [ ] Date range
  - [ ] Column count
- [ ] Summary stats show (total, simple, compound)

### Update Data Slice
- [ ] Click Edit button on a slice
- [ ] Modal opens pre-filled with slice data
- [ ] Slice ID is disabled
- [ ] Dataset is disabled
- [ ] For simple slice:
  - [ ] Modify dates
  - [ ] Add/remove columns
  - [ ] Change column types
- [ ] For compound slice:
  - [ ] Add/remove base slices
- [ ] Click "Update Slice"
- [ ] Changes reflected in list
- [ ] Success feedback shown

**Status**: ⚠️ **Needs Manual Testing**

---

## 4. Prophets Management (`/mgmt/prophets`)

### Create Prophet - Multi-Step Wizard

#### Step 1: Basic Info
- [ ] Navigate to `/mgmt/prophets/new`
- [ ] Wizard displays step progress indicator
- [ ] Test validation:
  - [ ] Empty prophet ID shows error
  - [ ] Invalid ID format shows error
  - [ ] Empty name shows error
  - [ ] Empty asset selection shows error
  - [ ] Empty target property shows error
- [ ] Fill basic info:
  - Prophet ID: `prophet-test-ensemble`
  - Name: `Test Ensemble Prophet`
  - Asset: Select from dropdown
  - Target Property: `close`
  - Description: `Test prophet for validation`
- [ ] Click "Next"
- [ ] Step 1 marked as completed (checkmark)

#### Step 2: Model Fits
- [ ] Model fits grid displays trained models for selected asset
- [ ] Test validation:
  - [ ] No model selected shows error
- [ ] Select 2+ model fits
- [ ] Checkboxes toggle selection
- [ ] Selected count updates
- [ ] Model metrics display (MAPE, RMSE)
- [ ] Click "Next"

#### Step 3: Ensemble Configuration
- [ ] Ensemble method options shown
- [ ] "Single Model" disabled if multiple selected
- [ ] Select "Weighted Average"
- [ ] Weight editor appears
- [ ] Test weight validation:
  - [ ] Weights not summing to 1.0 shows error
- [ ] Set weights for each model
- [ ] Click "Normalize Weights" button
- [ ] Weights adjust to sum to 1.0
- [ ] Weight sum displays (should be 1.000)
- [ ] Click "Next"

#### Step 4: Transform Scripts
- [ ] Test validation:
  - [ ] Empty output script shows error
- [ ] Fill script paths:
  - Input Transform: `s3://bucket/scripts/input.py` (optional)
  - Output Transform: `s3://bucket/scripts/output.py` (required)
- [ ] Click "Next"

#### Step 5: Forecast Configuration
- [ ] Select forecast method: "Stochastic"
- [ ] Additional params appear (seed, distribution, error model)
- [ ] Set seed: `42`
- [ ] Select distribution: "Normal"
- [ ] Select error model: "Additive"
- [ ] Click "Next"

#### Step 6: Review
- [ ] All configuration displayed:
  - [ ] Basic info section
  - [ ] Model configuration section
  - [ ] Scripts & forecast section
- [ ] All entered data visible
- [ ] Weights shown with 3 decimal precision
- [ ] Click "Create Prophet"
- [ ] Loading state shows
- [ ] Navigate back to `/mgmt/prophets`
- [ ] New prophet appears in list
- [ ] Success feedback shown

### Read Prophets
- [ ] Prophet list displays all prophets
- [ ] Search by name works
- [ ] Filter by status works (active, pending, inactive, failed)
- [ ] Prophet details display:
  - [ ] Prophet name and description preview
  - [ ] Asset
  - [ ] Status badge
  - [ ] Model fits count
  - [ ] Ensemble method
  - [ ] Created date

### Update Prophet
- [ ] Click Edit button on a prophet
- [ ] Navigate to `/mgmt/prophets/:prophetId/edit`
- [ ] Wizard loads with existing data
- [ ] Prophet ID disabled in step 1
- [ ] All steps pre-filled
- [ ] Modify prophet name
- [ ] Add/remove model fits
- [ ] Change ensemble method
- [ ] Update scripts
- [ ] Review shows updated info
- [ ] Click "Update Prophet"
- [ ] Changes saved
- [ ] Navigate back to list
- [ ] Changes reflected

### Delete Prophet
- [ ] Click Delete button on a prophet
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] Prophet removed from list
- [ ] Success feedback shown

### View Prophet Detail
- [ ] Click "View" button on a prophet
- [ ] Navigate to `/prophets/:prophetId`
- [ ] Prophet detail page displays:
  - [ ] Prophet name and description
  - [ ] Asset and status badge
  - [ ] Target property
  - [ ] Ensemble method
  - [ ] Model fits count
  - [ ] Forecast method
  - [ ] Model fit details card
  - [ ] Scaffold details card
  - [ ] Training data details card
- [ ] If inference configured:
  - [ ] Local inference runs automatically
  - [ ] Performance visualization loads
  - [ ] Prophet charts display
  - [ ] Metrics shown (MAPE, RMSE, etc.)
- [ ] Back button returns to prophets list

**Status**: ⚠️ **Needs Manual Testing**

---

## Cross-Entity Testing

### Navigation Flow
- [ ] Admin dashboard (`/mgmt`) lists all management sections
- [ ] Click Assets → navigates to `/mgmt/assets`
- [ ] Click Datasets → navigates to `/mgmt/datasets`
- [ ] Click Data Slices → navigates to `/mgmt/data/slices`
- [ ] Click Prophets → navigates to `/mgmt/prophets`
- [ ] Back buttons return to management dashboard

### Data Relationships
- [ ] Creating dataset requires existing asset
- [ ] Creating data slice requires existing dataset
- [ ] Creating prophet requires:
  - [ ] Existing asset
  - [ ] Existing trained model fits
- [ ] Deleting dataset warns about dependent slices
- [ ] Asset filter in datasets shows only that asset's datasets

### Form Behavior
- [ ] All modals close on Cancel
- [ ] All modals close on X button
- [ ] Click outside modal closes it
- [ ] Validation errors clear when corrected
- [ ] Loading states show during save
- [ ] Error messages display clearly
- [ ] Success states trigger list refresh

### Responsive Design
- [ ] Forms work on mobile viewport
- [ ] Tables scroll horizontally if needed
- [ ] Modals adapt to small screens
- [ ] Wizard adapts to mobile

**Status**: ⚠️ **Needs Manual Testing**

---

## Browser Testing

### Chrome/Edge
- [ ] All CRUD operations work
- [ ] Modals render correctly
- [ ] Forms validate properly
- [ ] CSV upload works

### Firefox
- [ ] All CRUD operations work
- [ ] Modals render correctly
- [ ] Forms validate properly
- [ ] CSV upload works

### Safari
- [ ] All CRUD operations work
- [ ] Modals render correctly
- [ ] Forms validate properly
- [ ] CSV upload works

**Status**: ⚠️ **Needs Manual Testing**

---

## Error Handling

### Network Errors
- [ ] AWS credentials missing → clear error
- [ ] DynamoDB unavailable → error displayed
- [ ] S3 upload fails → error displayed
- [ ] Timeout errors handled gracefully

### Validation Errors
- [ ] All required fields enforced
- [ ] Format validation works (IDs, dates, etc.)
- [ ] Duplicate IDs prevented
- [ ] Relationship validation works

### Edge Cases
- [ ] Empty lists display "No items" message
- [ ] Search with no results shows message
- [ ] Large datasets paginate properly
- [ ] Long text truncates with ellipsis

**Status**: ⚠️ **Needs Manual Testing**

---

## Performance Testing

### Load Times
- [ ] Asset list loads < 2s
- [ ] Dataset list loads < 2s
- [ ] Data slice list loads < 3s
- [ ] Prophet list loads < 2s
- [ ] Modal opens instantly
- [ ] Form submission < 3s

### Data Volume
- [ ] 100+ assets display properly
- [ ] 50+ datasets display properly
- [ ] 200+ data slices display properly
- [ ] 20+ prophets display properly
- [ ] Search filters remain fast

**Status**: ⚠️ **Needs Manual Testing**

---

## Accessibility

### Keyboard Navigation
- [ ] Tab through form fields works
- [ ] Enter submits forms
- [ ] Escape closes modals
- [ ] Arrow keys navigate wizard steps (optional)

### Screen Readers
- [ ] Labels associated with inputs
- [ ] Error messages announced
- [ ] Success messages announced
- [ ] Required fields marked

**Status**: ⚠️ **Needs Manual Testing**

---

## Security Testing

### Input Sanitization
- [ ] Special characters in names handled
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked
- [ ] File upload restricted to CSV

### Authorization
- [ ] Unauthenticated users cannot access `/mgmt`
- [ ] Invalid tokens rejected
- [ ] Session timeout handled

**Status**: ⚠️ **Needs Manual Testing**

---

## Summary

**Total Test Cases**: 150+  
**Completed**: 0  
**Passed**: 0  
**Failed**: 0  
**Blocked**: 0  

**Overall Status**: ⚠️ **READY FOR TESTING**

---

## Notes

All CRUD functionality has been implemented and compiled without errors. The testing checklist above should be executed manually to verify:

1. **User workflows** - Complete end-to-end user journeys
2. **Data integrity** - All relationships maintained correctly
3. **Error handling** - All edge cases handled gracefully
4. **UI/UX** - Forms are intuitive and provide good feedback

### Testing Prerequisites

Before testing, ensure:
- AWS credentials configured in `.env`
- DynamoDB tables exist and are accessible
- S3 buckets exist for data and models
- At least one asset exists in the database
- At least one trained model fit exists for prophet testing

### Quick Test Script

```bash
# Navigate to management dashboard
http://localhost:5173/mgmt

# Test each section:
1. Click "Assets Management"
2. Click "New Asset" → test create flow
3. Click Edit on an asset → test update flow
4. Repeat for Datasets, Data Slices, Prophets
```

### Known Limitations

- Delete operations for datasets show confirmation but may not cascade deletes to dependent entities
- CSV analysis is client-side only and may be slow for very large files (>50MB)
- Prophet wizard doesn't support draft saving (must complete in one session)
- Model fit selection only shows fits for selected asset (working as designed)

