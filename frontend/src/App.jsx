import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import MainLayout from './layouts/MainLayout';

import DashboardPage from './pages/DashboardPage';
import ForecastingPage from './pages/ForecastingPage';
import ModelComparisonPage from './pages/ModelComparisonPage';
import ProductAnalyticsPage from './pages/ProductAnalyticsPage';
import ReportsPage from './pages/ReportsPage';

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/forecast" element={<ForecastingPage />} />
            <Route path="/models" element={<ModelComparisonPage />} />
            <Route path="/products" element={<ProductAnalyticsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
