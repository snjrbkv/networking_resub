import { Box, Card, CardContent, Typography, Avatar, Chip, Stack, Divider } from "@mui/material";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

const cardSx = { maxWidth: 560 };
const headerRowSx = { display: "flex", alignItems: "center", gap: 2, mb: 2 };
const avatarSx = { width: 64, height: 64, bgcolor: "primary.main", fontSize: 28 };
const rowSx = { display: "flex", justifyContent: "space-between", py: 1 };
const listSx = { pt: 1 };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={rowSx}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={600}>{value}</Typography>
    </Box>
  );
}

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Box>
      <PageHeader title="Profile" subtitle="Your account details" />
      <Card sx={cardSx}>
        <CardContent>
          <Box sx={headerRowSx}>
            <Avatar sx={avatarSx}>{user.name.charAt(0).toUpperCase()}</Avatar>
            <Box>
              <Typography variant="h6">{user.name}</Typography>
              <Chip size="small" label={user.role.replace("_", " ")} color="primary" />
            </Box>
          </Box>
          <Divider />
          <Stack divider={<Divider />} sx={listSx}>
            <Row label="Full name" value={user.name} />
            <Row label="Email" value={user.email} />
            <Row label="Role" value={user.role.replace("_", " ")} />
            <Row label="User ID" value={user.id} />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
