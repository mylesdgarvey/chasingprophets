import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import AssetPage from "./pages/AssetPage";
import Settings from "./pages/Settings";
import ProphetsList from './pages/Prophets/ProphetsList';
import ProphetDetail from './pages/ProphetDetail';
import { ProphetLeaderboard } from './pages/Prophets/ProphetLeaderboard';
import { ProphetComparison } from './pages/Prophets/ProphetComparison';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { ScaffoldsList } from './pages/Management/ScaffoldsList';
import { ScaffoldEdit } from './pages/Management/ScaffoldEdit';
import AdminDashboardNew from './pages/Management/AdminDashboard';
import ProphetsManagement from './pages/Management/ProphetsManagement';
import ProphetForm from './pages/Management/ProphetForm';
import ModelFitsManagement from './pages/Management/ModelFitsManagement';
import ModelFitDetail from './pages/Management/ModelFitDetail';
import DataSlicesManagement from './pages/Management/DataSlicesManagement';
import DataSliceDetail from './pages/Management/DataSliceDetail';
import DatasetsManagement from './pages/Management/DatasetsManagement';
import DatasetDetail from './pages/Management/DatasetDetail';
import AssetsManagement from './pages/Management/AssetsManagement';
import AssetDetail from './pages/Management/AssetDetail';
import { SystemMetrics } from './pages/Management/SystemMetrics';
import { SystemSettings } from './pages/Management/SystemSettings';
import './App.css';
import LoginPage from "./pages/auth/LoginPage";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/prophets" element={<ProphetsList />} />
        <Route path="/prophets/leaderboard" element={<ProphetLeaderboard />} />
        <Route path="/prophets/compare" element={<ProphetComparison />} />
        <Route path="/prophets/:prophetId" element={<ProphetDetail />} />
        
        {/* Management/Admin Routes */}
        <Route path="/mgmt" element={<AdminDashboardNew />} />
        <Route path="/mgmt/prophets" element={<ProphetsManagement />} />
        <Route path="/mgmt/prophets/new" element={<ProphetForm />} />
        <Route path="/mgmt/prophets/:prophetId/edit" element={<ProphetForm />} />
        <Route path="/mgmt/models/fits" element={<ModelFitsManagement />} />
        <Route path="/mgmt/models/fits/:fitId" element={<ModelFitDetail />} />
        <Route path="/mgmt/data/slices" element={<DataSlicesManagement />} />
        <Route path="/mgmt/data/slices/:sliceId" element={<DataSliceDetail />} />
        <Route path="/mgmt/datasets" element={<DatasetsManagement />} />
        <Route path="/mgmt/datasets/:datasetId" element={<DatasetDetail />} />
        <Route path="/mgmt/assets" element={<AssetsManagement />} />
        <Route path="/mgmt/assets/:assetId" element={<AssetDetail />} />
        <Route path="/mgmt/models/scaffolds" element={<ScaffoldsList />} />
        <Route path="/mgmt/models/scaffolds/new" element={<ScaffoldEdit />} />
        <Route path="/mgmt/models/scaffolds/:scaffoldId/edit" element={<ScaffoldEdit />} />
        <Route path="/mgmt/metrics" element={<SystemMetrics />} />
        <Route path="/mgmt/settings" element={<SystemSettings />} />
        
        {/* Legacy admin routes */}
        <Route path="/admin" element={
          user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/dashboard" />
        } />
        <Route path="/admin/scaffolds" element={
          user?.role === 'admin' ? <ScaffoldsList /> : <Navigate to="/dashboard" />
        } />
        <Route path="/admin/scaffolds/:scaffoldId" element={
          user?.role === 'admin' ? <ScaffoldEdit /> : <Navigate to="/dashboard" />
        } />
        <Route path="/admin/scaffolds/:scaffoldId/edit" element={
          user?.role === 'admin' ? <ScaffoldEdit /> : <Navigate to="/dashboard" />
        } />
        
        {/* Legacy asset routes */}
        <Route path="/assets" element={
          user?.role === 'admin' ? <Assets /> : <Navigate to="/dashboard" />
        } />
        <Route path="/assets/:ticker" element={
          user?.role === 'admin' ? <AssetPage /> : <Navigate to="/dashboard" />
        } />
        
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}