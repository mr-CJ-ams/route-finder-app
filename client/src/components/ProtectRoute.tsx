import React from "react";
import { Navigate } from "react-router-dom";
import { ProtectedRouteProps } from "../types";

interface ExtendedProtectedRouteProps extends ProtectedRouteProps {
  isProvincialAdmin?: boolean;
}

const ProtectedRoute: React.FC<ExtendedProtectedRouteProps> = ({ children, isAdmin = false, isProvincialAdmin = false }) => {
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (isAdmin && user?.role !== "admin") {
    return <Navigate to="/login" />;
  }

  if (isProvincialAdmin && user?.role !== "p_admin") {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;