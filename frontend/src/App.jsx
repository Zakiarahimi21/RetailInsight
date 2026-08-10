import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import About from "./pages/About";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import DashboardLayout from "./layouts/DashboardLayout";
import DashboardOverview from "./pages/DashboardOverview";
import ImportData from "./pages/ImportData";
import ManualEntry from "./pages/ManualEntry";
import SalesAnalytics from "./pages/SalesAnalytics";
import ProductPerformance from "./pages/ProductPerformance";
import CustomerAnalytics from "./pages/CustomerAnalytics";
import SalesTrends from "./pages/SalesTrends";
import Forecasting from "./pages/Forecasting";
import Reports from "./pages/Reports";
import AIAssistant from "./pages/AIAssistant";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

function RedirectIfAuthed({ children }) {
  const { user, checkingSession } = useAuth();
  if (checkingSession) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />

        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <Login />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuthed>
              <Register />
            </RedirectIfAuthed>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="sales-analytics" element={<SalesAnalytics />} />
            <Route path="product-performance" element={<ProductPerformance />} />
            <Route path="customer-analytics" element={<CustomerAnalytics />} />
            <Route path="sales-trends" element={<SalesTrends />} />
            <Route path="forecasting" element={<Forecasting />} />
            <Route path="reports" element={<Reports />} />
            <Route path="import-data" element={<ImportData />} />
            <Route path="manual-entry" element={<ManualEntry />} />
            <Route path="ai-assistant" element={<AIAssistant />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
