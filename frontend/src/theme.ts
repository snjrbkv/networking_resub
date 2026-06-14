import { createTheme } from "@mui/material/styles";

// Enterprise-style MUI theme.
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1565c0" },
    secondary: { main: "#00897b" },
    background: { default: "#f4f6f8", paper: "#ffffff" },
    success: { main: "#2e7d32" },
    warning: { main: "#ed6c02" },
    error: { main: "#d32f2f" },
  },
  typography: {
    fontFamily: ["Inter", "Roboto", "Helvetica", "Arial", "sans-serif"].join(","),
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
    MuiCard: { styleOverrides: { root: { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
  },
});
