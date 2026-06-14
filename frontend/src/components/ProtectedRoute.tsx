/** Guards routes behind authentication and (optionally) specific roles. */
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

interface Props {
  children: ReactNode;
  roles?: Role[];
}

const centerSx = { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" };

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const fromState = { from: location };

  if (loading) {
    return (
      <Box sx={centerSx}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={fromState} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
