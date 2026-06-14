import { Box, Typography, Stack } from "@mui/material";
import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

const stackDirection = { xs: "column", sm: "row" } as const;
const stackAlign = { xs: "stretch", sm: "center" } as const;
const headerSx = { mb: 3 };

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <Stack
      direction={stackDirection}
      justifyContent="space-between"
      alignItems={stackAlign}
      spacing={2}
      sx={headerSx}
    >
      <Box>
        <Typography variant="h5">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}
