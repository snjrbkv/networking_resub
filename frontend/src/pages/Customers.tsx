import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  TextField,
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
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import PageHeader from "../components/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import { customerApi } from "../api/services";
import { apiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Customer } from "../types";

const filterRowSx = { p: 2 };
const searchSx = { minWidth: 240 };
const emptyForm = { name: "", email: "", phone: "", address: "", company: "" };

export default function Customers() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "MANAGER");
  const canDelete = hasRole("ADMIN");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [toDelete, setToDelete] = useState<Customer | null>(null);
  const [formError, setFormError] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["customers", page, pageSize, search],
    queryFn: () => customerApi.list({ page: page + 1, pageSize, search: search || undefined }),
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        address: form.address || undefined,
        company: form.company || undefined,
      };
      return editing ? customerApi.update(editing.id, payload) : customerApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setDialogOpen(false);
    },
    onError: (err) => setFormError(apiError(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => customerApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setToDelete(null);
    },
    onError: (err) => {
      alert(apiError(err));
      setToDelete(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone ?? "",
      address: c.address ?? "",
      company: c.company ?? "",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const setField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Box>
      <PageHeader
        title="Customers"
        subtitle="CRM — manage customer relationships"
        action={
          canManage ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              New Customer
            </Button>
          ) : undefined
        }
      />

      <Card>
        <Box sx={filterRowSx}>
          <TextField
            size="small"
            label="Search by name, email, company"
            sx={searchSx}
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
          />
        </Box>

        {error && <Alert severity="error">{apiError(error)}</Alert>}

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Company</TableCell>
              <TableCell align="center">Orders</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : (data?.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              data!.data.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.phone ?? "—"}</TableCell>
                  <TableCell>{c.company ?? "—"}</TableCell>
                  <TableCell align="center">
                    <Chip size="small" label={c._count?.orders ?? 0} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Customer history">
                      <IconButton size="small" onClick={() => navigate(`/customers/${c.id}/history`)}>
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canManage && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(c)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setToDelete(c)}>
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
        <DialogTitle>{editing ? "Edit Customer" : "New Customer"}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error">{formError}</Alert>}
          <Stack spacing={2} mt={1}>
            <TextField label="Customer Name" required value={form.name} onChange={(e) => setField("name", e.target.value)} />
            <TextField label="Email" type="email" required value={form.email} onChange={(e) => setField("email", e.target.value)} />
            <TextField label="Phone" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
            <TextField label="Address" value={form.address} onChange={(e) => setField("address", e.target.value)} />
            <TextField label="Company" value={form.company} onChange={(e) => setField("company", e.target.value)} />
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
        title="Delete customer"
        message={`Delete "${toDelete?.name}"? Customers with existing orders cannot be deleted.`}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
      />
    </Box>
  );
}
