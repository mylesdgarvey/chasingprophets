# Chasing Prophets - Database Schema

**Version:** 2.0
**Date:** November 5, 2025
**Status:** Design & Implementation Reconciliation

---

## 1. Schema Overview

This document outlines the DynamoDB schema for the Chasing Prophets application. It distinguishes between tables that are currently in use by the prototype and those that are planned for future features.

### **Data Model:**

The system is designed around a clear data hierarchy:
**Assets → Datasets → Data Slices → Model Scaffolds → Model Fits → Prophets → Performance Metrics**

### **Table Strategy:**

The design uses a multi-table approach in DynamoDB for clear separation of concerns and independent scaling.

---

## 2. Implemented & In-Use Tables

The current prototype actively uses the following tables. The schema definitions below reflect what is being used in the code (`src/services/*.ts`).

### **Table: `ChasingProphets-Assets`**

*   **Purpose:** Stores metadata for financial instruments.
*   **Status:** ✅ **In Use**
*   **Primary Key:** `ticker` (String)

| Attribute | Type | In Use? | Description |
| :--- | :--- | :--- | :--- |
| **ticker** (PK) | String | ✅ | Unique asset identifier (e.g., "AAPL", "DJIA"). |
| name | String | ✅ | Full asset name (e.g., "Apple Inc."). |
| market | String | ✅ | The market or exchange (e.g., "NASDAQ"). |
| lastPrice | Number | ✅ | The most recent price. |
| priceChange | Number | ✅ | The change from the previous period. |
| description | String | ❔ | Defined in schema, but not actively used in `AssetMeta` type. |
| isActive | Boolean | ❔ | Defined in schema, but not actively used in `AssetMeta` type. |

### **Table: `ChasingProphets-AssetPrices`**

*   **Purpose:** Stores the time-series price history for each asset.
*   **Status:** ✅ **In Use**
*   **Primary Key:** `ticker` (String)
*   **Sort Key:** `date` (String, ISO 8601 `YYYY-MM-DD`)

| Attribute | Type | In Use? | Description |
| :--- | :--- | :--- | :--- |
| **ticker** (PK) | String | ✅ | Foreign key to the `ChasingProphets-Assets` table. |
| **date** (SK) | String | ✅ | The date of the price record. |
| open | Number | ✅ | Opening price. |
| high | Number | ✅ | Highest price. |
| low | Number | ✅ | Lowest price. |
| close | Number | ✅ | Closing price. |
| volume | Number | ✅ | Trading volume. |

### **Table: `ChasingProphets-Notifications`**

*   **Purpose:** Stores system-generated notifications for users.
*   **Status:** ✅ **In Use**
*   **Primary Key:** `userId` (String)
*   **Sort Key:** `notificationId` (String)

| Attribute | Type | In Use? | Description |
| :--- | :--- | :--- | :--- |
| **userId** (PK) | String | ✅ | The ID of the user who receives the notification. |
| **notificationId** (SK) | String | ✅ | A unique ID for the notification. |
| message | String | ✅ | The content of the notification. |
| checked | Boolean | ✅ | `true` if the user has marked it as read, otherwise `false`. |
| createdAt | String | ✅ | ISO 8601 timestamp of when the notification was created. |

---

## 3. Planned (Not Yet Implemented) Tables

These tables are part of the conceptual design and are required to build out the core "Prophet" functionality. They are **not currently used** by the application.

### **Table: `ChasingProphets-Users`**

*   **Purpose:** Store user profiles and application-specific settings.
*   **Status:** ❌ **Not Implemented**
*   **Primary Key:** `userId` (String, from Cognito `sub`)

| Attribute | Type | Description |
| :--- | :--- | :--- |
| **userId** (PK) | String | Cognito `sub` UUID. |
| role | String | `admin` or `user`. |
| username | String | Display name. |
| email | String | User's email address (for GSI). |
| theme | String | Saved UI theme preference (e.g., "night-blue"). |
| createdAt | String | ISO 8601 timestamp. |

### **Table: `ChasingProphets-Datasets`**

*   **Purpose:** Catalog of standardized data collections for each asset.
*   **Status:** ❌ **Not Implemented**
*   **Primary Key:** `datasetId` (String)

| Attribute | Type | Description |
| :--- | :--- | :--- |
| **datasetId** (PK) | String | Unique dataset identifier. |
| assetId | String | Foreign key to the `Assets` table. |
| name | String | Human-readable name (e.g., "SPX Daily OHLCV"). |
| type | String | `OHLCV`, `fundamentals`, etc. |
| CEE | List | Standardized column names (e.g., `["date", "open", "close"]`). |
| folder | String | S3 folder path where raw data is stored. |
| isLive | Boolean | `true` if the dataset is actively updated. |

### **Table: `ChasingProphets-DataSlices`**

*   **Purpose:** Defines fixed, immutable time windows of datasets for model training.
*   **Status:** ❌ **Not Implemented**
*   **Primary Key:** `sliceId` (String)

| Attribute | Type | Description |
| :--- | :--- | :--- |
| **sliceId** (PK) | String | Unique slice identifier. |
| datasetId | String | Foreign key to the `Datasets` table. |
| startDate | String | ISO 8601 start date of the slice. |
| endDate | String | ISO 8601 end date of the slice. |
| sliceType | String | `simple` or `compound`. |

### **Table: `ChasingProphets-ModelScaffolds`**

*   **Purpose:** Reusable model architecture templates.
*   **Status:** ❌ **Not Implemented**
*   **Primary Key:** `scaffoldId` (String)

| Attribute | Type | Description |
| :--- | :--- | :--- |
| **scaffoldId** (PK) | String | Unique ID (e.g., "SLR-LAG-1"). |
| name | String | Human-readable name. |
| type | String | Model category (`ML`, `DL`, `TS`). |
| description | String | Detailed model description. |

### **Table: `ChasingProphets-ModelFits`**

*   **Purpose:** Represents a trained model instance (a scaffold trained on a data slice).
*   **Status:** ❌ **Not Implemented**
*   **Primary Key:** `modelFitId` (String)

| Attribute | Type | Description |
| :--- | :--- | :--- |
| **modelFitId** (PK) | String | Unique model fit identifier. |
| scaffoldId | String | Foreign key to the `ModelScaffolds` table. |
| assetId | String | The asset this model was trained on. |
| trainingSlices | List | List of `sliceId`s used for training. |
| trainingStatus | String | `unfit`, `fitting`, `fit`, `failed`. |
| fileLocation | String | S3 path to the trained model artifact (e.g., TF.js files). |

### **Table: `ChasingProphets-Prophets`**

*   **Purpose:** The final, deployable prediction engines that users interact with.
*   **Status:** ❌ **Not Implemented**
*   **Primary Key:** `prophetId` (String)

| Attribute | Type | Description |
| :--- | :--- | :--- |
| **prophetId** (PK) | String | Unique prophet identifier. |
| name | String | Prophet display name (e.g., "TimeSage AI - SPX"). |
| assetId | String | The asset this prophet predicts. |
| modelFitId | String | The core model fit this prophet uses. |
| outputMeasure | String | What the prophet predicts (e.g., "close_price"). |
| isActive | Boolean | `true` if the prophet is live and making predictions. |

### **Table: `ChasingProphets-ProphetPerformance`**

*   **Purpose:** Stores the daily performance metrics for each prophet.
*   **Status:** ❌ **Not Implemented**
*   **Primary Key:** `prophetId` (String)
*   **Sort Key:** `date` (String, `YYYY-MM-DD`)

| Attribute | Type | Description |
| :--- | :--- | :--- |
| **prophetId** (PK) | String | Foreign key to the `Prophets` table. |
| **date** (SK) | String | The date the performance was calculated for. |
| MAPE | Number | Mean Absolute Percentage Error for the day. |
| accuracy | Number | Directional accuracy for the day. |
| prediction | Number | The value the prophet predicted. |
| actual | Number | The actual value that occurred. |

