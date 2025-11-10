# Chasing Prophets - Frontend Screens & Navigation

**Version:** 2.0
**Date:** November 5, 2025
**Status:** Design & Implementation Status

---

## Screen Inventory & Status

This inventory lists all designed screens and their current implementation status.

| Route | Screen Name | Status | Description |
| :--- | :--- | :--- | :--- |
| `/login` | Login Page | ✅ **Implemented** | Authenticates users via Cognito. |
| `/signup` | Signup Page | ❌ **Not Implemented** | For new user registration. |
| `/dashboard` | Dashboard | 🟡 **Partial** | Main hub. UI is built but uses mock data. |
| `/assets` | Assets List | ✅ **Implemented** | Browse all available assets. |
| `/assets/:ticker` | Asset Detail | ✅ **Implemented** | Detailed technical analysis of a single asset. |
| `/settings` | Settings | 🟡 **Partial** | Theme selection works; profile form is UI-only. |
| `/prophets` | Prophets List | ❌ **Not Implemented** | Browse and discover prophets. |
| `/prophets/:id` | Prophet Detail | ❌ **Not Implemented** | View prophet predictions and performance. |
| `/datasets` | Datasets List | ❌ **Not Implemented** | Browse all datasets. |
| `/datasets/:id` | Dataset Detail | ❌ **Not Implemented** | View dataset metadata and preview data. |
| `/dataslices` | Data Slices List | ❌ **Not Implemented** | Browse data slices. |
| `/dataslices/:id` | Data Slice Detail | ❌ **Not Implemented** | View slice composition and usage. |
| `/model-fits` | Model Fits List | ❌ **Not Implemented** | Browse trained models. |
| `/model-fits/:id` | Model Fit Detail | ❌ **Not Implemented** | View model details and performance. |
| `/mgmt/*` | Admin Pages | ❌ **Not Implemented** | All pages for system and entity management. |

---

## Detailed Screen Descriptions

### 1. Authentication Screens

#### `/login` - Login Page
**Status:** ✅ **Implemented**
**Access:** Public (unauthenticated only)
**Purpose:** User authentication
**Navigation:**
- Success → `/dashboard`
- No account → `/signup` (Link is conceptual, page not implemented)

---

#### `/signup` - Signup Page
**Status:** ❌ **Not Implemented**
**Access:** Public (unauthenticated only)
**Purpose:** New user registration

---

### 2. Main Application Screens

#### `/dashboard` - Dashboard (Main Hub)
**Status:** 🟡 **Partial**
**Access:** All authenticated users
**Purpose:** Central navigation and overview. **Currently uses hardcoded test data.**

---

#### `/settings` - Settings Page
**Status:** 🟡 **Partial**
**Access:** All authenticated users
**Purpose:** User-specific settings. **Theme selection is functional; profile form is UI-only.**

---

### 3. Entity Screens (Assets Vertical)

#### `/assets` - Assets List
**Status:** ✅ **Implemented**
**Access:** All authenticated users
**Purpose:** Browse and search all tracked assets, fetched from DynamoDB.

---

#### `/assets/:ticker` - Asset Detail Page
**Status:** ✅ **Implemented**
**Access:** All authenticated users
**Purpose:** Detailed view of a specific asset, with price history from DynamoDB and client-side technical indicators.

---

### 4. Planned Entity Screens (Not Implemented)

#### `/prophets` - Prophets List
**Status:** ❌ **Not Implemented**
**Purpose:** Browse and discover prophets.

---

#### `/prophets/:prophetId` - Prophet Detail Page
**Status:** ❌ **Not Implemented**
**Purpose:** View prophet predictions and performance.

---

#### `/datasets` - Datasets List
**Status:** ❌ **Not Implemented**
**Purpose:** Browse all datasets.

---

#### `/datasets/:datasetId` - Dataset Detail
**Status:** ❌ **Not Implemented**
**Purpose:** View dataset details and slices.

---

#### `/dataslices` - Data Slices List
**Status:** ❌ **Not Implemented**
**Purpose:** Browse data slices.

---

#### `/dataslices/:dataSliceId` - Data Slice Detail
**Status:** ❌ **Not Implemented**
**Purpose:** View slice composition and usage.

---

#### `/model-fits` - Model Fits List
**Status:** ❌ **Not Implemented**
**Purpose:** Browse trained models.

---

#### `/model-fits/:modelFitId` - Model Fit Detail
**Status:** ❌ **Not Implemented**
**Purpose:** View model details and performance.

---

### 5. Planned Admin Screens (Not Implemented)

#### `/mgmt` - System Management Dashboard
**Status:** ❌ **Not Implemented**
**Access:** Admin only
**Purpose:** Central admin hub.

---

#### `/mgmt/assets/:assetId` - Manage Asset
**Status:** ❌ **Not Implemented**
**Access:** Admin only
**Purpose:** CRUD operations for assets.

---

*... (Other admin screens are also not implemented) ...*

