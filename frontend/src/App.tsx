import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import CustomerHistory from "./pages/CustomerHistory";
import Orders from "./pages/Orders";
import Warehouse from "./pages/Warehouse";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected */}
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/products" element={<Protected><Products /></Protected>} />
      <Route path="/customers" element={<Protected><Customers /></Protected>} />
      <Route path="/customers/:id/history" element={<Protected><CustomerHistory /></Protected>} />
      <Route path="/orders" element={<Protected><Orders /></Protected>} />
      <Route path="/warehouse" element={<Protected><Warehouse /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
