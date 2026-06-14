import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Stack,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import { authApi } from "../api/services";
import { tokenStore } from "../api/client";
import { apiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

const wrapSx = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bgcolor: "background.default",
  p: 2,
};
const paperSx = { width: "100%", maxWidth: 460, p: 4, borderRadius: 3 };
const brandSx = { display: "flex", alignItems: "center", gap: 1, mb: 2 };
const alertSx = { mb: 2 };

const roles: { value: Role; label: string }[] = [
  { value: "WAREHOUSE_STAFF", label: "Warehouse Staff" },
  { value: "MANAGER", label: "Manager" },
  { value: "ADMIN", label: "Admin" },
];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "WAREHOUSE_STAFF" as Role });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.register(form);
      tokenStore.set(res.accessToken, res.refreshToken);
      // Refresh auth context by logging in implicitly through stored token.
      await login(form.email, form.password);
      navigate("/dashboard", { replace: true });
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
          Create account
        </Typography>

        {error && (
          <Alert severity="error" sx={alertSx}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Full name"
              fullWidth
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              helperText="Minimum 8 characters"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
            <TextField
              select
              label="Role"
              fullWidth
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
            >
              {roles.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Create account"}
            </Button>
          </Stack>
        </form>

        <Typography variant="body2" mt={2}>
          Already have an account?{" "}
          <Link component={RouterLink} to="/login">
            Sign in
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
