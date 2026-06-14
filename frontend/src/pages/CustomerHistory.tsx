import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusChip from "../components/StatusChip";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaidIcon from "@mui/icons-material/Paid";
import { customerApi } from "../api/services";
import { apiError } from "../api/client";
import { OrderStatus } from "../types";

const statsGridSx = { display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, mb: 3 };
const centerSx = { display: "flex", justifyContent: "center", p: 6 };
const backSx = { mb: 2 };

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function CustomerHistory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["customer-history", id],
    queryFn: () => customerApi.history(id as string),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <Box sx={centerSx}>
        <CircularProgress />
      </Box>
    );
  }
  if (error || !data) {
    return <Alert severity="error">{error ? apiError(error) : "Customer not found"}</Alert>;
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/customers")} sx={backSx}>
        Back to customers
      </Button>
      <PageHeader title={data.customer.name} subtitle={data.customer.company ?? data.customer.email} />

      <Box sx={statsGridSx}>
        <StatCard title="Total Orders" value={data.stats.totalOrders} icon={<ReceiptLongIcon />} color="#1565c0" />
        <StatCard title="Total Spent" value={currency(data.stats.totalSpent)} icon={<PaidIcon />} color="#2e7d32" />
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Order History
          </Typography>
          {data.orders.length === 0 ? (
            <Typography color="text.secondary">No orders for this customer yet.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Items</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.orderNumber}</TableCell>
                    <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <StatusChip status={o.status as OrderStatus} />
                    </TableCell>
                    <TableCell align="center">{o.items?.length ?? o._count?.items ?? 0}</TableCell>
                    <TableCell align="right">{currency(Number(o.totalAmount))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
