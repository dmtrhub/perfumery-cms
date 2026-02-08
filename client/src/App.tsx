import { Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthPage } from "./pages/AuthPage";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { ProductionPage } from "./pages/ProductionPage";
import { ProcessingPage } from "./pages/ProcessingPage";
import { StoragePage } from "./pages/StoragePage";
import { SalesPage } from "./pages/SalesPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { PerformancePage } from "./pages/PerformancePage";
import { AuditPage } from "./pages/AuditPage";
import { ProtectedRoute } from "./components/protected_route/ProtectedRoute";
import { useAuth } from "./hooks/useAuthHook";

import { IAuthAPI } from "./api/auth/IAuthAPI";
import { AuthAPI } from "./api/auth/AuthAPI";
import { ProductionAPI } from "./api/production/ProductionAPI";
import { ProcessingAPI } from "./api/processing/ProcessingAPI";
import { StorageAPI } from "./api/storage/StorageAPI";
import { SalesAPI } from "./api/sales/SalesAPI";
import { AnalyticsAPI } from "./api/analytics/AnalyticsAPI";
import { PerformanceAPI } from "./api/performance/PerformanceAPI";
import { AuditAPI } from "./api/audit/AuditAPI";

const authAPI: IAuthAPI = new AuthAPI();
const productionAPI = new ProductionAPI();
const processingAPI = new ProcessingAPI();
const storageAPI = new StorageAPI();
const salesAPI = new SalesAPI();
const analyticsAPI = new AnalyticsAPI();
const performanceAPI = new PerformanceAPI();
const auditAPI = new AuditAPI();

const SALES_ROLES = "admin,sales_manager,salesperson";
const ADMIN_ROLES = "admin";

// Redirect component za default dashboard
const DefaultDashboardRedirect = () => {
  const { user } = useAuth();
  const [target, setTarget] = useState<string>("production");

  useEffect(() => {
    if (user?.role?.toLowerCase() === "admin") {
      setTarget("analytics");
    } else {
      setTarget("production");
    }
  }, [user?.role]);

  return <Navigate to={target} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage authAPI={authAPI} />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole={SALES_ROLES + "," + ADMIN_ROLES}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DefaultDashboardRedirect />} />

        <Route
          path="production"
          element={
            <ProtectedRoute requiredRole={SALES_ROLES}>
              <ProductionPage productionAPI={productionAPI} />
            </ProtectedRoute>
          }
        />
        <Route
          path="processing"
          element={
            <ProtectedRoute requiredRole={SALES_ROLES}>
              <ProcessingPage processingAPI={processingAPI} storageAPI={storageAPI} />
            </ProtectedRoute>
          }
        />
        <Route
          path="storage"
          element={
            <ProtectedRoute requiredRole={SALES_ROLES}>
              <StoragePage storageAPI={storageAPI} />
            </ProtectedRoute>
          }
        />
        <Route
          path="sales"
          element={
            <ProtectedRoute requiredRole={SALES_ROLES}>
              <SalesPage salesAPI={salesAPI} />
            </ProtectedRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <ProtectedRoute requiredRole={ADMIN_ROLES}>
              <AnalyticsPage analyticsAPI={analyticsAPI} />
            </ProtectedRoute>
          }
        />
        <Route
          path="performance"
          element={
            <ProtectedRoute requiredRole={ADMIN_ROLES}>
              <PerformancePage performanceAPI={performanceAPI} />
            </ProtectedRoute>
          }
        />
        <Route
          path="audit"
          element={
            <ProtectedRoute requiredRole={ADMIN_ROLES}>
              <AuditPage auditAPI={auditAPI} />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
