import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, checkingSession } = useAuth();

  if (checkingSession) {
    return (
      <div className="ri-loading-screen">
        <div className="ri-spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
