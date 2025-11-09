# Operational Mapping: Global UI Elements

**Version:** 1.0  
**Date:** November 5, 2025  
**Status:** ✅ Fully Implemented  
**Scope:** Cross-cutting UI components available on all authenticated pages

---

## Overview

This document provides detailed operational mappings for all global UI elements that appear across multiple pages, including navigation, search, notifications, theme toggle, and session management.

---

## Global Component: Sidebar Navigation

### User Role: Authenticated User

---

### Task: Navigate Between Pages Using Sidebar

**Task ID:** U-4  
**Task Name:** Navigate between pages using the sidebar  
**Status:** ✅ Fully Implemented

#### Operational Flow

1. **Sidebar Render**
   - Layout component renders sidebar on all authenticated pages
   - Component: `src/components/layout/Sidebar.tsx`
   - Position: Fixed left side, full height
   - Initial state: Expanded (desktop) or Collapsed (mobile)

2. **Sidebar Structure**
   - **Header Section:**
     - Application logo
     - Application name: "Chasing Prophets"
     - Collapse/expand button (logo acts as toggle)
   - **Navigation Links:**
     - Dashboard (icon: grid, route: `/dashboard`)
     - Assets (icon: chart-line, route: `/assets`)
     - Settings (icon: cog, route: `/settings`)
     - ~~Datasets~~ (disabled, grayed out, future)
     - ~~Data Slices~~ (disabled, grayed out, future)
     - ~~Model Fits~~ (disabled, grayed out, future)
     - ~~Prophets~~ (disabled, grayed out, future)
   - **Footer Section:**
     - Logout button (icon: sign-out)
     - User display name
     - Role badge (User/Admin)

3. **User Clicks Navigation Link**
   - User clicks "Assets" navigation link
   - React Router `<Link>` component triggers

4. **Client-Side Navigation**
   - React Router intercepts click event
   - Prevents default browser navigation (no page reload)
   - Updates browser history:
     ```typescript
     history.push('/assets');
     ```
   - Updates browser URL bar to `/assets`

5. **Route Matching**
   - React Router matches new path to route configuration
   - Finds matching route: `/assets` → `<Assets />` component
   - Unmounts current page component
   - Mounts new page component

6. **Active Link Highlighting**
   - Sidebar component uses `useLocation()` hook:
     ```typescript
     const location = useLocation();
     const isActive = location.pathname === '/assets';
     ```
   - Applies active state styling to "Assets" link:
     - Background color: Light blue highlight
     - Border-left: 3px solid primary color
     - Icon color: Primary color
     - Text weight: Bold

7. **Page Transition**
   - Previous page component unmounts (cleanup useEffect hooks)
   - New page component mounts (runs initialization useEffect hooks)
   - Sidebar remains mounted (no re-render unless state changes)
   - Navigation completes in < 100ms

8. **Scroll Position Reset**
   - Browser scrolls to top of new page
   - Scroll position of previous page not saved
   - **Future:** Implement scroll restoration for better UX

---

### Task: Collapse/Expand Sidebar

**Task ID:** Global UI Task  
**Task Name:** Toggle sidebar visibility  
**Status:** ✅ Fully Implemented

#### Operational Flow

1. **User Clicks Logo**
   - User clicks application logo (top of sidebar)
   - Click handler triggers state update

2. **Sidebar State Toggle**
   - Layout component state updates:
     ```typescript
     const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
     const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
     ```
   - State changes: `sidebarCollapsed = true`

3. **CSS Transition**
   - Sidebar div has CSS class applied:
     ```css
     .sidebar {
       width: 250px;
       transition: width 0.3s ease;
     }
     
     .sidebar.collapsed {
       width: 60px;
     }
     ```
   - Sidebar animates to collapsed width (60px)

4. **Navigation Link Text Hide**
   - Link text elements fade out:
     ```css
     .sidebar.collapsed .nav-link-text {
       opacity: 0;
       display: none;
     }
     ```
   - Only icons remain visible

5. **Tooltip Display**
   - User hovers over collapsed navigation icon
   - Browser shows native tooltip with link text:
     ```html
     <a href="/assets" title="Assets">
       <icon />
     </a>
     ```

6. **Main Content Reflow**
   - Main content area has dynamic margin:
     ```css
     .main-content {
       margin-left: 250px;
       transition: margin-left 0.3s ease;
     }
     
     .main-content.sidebar-collapsed {
       margin-left: 60px;
     }
     ```
   - Content area expands to fill space (190px wider)

7. **LocalStorage Persistence**
   - Layout component saves preference:
     ```typescript
     localStorage.setItem('sidebar-collapsed', 'true');
     ```
   - On next page load:
     - Read from localStorage
     - Initialize sidebar in collapsed state
     - User preference maintained across sessions

---

## Global Component: Header Bar

---

### Task: Use Global Search

**Task ID:** U-5 (Global Search)  
**Task Name:** Search for a specific asset globally  
**Status:** ✅ Fully Implemented

#### Operational Flow

1. **Header Bar Render**
   - Header component renders at top of page
   - Component: `src/components/layout/Header.tsx`
   - Contains:
     - Global search input (center)
     - Theme toggle button (right)
     - Notifications bell (right)
     - User menu (far right)

2. **Search Input Focus**
   - User clicks in search box OR
   - User presses keyboard shortcut: `/` key
   - Input field receives focus
   - Placeholder text: "Search assets... (Press / to focus)"

3. **User Types Query**
   - User types: "AAPL"
   - Component state updates with each keystroke:
     ```typescript
     const [searchQuery, setSearchQuery] = useState('');
     const handleInput = (e) => setSearchQuery(e.target.value);
     ```

4. **Debounced Search Trigger**
   - Component uses debounce hook:
     ```typescript
     const debouncedQuery = useDebounce(searchQuery, 200); // 200ms delay
     
     useEffect(() => {
       if (debouncedQuery.length >= 2) {
         performSearch(debouncedQuery);
       }
     }, [debouncedQuery]);
     ```
   - Prevents API call on every keystroke
   - Waits 200ms after user stops typing

5. **API Search Request**
   - After debounce delay, call API:
     ```
     GET /api/assets/search?q=AAPL&limit=10
     Headers:
       Authorization: Bearer <cognito-id-token>
     ```

6. **Lambda Search Function**
   - Lambda receives query parameter
   - DynamoDB scan with filter:
     ```javascript
     const params = {
       TableName: 'ChasingProphets-Assets',
       FilterExpression: 'contains(assetId, :query) OR contains(#name, :query)',
       ExpressionAttributeNames: { '#name': 'name' },
       ExpressionAttributeValues: { ':query': 'AAPL' },
       Limit: 10
     };
     const result = await dynamodb.scan(params).promise();
     ```
   - **Note:** For better performance, future implementation should use DynamoDB GSI with begins_with query

7. **Search Results Response**
   - Lambda returns filtered results:
     ```json
     {
       "success": true,
       "results": [
         {
           "id": "AAPL",
           "ticker": "AAPL",
           "name": "Apple Inc.",
           "type": "stock",
           "sector": "Technology",
           "exchange": "NASDAQ",
           "lastPrice": 176.80
         }
       ],
       "count": 1
     }
     ```

8. **Dropdown Results Display**
   - Component renders search dropdown:
     ```tsx
     <div className="search-dropdown">
       {results.map(asset => (
         <div key={asset.id} className="search-result-item">
           <span className="ticker">{asset.ticker}</span>
           <span className="name">{asset.name}</span>
           <span className="price">${asset.lastPrice}</span>
         </div>
       ))}
     </div>
     ```
   - Positioned absolutely below search input
   - Max height: 400px (scrollable if > 10 results)

9. **Keyboard Navigation**
   - User presses Arrow Down key
   - First result highlights (blue background)
   - State tracks selected index:
     ```typescript
     const [selectedIndex, setSelectedIndex] = useState(0);
     
     const handleKeyDown = (e) => {
       if (e.key === 'ArrowDown') {
         setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
       } else if (e.key === 'ArrowUp') {
         setSelectedIndex(prev => Math.max(prev - 1, 0));
       } else if (e.key === 'Enter') {
         navigateToAsset(results[selectedIndex]);
       } else if (e.key === 'Escape') {
         closeDropdown();
       }
     };
     ```

10. **Navigate to Asset**
    - User clicks result OR presses Enter
    - React Router navigates:
      ```typescript
      navigate(`/assets/${asset.id}`);
      ```
    - Search dropdown closes
    - Search input clears
    - Asset detail page loads

11. **Empty State**
    - If search returns no results:
      - Display: "No assets found matching 'XYZ'"
      - Show suggestion: "Try a different search term"

12. **Loading State**
    - While API request pending:
      - Display loading spinner in dropdown
      - Text: "Searching..."
      - Previous results remain visible (optional)

13. **Close Dropdown**
    - User clicks outside dropdown OR
    - User presses Escape key OR
    - User clears search input
    - Dropdown hides
    - Search state resets

---

### Task: Toggle Theme (Header Button)

**Task ID:** Global UI Task  
**Task Name:** Quick theme toggle from header  
**Status:** ✅ Fully Implemented

#### Operational Flow

1. **Theme Toggle Button Render**
   - Header displays sun/moon icon button
   - Icon reflects current theme:
     - Light theme: Moon icon (switch to dark)
     - Dark theme: Sun icon (switch to light)

2. **User Clicks Theme Toggle**
   - User clicks icon button
   - Click handler triggers:
     ```typescript
     const { currentTheme, setTheme } = useContext(ThemeContext);
     
     const toggleTheme = () => {
       const isDark = ['dark', 'midnight'].includes(currentTheme);
       const newTheme = isDark ? 'default' : 'dark';
       setTheme(newTheme);
     };
     ```

3. **Theme Context Update**
   - Same flow as Settings page (Task U-14)
   - ThemeContext updates CSS variables
   - LocalStorage updated
   - All UI elements re-style instantly

4. **Icon Update**
   - Button icon changes:
     - Was moon → Now sun
   - Tooltip updates:
     - Was "Switch to dark mode" → Now "Switch to light mode"

5. **Performance**
   - Toggle completes in < 50ms
   - No page reload
   - Smooth visual transition

---

## Global Component: Notifications

---

### Task: View and Manage Notifications

**Task ID:** U-6  
**Task Name:** View and manage notifications  
**Status:** ✅ Fully Implemented

#### Operational Flow

1. **Notifications Bell Render**
   - Header displays bell icon button
   - Badge shows unread count (if > 0)
   - Badge color: Red (for attention)

2. **Notification State Management**
   - NotificationContext provides global state:
     ```typescript
     const [notifications, setNotifications] = useState([]);
     const [unreadCount, setUnreadCount] = useState(0);
     ```
   - Context loaded on app mount

3. **Initial Load (Future: API Integration)**
   - **Current:** Notifications loaded from local state/mock data
   - **Future:** API call on app mount:
     ```
     GET /api/notifications?userId={userId}&status=unread
     ```
   - Lambda queries notifications (future table or service)
   - Returns recent notifications (last 30 days)

4. **Notification Data Structure**
   ```typescript
   interface Notification {
     id: string;
     userId: string;
     type: 'info' | 'warning' | 'error' | 'success';
     title: string;
     message: string;
     timestamp: string; // ISO 8601
     isRead: boolean;
     actionUrl?: string; // Optional link to related entity
     metadata?: {
       assetId?: string;
       prophetId?: string;
       modelFitId?: string;
     };
   }
   ```

5. **Sample Notifications**
   ```typescript
   const mockNotifications = [
     {
       id: 'notif-001',
       userId: 'user-123',
       type: 'success',
       title: 'Prophet Update Complete',
       message: 'TimeSage AI has been updated with latest market data',
       timestamp: '2025-11-05T09:30:00Z',
       isRead: false,
       actionUrl: '/prophets/timesage-ai',
       metadata: { prophetId: 'timesage-ai' }
     },
     {
       id: 'notif-002',
       userId: 'user-123',
       type: 'warning',
       title: 'High Volatility Detected',
       message: 'DJIA volatility exceeded 15% threshold',
       timestamp: '2025-11-05T08:15:00Z',
       isRead: false,
       actionUrl: '/assets/DJIA',
       metadata: { assetId: 'DJIA' }
     }
   ];
   ```

6. **Unread Count Calculation**
   - Context calculates unread count:
     ```typescript
     const unreadCount = notifications.filter(n => !n.isRead).length;
     ```
   - Badge displays count (max display: 99+)

7. **User Clicks Notifications Bell**
   - User clicks bell icon
   - Component toggles dropdown state:
     ```typescript
     const [isOpen, setIsOpen] = useState(false);
     const toggleNotifications = () => setIsOpen(!isOpen);
     ```

8. **Notifications Dropdown Render**
   - Dropdown panel appears below bell icon
   - Position: Absolute, right-aligned
   - Max height: 500px (scrollable)
   - Structure:
     ```tsx
     <div className="notifications-dropdown">
       <div className="header">
         <h3>Notifications</h3>
         <button onClick={markAllAsRead}>Mark all as read</button>
       </div>
       <div className="notifications-list">
         {notifications.map(notif => (
           <NotificationItem key={notif.id} notification={notif} />
         ))}
       </div>
       {notifications.length === 0 && (
         <div className="empty-state">No notifications</div>
       )}
     </div>
     ```

9. **Notification Item Render**
   - Each notification displays:
     - Icon (based on type: info, warning, error, success)
     - Title (bold)
     - Message text (2 lines max, truncated)
     - Timestamp (relative: "5 minutes ago")
     - Unread indicator (blue dot if `isRead = false`)
     - Action button or link (if `actionUrl` present)

10. **User Clicks Notification**
    - User clicks notification item
    - Two actions triggered:
      1. Mark notification as read
      2. Navigate to action URL (if present)

11. **Mark Notification as Read**
    - Component calls context method:
      ```typescript
      const markAsRead = async (notificationId) => {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        
        // Update backend (future)
        await updateNotificationStatus(notificationId, 'read');
      };
      ```
    - **Future API Call:**
      ```
      PATCH /api/notifications/{notificationId}
      Body: { "isRead": true }
      ```

12. **Navigate to Related Entity**
    - If notification has `actionUrl`:
      ```typescript
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
        closeDropdown();
      }
      ```
    - Example: Navigate to `/assets/DJIA` for volatility alert

13. **Mark All as Read**
    - User clicks "Mark all as read" button
    - Context updates all notifications:
      ```typescript
      const markAllAsRead = () => {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
        // Future: API call to bulk update
      };
      ```
    - Unread badge disappears
    - All blue dots removed from list

14. **Close Dropdown**
    - User clicks outside dropdown OR
    - User clicks bell icon again OR
    - User navigates to notification action URL
    - Dropdown closes:
      ```typescript
      setIsOpen(false);
      ```

15. **Auto-Refresh (Future)**
    - Poll for new notifications every 60 seconds:
      ```typescript
      useEffect(() => {
        const interval = setInterval(() => {
          fetchNotifications();
        }, 60000);
        return () => clearInterval(interval);
      }, []);
      ```
    - **Better:** WebSocket connection for real-time push

---

## Global Component: User Menu

---

### Task: Log Out

**Task ID:** U-7  
**Task Name:** Log out of the application  
**Status:** ✅ Fully Implemented

#### Operational Flow

1. **Logout Button Render**
   - Sidebar footer displays "Log Out" button
   - Icon: Sign-out icon
   - Text: "Log Out"
   - Always visible when authenticated

2. **User Clicks Logout**
   - User clicks "Log Out" button
   - Click handler triggers:
     ```typescript
     const { logout } = useContext(AuthContext);
     const handleLogout = async () => {
       await logout();
       navigate('/login');
     };
     ```

3. **AuthContext Logout Method**
   - Context executes logout sequence:
     ```typescript
     const logout = async () => {
       try {
         // Sign out from Cognito
         await Auth.signOut();
         
         // Clear local state
         setUser(null);
         setIsAuthenticated(false);
         
         // Clear localStorage tokens
         clearLocalStorage();
         
       } catch (error) {
         console.error('Logout error:', error);
       }
     };
     ```

4. **AWS Cognito Sign Out**
   - Amplify Auth calls Cognito:
     ```typescript
     await Auth.signOut({ global: true });
     ```
   - `global: true` invalidates tokens across all devices
   - Cognito marks tokens as revoked

5. **Clear Browser Storage**
   - Remove all Cognito tokens from localStorage:
     ```typescript
     const clearLocalStorage = () => {
       const keysToRemove = Object.keys(localStorage).filter(key =>
         key.startsWith('CognitoIdentityServiceProvider')
       );
       keysToRemove.forEach(key => localStorage.removeItem(key));
     };
     ```
   - Tokens removed:
     - ID token
     - Access token
     - Refresh token
     - User data
     - Clock drift

6. **Clear Application State**
   - AuthContext resets:
     ```typescript
     setUser(null);
     setIsAuthenticated(false);
     ```
   - Other contexts reset (if needed):
     - NotificationContext clears notifications
     - ThemeContext preserves theme (user preference)

7. **Navigation to Login**
   - React Router redirects:
     ```typescript
     navigate('/login', { replace: true });
     ```
   - `replace: true` removes `/dashboard` from history
   - User cannot use "back" button to access authenticated pages

8. **Protected Route Blocking**
   - If user tries to access `/dashboard` or other protected route:
     - Route guard checks authentication
     - `isAuthenticated = false` → redirect to `/login`

9. **Success Feedback**
   - Login page displays message:
     - "You have been logged out successfully"
   - Message auto-dismisses after 3 seconds

10. **Session Cleanup Complete**
    - User fully logged out
    - No valid tokens remain
    - Application state cleared
    - User must re-authenticate to access protected pages

---

## Infrastructure Component Summary

### Components Involved in Global UI

| Component | Role | Location/Identifier | Status |
|-----------|------|---------------------|--------|
| **Sidebar** | Navigation menu | `src/components/layout/Sidebar.tsx` | ✅ Implemented |
| **Header** | Top bar with search/theme/notifications | `src/components/layout/Header.tsx` | ✅ Implemented |
| **AuthContext** | Authentication state and logout | `src/context/AuthContext.tsx` | ✅ Implemented |
| **ThemeContext** | Theme management | `src/context/ThemeContext.tsx` | ✅ Implemented |
| **NotificationContext** | Notification state (future DB integration) | `src/context/NotificationContext.tsx` | 🟡 Partial |
| **React Router** | Client-side routing | `react-router-dom` package | ✅ Implemented |
| **API Gateway** | Search endpoint | `/api/assets/search` | ✅ Implemented |
| **Lambda: searchAssets** | Asset search function | AWS Lambda | ✅ Implemented |
| **DynamoDB: Assets** | Asset data for search | `ChasingProphets-Assets` | ✅ Implemented |
| **AWS Cognito** | Authentication and logout | User Pool | ✅ Implemented |
| **Browser LocalStorage** | Token and preference storage | Multiple keys | ✅ Implemented |

---

## Data Flow: Complete User Session

### End-to-End Flow

```
1. User navigates to app
   ↓
2. React app loads, checks localStorage for tokens
   ↓
3. If tokens exist and valid:
   → AuthContext sets isAuthenticated = true
   → Redirect to /dashboard
   ↓
4. If no tokens or expired:
   → Redirect to /login
   ↓
5. User logs in (see OPERATIONAL_MAPPING_LOGIN.md)
   ↓
6. Tokens stored in localStorage
   ↓
7. User navigates app using sidebar
   ↓
8. User searches for asset (global search)
   → API call to /api/assets/search
   → DynamoDB scan
   → Results displayed
   → User clicks result → Navigate to /assets/{id}
   ↓
9. User receives notification (future: real-time)
   → Notification badge updates
   → User clicks bell → Opens dropdown
   → User clicks notification → Marks read, navigates to entity
   ↓
10. User changes theme
    → ThemeContext updates CSS variables
    → LocalStorage saves preference
    ↓
11. User clicks Logout
    → Cognito signOut
    → Clear localStorage
    → Clear AuthContext
    → Redirect to /login
```

---

## Performance Metrics

### Component Render Times

- **Sidebar:** 10-30ms (includes icon rendering)
- **Header:** 20-50ms (includes search input initialization)
- **Notifications Dropdown:** 30-80ms (depends on notification count)
- **Theme Toggle:** 30-50ms (CSS variable updates)

### API Call Latencies

- **Search Assets:** 200-500ms (DynamoDB scan)
- **Fetch Notifications:** 100-300ms (future API)
- **Logout:** 150-400ms (Cognito signOut)

### User Experience Targets

- **Navigation:** < 100ms (client-side routing)
- **Search Results:** < 500ms (from keystroke to display)
- **Theme Switch:** < 100ms (instant visual change)
- **Logout:** < 500ms (redirect to login)

---

## Accessibility Features

### Keyboard Navigation

- **Sidebar:**
  - Tab key navigates through links
  - Enter/Space activates link
  - Focus indicators visible

- **Search:**
  - `/` key focuses search input
  - Tab navigates through results
  - Arrow Up/Down selects result
  - Enter navigates to selected result
  - Escape closes dropdown

- **Notifications:**
  - Tab focuses bell icon
  - Enter opens dropdown
  - Tab navigates through notifications
  - Escape closes dropdown

### Screen Reader Support

- **ARIA Labels:**
  - Sidebar links: `aria-label="Navigate to Assets"`
  - Search input: `aria-label="Search assets"`
  - Notification bell: `aria-label="Notifications, 3 unread"`
  - Theme toggle: `aria-label="Toggle dark mode"`

- **ARIA Live Regions:**
  - Search results: `aria-live="polite"` (announces result count)
  - Notifications: `aria-live="assertive"` (announces new notifications)

### Focus Management

- **Modal Dialrams:**
  - Trap focus inside modal when open
  - Restore focus to trigger element on close

- **Dropdown Menus:**
  - Focus search input when dropdown opens
  - Escape key closes dropdown and returns focus

---

## Security Considerations

### Token Security

- **Storage:** Tokens in localStorage (XSS risk mitigated by CSP)
- **Transmission:** Always HTTPS
- **Expiration:** Tokens auto-expire (1 hour default)
- **Refresh:** Refresh token used to obtain new access/ID tokens
- **Logout:** Global sign out invalidates tokens on server

### Search Query Sanitization

- **Input Validation:**
  - Max length: 100 characters
  - No special characters that could cause injection
- **DynamoDB Filter:**
  - Parameterized queries prevent injection
  - No raw query concatenation

### CSRF Protection

- **State-Changing Actions:**
  - Logout requires authenticated session
  - Mark as read requires valid user ID
- **Cognito Tokens:**
  - Include audience claim validation
  - API Gateway validates token issuer

---

## Error Handling

### Navigation Errors

- **Route Not Found:**
  - Display 404 page
  - "Return to Dashboard" button

- **Unauthorized Access:**
  - Redirect to /login
  - Message: "Please log in to continue"

### Search Errors

- **Network Error:**
  - Display: "Unable to search. Check your connection."
  - Retry button available

- **API Error:**
  - Display: "Search temporarily unavailable"
  - Clear search input

### Notification Errors

- **Load Failure:**
  - Display: "Unable to load notifications"
  - Bell icon shows error state (red)

- **Mark as Read Failure:**
  - Revert local state change
  - Display error message
  - Retry option

### Logout Errors

- **Cognito Error:**
  - Still clear local tokens
  - Still redirect to login
  - Log error for debugging

---

## Future Enhancements

### Planned Features (Not Implemented)

1. **Breadcrumb Navigation:**
   - Show current page hierarchy
   - Click breadcrumb to navigate up
   - Example: Dashboard > Assets > AAPL

2. **Recent Pages:**
   - Dropdown showing last 5 visited pages
   - Quick navigation to recent assets

3. **Favorites/Bookmarks:**
   - Star icon on assets
   - Quick access dropdown in header
   - Saved to user preferences

4. **Command Palette:**
   - Press Cmd+K (Mac) or Ctrl+K (Windows)
   - Search for pages, assets, prophets, actions
   - Keyboard-driven navigation

5. **Real-Time Notifications:**
   - WebSocket connection for push notifications
   - Toast messages for important alerts
   - Browser notifications (with permission)

6. **Multi-Language Support:**
   - Language selector in settings
   - Translations for all UI text
   - Date/time localization

---

## End of Global UI Elements Operational Mapping
