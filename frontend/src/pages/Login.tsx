import { useState } from "react";
import { useNavigate, Link as RouterLink, useLocation } from "react-router-dom";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Stack,
  Divider,
  CircularProgress,
} from "@mui/material";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import { useAuth } from "../context/AuthContext";
import { apiError } from "../api/client";

const wrapSx = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bgcolor: "background.default",
  p: 2,
};
const paperSx = { width: "100%", maxWidth: 430, p: 4, borderRadius: 3 };
const brandSx = { display: "flex", alignItems: "center", gap: 1, mb: 2 };
const hintSx = { mt: 2, p: 1.5, bgcolor: "grey.50", borderRadius: 2 };
const alertSx = { mb: 2 };
const dividerSx = { my: 2 };

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname?: string } } };
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@wholesaleos.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const dest = location.state?.from?.pathname ?? "/dashboard";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={wrapSx}>
      <Paper elevation={3} sx={paperSx}>
        <Box sx={brandSx}>
          <WarehouseIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight={800} color="primary">
            WholesaleOS
          </Typography>
        </Box>
        <Typography variant="h6" gutterBottom>
          Sign in
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          ERP · CRM · WMS platform for wholesale clothing
        </Typography>

        {error && (
          <Alert severity="error" sx={alertSx}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Sign in"}
            </Button>
          </Stack>
        </form>

        <Typography variant="body2" mt={2}>
          No account?{" "}
          <Link component={RouterLink} to="/register">
            Create one
          </Link>
        </Typography>

        <Divider sx={dividerSx} />
        <Box sx={hintSx}>
          <Typography variant="caption" color="text.secondary" display="block">
            <strong>Demo accounts</strong> (password after seeding):
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            admin@wholesaleos.com / Admin@123
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            manager@wholesaleos.com / Manager@123
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            staff@wholesaleos.com / Staff@123
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
