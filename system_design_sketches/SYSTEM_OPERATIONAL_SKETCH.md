# System Operational Sketch

Date: November 5, 2025

---

## 1) What this system is (conceptual)

Chasing Prophets is an ecosystem for understanding standardized data and leveraging it to manifest prediction. It doesn’t promise to predict the future; rather, it helps you discover which prophets (trained model + forecasting method bundles) do best on a chosen object (e.g., a financial asset), across time.

Alpha scope focuses on Finance. Core workflow: Take a dataset about an asset → define a data slice → train a model (fit a scaffold) → create a prophet → evaluate performance daily.

---

## 2) Primary actors

- Guest: Not signed in; can register/verify and log in.
- User (Authenticated): Can browse assets, datasets, data slices, model scaffolds/fits, and prophets; visualize and compare; no CSV downloads in alpha (inline preview only). 
- Admin: Can CRUD assets, datasets, slices, scaffolds; trigger training; create prophets; configure system; monitor jobs.
- System Services: EventBridge schedulers, Lambdas, ECS training tasks updating data and performance.

---

## 3) Primary domain objects

- Asset: The tracked object (e.g., DJIA, SPX, AAPL). Anchor for all dataset affiliations.
- Dataset: Standardized tables (primarily OHLCV in alpha) about an asset. Some are live and updated daily.
- Data Slice: Immutable window(s) on a dataset. Simple (start/end) or compound (list of simple sub-windows). Stored as metadata; optionally cached to S3 CSV.
- Model Scaffold: Architecture template with I/O specs, hyperparameters, and training script reference.
- Model Fit: A scaffold trained on an asset+data slice combo. Status: unfit/fitting/fit/failed. Points to model files in S3.
- Prophet: A model fit + forecasting method + output measure + horizon, tied to a single asset. Generates predictions and stores performance.
- Forecast (future): A composition that uses one/many prophets over fixed time horizons (5–480 days) to generate forward trajectories for comparison.

---

## 4) Alpha goal and contracts

- Alpha Goal: Make prophets the core, end-to-end. No explanation/analysis engines yet.
- Contracts (high level):
  - Datasets: CSV columns and types are standardized per dataset type (OHLCV baseline).
  - Scaffolds: Declare input features and shapes; declare output type; ship training entrypoint; declare inference engine (tfjs/coefficients/server).
  - Fits: Reference exact dataset slice; persist metrics and status.
  - Prophets: Reference one fit; declare measure, method, and horizon; persist daily performance.

---

## 5) High-level flows

- Ingestion & Updates (daily): EventBridge → Lambda → Fetch/append latest OHLCV to S3 → Update Datasets table.
- Training: Admin triggers fit → API Gateway → Lambda → ECS Fargate task → Model artifacts to S3 → Fit status to DynamoDB.
- Inference (prophet update): EventBridge (daily) → Lambda → Load fit/model + latest slice → Predict → Write ProphetPerformance.
- User browse: React page → API Gateway → Lambda → DynamoDB/S3 → Render Plotly charts and tables.
- Browser inference (alpha path): Prophet detail → fetch model (tfjs format) + input data → run tfjs locally → render predictions; server fallback later for large/proprietary models.

---

## 6) Screen-to-object interactions (unique per screen)

- Login/Signup/Verify/Forgot/Reset (Guest): Cognito auth lifecycle.
- Dashboard (User): System snapshot and hero metrics (read-only snapshot of assets/market and top prophets; deep prophet work happens on Prophets screens).
- Global UI (User): Navigation, universal search across assets; notifications; logout.
- Assets List/Detail (User): Discover assets; view OHLCV charts, indicators, time windows.
- Datasets List/Detail (User): Browse datasets for assets; view schema and sample data; inline preview only (no CSV downloads).
- Data Slices List/Detail (User): Browse slices; see composition and usage; inline preview only; cached CSVs are not downloadable.
- Model Scaffolds List/Detail (User): Discover scaffold specs and requirements.
- Model Fits List/Detail (User): Discover fits and metrics; see which prophets use them.
- Prophets List/Detail (User): Discover prophets; run/evaluate predictions (browser inference when feasible); compare vs actuals.
- Admin Dashboard (Admin): System stats, quick actions, job status.
- Admin: Manage Assets, Datasets (upload), Data Slices (create/edit), Model Scaffolds (CRUD + scripts), Model Fits (train/monitor), Prophets (create/manage), Settings, Jobs.

Each screen owns its unique tasks. Overlapping mechanics (e.g., global search, training orchestration) are centralized (Global UI; Admin pages) and referenced from other screens to avoid duplication.

---

## 7) Inference strategy (alpha)

- Preferred: TensorFlow.js in-browser for small/medium models and transparent algorithms (e.g., coefficients-based linear models).
- Fallback (later): Server-side Lambda inference for large/proprietary models; client receives predictions only.

---

## 8) Daily performance updates

- Scheduler triggers prophet updates post data refresh.
- For each active prophet: load model + recent 480 days (if available) → predict next applicable day(s) → store actual/prediction/performance metrics in DynamoDB (ProphetPerformance).
- Prophet pages read latest performance without recomputing historicals.

---

## 9) AWS mapping

- Cognito: Auth (login, signup/verify, forgot/reset).
- API Gateway + Lambda: All REST endpoints.
- DynamoDB: Assets, Datasets, DataSlices, ModelScaffolds, ModelFits, Prophets, ProphetPerformance, AdminAuditLog, Users (future).
- S3: data/ (OHLCV, cached slices), models/ (fit artifacts), scripts/scaffolds/ (training code).
- ECS Fargate: Training jobs; CloudWatch Logs for status.
- EventBridge: Data refresh and prophet updates scheduling.

---

## 10) Non-functional and guardrails

- Security: Admin routes require Cognito group claim; rate-limit uploads and auth attempts; least-privilege IAM.
- Data Quality: CSV validation on upload; schema and range checks; reproducible seeds for training.
- Performance: Debounced search; paginated queries; CDN caching for public assets.
- Observability: Structured logs with job/fit IDs; audit log for admin actions.

---

## 11) Current code alignment and minimal deltas

- Keep current React structure. Introduce new pages/components per mapping docs; wire to API later.
- Short-term data path: continue reading S3 CSV for assets; add thin Lambdas for datasets/slices preview.
- Feature flags: gate planned pages behind feature flags or 404 until backends exist.
- Shared components: Centralize Global Search; centralize Admin forms; chart theming reuses existing ThemeContext.

---

## 12) Roadmap focus

1) Stabilize Assets + Global UI (done).  
2) Add Datasets/Data Slices read-only.  
3) Add Model Scaffolds/Fits read-only.  
4) Admin CRUD + Training orchestration.  
5) Prophets detail with browser inference + daily performance pipeline.  
6) Server inference + Forecasts (future).

---

End of Operational Sketch
