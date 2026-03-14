import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Checkbox,
  Chip,
  Divider,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import PlaylistAddCheckRoundedIcon from "@mui/icons-material/PlaylistAddCheckRounded";
import EventRepeatRoundedIcon from "@mui/icons-material/EventRepeatRounded";

import {
  getRecurringTemplates,
  addRecurring,
  updateRecurring,
  deleteRecurring,
} from "../services/recurringService";
import { addTransaction } from "../services/transactionService";
import { getPersons } from "../services/personService";
import { useAppSelector } from "../hooks/reduxHooks";
import { useConfirm } from "../contexts/ConfirmContext";
import { useAlert } from "../contexts/AlertContext";

const typeOptions = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "lent", label: "Lent" },
  { value: "borrow", label: "Borrow" },
];

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const emptyForm = {
  personId: "",
  amount: "",
  type: "expense",
  dayOfMonth: 1,
  description: "",
};

// ── Shared MenuProps to fix dropdown z-index inside Dialog ──────────
const menuProps = {
  MenuProps: {
    sx: { zIndex: 9999 },
  },
};

export default function RecurringTransactions() {
  const theme = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const confirm = useConfirm();
  const showAlert = useAlert();

  const [templates, setTemplates] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Add/Edit dialog ──
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  // ── Preview/Create dialog ──
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);

  const personMap = Object.fromEntries(persons.map((p) => [p.id, p.name]));

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [t, p] = await Promise.all([
        getRecurringTemplates(user.uid),
        getPersons(user.uid),
      ]);
      setTemplates(t);
      setPersons(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // ── Open preview: pre-select all ──
  const openPreview = () => {
    const allSelected: Record<string, boolean> = {};
    templates.forEach((t) => {
      allSelected[t.id] = true;
    });
    setSelected(allSelected);
    setPreviewOpen(true);
  };

  // ── Create selected transactions for this month ──
  const handleCreateSelected = async () => {
    if (!user) return;
    setCreating(true);
    const now = new Date();
    const toCreate = templates.filter((t) => selected[t.id]);

    try {
      await Promise.all(
        toCreate.map((t) => {
          const txDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            Math.min(
              t.dayOfMonth,
              new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
            )
          );
          return addTransaction({
            userId: user.uid,
            personId: t.personId,
            amount: t.amount,
            type: t.type,
            description: t.description || "",
            status: "pending",
            date: txDate,
            completedDate: null,
            createdAt: new Date(),
            isRecurring: true,
          });
        })
      );
      showAlert(
        `${toCreate.length} recurring transaction${
          toCreate.length !== 1 ? "s" : ""
        } created for ${now.toLocaleString("default", {
          month: "long",
          year: "numeric",
        })}`,
        "success"
      );
      setPreviewOpen(false);
    } catch {
      showAlert("Failed to create transactions. Please try again.", "error");
    } finally {
      setCreating(false);
    }
  };

  // ── Save template (add or edit) ──
  const handleSave = async () => {
    if (!user || !form.personId || !form.amount) return;
    setSaving(true);
    try {
      const payload = {
        userId: user.uid,
        personId: form.personId,
        amount: Number(form.amount),
        type: form.type,
        dayOfMonth: Number(form.dayOfMonth),
        description: form.description.trim(),
      };
      if (editingId) {
        await updateRecurring(editingId, payload);
      } else {
        await addRecurring({ ...payload, createdAt: new Date() });
      }
      setFormOpen(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setForm({
      personId: t.personId,
      amount: String(t.amount),
      type: t.type,
      dayOfMonth: t.dayOfMonth,
      description: t.description || "",
    });
    setFormOpen(true);
  };

  const handleDelete = async (id: string, label: string) => {
    const ok = await confirm({
      title: "Delete recurring template?",
      message: `"${label}" will be removed. This cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      confirmColor: "error",
    });
    if (!ok) return;
    await deleteRecurring(id);
    loadData();
  };

  const now = new Date();
  const currentMonthLabel = now.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: theme.palette.background.paper,
    },
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 2, sm: 3 }, py: 3 }}>
      {/* ── Page Header ── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 1 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <RepeatRoundedIcon sx={{ fontSize: 32, color: "primary.main" }} />
            <Typography variant="h4" fontWeight={700}>
              Recurring Transactions
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage monthly templates and create this month's transactions in one
            click.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          {templates.length > 0 && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<PlaylistAddCheckRoundedIcon />}
              onClick={openPreview}
              sx={{ borderRadius: 2, fontWeight: 600, whiteSpace: "nowrap" }}
            >
              Create for {currentMonthLabel}
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              setEditingId(null);
              setForm({ ...emptyForm });
              setFormOpen(true);
            }}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Add Template
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ my: 2.5 }} />

      {/* ── Template List ── */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : templates.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 2,
            border: `1px dashed ${theme.palette.divider}`,
            backgroundColor: alpha(theme.palette.text.primary, 0.02),
          }}
        >
          <EventRepeatRoundedIcon
            sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }}
          />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No recurring templates yet
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 2.5 }}>
            Add a template for monthly salary, rent, or any fixed transaction.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setFormOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Add Template
          </Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {templates.map((t) => (
            <Paper
              key={t.id}
              elevation={0}
              sx={{
                px: 2.5,
                py: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
                transition: "border-color 0.2s, box-shadow 0.2s",
                "&:hover": {
                  borderColor: alpha(theme.palette.primary.main, 0.4),
                  boxShadow: theme.shadows[2],
                },
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                spacing={1.5}
              >
                <Box>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 0.5 }}
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      {personMap[t.personId] || "Unknown"}
                    </Typography>
                    <Chip
                      label={
                        t.type.charAt(0).toUpperCase() + t.type.slice(1)
                      }
                      size="small"
                      variant="outlined"
                      color={
                        t.type === "income"
                          ? "success"
                          : t.type === "expense"
                          ? "error"
                          : t.type === "lent"
                          ? "warning"
                          : "info"
                      }
                      sx={{ fontWeight: 600, fontSize: 11 }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="primary.main"
                    >
                      ₹{Number(t.amount).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Every month on the{" "}
                      <strong>{ordinal(t.dayOfMonth)}</strong>
                    </Typography>
                  </Stack>
                  {t.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.25, display: "block" }}
                    >
                      {t.description}
                    </Typography>
                  )}
                </Box>

                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Edit template">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(t)}
                      sx={{ color: "primary.main" }}
                    >
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete template">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        handleDelete(
                          t.id,
                          `${personMap[t.personId]} ₹${t.amount}`
                        )
                      }
                      sx={{
                        "&:hover": {
                          backgroundColor: alpha(
                            theme.palette.error.main,
                            0.08
                          ),
                        },
                      }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* ── Add / Edit Template Dialog ── */}
      <Dialog
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "visible" } }} // 👈 overflow visible helps dropdown
      >
      {/* ── Add / Edit Template Dialog title ── */}
<DialogTitle
  sx={{
    pb: 1,
    fontWeight: 700,
    fontSize: "1.25rem",   // same as h6
  }}
>
  {editingId ? "Edit Template" : "New Recurring Template"}
</DialogTitle>

        <DialogContent sx={{ overflow: "visible" }}> // 👈 overflow visible
          <Stack spacing={2.5} sx={{ mt: 1 }}>

            {/* ── Person dropdown ── */}
            <TextField
              select
              label="Person"
              size="small"
              fullWidth
              value={form.personId}
              onChange={(e) =>
                setForm((f) => ({ ...f, personId: e.target.value }))
              }
              sx={inputSx}
              SelectProps={{
                displayEmpty: true,
                ...menuProps, // 👈 z-index fix
              }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">
                <em>Select person</em>
              </MenuItem>
              {persons.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>

            {/* ── Amount ── */}
            <TextField
              label="Amount"
              type="number"
              size="small"
              fullWidth
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
              inputProps={{ min: 0 }}
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <Typography
                    component="span"
                    sx={{ mr: 1, color: "text.secondary", fontWeight: 600 }}
                  >
                    ₹
                  </Typography>
                ),
              }}
            />

            {/* ── Type dropdown ── */}
            <TextField
              select
              label="Type"
              size="small"
              fullWidth
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value }))
              }
              sx={inputSx}
              SelectProps={{
                ...menuProps, // 👈 z-index fix
              }}
            >
              {typeOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            {/* ── Day of Month ── */}
            <TextField
              label="Day of Month"
              type="number"
              size="small"
              fullWidth
              value={form.dayOfMonth}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  dayOfMonth: Math.min(
                    28,
                    Math.max(1, Number(e.target.value))
                  ),
                }))
              }
              inputProps={{ min: 1, max: 28 }}
              helperText={`Transaction will be dated the ${ordinal(
                Number(form.dayOfMonth)
              )} of each month (max 28 to work in all months)`}
              sx={inputSx}
            />

            {/* ── Description ── */}
            <TextField
              label="Description (optional)"
              placeholder="e.g. Monthly salary, Office rent…"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              sx={inputSx}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setFormOpen(false)}
            disabled={saving}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.personId || !form.amount}
            startIcon={
              saving ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
            sx={{ borderRadius: 2, minWidth: 100 }}
          >
            {saving ? "Saving…" : editingId ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Preview / Create Dialog ── */}
      <Dialog
        open={previewOpen}
        onClose={() => !creating && setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
       {/* ── Preview Dialog title ── */}
<DialogTitle sx={{ pb: 1 }}>
  <Stack direction="row" alignItems="center" spacing={1}>
    <PlaylistAddCheckRoundedIcon color="primary" />
    <Box>
      {/* 👇 use Box with sx instead of Typography variant="h6" */}
      <Box sx={{ fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.4 }}>
        Create for {currentMonthLabel}
      </Box>
      <Typography variant="caption" color="text.secondary">
        All templates are selected. Uncheck any you want to skip.
      </Typography>
    </Box>
  </Stack>
</DialogTitle>

        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {templates.map((t) => {
              const txDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                Math.min(
                  t.dayOfMonth,
                  new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    0
                  ).getDate()
                )
              );
              return (
                <Paper
                  key={t.id}
                  elevation={0}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    border: `1px solid`,
                    borderColor: selected[t.id]
                      ? alpha(theme.palette.primary.main, 0.4)
                      : theme.palette.divider,
                    backgroundColor: selected[t.id]
                      ? alpha(theme.palette.primary.main, 0.04)
                      : theme.palette.background.paper,
                    transition: "all 0.15s",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setSelected((s) => ({ ...s, [t.id]: !s[t.id] }))
                  }
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Checkbox
                      checked={!!selected[t.id]}
                      onChange={(e) =>
                        setSelected((s) => ({
                          ...s,
                          [t.id]: e.target.checked,
                        }))
                      }
                      onClick={(e) => e.stopPropagation()}
                      size="small"
                      sx={{ p: 0 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {personMap[t.personId] || "Unknown"}
                        </Typography>
                        <Chip
                          label={
                            t.type.charAt(0).toUpperCase() + t.type.slice(1)
                          }
                          size="small"
                          variant="outlined"
                          color={
                            t.type === "income"
                              ? "success"
                              : t.type === "expense"
                              ? "error"
                              : t.type === "lent"
                              ? "warning"
                              : "info"
                          }
                          sx={{ fontSize: 10, height: 20 }}
                        />
                      </Stack>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{ mt: 0.25 }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="primary.main"
                        >
                          ₹{Number(t.amount).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Dated {txDate.toLocaleDateString("en-GB")}
                        </Typography>
                        {t.description && (
                          <Typography variant="caption" color="text.disabled">
                            · {t.description}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              );
            })}

            {/* ── Summary footer ── */}
            <Box
              sx={{
                mt: 1,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.06),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                <strong>
                  {Object.values(selected).filter(Boolean).length}
                </strong>{" "}
                of <strong>{templates.length}</strong> templates selected ·
                Total:{" "}
                <strong>
                  ₹
                  {templates
                    .filter((t) => selected[t.id])
                    .reduce((sum, t) => sum + Number(t.amount), 0)
                    .toLocaleString()}
                </strong>
              </Typography>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            variant="text"
            onClick={() => {
              const allSelected: Record<string, boolean> = {};
              templates.forEach((t) => (allSelected[t.id] = true));
              setSelected(allSelected);
            }}
            sx={{ mr: "auto", borderRadius: 2 }}
          >
            Select All
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setPreviewOpen(false)}
            disabled={creating}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSelected}
            disabled={
              creating ||
              Object.values(selected).filter(Boolean).length === 0
            }
            startIcon={
              creating ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <PlaylistAddCheckRoundedIcon />
              )
            }
            sx={{ borderRadius: 2, minWidth: 140 }}
          >
            {creating
              ? "Creating…"
              : `Create ${
                  Object.values(selected).filter(Boolean).length
                } Transactions`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}