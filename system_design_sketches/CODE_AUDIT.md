# Code Audit & Feature Reconciliation

**Version:** 1.0
**Date:** November 5, 2025
**Status:** Initial Audit

---

## 1. Objective

This document audits the current state of the `chasing-prophets` prototype to reconcile implemented features against the original conceptual design and whiteboard sketch.

## 2. Audit Findings: Implemented vs. Planned

The audit is based on a review of the `src/pages` directory and `src/services` directory.

### **Part A: Implemented & Functional Features**

The following features are present in the codebase and are functional, connecting to a live backend (DynamoDB) where specified.

| Feature | Location(s) | Status | Notes |
| :--- | :--- | :--- | :--- |
| **User Authentication** | `LoginPage.tsx`, `AuthContext.tsx`, `useAuth.ts` | ✅ **Implemented** | Full login flow via AWS Cognito is working. Handles new password challenges. |
| **Asset List View** | `Assets.tsx`, `assets.ts` (service) | ✅ **Implemented** | Fetches and displays a list of all assets from the `ChasingProphets-Assets` DynamoDB table. |
| **Asset Detail View** | `AssetPage.tsx`, `assets.ts` (service) | ✅ **Implemented** | Fetches price history for a single asset from `ChasingProphets-AssetPrices` table. |
| **Client-Side Charting** | `StockChart.tsx`, `AssetPage.tsx` | ✅ **Implemented** | All technical analysis indicators (SMA, EMA, etc.) are calculated and rendered on the client-side using Plotly. |
| **Theme Switching** | `ThemeContext.tsx`, `Settings.tsx` | ✅ **Implemented** | Users can select from 7 different themes, and the choice is persisted in `localStorage`. |
| **Global Layout & UI** | `Layout.tsx`, `MainLayout.tsx` | ✅ **Implemented** | Includes the collapsible sidebar, top navigation bar, and notification panel. |
| **Global Asset Search** | `SearchBox.tsx` | ✅ **Implemented** | A debounced search input that queries assets and provides quick navigation. |
| **Notifications System** | `notifications.ts` (service) | ✅ **Implemented** | Fetches user-specific notifications from the `ChasingProphets-Notifications` DynamoDB table. |

### **Part B: Partially Implemented Features (UI Only / Mock Data)**

| Feature | Location(s) | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `Dashboard.tsx` | 🟡 **Partial** | The entire dashboard is built with a responsive grid layout, but all widgets (`MarketChart`, `PriceVolumeExplorer`, etc.) are populated with hardcoded mock data from `testData.ts`. |
| **Settings Profile Form** | `Settings.tsx` | 🟡 **Partial** | The user profile form is present in the UI, but it is not connected to any backend service. The "Save Changes" button has no function. |
| **Prophet Widgets** | `ProphetControls.tsx`, `ProphetAccordion.tsx` | 🟡 **Partial** | These widgets are on the dashboard but are UI mockups with no real functionality. |

### **Part C: Unimplemented Features (Conceptual / Planned)**

The following features from the conceptual design are not present in the current codebase in any form (neither functional nor UI mockups).

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **User Signup** | ❌ **Not Implemented** | There is no registration or signup page. |
| **Prophets (Core Feature)** | ❌ **Not Implemented** | No pages, services, or components related to listing, viewing, or evaluating "Prophets." |
| **Datasets** | ❌ **Not Implemented** | No pages, services, or components related to Datasets. |
| **Data Slices** | ❌ **Not Implemented** | No pages, services, or components related to Data Slices. |
| **Model Scaffolds** | ❌ **Not Implemented** | No pages, services, or components related to Model Scaffolds. |
| **Model Fits** | ❌ **Not Implemented** | No pages, services, or components related to Model Fits. |
| **Admin / Management** | ❌ **Not Implemented** | No `/mgmt` section or any administrative functionality for managing the system's entities (CRUD for assets, prophets, etc.). |

## 3. Conclusion

The current prototype has a solid foundation for the "Assets" vertical, including authentication and data visualization. However, the core conceptual features of the application—Prophets, Datasets, Model Fits, and the entire administrative backend—are not yet implemented. The Dashboard is a UI shell waiting for live data.
