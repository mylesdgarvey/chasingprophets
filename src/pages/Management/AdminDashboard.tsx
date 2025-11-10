import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AdminCard {
  title: string;
  description: string;
  route: string;
  icon: string;
  count?: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const adminSections: AdminCard[] = [
    {
      title: 'Model Scaffolds',
      description: 'Create and manage model templates with training and inference scripts',
      route: '/mgmt/models/scaffolds',
      icon: '🧬',
    },
    {
      title: 'Datasets',
      description: 'Manage asset data collections and sources',
      route: '/mgmt/datasets',
      icon: '💾',
    },
    {
      title: 'Data Slices',
      description: 'Manage training data slices and validation sets',
      route: '/mgmt/data/slices',
      icon: '📊',
    },
    {
      title: 'Model Fits',
      description: 'View and manage trained model instances',
      route: '/mgmt/models/fits',
      icon: '🎯',
    },
    {
      title: 'Prophets',
      description: 'Manage forecasting prophets and ensemble configurations',
      route: '/mgmt/prophets',
      icon: '🔮',
    },
    {
      title: 'Assets',
      description: 'Manage financial assets and price data',
      route: '/mgmt/assets',
      icon: '💰',
    },
    {
      title: 'System Metrics',
      description: 'Monitor system health, performance, and resource usage',
      route: '/mgmt/metrics',
      icon: '📈',
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide admin settings and automation',
      route: '/mgmt/settings',
      icon: '⚙️',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all system resources and configurations
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => (
            <button
              key={section.route}
              onClick={() => navigate(section.route)}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all text-left group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{section.icon}</div>
                <svg
                  className="w-6 h-6 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {section.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {section.description}
              </p>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/mgmt/models/scaffolds/new')}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + New Scaffold
              </button>
              <button
                onClick={() => navigate('/mgmt/data/slices')}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Manage Data Slices
              </button>
              <button
                onClick={() => navigate('/mgmt/prophets/new')}
                className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                + New Prophet
              </button>
              <button
                onClick={() => navigate('/mgmt/assets')}
                className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Manage Assets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
