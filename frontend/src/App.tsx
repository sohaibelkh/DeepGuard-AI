import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './modules/auth/LoginPage';
import { RegisterPage } from './modules/auth/RegisterPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LandingPage } from './modules/public/LandingPage';
import { DetectionPage } from './modules/detection/DetectionPage';
import { AppShell } from './components/layout/AppShell';
import { DashboardHome } from './modules/dashboard/DashboardHome';
import { ScanHistoryPage } from './modules/history/ScanHistoryPage';
import { ProfilePage } from './modules/profile/ProfilePage';
import { ModelPerformancePage } from './modules/dashboard/ModelPerformancePage';
import { ModelArchitecturePage } from './modules/dashboard/ModelArchitecturePage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/dashboard/detect" element={<DetectionPage />} />
          <Route path="/dashboard/history" element={<ScanHistoryPage />} />
          <Route path="/dashboard/model-performance" element={<ModelPerformancePage />} />
          <Route path="/dashboard/model-architecture" element={<ModelArchitecturePage />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

