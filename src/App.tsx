import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';

// Import other components (we'll create these next)
const Orders = React.lazy(() => import('./components/orders/Orders'));
const POS = React.lazy(() => import('./components/pos/POS'));
const Inventory = React.lazy(() => import('./components/inventory/Inventory'));
const IncomeExpense = React.lazy(() => import('./components/income-expense/IncomeExpense'));
const Reports = React.lazy(() => import('./components/reports/Reports'));
const Customers = React.lazy(() => import('./components/customers/Customers'));
const Categories = React.lazy(() => import('./components/categories/Categories'));
const Settings = React.lazy(() => import('./components/settings/Settings'));

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Layout>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <Orders />
                    </React.Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <POS />
                    </React.Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <Layout>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <Inventory />
                    </React.Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/income-expense"
              element={
                <ProtectedRoute>
                  <Layout>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <IncomeExpense />
                    </React.Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <Reports />
                    </React.Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <Customers />
                    </React.Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <Categories />
                    </React.Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <Settings />
                    </React.Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;