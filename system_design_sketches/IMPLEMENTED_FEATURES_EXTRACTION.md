# Implemented Features Extraction

**Version:** 1.0
**Date:** November 5, 2025
**Status:** Raw Extraction from Code Audit

---

## 1. Objective

This document provides a raw, concise list of all features confirmed to be implemented and functional in the current prototype. This is extracted directly from the `CODE_AUDIT.md` for clear, at-a-glance reference.

## 2. List of Implemented & Functional Features

-   **User Authentication:**
    -   Login via AWS Cognito.
    -   Handles "new password required" challenge for first-time users.

-   **Asset Analysis:**
    -   **Asset List Page (`/assets`):** Fetches and displays a complete list of assets from the `ChasingProphets-Assets` DynamoDB table.
    -   **Asset Detail Page (`/assets/:ticker`):** Fetches and displays the full price history for a selected asset from the `ChasingProphets-AssetPrices` DynamoDB table.

-   **Client-Side Data Visualization:**
    -   **Stock Charting:** Renders asset price history using Plotly.
    -   **Technical Indicators:** Calculates and overlays multiple indicators (SMA, EMA, RSI, MACD) on the client side.
    -   **Chart Controls:** Allows users to change the time window and switch between linear and log scales.

-   **Core UI & User Experience:**
    -   **Global Layout:** A persistent layout with a collapsible sidebar and top navigation bar.
    -   **Theme Switching:** A fully functional theme selector with 7 themes that persists to `localStorage`.
    -   **Global Asset Search:** A debounced header search bar for quickly finding and navigating to assets.
    -   **Notifications Panel:** A functional panel that fetches and displays real user notifications from the `ChasingProphets-Notifications` DynamoDB table.

## 3. List of Partially Implemented Features

-   **Dashboard (`/dashboard`):**
    -   The UI layout is complete.
    -   All data is currently hardcoded from a test file (`testData.ts`).

-   **Settings Page (`/settings`):**
    -   The "Operator Profile" form is a UI-only mockup and does not save data.
