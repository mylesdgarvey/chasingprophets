# Chasing Prophets - System Design Document

**Version:** 2.0
**Date:** November 5, 2025
**Status:** Consolidated Master Document (with Granular Task Analysis)

---

## 1. Core Concept & Vision

**Chasing Prophets** is a platform designed to help users identify which "prophets" (trained models combined with forecasting methods) are most effective at predicting the future outcomes of financial assets.

The core conceptual model follows a clear data hierarchy:

**Assets → Datasets → Data Slices → Model Scaffolds → Model Fits → Prophets → Performance Metrics**

-   **Assets:** The financial instruments being predicted (e.g., stocks, indices).
-   **Datasets:** Standardized historical data for an asset (e.g., daily OHLCV).
-   **Data Slices:** Fixed, immutable time intervals from a dataset used for training.
-   **Model Scaffolds:** Reusable model architectures (e.g., "Simple Linear Regression").
-   **Model Fits:** A specific scaffold trained on a specific data slice for a specific asset.
-   **Prophets:** A model fit combined with a forecasting method, producing live predictions.
-   **Performance:** Nightly-computed metrics tracking a prophet's accuracy over time.

The primary goal for a **User** is to discover and evaluate high-performing prophets. The primary goal for an **Admin** is to manage the entire lifecycle, from creating assets to deploying and monitoring prophets.

---

## 2. Implementation Status & Roadmap

This section provides a clear distinction between what is currently working in the prototype and what is planned for future development.

### **Part A: Implemented Features (Currently Working)**

| Feature | Status | Description |
| :--- | :--- | :--- |
| **Authentication** | ✅ **Functional** | Users can log in via AWS Cognito. Handles new password challenges. |
| **Dashboard** | 🟡 **Partial** | UI is implemented but uses **hardcoded test data**. Prophet console is a UI mockup. |
| **Asset List** | ✅ **Functional** | Fetches and displays a list of all assets from DynamoDB. Features working letter-based navigation. |
| **Asset Detail** | ✅ **Functional** | Fetches and displays detailed price history for a selected asset from DynamoDB. All technical indicators are calculated client-side. |
| **Settings** | 🟡 **Partial** | A fully functional 7-theme selector that persists to `localStorage`. The "Operator Profile" form is UI-only and does not save changes. |
| **Global UI** | ✅ **Functional** | The main layout, including the collapsible sidebar, debounced global search (for assets), and notifications popup, is fully functional. |

### **Part B: Planned Features (Not Yet Implemented)**

| Feature | Status | Description |
| :--- | :--- | :--- |
| **Signup Flow** | ❌ **Not Implemented** | User registration and email verification pages do not exist. |
| **Prophets** | ❌ **Not Implemented** | No pages for listing or viewing prophet details. The core prediction engine is not built. |
| **Datasets** | ❌ **Not Implemented** | No pages for listing or viewing dataset details. |
| **Data Slices** | ❌ **Not Implemented** | No pages for listing or viewing data slice details. |
| **Model Fits** | ❌ **Not Implemented** | No pages for listing or viewing model fit details. |
| **Admin (`/mgmt`)** | ❌ **Not Implemented** | All system administration pages for managing the entity lifecycle (CRUD, job triggers) do not exist. |

---

## 3. Screen Flow & Architecture

The application follows a hub-and-spoke model, with the Dashboard serving as the central navigation point.

```
┌─────────────┐
│ Login Page  │
└──────┬──────┘
       │
       ├──→ No Auth ──→ Signup Page (Planned)
       │
       └──→ Verified ──→ Dashboard
                            │
                ┌───────────┼───────────┬────────────┬──────────────┐
                │           │           │            │              │
            ┌───▼────┐  ┌───▼─────┐ ┌──▼──────┐ ┌──▼────────┐ ┌───▼────────┐
            │ Assets │  │Datasets │ │Data     │ │Model Fits │ │  Prophets  │
            │        │  │ (Planned) │ │Slices   │ │ (Planned) │ │ (Planned)  │
            └───┬────┘  └───┬─────┘ │(Planned)│ └──┬────────┘ └───┬────────┘
                │           │       └──┬──────┘    │              │
                │           │          │           │              │
          ┌─────▼─────┐ ┌───▼──────────▼───────────▼──────────────▼──────┐
          │ Asset     │ │                                                 │
          │ Detail    │ │        System Management (Admin Only - Planned)  │
          └───────────┘ │                                                 │
                        └─────────────────────────────────────────────────┘
```

---

## 4. User Roles & Granular Task Analysis

This section provides a complete enumeration of all user tasks, broken down by role and by screen.

### **Role 1: Guest (Unauthenticated)**

| Screen | Task | Status |
| :--- | :--- | :--- |
| **`/login`** | View the login form | ✅ **Implemented** |
| | Enter email address | ✅ **Implemented** |
| | Enter password | ✅ **Implemented** |
| | Toggle password visibility | ✅ **Implemented** |
| | Submit login form | ✅ **Implemented** |
| | Receive and view login error messages | ✅ **Implemented** |
| | Be prompted for a new password on first login | ✅ **Implemented** |
| | Enter and confirm a new password when prompted | ✅ **Implemented** |
| | Click the "Sign Up" link | ❌ **Not Implemented** |
| **`/signup`** | View the signup form | ❌ **Not Implemented** |
| | Enter user details (name, email, password) | ❌ **Not Implemented** |
| | Submit signup form | ❌ **Not Implemented** |
| | Receive and view signup error messages | ❌ **Not Implemented** |

---

### **Role 2: User (Authenticated)**

| Screen | Task | Status |
| :--- | :--- | :--- |
| **Global Layout** | View main layout (sidebar, header) | ✅ **Implemented** |
| | Collapse and expand the main sidebar | ✅ **Implemented** |
| | Navigate to Dashboard, Assets, Settings via sidebar | ✅ **Implemented** |
| | Use the global search bar to find assets | ✅ **Implemented** |
| | Click a search result to navigate to the asset page | ✅ **Implemented** |
| | Open and close the notifications panel | ✅ **Implemented** |
| | View a list of notifications | ✅ **Implemented** |
| | Mark all notifications as read | ✅ **Implemented** |
| | Open the user profile dropdown | ✅ **Implemented** |
| | Sign out of the application | ✅ **Implemented** |
| **`/dashboard`** | View the main dashboard grid | 🟡 **Partial** |
| | View the "Welcome" message | ✅ **Implemented** |
| | View the "Prophet Controls" widget (UI only) | ✅ **Implemented** |
| | View the "Prophet Accordion" widget (UI only) | ✅ **Implemented** |
| | View the "Market Chart" widget (mock data) | ✅ **Implemented** |
| | View the "Price Volume Explorer" widget (mock data) | ✅ **Implemented** |
| | View the "Time Explorer" widget (mock data) | ✅ **Implemented** |
| **`/assets`** | View the list of all available assets | ✅ **Implemented** |
| | Use the A-Z filter to navigate the asset list | ✅ **Implemented** |
| | Click on an asset to navigate to its detail page | ✅ **Implemented** |
| **`/assets/:ticker`** | View the detailed header for a specific asset | ✅ **Implemented** |
| | View the main stock chart for the asset | ✅ **Implemented** |
| | Select a time window for the chart (e.g., 1M, 6M, 1Y) | ✅ **Implemented** |
| | Select a chart scale type (Linear, Log) | ✅ **Implemented** |
| | Add a technical indicator to the chart (e.g., SMA, EMA) | ✅ **Implemented** |
| | Remove a technical indicator from the chart | ✅ **Implemented** |
| | Customize parameters for a technical indicator | ✅ **Implemented** |
| | View the data table of historical prices | ✅ **Implemented** |
| **`/settings`** | View the settings page with two main sections | ✅ **Implemented** |
| | Select a new UI theme from the theme selector | ✅ **Implemented** |
| | See the UI theme change instantly | ✅ **Implemented** |
| | Have the theme choice persist across sessions | ✅ **Implemented** |
| | View the "Operator Profile" form | ✅ **Implemented** |
| | Enter text into the profile form fields | ✅ **Implemented** |
| | Click the "Save Changes" button (does nothing) | 🟡 **Partial** |
| **`/prophets`** | View a list/grid of all available prophets | ❌ **Not Implemented** |
| | Search or filter the list of prophets | ❌ **Not Implemented** |
| | Click on a prophet to view its detail page | ❌ **Not Implemented** |
| **`/prophets/:id`** | View detailed information about a specific prophet | ❌ **Not Implemented** |
| | View the prophet's historical performance charts | ❌ **Not Implemented** |
| | View the prophet's live prediction chart | ❌ **Not Implemented** |
| | Run a new inference/prediction on the client | ❌ **Not Implemented** |

---

### **Role 3: Admin (Authenticated)**

*Note: No admin-specific features are currently implemented. All tasks below are planned.*

| Screen | Task | Status |
| :--- | :--- | :--- |
| **`/mgmt`** | View the main system management dashboard | ❌ **Not Implemented** |
| | View high-level system statistics | ❌ **Not Implemented** |
| | Navigate to different management sections | ❌ **Not Implemented** |
| **`/mgmt/assets`** | View a list of all assets in the system | ❌ **Not Implemented** |
| | Create a new asset | ❌ **Not Implemented** |
| | Edit an existing asset's metadata | ❌ **Not Implemented** |
| | Delete an asset | ❌ **Not Implemented** |
| **`/mgmt/datasets`** | View a list of all datasets | ❌ **Not Implemented** |
| | Create a new dataset from an uploaded file | ❌ **Not Implemented** |
| | Associate a dataset with an asset | ❌ **Not Implemented** |
| | View metadata and preview a dataset | ❌ **Not Implemented** |
| **`/mgmt/dataslices`** | View a list of all data slices | ❌ **Not Implemented** |
| | Create a new data slice from a dataset | ❌ **Not Implemented** |
| | View the composition of a data slice | ❌ **Not Implemented** |
| **`/mgmt/models`** | View a list of all model scaffolds and fits | ❌ **Not Implemented** |
| | Create/upload a new model scaffold | ❌ **Not Implemented** |
| | Initiate a model training job (create a model fit) | ❌ **Not Implemented** |
| | View the status and results of a training job | ❌ **Not Implemented** |
| **`/mgmt/prophets`** | View a list of all prophets | ❌ **Not Implemented** |
| | Create a new prophet from a model fit | ❌ **Not Implemented** |
| | Deploy or deactivate a prophet | ❌ **Not Implemented** |
| | Monitor a prophet's live performance | ❌ **Not Implemented** |

---

## 5. Next Steps & Development Priorities

Based on this granular analysis, the clear priority is to build out the core "Prophet" and "Admin" functionality, as they are central to the application's purpose and currently entirely unimplemented.

1.  **Implement Admin (`/mgmt`) MVP:**
    -   Build the minimum necessary admin pages to allow for the creation and management of a single Prophet, from Asset to Model Fit. This is essential for populating the system with data.
2.  **Implement Prophet Data Layer:**
    -   Create services (`src/services/prophets.ts`) to fetch prophet data created by the Admin.
3.  **Build Prophet Pages:**
    -   Create the `/prophets` list page to display prophets from the database.
    -   Create the `/prophets/:id` detail page.
4.  **Connect Dashboard to Live Data:**
    -   Replace the hardcoded data on the Dashboard with live data from the new prophet services.
