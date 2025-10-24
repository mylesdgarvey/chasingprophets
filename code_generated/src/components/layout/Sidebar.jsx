import React from 'react';
import { BarChart2, Globe, Activity, Settings, Users, Database } from 'react-feather';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="logo">
        <img src="/logo.svg" alt="Chasing Prophets" className="logo-img" />
        <span className="logo-text">Chasing Prophets</span>
      </div>
      
      <nav className="nav-menu">
        <a href="#" className="nav-item active">
          <BarChart2 size={20} />
          <span>Markets</span>
        </a>
        <a href="#" className="nav-item">
          <Globe size={20} />
          <span>Global Analysis</span>
        </a>
        <a href="#" className="nav-item">
          <Activity size={20} />
          <span>Prophet Stats</span>
        </a>
        <a href="#" className="nav-item">
          <Database size={20} />
          <span>Data Sources</span>
        </a>
        <a href="#" className="nav-item">
          <Users size={20} />
          <span>Community</span>
        </a>
        <a href="#" className="nav-item">
          <Settings size={20} />
          <span>Settings</span>
        </a>
      </nav>

      <style jsx>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: var(--background-color);
          border-right: 1px solid var(--border-color);
          padding: var(--spacing-4);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-8);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          padding: var(--spacing-4) 0;
        }

        .logo-img {
          width: 32px;
          height: 32px;
        }

        .logo-text {
          font-size: var(--font-size-xl);
          font-weight: 600;
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-2);
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          padding: var(--spacing-3) var(--spacing-4);
          color: var(--secondary-color);
          border-radius: 8px;
          transition: all var(--transition-fast);
        }

        .nav-item:hover {
          background: var(--hover-color);
          color: var(--primary-color);
        }

        .nav-item.active {
          background: var(--hover-color);
          color: var(--primary-color);
          font-weight: 500;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;