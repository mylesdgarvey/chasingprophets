# Widget System Implementation

## Overview
The application now uses a modular widget-based architecture where each chart/visualization is wrapped in a reusable `Widget` component with expand/fullscreen capabilities.

## Architecture

### Widget Component
Location: `/src/components/widgets/Widget.tsx`

**Features:**
- Title and subtitle display
- Expand/fullscreen functionality (click outside or ESC to close)
- Smooth animations (fadeIn, scaleIn)
- Overlay system with backdrop blur
- Flexible content container

**Props:**
```typescript
interface WidgetProps {
  id: string;                    // Unique identifier
  title: string;                 // Widget title
  subtitle?: string;             // Optional subtitle
  children: React.ReactNode;     // Widget content
  expandable?: boolean;          // Enable expand button (default: true)
  defaultExpanded?: boolean;     // Start in expanded state
  onExpand?: (expanded: boolean) => void;  // Callback on expand state change
  className?: string;            // Additional CSS classes
}
```

**Usage Example:**
```tsx
<Widget
  id="price-volume-explorer"
  title="Price-Volume Explorer"
  subtitle="Interactive 3D Analysis"
>
  <div className="chart-container">
    <PriceVolumeExplorer data={prices} height={380} />
  </div>
</Widget>
```

### Current Implementation

#### AssetPage Widgets (4 total)
All chart panels in `/src/pages/AssetPage.tsx` now use the Widget component:

1. **Price-Volume Explorer** - 3D interactive surface chart
2. **Daily Returns** - Returns distribution with time window selectors (DoD, WoW, MoM, etc.)
3. **Time Explorer** - Historical timeline view
4. **Technical Analysis** - Key indicators (SMA, RSI, MACD)

**Layout:**
- 3-column grid (`.widgets-grid`)
- Responsive gap spacing
- Glass morphism styling via `glass-surface` class

### Styling

#### Widget Styles
Location: `/src/components/widgets/Widget.css`

**Key Classes:**
- `.widget` - Base widget container
- `.widget-header` - Title/subtitle section with expand button
- `.widget-content` - Content container
- `.widget-overlay` - Fullscreen overlay (z-index: 9999)
- `.widget-fullscreen` - Expanded widget (95vw × 90vh)

**Animations:**
- `@keyframes fadeIn` - 0.2s opacity transition
- `@keyframes scaleIn` - 0.2s scale transformation

#### Page Styles
Location: `/src/pages/AssetPage.css`

**Key Classes:**
- `.widgets-grid` - 3-column grid layout
- `.indicators-content` - Technical analysis indicator container
- `.hero-chart` - Integrated chart in hero section

## Theme System

### Theme Configuration
Location: `/src/themes/themeConfigs.ts`

**Available Themes:**
1. **Night Blue** (default dark) - Deep blue gradients, cool tones
2. **Day Light** (default light) - Clean white/gray, warm accents
3. **Cyber Purple** - Vibrant purple/magenta cyberpunk aesthetic
4. **Forest Green** - Earthy green tones with natural feel

**Theme Structure:**
Each theme defines 30+ properties including:
- **UI Colors**: Primary, secondary, background, text, borders
- **Chart Colors**: Background, grid, axes, tooltips
- **Candlestick Colors**: Up/down colors for financial charts
- **Gradients**: Hero section, cards, overlays
- **Effects**: Shadows, hover states, glass morphism

**Usage:**
```typescript
import { themes, getThemeById } from '@/themes/themeConfigs';

// Get all themes
const allThemes = themes;

// Get specific theme
const nightBlue = getThemeById('night-blue');
```

### Integration Status
- ✅ Theme config file created with 4 complete themes
- ✅ Widget system fully implemented on AssetPage
- ⏳ Theme context/provider (pending)
- ⏳ Theme selector UI (pending)
- ⏳ Plotly chart theme integration (pending)
- ⏳ Dashboard widget conversion (pending)

## Future Enhancements

### Short-term
1. Create `ThemeContext` and `ThemeProvider` to manage active theme
2. Build theme selector UI component (dropdown/palette picker)
3. Update Plotly charts to use theme colors from config
4. Apply widget system to Dashboard page
5. Add widget drag-and-drop positioning

### Long-term
1. **Custom Themes**: User-created themes stored in database
2. **Custom Chart Images**: Replace candlesticks with custom images (bears/bulls, etc.)
3. **Widget Marketplace**: Community-created widgets
4. **Layout Persistence**: Save user's widget arrangements
5. **Widget Configuration**: Per-widget settings (refresh rate, data sources, etc.)

## Benefits

### Modularity
- Each widget is self-contained and reusable
- Easy to add/remove widgets from pages
- Consistent UI/UX across all visualizations

### Customization
- Themes separated from CSS (easy to modify/extend)
- Widget-level configuration
- Flexible layout system

### User Experience
- Fullscreen mode for detailed analysis
- Smooth animations and transitions
- Responsive design for all screen sizes
- Keyboard shortcuts (ESC to close)

### Developer Experience
- Simple, intuitive API
- TypeScript for type safety
- Clear separation of concerns
- Easy to test and maintain

## Migration Guide

### Converting Old Panels to Widgets

**Before:**
```tsx
<article className="chart-panel glass-surface">
  <div className="panel-header">
    <h3>Chart Title</h3>
    <span>Chart Subtitle</span>
  </div>
  <div className="chart-container">
    <ChartComponent />
  </div>
</article>
```

**After:**
```tsx
<Widget
  id="unique-id"
  title="Chart Title"
  subtitle="Chart Subtitle"
>
  <div className="chart-container">
    <ChartComponent />
  </div>
</Widget>
```

### Error Boundaries
Widgets should be wrapped in ErrorBoundary for robustness:

```tsx
<ErrorBoundary>
  <Widget {...props}>
    <ChartComponent />
  </Widget>
</ErrorBoundary>
```

## Notes
- Widget component uses `glass-surface` class for styling (from global styles)
- Fullscreen overlay prevents page scroll
- Click outside overlay or press ESC to exit fullscreen
- Widget IDs should be unique within a page
