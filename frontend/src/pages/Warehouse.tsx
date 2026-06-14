import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from "@mui/material";
import SouthIcon from "@mui/icons-material/South";
import NorthIcon from "@mui/icons-material/North";
import PageHeader from "../components/PageHeader";
import { warehouseApi, productApi } from "../api/services";
import { apiError } from "../api/client";

const tabPanelSx = { mt: 2 };
const actionsSx = { display: "flex", gap: 1, mb: 2 };

type MovementKind = "STOCK_IN" | "STOCK_OUT";

export default function Warehouse() {
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [kind, setKind] = useState<MovementKind>("STOCK_IN");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");

  const { data: inventory, isLoading: invLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: warehouseApi.inventory,
  });

  const { data: history, isLoading: histLoading } = useQuery({
    queryKey: ["inventory-history", page, pageSize],
    queryFn: () => warehouseApi.history({ page: page + 1, pageSize }),
  });

  const { data: products } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productApi.list({ pageSize: 100 }),
    enabled: dialogOpen,
  });

  const move = useMutation({
    mutationFn: () => {
      const payload = { productId, quantity: Number(quantity), reason: reason || undefined };
      return kind === "STOCK_IN" ? warehouseApi.stockIn(payload) : warehouseApi.stockOut(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory-history"] });
      setDialogOpen(false);
    },
    onError: (err) => setFormError(apiError(err)),
  });

  const openMovement = (k: MovementKind) => {
    setKind(k);
    setProductId("");
    setQuantity("1");
    setReason("");
    setFormError("");
    setDialogOpen(true);
  };

  return (
    <Box>
      <PageHeader title="Warehouse" subtitle="WMS — inventory & stock movements" />

      <Box sx={actionsSx}>
        <Button variant="contained" color="success" startIcon={<SouthIcon />} onClick={() => openMovement("STOCK_IN")}>
          Stock In
        </Button>
        <Button variant="contained" color="warning" startIcon={<NorthIcon />} onClick={() => openMovement("STOCK_OUT")}>
          Stock Out
        </Button>
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label="Inventory" />
          <Tab label="History" />
        </Tabs>
        <CardContent>
          {tab === 0 ? (
            invLoading ? (
              <CircularProgress size={28} />
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(inventory ?? []).map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="center">
                        {item.isLowStock ? (
                          <Chip size="small" color="warning" label="Low stock" />
                        ) : (
                          <Chip size="small" color="success" label="OK" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            <Box sx={tabPanelSx}>
              {histLoading ? (
                <CircularProgress size={28} />
              ) : (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Balance</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(history?.data ?? []).map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
                          <TableCell>{t.product?.name ?? "—"}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={t.type === "STOCK_IN" ? "success" : "warning"}
                              label={t.type === "STOCK_IN" ? "Stock In" : "Stock Out"}
                            />
                          </TableCell>
                          <TableCell align="right">{t.quantity}</TableCell>
                          <TableCell align="right">{t.balanceAfter}</TableCell>
                          <TableCell>{t.reason ?? "—"}</TableCell>
                          <TableCell>{t.performedBy?.name ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={history?.pagination.total ?? 0}
                    page={page}
                    onPageChange={(_e, p) => setPage(p)}
                    rowsPerPage={pageSize}
                    onRowsPerPageChange={(e) => {
                      setPageSize(parseInt(e.target.value, 10));
                      setPage(0);
                    }}
                    rowsPerPageOptions={[10, 25, 50]}
                  />
                </>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{kind === "STOCK_IN" ? "Stock In" : "Stock Out"}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error">{formError}</Alert>}
          <Stack spacing={2} mt={1}>
            <TextField select label="Product" required value={productId} onChange={(e) => setProductId(e.target.value)}>
              {(products?.data ?? []).map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} ({p.quantity} in stock)
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Quantity"
              type="number"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => move.mutate()} disabled={move.isPending || !productId}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
