import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  Select,
  CircularProgress,
  Alert,
  Divider,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import PageHeader from "../components/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusChip from "../components/StatusChip";
import { orderApi, customerApi, productApi } from "../api/services";
import { apiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Order, OrderStatus } from "../types";

const filterRowSx = { display: "flex", flexWrap: "wrap", gap: 2, p: 2 };
const selectSx = { minWidth: 180 };
const searchSx = { minWidth: 220, flexGrow: 1 };
const lineRowSx = { display: "flex", gap: 1, alignItems: "center" };
const lineProductSx = { flexGrow: 1 };
const lineQtySx = { width: 110 };
const totalSx = { display: "flex", justifyContent: "space-between", mt: 1 };

const STATUSES: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

interface LineItem {
  productId: string;
  quantity: string;
}

export default function Orders() {
  const qc = useQueryClient();
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "MANAGER");
  const canDelete = hasRole("ADMIN");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([{ productId: "", quantity: "1" }]);
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState<Order | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", page, pageSize, search, status],
    queryFn: () =>
      orderApi.list({ page: page + 1, pageSize, search: search || undefined, status: status || undefined }),
  });

  const { data: customers } = useQuery({
    queryKey: ["customers-all"],
    queryFn: () => customerApi.list({ pageSize: 100 }),
    enabled: dialogOpen,
  });
  const { data: products } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productApi.list({ pageSize: 100 }),
    enabled: dialogOpen,
  });

  const create = useMutation({
    mutationFn: () =>
      orderApi.create({
        customerId,
        notes: notes || undefined,
        items: lines
          .filter((l) => l.productId && Number(l.quantity) > 0)
          .map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      setDialogOpen(false);
    },
    onError: (err) => setFormError(apiError(err)),
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) => orderApi.updateStatus(id, next),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
    onError: (err) => alert(apiError(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => orderApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      setToDelete(null);
    },
  });

  const openCreate = () => {
    setCustomerId("");
    setNotes("");
    setLines([{ productId: "", quantity: "1" }]);
    setFormError("");
    setDialogOpen(true);
  };

  const updateLine = (idx: number, key: keyof LineItem, value: string) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  const addLine = () => setLines((prev) => [...prev, { productId: "", quantity: "1" }]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const productList = products?.data ?? [];
  const estimatedTotal = lines.reduce((sum, l) => {
    const prod = productList.find((p) => p.id === l.productId);
    return sum + (prod ? Number(prod.price) * Number(l.quantity || 0) : 0);
  }, 0);

  return (
    <Box>
      <PageHeader
        title="Orders"
        subtitle="Track and fulfil customer orders"
        action={
          canManage ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              New Order
            </Button>
          ) : undefined
        }
      />

      <Card>
        <Box sx={filterRowSx}>
          <TextField
            size="small"
            label="Search by order # or notes"
            sx={searchSx}
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
          />
          <TextField
            select
            size="small"
            label="Status"
            sx={selectSx}
            value={status}
            onChange={(e) => {
              setPage(0);
              setStatus(e.target.value);
            }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {error && <Alert severity="error">{apiError(error)}</Alert>}

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="center">Items</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : (data?.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              data!.data.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell>{o.orderNumber}</TableCell>
                  <TableCell>{o.customer?.name ?? "—"}</TableCell>
                  <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="center">{o._count?.items ?? o.items?.length ?? 0}</TableCell>
                  <TableCell align="right">{currency(Number(o.totalAmount))}</TableCell>
                  <TableCell>
                    {canManage ? (
                      <Select
                        size="small"
                        variant="standard"
                        value={o.status}
                        onChange={(e) => changeStatus.mutate({ id: o.id, next: e.target.value })}
                      >
                        {STATUSES.map((s) => (
                          <MenuItem key={s} value={s}>
                            {s}
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <StatusChip status={o.status as OrderStatus} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {canDelete && (
                      <Tooltip title="Delete (restocks items)">
                        <IconButton size="small" color="error" onClick={() => setToDelete(o)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={data?.pagination.total ?? 0}
          page={page}
          onPageChange={(_e, p) => setPage(p)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Order</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error">{formError}</Alert>}
          <Stack spacing={2} mt={1}>
            <TextField
              select
              label="Customer"
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              {(customers?.data ?? []).map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ""}
                </MenuItem>
              ))}
            </TextField>

            <Divider>Items</Divider>
            {lines.map((line, idx) => (
              <Box key={idx} sx={lineRowSx}>
                <TextField
                  select
                  size="small"
                  label="Product"
                  sx={lineProductSx}
                  value={line.productId}
                  onChange={(e) => updateLine(idx, "productId", e.target.value)}
                >
                  {productList.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} — {currency(Number(p.price))} ({p.quantity} in stock)
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  size="small"
                  type="number"
                  label="Qty"
                  sx={lineQtySx}
                  value={line.quantity}
                  onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                />
                <IconButton size="small" color="error" disabled={lines.length === 1} onClick={() => removeLine(idx)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button startIcon={<AddShoppingCartIcon />} onClick={addLine} size="small">
              Add item
            </Button>

            <TextField label="Notes" multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

            <Box sx={totalSx}>
              <Typography variant="subtitle1">Estimated total</Typography>
              <Typography variant="subtitle1" fontWeight={700}>
                {currency(estimatedTotal)}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => create.mutate()}
            disabled={create.isPending || !customerId}
          >
            Create Order
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete order"
        message={`Delete order ${toDelete?.orderNumber}? Stock will be returned to inventory.`}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
      />
    </Box>
  );
}
