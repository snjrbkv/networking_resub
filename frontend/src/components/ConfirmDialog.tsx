import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onClose, loading }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
