import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-container">
        <Header />
        <main className="main-content">
          {children}
        </main>
      </div>

      <style jsx>{`
        .layout {
          min-height: 100vh;
          background: var(--background-color);
        }

        .main-container {
          margin-left: var(--sidebar-width);
        }

        .main-content {
          margin-top: var(--header-height);
          padding: var(--spacing-6);
          max-width: var(--content-max-width);
          margin-left: auto;
          margin-right: auto;
        }
      `}</style>
    </div>
  );
};

export default MainLayout;