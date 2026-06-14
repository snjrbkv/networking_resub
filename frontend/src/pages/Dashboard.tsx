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
  Divider,
  LinearProgress,
} from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaidIcon from "@mui/icons-material/Paid";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusChip from "../components/StatusChip";
import { dashboardApi } from "../api/services";
import { apiError } from "../api/client";
import { OrderStatus } from "../types";

// ─── Layout tokens ───────────────────────────────────────────────────────────
const statsGridSx = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
  mb: 3,
};
const chartsRowSx = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
  mb: 3,
};
const chartsRow2Sx = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
  mb: 3,
};
const lowerGridSx = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
};
const centerSx = { display: "flex", justifyContent: "center", p: 6 };

// ─── Palette for charts ───────────────────────────────────────────────────────
const CHART_COLORS = {
  primary: "#1565c0",
  teal: "#00897b",
  purple: "#6a1b9a",
  green: "#2e7d32",
  orange: "#e65100",
  red: "#c62828",
  amber: "#f57f17",
  blue2: "#0288d1",
};

const STATUS_COLORS: Record<string, string> = {
  pending: CHART_COLORS.amber,
  processing: CHART_COLORS.blue2,
  shipped: CHART_COLORS.purple,
  delivered: CHART_COLORS.green,
  cancelled: CHART_COLORS.red,
};

const PIE_COLORS = Object.values(STATUS_COLORS);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const shortCurrency = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

// ─── Mock analytic data (replace with real API when ready) ───────────────────
const REVENUE_BY_MONTH = [
  { month: "Jan", revenue: 18400, orders: 42 },
  { month: "Feb", revenue: 22100, orders: 55 },
  { month: "Mar", revenue: 19800, orders: 48 },
  { month: "Apr", revenue: 31500, orders: 74 },
  { month: "May", revenue: 28700, orders: 68 },
  { month: "Jun", revenue: 35200, orders: 89 },
  { month: "Jul", revenue: 41000, orders: 97 },
  { month: "Aug", revenue: 38600, orders: 91 },
  { month: "Sep", revenue: 44300, orders: 104 },
  { month: "Oct", revenue: 52100, orders: 120 },
  { month: "Nov", revenue: 61800, orders: 145 },
  { month: "Dec", revenue: 73400, orders: 172 },
];

const ORDER_STATUS_DATA = [
  { name: "Delivered", value: 312 },
  { name: "Processing", value: 87 },
  { name: "Pending", value: 43 },
  { name: "Shipped", value: 64 },
  { name: "Cancelled", value: 19 },
];

const TOP_PRODUCTS = [
  { name: "Wireless Headphones Pro", sales: 284, revenue: 56800 },
  { name: "USB-C Hub 7-in-1", sales: 241, revenue: 22890 },
  { name: "Mechanical Keyboard", sales: 198, revenue: 39600 },
  { name: "27\" 4K Monitor", sales: 143, revenue: 71500 },
  { name: "Webcam HD 1080p", sales: 127, revenue: 12700 },
];

const CUSTOMER_GROWTH = [
  { month: "Jul", new: 34, returning: 58 },
  { month: "Aug", new: 41, returning: 62 },
  { month: "Sep", new: 38, returning: 71 },
  { month: "Oct", new: 55, returning: 80 },
  { month: "Nov", new: 63, returning: 94 },
  { month: "Dec", new: 78, returning: 112 },
];

const DAILY_REVENUE = [
  { day: "Mon", revenue: 4200 },
  { day: "Tue", revenue: 5800 },
  { day: "Wed", revenue: 3900 },
  { day: "Thu", revenue: 7100 },
  { day: "Fri", revenue: 9300 },
  { day: "Sat", revenue: 6400 },
  { day: "Sun", revenue: 3100 },
];

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 1.5,
        boxShadow: 2,
      }}
    >
      <Typography variant="caption" fontWeight={600} color="text.secondary">
        {label}
      </Typography>
      {payload.map((p: any) => (
        <Box key={p.dataKey} sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: p.color }} />
          <Typography variant="caption">
            {p.name}: {p.name.toLowerCase().includes("revenue") ? currency(p.value) : p.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// ─── Trend indicator ──────────────────────────────────────────────────────────
function TrendBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.3,
        px: 0.8,
        py: 0.2,
        borderRadius: 1,
        bgcolor: up ? "success.50" : "error.50",
        color: up ? "success.main" : "error.main",
        fontSize: "0.7rem",
        fontWeight: 700,
      }}
    >
      {up ? <TrendingUpIcon sx={{ fontSize: 13 }} /> : <TrendingDownIcon sx={{ fontSize: 13 }} />}
      {up ? "+" : ""}
      {value}
      {suffix} vs last month
    </Box>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
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
      <PageHeader title="Dashboard" subtitle="Business overview at a glance" />

      {/* ── KPI Cards ── */}
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

      {/* ── Revenue trend + Order status pie ── */}
      <Box sx={chartsRowSx}>
        {/* Area chart: Revenue & orders over 12 months */}
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
              <Box>
                <Typography variant="h6">Revenue Over Time</Typography>
                <Typography variant="caption" color="text.secondary">
                  Monthly revenue & order volume
                </Typography>
              </Box>
              <TrendBadge value={18.7} />
            </Box>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={REVENUE_BY_MONTH}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="left"
                  tickFormatter={shortCurrency}
                  tick={{ fontSize: 11 }}
                  width={52}
                />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} width={32} />
                <Tooltip content={<RevenueTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke={CHART_COLORS.teal}
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart: Order status breakdown */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Order Status
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Distribution by fulfillment stage
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={ORDER_STATUS_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {ORDER_STATUS_DATA.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [v, "orders"]}
                  contentStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
              {ORDER_STATUS_DATA.map((d, i) => (
                <Box key={d.name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: PIE_COLORS[i] }} />
                    <Typography variant="caption">{d.name}</Typography>
                  </Box>
                  <Typography variant="caption" fontWeight={600}>
                    {d.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* ── 3-column row: Customer growth / Daily revenue / Top products ── */}
      <Box sx={chartsRow2Sx}>
        {/* Stacked bar: New vs Returning customers */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Customer Acquisition
            </Typography>
            <Typography variant="caption" color="text.secondary">
              New vs returning — last 6 months
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={CUSTOMER_GROWTH} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={28} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="new" name="New" stackId="a" fill={CHART_COLORS.blue2} radius={[0, 0, 0, 0]} />
                <Bar dataKey="returning" name="Returning" stackId="a" fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar chart: Daily revenue this week */}
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="h6">This Week</Typography>
                <Typography variant="caption" color="text.secondary">
                  Daily revenue
                </Typography>
              </Box>
              <TrendBadge value={-4.2} />
            </Box>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={DAILY_REVENUE} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11 }} width={44} />
                <Tooltip
                  formatter={(v: number) => [currency(v), "Revenue"]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]}>
                  {DAILY_REVENUE.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.day === "Fri" ? CHART_COLORS.primary : CHART_COLORS.purple}
                      fillOpacity={entry.day === "Fri" ? 1 : 0.65}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products by revenue */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Products
            </Typography>
            <Typography variant="caption" color="text.secondary">
              By revenue this month
            </Typography>
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
              {TOP_PRODUCTS.map((p, i) => {
                const maxRevenue = TOP_PRODUCTS[0].revenue;
                const pct = Math.round((p.revenue / maxRevenue) * 100);
                return (
                  <Box key={p.name}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
                      <Typography variant="caption" noWrap sx={{ maxWidth: "62%", fontWeight: 500 }}>
                        {i + 1}. {p.name}
                      </Typography>
                      <Typography variant="caption" fontWeight={700} color="text.primary">
                        {shortCurrency(p.revenue)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 5,
                        borderRadius: 3,
                        bgcolor: "action.hover",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: PIE_COLORS[i % PIE_COLORS.length],
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {p.sales} units sold
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* ── Recent Orders + Low Stock ── */}
      <Box sx={lowerGridSx}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Orders
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
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(
                        100,
                        Math.round((p.quantity / p.lowStockThreshold) * 100),
                      )}
                      color="warning"
                      sx={{ width: 48, height: 4, borderRadius: 2, ml: 1 }}
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

const chipSx = { ml: 1 };