import React from 'react';
import { Search, Bell, User } from 'react-feather';

const Header = () => {
  return (
    <header className="header">
      <div className="search-bar">
        <Search size={20} />
        <input type="text" placeholder="Search markets, prophets, analysis..." />
      </div>

      <div className="user-menu">
        <button className="icon-button">
          <Bell size={20} />
        </button>
        <div className="user-profile">
          <User size={20} />
          <span>John Doe</span>
        </div>
      </div>

      <style jsx>{`
        .header {
          position: fixed;
          top: 0;
          left: var(--sidebar-width);
          right: 0;
          height: var(--header-height);
          background: var(--background-color);
          border-bottom: 1px solid var(--border-color);
          padding: 0 var(--spacing-6);
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 100;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          background: var(--hover-color);
          padding: var(--spacing-2) var(--spacing-4);
          border-radius: 8px;
          width: 400px;
        }

        .search-bar input {
          border: none;
          background: none;
          outline: none;
          font-size: var(--font-size-base);
          width: 100%;
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: var(--spacing-4);
        }

        .icon-button {
          background: none;
          border: none;
          padding: var(--spacing-2);
          color: var(--secondary-color);
          border-radius: 8px;
          transition: all var(--transition-fast);
        }

        .icon-button:hover {
          background: var(--hover-color);
          color: var(--primary-color);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          padding: var(--spacing-2) var(--spacing-4);
          border-radius: 8px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .user-profile:hover {
          background: var(--hover-color);
        }
      `}</style>
    </header>
  );
};

export default Header;