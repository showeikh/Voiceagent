import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import CalendarConnections from "./pages/CalendarConnections";
import Appointments from "./pages/Appointments";
import ConversationHistory from "./pages/ConversationHistory";
import Settings from "./pages/Settings";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTenants from "./pages/admin/AdminTenants";
import AdminPricing from "./pages/admin/AdminPricing";
import AdminInvoices from "./pages/admin/AdminInvoices";
import AdminSettings from "./pages/admin/AdminSettings";
import PendingApproval from "./pages/PendingApproval";
import "./App.css";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, tenantStatus, isSuperAdmin } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Super admin bypasses tenant status check
  if (isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  // Check tenant approval status
  if (tenantStatus === 'pending') {
    return <Navigate to="/pending" replace />;
  }
  
  if (tenantStatus === 'rejected') {
    return <Navigate to="/rejected" replace />;
  }
  
  if (tenantStatus === 'suspended') {
    return <Navigate to="/suspended" replace />;
  }
  
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, isSuperAdmin } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }
  
  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, isSuperAdmin, tenantStatus } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    if (isSuperAdmin) {
      return <Navigate to="/admin" replace />;
    }
    if (tenantStatus === 'pending') {
      return <Navigate to="/pending" replace />;
    }
    if (tenantStatus === 'approved') {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />
      
      {/* Pending/Rejected/Suspended Pages */}
      <Route path="/pending" element={<PendingApproval status="pending" />} />
      <Route path="/rejected" element={<PendingApproval status="rejected" />} />
      <Route path="/suspended" element={<PendingApproval status="suspended" />} />
      
      {/* Protected Routes (Approved Tenants) */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardHome />} />
        <Route path="calendars" element={<CalendarConnections />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="history" element={<ConversationHistory />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminLayout />
        </AdminRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="tenants" element={<AdminTenants />} />
        <Route path="pricing" element={<AdminPricing />} />
        <Route path="invoices" element={<AdminInvoices />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
