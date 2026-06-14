import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const wrapSx = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  bgcolor: "background.default",
};

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Box sx={wrapSx}>
      <Typography variant="h2" fontWeight={800} color="primary">
        404
      </Typography>
      <Typography variant="h6" color="text.secondary">
        Page not found
      </Typography>
      <Button variant="contained" onClick={() => navigate("/dashboard")}>
        Back to dashboard
      </Button>
    </Box>
  );
}
