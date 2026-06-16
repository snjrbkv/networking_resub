import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaidIcon from "@mui/icons-material/Paid";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusChip from "../components/StatusChip";
import { dashboardApi } from "../api/services";
import { apiError } from "../api/client";
import { OrderStatus } from "../types";
const statsGridSx = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
  mb: 3,
};
const lowerGridSx = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
};
const centerSx = { display: "flex", justifyContent: "center", p: 6 };

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardApi.summary,
  });

  if (isLoading) {
    return (
      <Box sx={centerSx}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Alert severity="error">
        {error ? apiError(error) : "Failed to load dashboard"}
      </Alert>
    );
  }

  return (
    <Box>
      <PageHeader title="Somsa" subtitle="Business overview at a glance" />

      <Box sx={statsGridSx}>
        <StatCard
          title="Total Products"
          value={data.totals.products}
          icon={<Inventory2Icon />}
          color="#1565c0"
        />
        <StatCard
          title="Total Customers"
          value={data.totals.customers}
          icon={<PeopleIcon />}
          color="#00897b"
        />
        <StatCard
          title="Total Orders"
          value={data.totals.orders}
          icon={<ReceiptLongIcon />}
          color="#6a1b9a"
        />
        <StatCard
          title="Total Revenue"
          value={currency(data.totals.revenue)}
          icon={<PaidIcon />}
          color="#2e7d32"
        />
      </Box>
      {/* somsa */}
      <Box sx={lowerGridSx}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Somsa Orders
            </Typography>
            {data.recentOrders.length === 0 ? (
              <Typography color="text.secondary">No orders yet.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recentOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>{o.orderNumber}</TableCell>
                      <TableCell>{o.customer?.name ?? "—"}</TableCell>
                      <TableCell>
                        <StatusChip status={o.status as OrderStatus} />
                      </TableCell>
                      <TableCell align="right">
                        {currency(Number(o.totalAmount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <WarningAmberIcon color="warning" fontSize="small" /> Low Stock
              Alerts
              <Chip
                size="small"
                label={data.lowStockCount}
                color="warning"
                sx={chipSx}
              />
            </Typography>
            {data.lowStockProducts.length === 0 ? (
              <Typography color="text.secondary">
                All products are well stocked.
              </Typography>
            ) : (
              <List dense>
                {data.lowStockProducts.map((p) => (
                  <ListItem key={p.id} disableGutters>
                    <ListItemText
                      primary={p.name}
                      secondary={`SKU ${p.sku} · ${p.quantity} left (min ${p.lowStockThreshold})`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
// check
const chipSx = { ml: 1 };
