# Complete Route Audit - Chasing Prophets

**Generated**: Auto-analysis
**Purpose**: Systematically verify that every route has a proper, fully-implemented page

---

## Summary Status

| Category | Total | ✅ Implemented | ⚠️ Needs Work | ❌ Missing/Broken |
|----------|-------|---------------|--------------|-------------------|
| **User Routes** | 6 | 5 | 1 | 0 |
| **Management Routes** | 11 | 8 | 3 | 0 |
| **Legacy Routes** | 4 | 2 | 2 | 0 |
| **TOTAL** | 21 | 15 | 6 | 0 |

---

## User-Facing Routes (Non-Admin)

### ✅ `/login` - Login Page
- **File**: `src/pages/auth/LoginPage.tsx`
- **Status**: IMPLEMENTED
- **Styling**: Custom (auth-specific)
- **Features**: Email/password authentication, Cognito integration
- **Notes**: Fully functional

### ✅ `/dashboard` - Main Dashboard
- **File**: `src/pages/Dashboard.tsx`
- **Status**: IMPLEMENTED
- **Styling**: `Dashboard.css` (custom)
- **Features**: Portfolio overview, recent prophets, performance summaries
- **Notes**: User's main landing page after login

### ✅ `/prophets` - Prophets List
- **File**: `src/pages/Prophets/ProphetsList.tsx`
- **Status**: IMPLEMENTED
- **Styling**: `ProphetsList.css` (custom)
- **Features**: Grid view of all prophets with filtering
- **Notes**: User can browse all available prophets

### ✅ `/prophets/leaderboard` - Prophet Leaderboard
- **File**: `src/pages/Prophets/ProphetLeaderboard.tsx`
- **Status**: IMPLEMENTED
- **Styling**: Management.css patterns
- **Features**: Ranked list of prophets by performance
- **Notes**: Comparison and ranking functionality

### ✅ `/prophets/compare` - Prophet Comparison
- **File**: `src/pages/Prophets/ProphetComparison.tsx`
- **Status**: IMPLEMENTED
- **Styling**: Management.css patterns
- **Features**: Side-by-side prophet comparison
- **Notes**: Multi-prophet analysis

### ⚠️ `/prophets/:prophetId` - Prophet Detail
- **File**: `src/pages/ProphetDetail.tsx`
- **Status**: NEEDS ENHANCEMENT
- **Styling**: `ProphetDetail.css` (custom)
- **Features**: Individual prophet view with performance metrics
- **Issues**: 
  - Should show model lineage (scaffold → fit → prophet)
  - Should show data slice used for training
  - Should link to related entities
- **Action Items**:
  - [ ] Add "View Data Slice" button
  - [ ] Add "View Model Fit" button
  - [ ] Add "View Scaffold" button
  - [ ] Show full training provenance

---

## Management/Admin Routes (`/mgmt/*`)

### ✅ `/mgmt` - Admin Dashboard
- **File**: `src/pages/Management/AdminDashboard.tsx`
- **Status**: IMPLEMENTED
- **Styling**: Management.css
- **Features**: 
  - Real-time counts (assets, datasets, slices, scaffolds, fits, prophets)
  - Quick navigation to all admin sections
  - StatCard components with gradient borders
- **Notes**: Central hub for all admin operations
- **Recent Changes**: Converted from AdminDashboard.css to Management.css

### ✅ `/mgmt/assets` - Assets Management
- **File**: `src/pages/Management/AssetsManagement.tsx`
- **Status**: IMPLEMENTED
- **Styling**: Management.css
- **Features**: 
  - List all assets (ticker, name, type)
  - Search/filter functionality
  - View/Edit buttons
- **Issues**:
  - "New Asset" button routes to `/mgmt/assets/new` (route doesn't exist)
  - No inline create modal
  - No asset detail page
- **Action Items**:
  - [ ] Add create asset modal (inline, not separate route)
  - [ ] Add edit asset modal
  - [ ] Add asset detail page at `/mgmt/assets/:assetId`
  - [ ] Show related datasets for each asset

### ⚠️ `/mgmt/datasets` - Datasets Management
- **File**: `src/pages/Management/DatasetsManagement.tsx`
- **Status**: NEEDS ENHANCEMENT
- **Styling**: Management.css
- **Features**: 
  - List all datasets
  - Search by dataset ID, name, asset
  - Filter by asset
  - Delete functionality
  - View button (navigates to detail page)
- **Issues**:
  - "New Dataset" button routes to `/mgmt/datasets/new` (route doesn't exist)
  - No inline create modal
  - No edit functionality
  - Upload dataset flow not implemented
- **Action Items**:
  - [ ] Add create dataset modal with file upload
  - [ ] Add edit dataset modal
  - [ ] Implement S3 upload with presigned URLs
  - [ ] Add schema validation/preview before upload

### ✅ `/mgmt/datasets/:datasetId` - Dataset Detail
- **File**: `src/pages/Management/DatasetDetail.tsx`
- **Status**: IMPLEMENTED
- **Styling**: Management.css
- **Features**: 
  - Dataset metadata
  - Data visualizations component
  - "Create Data Slice" button
- **Dependencies**: Uses `DatasetVisualizations` component
- **Notes**: Good foundation, visualizations need enhancement

### ⚠️ `/mgmt/data/slices` - Data Slices Management
- **File**: `src/pages/Management/DataSlicesManagement.tsx`
- **Status**: NEEDS ENHANCEMENT
- **Styling**: Management.css
- **Features**: 
  - List all data slices
  - Search by slice ID
  - Filter by dataset/asset (handles both new/legacy schema)
  - Filter by type (simple/compound)
- **Issues**:
  - "New Data Slice" button routes to `/mgmt/data/slices/new` (doesn't exist)
  - Dataset column shows ID, not name (not user-friendly)
  - No link to parent dataset
  - No slice detail page
  - No edit functionality
- **Action Items**:
  - [ ] Add create slice modal (select dataset, time window, columns)
  - [ ] Show dataset NAME instead of ID in table
  - [ ] Add "View Dataset" link for each slice
  - [ ] Add slice detail page
  - [ ] Add edit slice modal
  - [ ] Implement compound slice builder UI

### ✅ `/mgmt/models/scaffolds` - Scaffolds List
- **File**: `src/pages/Management/ScaffoldsList.tsx`
- **Status**: IMPLEMENTED
- **Styling**: `ScaffoldEdit.css` (custom - should migrate)
- **Features**: 
  - List all model scaffolds
  - Create new scaffold button
  - Edit/View functionality
- **Notes**: Works but uses custom CSS instead of Management.css
- **Action Items**:
  - [ ] Migrate to Management.css styling
  - [ ] Add scaffold detail view (currently goes straight to edit)

### ✅ `/mgmt/models/scaffolds/new` - Create Scaffold
- **File**: `src/pages/Management/ScaffoldEdit.tsx`
- **Status**: IMPLEMENTED (in create mode)
- **Styling**: `ScaffoldEdit.css` (custom)
- **Features**: 
  - Contract definition (inputs/outputs)
  - Training script upload
  - Inference script upload
  - Metadata editing
- **Notes**: Complex form, works well

### ✅ `/mgmt/models/scaffolds/:scaffoldId/edit` - Edit Scaffold
- **File**: `src/pages/Management/ScaffoldEdit.tsx`
- **Status**: IMPLEMENTED (in edit mode)
- **Styling**: `ScaffoldEdit.css` (custom)
- **Features**: Same as create, loads existing scaffold
- **Notes**: Full CRUD for scaffolds works

### ✅ `/mgmt/models/fits` - Model Fits Management
- **File**: `src/pages/Management/ModelFitsManagement.tsx`
- **Status**: IMPLEMENTED
- **Styling**: Management.css
- **Features**: 
  - List all model fits
  - Search by fit ID
  - Filter by status (fit/unfit/training/failed)
  - Status badges with color coding
- **Issues**:
  - No "create fit" functionality (should trigger training)
  - No detail page
  - No edit/delete
- **Action Items**:
  - [ ] Add "Train New Model" button (select scaffold + slice)
  - [ ] Add fit detail page showing metrics, parameters
  - [ ] Add "Retrain" functionality
  - [ ] Show related prophet if fit is used

### ✅ `/mgmt/prophets` - Prophets Management
- **File**: `src/pages/Management/ProphetsManagement.tsx`
- **Status**: IMPLEMENTED
- **Styling**: Management.css
- **Features**: List prophets with admin controls
- **Notes**: Admin view of prophets (vs user view)
- **Action Items**:
  - [ ] Add "Activate/Deactivate" toggle
  - [ ] Add "Delete Prophet" functionality
  - [ ] Show deployment status

### ✅ `/mgmt/metrics` - System Metrics
- **File**: `src/pages/Management/SystemMetrics.tsx`
- **Status**: IMPLEMENTED
- **Styling**: Management.css + AdminDashboard.css
- **Features**: 
  - Prophet status breakdown (total/active/training/failed)
  - Model fit statistics
  - Data slice counts
  - Real-time monitoring
- **Notes**: Comprehensive system health dashboard

### ✅ `/mgmt/settings` - System Settings
- **File**: `src/pages/Management/SystemSettings.tsx`
- **Status**: IMPLEMENTED
- **Styling**: Management.css + AdminDashboard.css
- **Features**: 
  - Model training defaults
  - Data pipeline configuration
  - Automation settings (daily predictions, performance tracking)
  - Performance thresholds
- **Notes**: Full configuration interface

---

## Legacy Routes (Should Eventually Deprecate)

### ⚠️ `/admin` - Old Admin Dashboard
- **File**: `src/pages/Admin/AdminDashboard.tsx`
- **Status**: LEGACY - REDIRECT TO `/mgmt`
- **Styling**: `AdminDashboard.css` (old custom)
- **Notes**: User must have `role === 'admin'`
- **Action Items**:
  - [ ] Remove this route after migration complete
  - [ ] Update any remaining links to use `/mgmt`

### ✅ `/admin/scaffolds` - Old Scaffolds (Redirects)
- **File**: `src/pages/Management/ScaffoldsList.tsx`
- **Status**: REDIRECTS TO MANAGEMENT
- **Notes**: Same component as `/mgmt/models/scaffolds`

### ✅ `/admin/scaffolds/:scaffoldId` - Old Scaffold Detail (Redirects)
- **File**: `src/pages/Management/ScaffoldEdit.tsx`
- **Status**: REDIRECTS TO MANAGEMENT
- **Notes**: Same component as `/mgmt/models/scaffolds/:scaffoldId/edit`

### ⚠️ `/assets` - Old Assets List
- **File**: `src/pages/Assets.tsx`
- **Status**: LEGACY - REDIRECT TO `/mgmt/assets`
- **Styling**: `Assets.css` (old custom)
- **Notes**: User must have `role === 'admin'`
- **Action Items**:
  - [ ] Remove this route
  - [ ] Update any links to use `/mgmt/assets`

### ⚠️ `/assets/:ticker` - Old Asset Detail
- **File**: `src/pages/AssetPage.tsx`
- **Status**: LEGACY
- **Styling**: `AssetPage.css` (old custom)
- **Features**: Individual asset view with charts
- **Notes**: This has good visualizations that should be preserved
- **Action Items**:
  - [ ] Create new `/mgmt/assets/:assetId` detail page
  - [ ] Port visualization components
  - [ ] Remove legacy route

---

## Missing Routes (Should Be Created)

### ❌ `/mgmt/assets/:assetId` - Asset Detail
- **Status**: MISSING
- **Needed For**: View individual asset with related datasets
- **Features Needed**:
  - Asset metadata
  - Price history chart
  - List of datasets using this asset
  - Edit button

### ❌ `/mgmt/data/slices/:sliceId` - Data Slice Detail
- **Status**: MISSING
- **Needed For**: View individual data slice details
- **Features Needed**:
  - Slice metadata (time window, columns, rows)
  - Parent dataset link
  - Data preview table
  - Column statistics
  - List of model fits using this slice
  - Edit button

### ❌ `/mgmt/models/fits/:fitId` - Model Fit Detail
- **Status**: MISSING
- **Needed For**: View training results and metrics
- **Features Needed**:
  - Training metrics (R², MAPE, MSE, etc.)
  - Training history/logs
  - Scaffold used
  - Data slice used
  - Model parameters (from S3)
  - "Create Prophet from this Fit" button
  - Retrain button

### ❌ `/mgmt/models/scaffolds/:scaffoldId` - Scaffold Detail (View-only)
- **Status**: MISSING (currently jumps straight to edit)
- **Needed For**: View scaffold without editing
- **Features Needed**:
  - Contract (inputs/outputs) display
  - Scripts preview (not editable)
  - List of model fits using this scaffold
  - Edit button
  - Clone button

---

## Common Issues Across All Management Pages

### 🔴 Critical Issues
1. **No inline CRUD modals** - All "New X" buttons route to non-existent pages instead of opening modals
2. **Entity relationships not visible** - Can't navigate from dataset → slices → fits → prophets
3. **Inconsistent styling** - Mix of Management.css, custom CSS files

### 🟡 Enhancement Needed
1. **No breadcrumb navigation** - Hard to know where you are in admin hierarchy
2. **No loading skeletons** - Just spinning icons
3. **No empty states** - When lists are empty, just shows empty table
4. **No bulk operations** - Can't select multiple items for deletion/export

---

## Recommended Implementation Priority

### Phase 1: Fix Broken/Incomplete (IMMEDIATE)
1. ✅ Fix AdminDashboard naming (AdminDashboard vs AdminDashboardNew)
2. ✅ Create Asset Detail page (`/mgmt/assets/:assetId`)
3. ✅ Create Data Slice Detail page (`/mgmt/data/slices/:sliceId`)
4. ✅ Create Model Fit Detail page (`/mgmt/models/fits/:fitId`)
5. ✅ Add inline Create Asset modal (remove `/mgmt/assets/new` route)
6. ✅ Add inline Create Dataset modal with upload (remove `/mgmt/datasets/new` route)
7. ✅ Add inline Create Data Slice modal (remove `/mgmt/data/slices/new` route)

### Phase 2: Connect Entities (HIGH PRIORITY)
1. ✅ DataSlicesManagement: Show dataset NAME, add "View Dataset" button
2. ✅ DatasetDetail: Add "View Slices" section listing all slices from this dataset
3. ✅ ModelFitsManagement: Show scaffold name, slice name (not just IDs)
4. ✅ ModelFitDetail: Link to scaffold and slice used
5. ✅ ProphetDetail: Show full provenance chain (scaffold → slice → fit → prophet)

### Phase 3: Polish (MEDIUM PRIORITY)
1. ✅ Add breadcrumb component to all `/mgmt/*` pages
2. ✅ Migrate ScaffoldsList and ScaffoldEdit to Management.css
3. ✅ Add loading skeletons (replace spinners)
4. ✅ Add empty states with helpful messages
5. ✅ Add error boundaries

### Phase 4: Remove Legacy (LOW PRIORITY)
1. ✅ Remove `/admin` route (redirect to `/mgmt`)
2. ✅ Remove `/assets` routes (functionality in `/mgmt/assets`)
3. ✅ Remove old CSS files (AdminDashboard.css, Assets.css, AssetPage.css if not used)

---

## Design Pattern Requirements

All management pages should follow this structure:

```tsx
<div className="management-page">
  {/* Breadcrumb */}
  <nav className="breadcrumb">Admin > Section > Page</nav>
  
  {/* Header */}
  <div className="page-header">
    <div className="header-content">
      <button className="back-button">← Back</button>
      <h1>Page Title</h1>
      <p className="subtitle">Description</p>
    </div>
    <button className="action-button">+ New Item</button>
  </div>

  {/* Search/Filters */}
  <div className="search-filter-section">...</div>

  {/* Stats/Summary (optional) */}
  <div className="info-cards">...</div>

  {/* Main Content Table */}
  <div className="table-container">
    <table className="data-table">...</table>
  </div>

  {/* Modal for Create/Edit (overlay) */}
  {showModal && <Modal>...</Modal>}
</div>
```

All modals should:
- Open as overlay (not new route)
- Have cancel/save buttons
- Show validation errors inline
- Close on save success
- Reload parent list on success

---

## Next Steps

1. **Create comprehensive entity detail pages** (Asset, Slice, Fit)
2. **Implement inline CRUD modals** for all entities
3. **Add breadcrumb navigation** component
4. **Connect all related entities** with view/filter buttons
5. **Test every route** in browser to verify functionality
6. **Remove legacy routes** after verifying all functionality migrated
