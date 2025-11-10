# Visual Baseline Captures

This directory stores screenshots of the application at various stages for visual regression testing.

## Session 0 Baseline (Pre-Alpha Features)

**Date**: November 6, 2025  
**Purpose**: Capture existing UI before any model system implementation

### Required Screenshots

1. **Login Page** (`session0_login.png`)
   - Route: `/login`
   - Capture: Full page with login form

2. **Dashboard** (`session0_dashboard.png`)
   - Route: `/dashboard`
   - Capture: Full page with prophet selector accordion and main chart
   - **CRITICAL**: This is the highest-risk page for visual regression

3. **Assets List** (`session0_assets.png`)
   - Route: `/assets`
   - Capture: Asset table with search (admin only)

4. **Asset Detail** (`session0_asset_detail_DJIA.png`)
   - Route: `/assets/DJIA`
   - Capture: Full page with main chart and all technical indicators

5. **Settings** (`session0_settings.png`)
   - Route: `/settings`
   - Capture: Settings page with theme toggle

### How to Capture

#### Option A: Manual Screenshots
1. Start dev server: `npm run dev`
2. Login with test credentials
3. Visit each route and take screenshots
4. Save to this directory with naming convention above

#### Option B: Automated (Playwright)
```bash
# Install Playwright
npm install -D @playwright/test

# Create screenshot script
npx playwright codegen http://localhost:5173

# Run screenshot capture
npm run capture-baselines
```

### Visual Regression Testing

After each session, compare new screenshots against Session 0 baseline:

**Allowed Changes**:
- New nav items (e.g., "Management" link)
- New pages under `/mgmt/*`, `/prophets`, `/forecasts`
- Theme improvements (if intentional)

**NOT Allowed**:
- Dashboard prophet selector layout changes
- Asset detail chart positioning changes
- Login page layout changes
- Settings page layout changes

### Diff Tools

- **Manual**: Side-by-side comparison
- **Automated**: Playwright visual comparison, Percy, BackstopJS

---

**Status**: Directory created, awaiting screenshot capture

