import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit2 } from 'lucide-react';
import { getAllModelFits } from '../../services/modelFit';
import { getAllModelScaffolds } from '../../services/modelScaffold';
import { getAllDataSlices } from '../../services/dataSlice';
import { EntityBadge } from '../../components/common/EntityBadge';
import type { ModelFit } from '../../types/modelFit';
import type { ModelScaffold } from '../../types/modelScaffold';
import type { DataSlice } from '../../types/dataSlice';
import './Management.css';

export default function ModelFitsManagement() {
  const navigate = useNavigate();
  const [modelFits, setModelFits] = useState<ModelFit[]>([]);
  const [scaffolds, setScaffolds] = useState<Map<string, ModelScaffold>>(new Map());
  const [slices, setSlices] = useState<Map<string, DataSlice>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadModelFits();
  }, []);

  const loadModelFits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [fitsData, scaffoldsData, slicesData] = await Promise.all([
        getAllModelFits(),
        getAllModelScaffolds(),
        getAllDataSlices()
      ]);
      
      setModelFits(fitsData);
      setScaffolds(new Map(scaffoldsData.map(s => [s.scaffoldId, s])));
      setSlices(new Map(slicesData.map(s => [s.dataSliceId, s])));
    } catch (err) {
      console.error('Error loading model fits:', err);
      setError(err instanceof Error ? err.message : 'Failed to load model fits');
    } finally {
      setLoading(false);
    }
  };

  const filteredFits = modelFits.filter(fit => {
    if (statusFilter !== 'all' && fit.trainingStatus !== statusFilter) return false;
    if (searchTerm && !fit.modelFitId.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fit': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'unfit': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'training': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="management-page">
        <div className="max-w-7xl mx-auto text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading model fits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="management-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
                        <button 
              className="back-button"
              onClick={() => navigate('/admin')}
            >
              ← Back to Admin
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Model Fits Management
            </h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search by model fit ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="fit">Fit</option>
            <option value="unfit">Unfit</option>
            <option value="training">Training</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Showing {filteredFits.length} of {modelFits.length} model fits
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Model Fit ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Scaffold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data Slice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFits.map((fit) => {
                const scaffold = scaffolds.get(fit.scaffoldId);
                const slice = slices.get(fit.dataSliceId);
                
                return (
                <tr key={fit.modelFitId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <EntityBadge
                      type="model-fit"
                      id={fit.modelFitId}
                      label={fit.modelFitId.split('-').slice(-2).join('-')}
                      size="small"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <EntityBadge
                      type="scaffold"
                      id={fit.scaffoldId}
                      label={scaffold ? scaffold.name : fit.scaffoldId}
                      size="small"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <EntityBadge
                      type="data-slice"
                      id={fit.dataSliceId}
                      label={slice ? `${slice.startDate} - ${slice.endDate}` : fit.dataSliceId}
                      size="small"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(fit.trainingStatus)}`}>
                      {fit.trainingStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(fit.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => navigate(`/mgmt/models/fits/${fit.modelFitId}`)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
