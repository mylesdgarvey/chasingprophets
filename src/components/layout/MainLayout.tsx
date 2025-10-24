import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart2, Bell, User, Globe,
  Settings, LogOut
} from 'react-feather';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <img src="/logo.svg" alt="Chasing Prophets" className="logo-img" />
          <span className="logo-text">Chasing Prophets</span>
        </div>
        
        <nav className="nav-menu">
          <a 
            href="/dashboard" 
            className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            <BarChart2 size={20} />
            <span>Markets</span>
          </a>
          <a 
            href="/assets" 
            className={`nav-item ${location.pathname === '/assets' ? 'active' : ''}`}
          >
            <Globe size={20} />
            <span>Global Analysis</span>
          </a>
          <a 
            href="/settings" 
            className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </a>
        </nav>

        <div className="nav-footer">
          <button className="nav-item" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <div className="main-container">
        <header className="header">
          {/* MainLayout had a simple search input; the main app Layout provides a unified SearchBox.
              Removing the duplicate input to avoid two search bars showing when both layouts are used. */}
          <div className="search-bar-placeholder" />

          <div className="user-menu">
            <button className="icon-button">
              <Bell size={16} />
            </button>
            <div className="user-profile">
              <User size={16} />
              <span>{user?.username}</span>
            </div>
          </div>
        </header>

        <main className="main-content">
          {children}
        </main>
      </div>


    </div>
  );
};

export default MainLayout;