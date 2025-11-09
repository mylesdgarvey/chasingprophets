# Operational Mapping: Settings Page

**Version:** 1.0  
**Date:** November 5, 2025  
**Status:** 🟡 Partial Implementation (Theme functional, Profile UI-only)  
**Page:** `/settings`

---

## Overview

This document provides detailed operational mappings for all tasks on the Settings page. The theme selector is fully functional with localStorage persistence, while the operator profile form is UI-only without backend integration.

---

## User Role: Authenticated User

---

### Task U-14: Change the Application's Visual Theme

**Task ID:** U-14  
**Task Name:** Change the application's visual theme  
**Status:** ✅ Fully Implemented

#### Operational Flow

1. **User Navigation**
   - User clicks "Settings" link in sidebar OR
   - User enters URL `/settings` directly

2. **Route Protection**
   - React Router checks authentication
   - AuthContext validates Cognito tokens
   - If unauthorized: redirect to `/login`
   - If authorized: continue

3. **Settings Component Mount**
   - React renders `Settings.tsx` component
   - Component state initializes:
     - `currentTheme: null` (will be loaded)
     - `profileData: {}` (empty)
     - `savingTheme: false`

4. **Theme Context Initialization**
   - `ThemeContext` provider loads on app mount (before Settings page)
   - Context reads from localStorage on app startup:
     ```typescript
     const savedTheme = localStorage.getItem('chasingprophets-theme');
     const initialTheme = savedTheme || 'default';
     ```

5. **Available Themes**
   - Application provides 7 theme options:
     1. **Default** (Light) - Blue and white, professional
     2. **Dark** - Charcoal background, white text
     3. **Midnight** - Deep blue/black, OLED-friendly
     4. **Forest** - Green accent, earthy tones
     5. **Sunset** - Orange/purple gradient
     6. **Ocean** - Blue gradient, aquatic theme
     7. **High Contrast** - Accessibility mode, maximum contrast

6. **Theme Configuration Storage**
   - File: `src/themes/themeConfigs.ts`
   - Structure:
     ```typescript
     export const themes = {
       default: {
         name: 'Default',
         colors: {
           primary: '#3b82f6',
           background: '#ffffff',
           text: '#1f2937',
           sidebar: '#f9fafb',
           border: '#e5e7eb',
           accent: '#10b981'
         }
       },
       dark: {
         name: 'Dark',
         colors: {
           primary: '#60a5fa',
           background: '#111827',
           text: '#f9fafb',
           sidebar: '#1f2937',
           border: '#374151',
           accent: '#34d399'
         }
       }
       // ... 5 more themes
     };
     ```

7. **Settings Page Renders Theme Selector**
   - Component displays theme selection grid
   - Each theme shown as card:
     - Theme name
     - Color palette preview (5 colored squares)
     - Radio button or "Select" button
     - Checkmark if currently active

8. **User Selects New Theme**
   - User clicks on "Dark" theme card
   - Component calls theme context method:
     ```typescript
     const { setTheme } = useContext(ThemeContext);
     setTheme('dark');
     ```

9. **Theme Context Update**
   - ThemeContext state updates:
     - `currentTheme = 'dark'`
   - Context triggers CSS variable updates

10. **CSS Custom Properties Application**
    - ThemeContext applies theme colors to document:
      ```typescript
      document.documentElement.style.setProperty('--color-primary', '#60a5fa');
      document.documentElement.style.setProperty('--color-background', '#111827');
      document.documentElement.style.setProperty('--color-text', '#f9fafb');
      document.documentElement.style.setProperty('--color-sidebar', '#1f2937');
      document.documentElement.style.setProperty('--color-border', '#374151');
      document.documentElement.style.setProperty('--color-accent', '#34d399');
      ```

11. **Global CSS Responds**
    - All components use CSS variables:
      ```css
      .sidebar {
        background-color: var(--color-sidebar);
        border-right: 1px solid var(--color-border);
      }
      
      .button-primary {
        background-color: var(--color-primary);
        color: var(--color-background);
      }
      ```
    - Theme change is instantaneous (no page reload)
    - All UI elements update immediately

12. **LocalStorage Persistence**
    - ThemeContext saves theme preference:
      ```typescript
      localStorage.setItem('chasingprophets-theme', 'dark');
      ```
    - **Key:** `chasingprophets-theme`
    - **Value:** `'dark'` (theme identifier string)

13. **User Feedback**
    - Settings page shows success message:
      - "Theme updated successfully"
      - Auto-dismisses after 2 seconds
    - Selected theme card shows checkmark icon
    - Previous theme card checkmark removed

14. **Theme Persistence Across Sessions**
    - User closes browser
    - User returns to application later
    - App loads and checks localStorage:
      ```typescript
      const savedTheme = localStorage.getItem('chasingprophets-theme');
      // savedTheme = 'dark'
      ```
    - ThemeContext initializes with saved theme
    - Dark theme applied before first render (no flash)

15. **Header Theme Toggle Integration**
    - Global header has sun/moon icon toggle
    - Clicking icon cycles between light/dark themes:
      - If current theme is light variant: switch to dark
      - If current theme is dark variant: switch to default
    - Uses same ThemeContext mechanism
    - localStorage updated automatically

---

### Task U-15: Update User Profile Information

**Task ID:** U-15  
**Task Name:** Update their user profile information  
**Status:** 🟡 Partial (UI-only, no backend save)

#### Operational Flow

1. **Profile Form Render**
   - Settings page displays "Operator Profile" section
   - Form includes fields:
     - **Display Name:** Text input
     - **Email:** Text input (disabled, read from Cognito)
     - **Role:** Dropdown (User / Admin) - display only
     - **Notification Preferences:**
       - Email notifications (checkbox)
       - In-app notifications (checkbox)
       - Prophet alerts (checkbox)
     - **Default Asset:** Dropdown (select favorite asset)
     - **Default Time Window:** Dropdown (1M, 3M, 6M, 1Y, Max)

2. **Load Current User Data (Cognito)**
   - Component fetches user info from AuthContext:
     ```typescript
     const { user } = useContext(AuthContext);
     // user = {
     //   id: 'cognito-sub-uuid',
     //   email: 'user@example.com',
     //   groups: ['user']
     // }
     ```
   - Email pre-filled from Cognito
   - Role derived from `groups` array

3. **Load User Preferences (Future: DynamoDB)**
   - **Current Implementation:** No API call made
   - **Future Implementation:**
     - API call: `GET /api/user/preferences`
     - Lambda queries `ChasingProphets-Users` table:
       ```javascript
       const params = {
         TableName: 'ChasingProphets-Users',
         Key: { userId: user.id }
       };
       const result = await dynamodb.get(params).promise();
       ```
     - Returns:
       ```json
       {
         "userId": "cognito-sub-uuid",
         "displayName": "John Doe",
         "preferences": {
           "emailNotifications": true,
           "inAppNotifications": true,
           "prophetAlerts": false,
           "defaultAsset": "DJIA",
           "defaultTimeWindow": "3M"
         }
       }
       ```

4. **User Modifies Form Fields**
   - User changes "Display Name" to "Jane Doe"
   - User unchecks "Email notifications"
   - User changes "Default Asset" to "SPX"
   - Component updates local form state:
     ```typescript
     const [formData, setFormData] = useState({
       displayName: 'Jane Doe',
       emailNotifications: false,
       inAppNotifications: true,
       prophetAlerts: false,
       defaultAsset: 'SPX',
       defaultTimeWindow: '3M'
     });
     ```

5. **User Clicks "Save Changes" Button**
   - **Current Implementation:**
     - Button shows loading spinner
     - Simulated 1-second delay:
       ```typescript
       await new Promise(resolve => setTimeout(resolve, 1000));
       ```
     - Success message displayed: "Profile updated successfully"
     - **No API call made**
     - **No data saved to database**
     - Form state persists in component only (resets on page reload)

6. **Future: Save to DynamoDB**
   - **Planned Flow:**
     - API call: `PUT /api/user/preferences`
     - Request body:
       ```json
       {
         "displayName": "Jane Doe",
         "preferences": {
           "emailNotifications": false,
           "inAppNotifications": true,
           "prophetAlerts": false,
           "defaultAsset": "SPX",
           "defaultTimeWindow": "3M"
         }
       }
       ```
     - Lambda function updates DynamoDB:
       ```javascript
       const params = {
         TableName: 'ChasingProphets-Users',
         Key: { userId: user.id },
         UpdateExpression: 'SET displayName = :name, preferences = :prefs, updatedAt = :now',
         ExpressionAttributeValues: {
           ':name': 'Jane Doe',
           ':prefs': { /* preferences object */ },
           ':now': new Date().toISOString()
         }
       };
       await dynamodb.update(params).promise();
       ```
     - Lambda returns success
     - Frontend displays confirmation

7. **Form Validation**
   - **Display Name:**
     - Min length: 2 characters
     - Max length: 50 characters
     - No special characters except spaces, hyphens, apostrophes
   - **Email:**
     - Read-only (managed by Cognito)
     - Cannot be changed from this form
   - If validation fails:
     - Display inline error message
     - Prevent form submission

8. **Error Handling (Future)**
   - Network error: "Unable to save. Check your connection."
   - 401 Unauthorized: Re-authenticate user
   - 500 Server error: "Server error. Please try again."
   - Display error banner above form
   - "Retry" button available

9. **Cancel Button**
   - User clicks "Cancel"
   - Form resets to original values:
     - Re-fetch user data from AuthContext
     - Discard unsaved changes
   - No API call made

---

## Infrastructure Component Summary

### Components Involved in Settings Tasks

| Component | Role | Location/Identifier | Status |
|-----------|------|---------------------|--------|
| **Settings Component** | UI rendering and form state | `src/pages/Settings.tsx` | ✅ Implemented |
| **ThemeContext** | Theme state management | `src/context/ThemeContext.tsx` | ✅ Implemented |
| **Theme Configs** | Theme color definitions | `src/themes/themeConfigs.ts` | ✅ Implemented |
| **AuthContext** | User identity and groups | `src/context/AuthContext.tsx` | ✅ Implemented |
| **Browser LocalStorage** | Theme persistence | Key: `chasingprophets-theme` | ✅ Implemented |
| **CSS Custom Properties** | Dynamic styling | `document.documentElement.style` | ✅ Implemented |
| **API Gateway** | `/api/user/preferences` endpoints | AWS API Gateway | ❌ Not implemented |
| **Lambda: getUserPreferences** | Fetch user preferences | AWS Lambda | ❌ Not implemented |
| **Lambda: updateUserPreferences** | Save user preferences | AWS Lambda | ❌ Not implemented |
| **DynamoDB: Users Table** | User preferences storage | `ChasingProphets-Users` | ❌ Not implemented |

---

## Data Storage Details

### Browser LocalStorage

**Theme Preference:**
- **Key:** `chasingprophets-theme`
- **Value:** `'default' | 'dark' | 'midnight' | 'forest' | 'sunset' | 'ocean' | 'high-contrast'`
- **Example:**
  ```javascript
  localStorage.getItem('chasingprophets-theme'); // 'dark'
  ```

### Future: DynamoDB Users Table

**Table Name:** `ChasingProphets-Users`

**Primary Key:** `userId` (String) - Cognito `sub` UUID

**Attributes:**
```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "user@example.com",
  "displayName": "Jane Doe",
  "role": "user",
  "preferences": {
    "theme": "dark",
    "emailNotifications": false,
    "inAppNotifications": true,
    "prophetAlerts": false,
    "defaultAsset": "SPX",
    "defaultTimeWindow": "3M"
  },
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-11-05T14:30:00Z",
  "lastLogin": "2025-11-05T09:15:00Z"
}
```

**GSI (Global Secondary Index):**
- **Index Name:** `email-index`
- **Partition Key:** `email`
- **Use Case:** Lookup user by email address

---

## Theme Details

### Theme Configuration Example

**Dark Theme Full Specification:**
```typescript
{
  id: 'dark',
  name: 'Dark',
  description: 'Dark mode with blue accents',
  colors: {
    // Backgrounds
    primary: '#60a5fa',           // Blue accent
    background: '#111827',        // Very dark gray
    backgroundSecondary: '#1f2937', // Dark gray
    backgroundTertiary: '#374151', // Medium gray
    
    // Text
    text: '#f9fafb',              // Almost white
    textSecondary: '#d1d5db',     // Light gray
    textMuted: '#9ca3af',         // Medium gray
    
    // UI Elements
    sidebar: '#1f2937',           // Dark gray
    header: '#111827',            // Very dark gray
    border: '#374151',            // Medium gray
    
    // Interactive
    accent: '#34d399',            // Green
    success: '#10b981',           // Green
    warning: '#f59e0b',           // Amber
    error: '#ef4444',             // Red
    info: '#3b82f6',              // Blue
    
    // Charts
    chartLine: '#60a5fa',         // Blue
    chartGrid: '#374151',         // Dark gray
    chartTooltipBg: '#1f2937',    // Dark gray
    chartTooltipText: '#f9fafb',  // White
    
    // Shadows
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(0, 0, 0, 0.3)'
  },
  chartTheme: {
    // Plotly-specific configuration
    template: 'plotly_dark',
    layout: {
      paper_bgcolor: '#111827',
      plot_bgcolor: '#1f2937',
      font: { color: '#f9fafb' },
      xaxis: { 
        gridcolor: '#374151',
        zerolinecolor: '#4b5563'
      },
      yaxis: {
        gridcolor: '#374151',
        zerolinecolor: '#4b5563'
      }
    }
  }
}
```

### CSS Variable Mapping

**Application of Theme:**
```typescript
// ThemeContext applies these on theme change
Object.entries(theme.colors).forEach(([key, value]) => {
  const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
  document.documentElement.style.setProperty(cssVarName, value);
});
```

**Example CSS Variables Set:**
```css
:root {
  --color-primary: #60a5fa;
  --color-background: #111827;
  --color-background-secondary: #1f2937;
  --color-text: #f9fafb;
  --color-text-secondary: #d1d5db;
  --color-sidebar: #1f2937;
  --color-border: #374151;
  --color-accent: #34d399;
  /* ... all theme colors */
}
```

**Component CSS Usage:**
```css
/* Example: Sidebar styles */
.sidebar {
  background-color: var(--color-sidebar);
  border-right: 1px solid var(--color-border);
  color: var(--color-text);
}

.sidebar-link:hover {
  background-color: var(--color-background-secondary);
  color: var(--color-primary);
}

/* Example: Button styles */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-background);
  border: none;
}

.btn-primary:hover {
  background-color: var(--color-accent);
}
```

---

## Plotly Chart Theme Integration

### Chart Theme Application

When theme changes, charts automatically update:

```typescript
// In chart components (e.g., StockChart.tsx)
const { currentTheme } = useContext(ThemeContext);
const theme = themes[currentTheme];

const layout = {
  paper_bgcolor: theme.colors.background,
  plot_bgcolor: theme.colors.backgroundSecondary,
  font: { 
    family: 'Inter, sans-serif',
    color: theme.colors.text 
  },
  xaxis: {
    gridcolor: theme.colors.border,
    linecolor: theme.colors.border,
    tickcolor: theme.colors.textMuted
  },
  yaxis: {
    gridcolor: theme.colors.border,
    linecolor: theme.colors.border,
    tickcolor: theme.colors.textMuted
  },
  hovermode: 'x unified',
  hoverlabel: {
    bgcolor: theme.colors.backgroundTertiary,
    bordercolor: theme.colors.border,
    font: { color: theme.colors.text }
  }
};

// Chart automatically re-renders with new theme
```

---

## User Experience Flow

### Complete Theme Change Journey

1. **User arrives at Settings page**
   - Sees current theme highlighted (e.g., "Default")
   - Views all 7 theme options in grid

2. **User explores themes**
   - Hovers over "Dark" theme card
   - Sees preview colors
   - Reads description: "Dark mode with blue accents"

3. **User selects theme**
   - Clicks "Dark" theme card
   - **Instant visual change:**
     - Background turns dark gray
     - Text turns white
     - Sidebar updates to dark theme
     - All charts redraw with dark theme
     - Settings page UI updates
   - Success message appears

4. **User navigates away**
   - Clicks "Assets" in sidebar
   - Assets page renders with dark theme
   - Charts display with dark theme
   - No flash or delay

5. **User closes browser**
   - Theme preference saved in localStorage

6. **User returns next day**
   - Opens application
   - Dark theme applied immediately (before first paint)
   - No flash of default theme
   - Seamless experience

---

## Performance Considerations

### Theme Switching Performance

- **Switch Time:** < 50ms (CSS variable update)
- **Visual Flash:** None (CSS variables update synchronously)
- **Chart Re-render:** 100-200ms (Plotly re-layout)
- **Total Perceived Latency:** < 200ms

### LocalStorage Access

- **Read Time:** < 1ms (synchronous browser API)
- **Write Time:** < 1ms (synchronous browser API)
- **Storage Size:** ~50 bytes per theme preference

---

## Accessibility Features

### High Contrast Theme

**Purpose:** Accessibility for users with visual impairments

**Characteristics:**
- Maximum contrast ratio (21:1)
- Pure black (#000000) background
- Pure white (#ffffff) text
- Bold borders (2px minimum)
- No gradients or shadows
- No subtle color differences
- Large focus indicators

**WCAG Compliance:**
- Meets WCAG 2.1 Level AAA for contrast
- Supports screen readers (semantic HTML)
- Keyboard navigation fully functional

---

## Error States

### Theme Loading Failure

**Scenario:** localStorage corrupted or invalid theme ID

**Handling:**
```typescript
try {
  const savedTheme = localStorage.getItem('chasingprophets-theme');
  if (!themes[savedTheme]) {
    console.warn('Invalid theme, falling back to default');
    setTheme('default');
  } else {
    setTheme(savedTheme);
  }
} catch (error) {
  console.error('Failed to load theme:', error);
  setTheme('default');
}
```

**User Experience:**
- Fallback to default theme
- No error message displayed
- Application continues to function

---

## Future Enhancements

### Planned Features (Not Implemented)

1. **Custom Theme Builder:**
   - User creates custom color palette
   - Live preview as colors selected
   - Save custom theme to user preferences

2. **Theme Scheduling:**
   - Auto-switch to dark theme at sunset
   - Auto-switch to light theme at sunrise
   - Based on user's timezone

3. **Theme Presets by Use Case:**
   - "Presentation Mode" - high contrast, large text
   - "Print Mode" - optimized for screenshots
   - "Energy Saver" - dark theme with reduced animations

4. **Sync Across Devices:**
   - Save theme to DynamoDB (not just localStorage)
   - Sync preferences across all user devices
   - Requires user to be logged in

---

## End of Settings Page Operational Mapping
