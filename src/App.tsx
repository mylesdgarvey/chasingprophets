import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import AssetPage from "./pages/AssetPage";
import Settings from "./pages/Settings";
import LoginPage from "./pages/auth/LoginPage";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
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