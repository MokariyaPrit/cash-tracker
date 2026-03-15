import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
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
  Avatar,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import PlaylistAddCheckRoundedIcon from "@mui/icons-material/PlaylistAddCheckRounded";
import EventRepeatRoundedIcon from "@mui/icons-material/EventRepeatRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";

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
  { value: "salary", label: "Salary" },
  { value: "income", label: "Income" },
  { value: "advance", label: "Advance" },
];

const monthNames = [
  "January","February","March","April",
  "May","June","July","August",
  "September","October","November","December",
];

const ordinal = (n: number) => {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const emptyForm = {
  personId: "",
  amount: "",
  type: "salary",
  dayOfMonth: 1,
  description: "",
};

const menuProps = { MenuProps: { sx: { zIndex: 9999 } } };
const now = new Date();
const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

const TYPE_META: Record<string, { color: any; icon: any; bg: string }> = {
  income:     { color: "success", icon: TrendingUpRoundedIcon,           bg: "#10b981" },
  expense:    { color: "error",   icon: TrendingDownRoundedIcon,          bg: "#ef4444" },
  salary:     { color: "error",   icon: TrendingDownRoundedIcon,          bg: "#ef4444" },
  advance:    { color: "info",    icon: AccountBalanceWalletRoundedIcon,  bg: "#0ea5e9" },
  settlement: { color: "success", icon: SwapHorizRoundedIcon,             bg: "#10b981" },
};

function getAvatarColor(name: string) {
  const palette = ["#2563eb","#8b5cf6","#10b981","#0ea5e9","#f59e0b"];
  return palette[name.charCodeAt(0) % palette.length];
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function RecurringTransactions() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const user = useAppSelector((state) => state.auth.user);
  const confirm = useConfirm();
  const showAlert = useAlert();

  const [templates, setTemplates] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);

  const [previewMonth, setPreviewMonth] = useState(now.getMonth());
  const [previewYear, setPreviewYear] = useState(now.getFullYear());

  const personMap = Object.fromEntries(persons.map((p) => [p.id, p.name]));
  const previewMonthLabel = new Date(previewYear, previewMonth).toLocaleString("default", { month: "long", year: "numeric" });
  const currentMonthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });
  const isCurrentMonth = previewMonth === now.getMonth() && previewYear === now.getFullYear();

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

  useEffect(() => { loadData(); }, [user]);

  const openPreview = () => {
    const allSelected: Record<string, boolean> = {};
    templates.forEach((t) => { allSelected[t.id] = true; });
    setSelected(allSelected);
    setPreviewMonth(now.getMonth());
    setPreviewYear(now.getFullYear());
    setPreviewOpen(true);
  };

  const handleCreateSelected = async () => {
    if (!user) return;
    setCreating(true);
    const toCreate = templates.filter((t) => selected[t.id]);
    try {
      await Promise.all(
        toCreate.map((t) => {
          const txDate = new Date(
            previewYear, previewMonth,
            Math.min(t.dayOfMonth, new Date(previewYear, previewMonth + 1, 0).getDate())
          );
          return addTransaction({
            userId: user.uid, personId: t.personId,
            amount: t.amount, type: t.type,
            description: t.description || "",
            status: "pending", date: txDate,
            completedDate: null, createdAt: new Date(), isRecurring: true,
          });
        })
      );
      showAlert(`${toCreate.length} recurring transaction${toCreate.length !== 1 ? "s" : ""} created for ${previewMonthLabel}`, "success");
      setPreviewOpen(false);
    } catch {
      showAlert("Failed to create transactions. Please try again.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!user || !form.personId || !form.amount) return;
    setSaving(true);
    try {
      const payload = {
        userId: user.uid, personId: form.personId,
        amount: Number(form.amount), type: form.type,
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
      personId: t.personId, amount: String(t.amount),
      type: t.type, dayOfMonth: t.dayOfMonth,
      description: t.description || "",
    });
    setFormOpen(true);
  };

  const handleDelete = async (id: string, label: string) => {
    const ok = await confirm({
      title: "Delete recurring template?",
      message: `"${label}" will be removed. This cannot be undone.`,
      confirmLabel: "Delete", cancelLabel: "Cancel", confirmColor: "error",
    });
    if (!ok) return;
    await deleteRecurring(id);
    loadData();
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: theme.palette.background.paper,
    },
  };

  // ── Total monthly amount ───────────────────────────────────────────
  const totalMonthly = templates.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>

      {/* ── Page Header ── */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
          <Box
            sx={{
              width: 38, height: 38, borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <RepeatRoundedIcon sx={{ fontSize: 20, color: "primary.main" }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">
              Recurring
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
              Monthly templates
            </Typography>
          </Box>
          {templates.length > 0 && (
            <Chip
              label={`${templates.length} template${templates.length !== 1 ? "s" : ""}`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: 11, height: 22, ml: 0.5 }}
            />
          )}
        </Stack>
      </Box>

      {/* ── Action buttons ── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.25}
        sx={{ mb: 3 }}
      >
        {templates.length > 0 && (
          <Button
            variant="outlined"
            color="success"
            startIcon={<PlaylistAddCheckRoundedIcon />}
            onClick={openPreview}
            fullWidth={isMobile}
            sx={{ borderRadius: 2, fontWeight: 700, whiteSpace: "nowrap" }}
          >
            {isMobile ? `Create for ${monthNames[now.getMonth()]}` : `Create for ${currentMonthLabel}`}
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => { setEditingId(null); setForm({ ...emptyForm }); setFormOpen(true); }}
          fullWidth={isMobile}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Add Template
        </Button>
      </Stack>

      {/* ── Monthly total summary ── */}
      {templates.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            px: 2.5, py: 2, mb: 3,
            borderRadius: 2.5,
            border: `1.5px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.primary.main, 0.02)})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: 10 }}>
              Monthly Commitment
            </Typography>
            <Typography variant="h5" fontWeight={800} color="primary.main" sx={{ fontVariantNumeric: "tabular-nums" }}>
              ₹{totalMonthly.toLocaleString()}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {["salary","expense","income","advance"].map((type) => {
              const total = templates.filter((t) => t.type === type).reduce((s, t) => s + Number(t.amount), 0);
              if (!total) return null;
              const meta = TYPE_META[type];
              return (
                <Chip
                  key={type}
                  label={`${type.charAt(0).toUpperCase() + type.slice(1)} ₹${total.toLocaleString()}`}
                  size="small"
                  color={meta.color}
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: 11 }}
                />
              );
            })}
          </Stack>
        </Paper>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* ── Template List ── */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : templates.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 }, textAlign: "center", borderRadius: 2.5,
            border: `1.5px dashed ${theme.palette.divider}`,
            backgroundColor: alpha(theme.palette.text.primary, 0.02),
          }}
        >
          <EventRepeatRoundedIcon sx={{ fontSize: 52, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="body1" color="text.secondary" fontWeight={600} gutterBottom>
            No recurring templates yet
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3, maxWidth: 280, mx: "auto" }}>
            Add a template for monthly salary, rent, or any fixed transaction.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setFormOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Add Template
          </Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {templates.map((t) => {
            const meta = TYPE_META[t.type] ?? TYPE_META.expense;
            const TypeIcon = meta.icon;
            const personName = personMap[t.personId] || "Unknown";
            const avatarColor = getAvatarColor(personName);

            return (
              <Paper
                key={t.id}
                elevation={0}
                sx={{
                  px: { xs: 1.75, sm: 2.5 },
                  py: { xs: 1.5, sm: 2 },
                  borderRadius: 2.5,
                  border: `1.5px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    borderColor: alpha(theme.palette.primary.main, 0.35),
                    boxShadow: theme.shadows[2],
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  {/* Avatar */}
                  <Avatar
                    sx={{
                      width: 40, height: 40, fontSize: 14, fontWeight: 800,
                      backgroundColor: alpha(avatarColor, 0.14),
                      color: avatarColor, flexShrink: 0,
                    }}
                  >
                    {getInitials(personName)}
                  </Avatar>

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Row 1: Name + Type chip */}
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                      <Typography variant="body1" fontWeight={700} noWrap>
                        {personName}
                      </Typography>
                      <Chip
                        icon={<TypeIcon sx={{ fontSize: "13px !important" }} />}
                        label={t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                        size="small"
                        color={meta.color}
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: 11, height: 22 }}
                      />
                    </Stack>

                    {/* Row 2: Amount + Day */}
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 0.25 }}>
                      <Typography variant="body2" fontWeight={800} color="primary.main" sx={{ fontVariantNumeric: "tabular-nums" }}>
                        ₹{Number(t.amount).toLocaleString()}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <CalendarTodayRoundedIcon sx={{ fontSize: 12, color: "text.disabled" }} />
                        <Typography variant="caption" color="text.secondary">
                          {ordinal(t.dayOfMonth)} of every month
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Row 3: Description */}
                    {t.description && (
                      <Typography variant="caption" color="text.disabled" noWrap sx={{ display: "block", mt: 0.25 }}>
                        {t.description}
                      </Typography>
                    )}
                  </Box>

                  {/* Actions */}
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                    <Tooltip title="Edit template">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(t)}
                        sx={{
                          color: "primary.main", width: 32, height: 32, borderRadius: 1.5,
                          border: `1.5px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                          "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
                        }}
                      >
                        <EditRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete template">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(t.id, `${personName} ₹${t.amount}`)}
                        sx={{
                          width: 32, height: 32, borderRadius: 1.5,
                          border: `1.5px solid ${alpha(theme.palette.error.main, 0.25)}`,
                          "&:hover": { backgroundColor: alpha(theme.palette.error.main, 0.08), borderColor: theme.palette.error.main },
                        }}
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* ── Add / Edit Dialog ── */}
      <Dialog
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
          {editingId ? "Edit Template" : "New Recurring Template"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              select label="Person" size="small" fullWidth
              value={form.personId}
              onChange={(e) => setForm((f) => ({ ...f, personId: e.target.value }))}
              sx={inputSx} SelectProps={{ displayEmpty: true, ...menuProps }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value=""><em>Select person</em></MenuItem>
              {persons.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Amount" type="number" size="small" fullWidth
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              inputProps={{ min: 0 }} sx={inputSx}
              InputProps={{
                startAdornment: (
                  <Typography component="span" sx={{ mr: 1, color: "text.secondary", fontWeight: 700 }}>₹</Typography>
                ),
              }}
            />

            <TextField
              select label="Type" size="small" fullWidth
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              sx={inputSx} SelectProps={{ ...menuProps }}
            >
              {typeOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Day of Month" type="number" size="small" fullWidth
              value={form.dayOfMonth}
              onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: Math.min(28, Math.max(1, Number(e.target.value))) }))}
              inputProps={{ min: 1, max: 28 }}
              helperText={`Dated the ${ordinal(Number(form.dayOfMonth))} of each month (max 28)`}
              sx={inputSx}
            />

            <TextField
              label="Description (optional)" placeholder="e.g. Monthly salary, Office rent…"
              size="small" fullWidth multiline minRows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              sx={inputSx}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: { xs: "column", sm: "row" } }}>
          <Button
            variant="outlined" color="inherit"
            onClick={() => setFormOpen(false)} disabled={saving}
            fullWidth={isMobile} sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained" onClick={handleSave}
            disabled={saving || !form.personId || !form.amount}
            fullWidth={isMobile}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {saving ? "Saving…" : editingId ? "Update" : "Add Template"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Preview / Create Dialog ── */}
      <Dialog
        open={previewOpen}
        onClose={() => !creating && setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <PlaylistAddCheckRoundedIcon color="primary" />
            <Typography fontWeight={700} fontSize="1.15rem">
              Create Recurring Transactions
            </Typography>
          </Stack>

          {/* Month + Year pickers */}
          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" sx={{ gap: 1 }}>
            <TextField
              select size="small" label="Month" value={previewMonth}
              onChange={(e) => setPreviewMonth(Number(e.target.value))}
              sx={{ flex: 1, minWidth: 120, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              SelectProps={{ ...menuProps }}
            >
              {monthNames.map((m, i) => (
                <MenuItem key={i} value={i}>{m}</MenuItem>
              ))}
            </TextField>

            <TextField
              select size="small" label="Year" value={previewYear}
              onChange={(e) => setPreviewYear(Number(e.target.value))}
              sx={{ width: 100, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              SelectProps={{ ...menuProps }}
            >
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>

            {!isCurrentMonth && (
              <Button
                size="small" variant="outlined"
                onClick={() => { setPreviewMonth(now.getMonth()); setPreviewYear(now.getFullYear()); }}
                sx={{ borderRadius: 2, whiteSpace: "nowrap", height: 36 }}
              >
                This Month
              </Button>
            )}
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Creating for <strong>{previewMonthLabel}</strong> — uncheck any you want to skip.
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={1.25} sx={{ mt: 1 }}>
            {templates.map((t) => {
              const txDate = new Date(
                previewYear, previewMonth,
                Math.min(t.dayOfMonth, new Date(previewYear, previewMonth + 1, 0).getDate())
              );
              const meta = TYPE_META[t.type] ?? TYPE_META.expense;
              const personName = personMap[t.personId] || "Unknown";
              const avatarColor = getAvatarColor(personName);

              return (
                <Paper
                  key={t.id}
                  elevation={0}
                  onClick={() => setSelected((s) => ({ ...s, [t.id]: !s[t.id] }))}
                  sx={{
                    px: 1.75, py: 1.5, borderRadius: 2,
                    border: "1.5px solid",
                    borderColor: selected[t.id]
                      ? alpha(theme.palette.primary.main, 0.4)
                      : theme.palette.divider,
                    backgroundColor: selected[t.id]
                      ? alpha(theme.palette.primary.main, 0.04)
                      : theme.palette.background.paper,
                    transition: "all 0.15s",
                    cursor: "pointer",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    <Checkbox
                      checked={!!selected[t.id]}
                      onChange={(e) => setSelected((s) => ({ ...s, [t.id]: e.target.checked }))}
                      onClick={(e) => e.stopPropagation()}
                      size="small" sx={{ p: 0, flexShrink: 0 }}
                    />
                    <Avatar
                      sx={{
                        width: 32, height: 32, fontSize: 12, fontWeight: 800,
                        backgroundColor: alpha(avatarColor, 0.14),
                        color: avatarColor, flexShrink: 0,
                      }}
                    >
                      {getInitials(personName)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {personName}
                        </Typography>
                        <Chip
                          label={t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                          size="small" color={meta.color} variant="outlined"
                          sx={{ fontSize: 10, height: 18, fontWeight: 600 }}
                        />
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" fontWeight={800} color="primary.main">
                          ₹{Number(t.amount).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          · {txDate.toLocaleDateString("en-GB")}
                        </Typography>
                        {t.description && (
                          <Typography variant="caption" color="text.disabled" noWrap>
                            · {t.description}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              );
            })}

            {/* Summary */}
            <Box
              sx={{
                mt: 0.5, p: 2, borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.06),
                border: `1.5px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <Typography variant="body2" color="text.secondary">
                  <strong>{Object.values(selected).filter(Boolean).length}</strong> of{" "}
                  <strong>{templates.length}</strong> selected
                </Typography>
                <Typography variant="body2" fontWeight={800} color="primary.main">
                  Total: ₹{templates
                    .filter((t) => selected[t.id])
                    .reduce((sum, t) => sum + Number(t.amount), 0)
                    .toLocaleString()}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: { xs: "column-reverse", sm: "row" } }}>
          <Button
            variant="text"
            onClick={() => {
              const all: Record<string, boolean> = {};
              templates.forEach((t) => (all[t.id] = true));
              setSelected(all);
            }}
            sx={{ mr: { sm: "auto" }, borderRadius: 2, fontWeight: 600 }}
          >
            Select All
          </Button>
          <Button
            variant="outlined" color="inherit"
            onClick={() => setPreviewOpen(false)} disabled={creating}
            fullWidth={isMobile} sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained" onClick={handleCreateSelected}
            disabled={creating || Object.values(selected).filter(Boolean).length === 0}
            fullWidth={isMobile}
            startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <PlaylistAddCheckRoundedIcon />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {creating
              ? "Creating…"
              : `Create ${Object.values(selected).filter(Boolean).length} for ${monthNames[previewMonth]}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}