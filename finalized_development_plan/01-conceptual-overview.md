# Chasing Prophets — Conceptual Overview (Alpha)

Date: 2025-11-06
Status: Revised to reflect contract-based scaffold system

## Vision in one paragraph
Chasing Prophets is a system to describe, explain, and predict entities. In the alpha, the entity is a financial asset. Users explore Assets and their Datasets, train Model Fits from reusable contract-based Model Scaffolds on validated Data Slices, and deploy Prophets that make daily predictions; we then track Performance to rank what works. Model Scaffolds define precise input/output contracts and include executable training and inference scripts (both server-side and client-side). The long vision is domain‑agnostic: finance first, then sports, games, and beyond.

## Canonical object graph
Assets → Datasets → Data Slices ⟷ Model Scaffolds (contract validation) → Model Fits → Prophets → Forecasts → Performance

- **Asset**: A thing being predicted (e.g., DJIA, SPX, AAPL)
- **Dataset**: Standardized OHLCV history for an asset, stored in S3 as CSV
- **Data Slice**: Immutable training/eval window from a dataset with analyzed schema (columns, types, ranges)
- **Model Scaffold**: Contract-based reusable model design with:
  - Input/output contracts (field names, types, value ranges)
  - Three executable scripts: training (Python), remote inference (Python), local inference (JavaScript)
  - Contextualized (specific variable names) or non-contextualized (generic variables)
- **Model Fit**: Trained instance of a scaffold on a contract-validated slice for an asset
  - Stores model parameters in S3
  - Copies scaffold's inference scripts for execution
- **Prophet**: A deployed prediction engine (fit + forecasting method)
  - Executes remote inference on server scheduler for daily predictions
  - Supports local inference in browser for performance visualization
- **Forecast**: Multi-day prediction over fixed horizon (20/60/120/240 days) from a prophet
- **Performance**: Aggregated metrics computed over time windows (20d, 40d, 60d, 120d, 240d, 480d, 1080d, 1200d)
  - Daily raw data not persisted (computed on-demand client-side for visualization)

## Design principles
- **Truth before flash**: Correctness, reproducibility, and auditability
- **Contract-first validation**: Data slices and scaffolds must have compatible contracts before model fits can be created
- **Immutable training windows**: Explicit provenance for every artifact
- **Dual inference architecture**: 
  - Server-side (remote) inference for scheduled predictions and daily performance tracking
  - Client-side (local) inference for on-demand performance visualization without server load
- **Script-based extensibility**: All model logic lives in uploadable/editable Python and JavaScript scripts stored in S3
- **Aggregate-only persistence**: Daily predictions aggregated into rolling metrics; individual predictions computed on-demand
- **Pre-signed, short-lived access**: Models and data in S3 accessed via temporary URLs
- **Least-privilege IAM**: Scripted setup with repeatable deployments

## Alpha scope (what "done" looks like)
- Users can log in (Cognito) and browse Assets and their price charts
- Admin can:
  - Create contract-based model scaffolds with input/output specifications
  - Upload and edit training/inference scripts (Python + JavaScript) via web UI
  - Test local and remote inference directly in admin panel
  - Seed real DJIA and SPX datasets with schema analysis
  - Create data slices with automatic column/type/range detection
  - Validate scaffold/slice contract compatibility
  - Create model fits with automated training
  - Deploy prophets with dual inference modes
- Daily scheduler:
  - Updates datasets with latest OHLCV data
  - Runs remote inference for all active prophets
  - Computes and persists rolling performance aggregates (20d through 1200d windows)
- User views prophet performance:
  - Client-side local inference on 1200 days of historical data
  - Performance charts rendered in browser without server queries
- Prophet leaderboard ranks predictive performance across all assets and time windows
- App deployed on Amplify; infra created by scripts with one-time IAM bootstrap

## Out-of-scope for alpha
- Social features, marketplace, crypto/tokenomics
- GPU training and advanced deep learning models (starting with statistical baselines: SLR, MLR)
- Full multi-tenant or enterprise controls
- Real-time streaming predictions (daily batch only)
- Ensemble prophets (single model fit per prophet in alpha)

---

This document is derived from HUMAN_DESIGNER_CONCEPT_DESCRIPTION.md and aligned with the concrete architecture decisions captured for v1 alpha.