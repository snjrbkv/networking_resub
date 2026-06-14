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
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PageHeader from "../components/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import { productApi } from "../api/services";
import { apiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Product } from "../types";

const filterRowSx = { display: "flex", flexWrap: "wrap", gap: 2, p: 2 };
const searchSx = { minWidth: 220, flexGrow: 1 };
const selectSx = { minWidth: 180 };
const emptyForm = {
  name: "",
  sku: "",
  category: "",
  price: "",
  quantity: "",
  supplier: "",
  description: "",
  lowStockThreshold: "10",
};

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function Products() {
  const qc = useQueryClient();
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "MANAGER");
  const canDelete = hasRole("ADMIN");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [formError, setFormError] = useState("");

  const { data: categories } = useQuery({ queryKey: ["product-categories"], queryFn: productApi.categories });

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", page, pageSize, search, category],
    queryFn: () =>
      productApi.list({ page: page + 1, pageSize, search: search || undefined, category: category || undefined }),
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        sku: form.sku,
        category: form.category,
        price: Number(form.price),
        quantity: Number(form.quantity),
        supplier: form.supplier || undefined,
        description: form.description || undefined,
        lowStockThreshold: Number(form.lowStockThreshold),
      };
      return editing ? productApi.update(editing.id, payload) : productApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product-categories"] });
      setDialogOpen(false);
    },
    onError: (err) => setFormError(apiError(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => productApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setToDelete(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: String(p.price),
      quantity: String(p.quantity),
      supplier: p.supplier ?? "",
      description: p.description ?? "",
      lowStockThreshold: String(p.lowStockThreshold),
    });
    setFormError("");
    setDialogOpen(true);
  };

  const setField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Box>
      <PageHeader
        title="Products"
        subtitle="ERP — manage your product catalog"
        action={
          canManage ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              New Product
            </Button>
          ) : undefined
        }
      />

      <Card>
        <Box sx={filterRowSx}>
          <TextField
            size="small"
            label="Search by name, SKU, supplier"
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
            label="Category"
            sx={selectSx}
            value={category}
            onChange={(e) => {
              setPage(0);
              setCategory(e.target.value);
            }}
          >
            <MenuItem value="">All categories</MenuItem>
            {(categories ?? []).map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {error && <Alert severity="error">{apiError(error)}</Alert>}

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell>Supplier</TableCell>
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
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              data!.data.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.sku}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell align="right">{currency(Number(p.price))}</TableCell>
                  <TableCell align="right">
                    {p.quantity <= p.lowStockThreshold ? (
                      <Chip size="small" color="warning" label={p.quantity} />
                    ) : (
                      p.quantity
                    )}
                  </TableCell>
                  <TableCell>{p.supplier ?? "—"}</TableCell>
                  <TableCell align="right">
                    {canManage && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(p)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setToDelete(p)}>
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

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error">{formError}</Alert>}
          <Stack spacing={2} mt={1}>
            <TextField label="Product Name" required value={form.name} onChange={(e) => setField("name", e.target.value)} />
            <TextField label="SKU" required value={form.sku} onChange={(e) => setField("sku", e.target.value)} />
            <TextField label="Category" required value={form.category} onChange={(e) => setField("category", e.target.value)} />
            <TextField
              label="Price"
              type="number"
              required
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
            />
            <TextField
              label="Quantity"
              type="number"
              required
              value={form.quantity}
              onChange={(e) => setField("quantity", e.target.value)}
            />
            <TextField
              label="Low Stock Threshold"
              type="number"
              value={form.lowStockThreshold}
              onChange={(e) => setField("lowStockThreshold", e.target.value)}
            />
            <TextField label="Supplier" value={form.supplier} onChange={(e) => setField("supplier", e.target.value)} />
            <TextField
              label="Description"
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => upsert.mutate()} disabled={upsert.isPending}>
            {editing ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete product"
        message={`Delete "${toDelete?.name}"? This cannot be undone.`}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
      />
    </Box>
  );
}
