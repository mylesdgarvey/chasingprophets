import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BarChart2, Database, Settings, LogOut, Bell, Moon, Sun } from 'react-feather';
import NotificationPopup from '../notifications/NotificationPopup';
import SearchBox from '../controls/SearchBox';
import { getUnreadCountForUser } from '../../services/notifications';
import './Layout.css';

const Layout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  // bell will be inline in the header; popup is positioned relative to the bell wrapper

  async function refreshUnreadCount() {
    if (!user) return;
    try {
      const idsToQuery = Array.from(new Set([user.username, user.email].filter(Boolean)));
      console.debug('refreshUnreadCount: querying ids', idsToQuery);
      const count = await getUnreadCountForUser(idsToQuery);
      console.debug('refreshUnreadCount: count=', count);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to refresh unread count', err);
    }
  }

  useEffect(() => {
    refreshUnreadCount();
  }, [user]);

  // If auth populates a little after mount, retry once after a short delay to ensure badge updates.
  useEffect(() => {
    let t: any;
    if (!user) {
      t = setTimeout(() => {
        refreshUnreadCount();
      }, 1000);
    }
    return () => { if (t) clearTimeout(t); };
  }, []);

  // We deliberately keep the bell inline with the username so it visually sits to the left
  // of the username; popup is anchored to the bell wrapper and opens to the left (CSS uses right:0).

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`layout layout-${theme}`}>
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="logo" onClick={toggleSidebar}>
          <img src="/logo.svg" alt="ChasingProphets" />
          <span className="logo-text">ChasingProphets</span>
        </div>

        <nav className="nav-menu">
          <div className="nav-items">
            <Link 
              to="/dashboard" 
              className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
              data-tooltip="Dashboard"
            >
              <div className="nav-icon"><BarChart2 size={24} /></div>
              <span className="nav-text">Dashboard</span>
            </Link>
            <Link 
              to="/assets" 
              className={`nav-item ${location.pathname === '/assets' ? 'active' : ''}`}
              data-tooltip="Assets"
            >
              <div className="nav-icon"><Database size={24} /></div>
              <span className="nav-text">Assets</span>
            </Link>
            <Link 
              to="/settings" 
              className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
              data-tooltip="Settings"
            >
              <div className="nav-icon"><Settings size={24} /></div>
              <span className="nav-text">Settings</span>
            </Link>
            <button 
              className="nav-item"
              onClick={handleLogout}
              data-tooltip="Log Out"
            >
              <div className="nav-icon"><LogOut size={24} /></div>
              <span className="nav-text">Log Out</span>
            </button>
          </div>
        </nav>
      </aside>

      <div className={`main-container ${isCollapsed ? 'collapsed' : ''}`}>
        <header className="header">
          <div className="search-bar">
            <SearchBox />
          </div>

          <div className="user-menu">
            <button
              className="icon-button theme-toggle"
              type="button"
              onClick={toggleTheme}
              title={theme === 'night' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            >
              {theme === 'night' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="bell-wrapper">
              <button className="icon-button bell-icon" title="Notifications" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="badge">{unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <NotificationPopup onClose={() => { setShowNotifications(false); refreshUnreadCount(); }} onChange={() => refreshUnreadCount()} />
              )}
            </div>
            <div className="user-profile">
              <span className="username">{user?.username}</span>
            </div>
            <button className="icon-button" onClick={handleLogout} title="Log Out">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;