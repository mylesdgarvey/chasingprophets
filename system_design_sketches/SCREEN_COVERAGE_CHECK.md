# Screen Coverage Check

**Version:** 1.0
**Date:** November 5, 2025
**Status:** Initial Draft

---

## 1. Objective

This document inventories all screens required by the application design and checks their implementation status in the current prototype.

## 2. Screen Inventory

| Route | Screen Name | Implementation Status | Notes |
| :--- | :--- | :--- | :--- |
| `/login` | Login Page | ✅ **Implemented** | Fully functional authentication screen. |
| `/signup` | Signup Page | ❌ **Not Implemented** | Page does not exist. |
| `/dashboard` | Dashboard | 🟡 **Partial** | UI is built, but all data is hardcoded. |
| `/assets` | Assets List Page | ✅ **Implemented** | Fetches and displays real data from DynamoDB. |
| `/assets/:ticker` | Asset Detail Page | ✅ **Implemented** | Fetches and displays real data from DynamoDB. |
| `/settings` | Settings Page | 🟡 **Partial** | Theme switching is functional, but the profile form is UI-only. |
| `/prophets` | Prophets List Page | ❌ **Not Implemented** | Page does not exist. |
| `/prophets/:id` | Prophet Detail Page | ❌ **Not Implemented** | Page does not exist. |
| `/datasets` | Datasets List Page | ❌ **Not Implemented** | Page does not exist. |
| `/datasets/:id` | Dataset Detail Page | ❌ **Not Implemented** | Page does not exist. |
| `/dataslices` | Data Slices List Page | ❌ **Not Implemented** | Page does not exist. |
| `/dataslices/:id`| Data Slice Detail Page | ❌ **Not Implemented** | Page does not exist. |
| `/model-fits` | Model Fits List Page | ❌ **Not Implemented** | Page does not exist. |
| `/model-fits/:id`| Model Fit Detail Page | ❌ **Not Implemented** | Page does not exist. |
| `/mgmt` | Admin Dashboard | ❌ **Not Implemented** | Page does not exist. |
| `/mgmt/assets` | Manage Assets | ❌ **Not Implemented** | Page does not exist. |
| `/mgmt/datasets`| Manage Datasets | ❌ **Not Implemented** | Page does not exist. |
| `/mgmt/prophets`| Manage Prophets | ❌ **Not Implemented** | Page does not exist. |
| `/mgmt/jobs` | Monitor Jobs | ❌ **Not Implemented** | Page does not exist. |

## 3. Summary

-   **Implemented Verticals:** The "Authentication" and "Assets" verticals are largely complete.
-   **Partially Implemented:** The "Dashboard" and "Settings" pages are present but incomplete.
-   **Not Implemented:** The core "Prophets" vertical and the entire "Admin" section are completely missing.
