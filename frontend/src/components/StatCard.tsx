import { Card, CardContent, Box, Typography, Avatar } from "@mui/material";
import { ReactNode } from "react";

interface Props {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
  subtitle?: string;
}

const cardSx = { height: "100%" };
const rowSx = { display: "flex", alignItems: "center", justifyContent: "space-between" };

export default function StatCard({ title, value, icon, color = "#1565c0", subtitle }: Props) {
  const avatarSx = { bgcolor: color, width: 52, height: 52 };
  return (
    <Card sx={cardSx}>
      <CardContent>
        <Box sx={rowSx}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={avatarSx}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}
