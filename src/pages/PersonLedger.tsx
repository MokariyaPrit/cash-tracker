import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  useTheme,
  alpha,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { getTransactions } from "../services/transactionService";
import { getPersons } from "../services/personService";
import {
  addTransaction,
  bulkMarkCompleted,
} from "../services/transactionService";
import { useAppSelector } from "../hooks/reduxHooks";
import { useNavigate, useParams } from "react-router-dom";
import { deleteTransaction } from "../services/transactionService";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useConfirm } from "../contexts/ConfirmContext";
import { useAlert } from "../contexts/AlertContext";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";

export default function PersonLedger() {
  const user = useAppSelector((state) => state.auth.user);
  const theme = useTheme();
  const [persons, setPersons] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleDescription, setSettleDescription] = useState("");
  const [settleDate, setSettleDate] = useState<Dayjs>(dayjs());
  const [settling, setSettling] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const showAlert = useAlert();

  const handleDelete = async (transactionId: string) => {
    const ok = await confirm({
      title: "Delete transaction?",
      message: "This transaction will be removed. This cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      confirmColor: "error",
    });
    if (!ok) return;
    await deleteTransaction(transactionId);
    loadData();
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const t = await getTransactions(user.uid);
    const p = await getPersons(user.uid);
    setTransactions(t);
    setPersons(p);
    if (id) {
      const person = p.find((x: any) => x.id === id);
      setSelectedPerson(person);
    }
  };

  // ── Settle Up handler ──────────────────────────────────────────────
  const handleSettleUp = async () => {
    if (!user || !selectedPerson) return;
    setSettling(true);
    try {
      const settledAt = settleDate.toDate();

      // 1. Add a settlement transaction
      await addTransaction({
        userId: user.uid,
        personId: selectedPerson.id,
        type: "settlement",          // settlement = money received / cleared
        amount: Math.abs(currentBalance),
        description: settleDescription.trim()
          ? settleDescription.trim()
          : `Settlement for ${selectedPerson.name}`,
        status: "completed",
        date: settledAt,
        completedDate: settledAt,
        createdAt: new Date(),
        isSettlement: true,       // flag so you can identify it later
      });

      // 2. Mark all pending transactions for this person as completed
      const pendingIds = transactions
        .filter(
          (t) => t.personId === selectedPerson.id && t.status === "pending"
        )
        .map((t) => t.id);

      if (pendingIds.length > 0) {
        await bulkMarkCompleted(pendingIds, settledAt);
      }

      showAlert(
        `Settled ₹${Math.abs(currentBalance).toLocaleString()} with ${selectedPerson.name}`,
        "success"
      );
      setSettleOpen(false);
      setSettleDescription("");
      setSettleDate(dayjs());
      await loadData();
    } catch (err) {
      showAlert("Settlement failed. Please try again.", "error");
    } finally {
      setSettling(false);
    }
  };

  // ── Person balance list ────────────────────────────────────────────
  const personBalances = persons.map((person) => {
    const personTransactions = transactions.filter(
      (t) => t.personId === person.id
    );
    let balance = 0;
    personTransactions.forEach((t) => {
      if (t.type === "income") balance += t.amount;
      if (t.type === "advance") balance += t.amount;
      if (t.type === "expense") balance -= t.amount;
      if (t.type === "salary") balance -= t.amount;
      if (t.type === "settlement") balance += t.amount
    });
    return { id: person.id, name: person.name, balance };
  });

  const personColumns: GridColDef[] = [
    { field: "name", headerName: "Person", flex: 1 },
    {
      field: "balance",
      headerName: "Balance",
      flex: 1,
      renderCell: (params) => (
        <span style={{ color: params.value >= 0 ? "green" : "red" }}>
          ₹{params.value}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Button
          onClick={() =>
            setSelectedPerson(persons.find((p) => p.id === params.row.id))
          }
        >
          View Ledger
        </Button>
      ),
    },
  ];

  // ── Person transaction history ─────────────────────────────────────
  let balance = 0;
  const personRows = transactions
    .filter((t) => t.personId === selectedPerson?.id)
    .sort((a, b) => {
      const aDate = a.date?.seconds
        ? new Date(a.date.seconds * 1000)
        : new Date(a.date);
      const bDate = b.date?.seconds
        ? new Date(b.date.seconds * 1000)
        : new Date(b.date);
      return aDate.getTime() - bDate.getTime();
    })
    .map((t) => {
      if (t.type === "income") balance += t.amount;
      if (t.type === "advance") balance += t.amount;
      if (t.type === "expense") balance -= t.amount;
      if (t.type === "salary") balance -= t.amount;
       if (t.type === "settlement") balance += t.amount;
      return {
        id: t.id,
        date: t.date?.seconds
          ? new Date(t.date.seconds * 1000).toLocaleDateString("en-GB")
          : "",
        type: t.type,
        amount: t.amount,
        status: t.status,
        balance,
        description: t.description ?? "",
        isSettlement: t.isSettlement ?? false,
        completedDate: t.completedDate?.seconds
          ? new Date(t.completedDate.seconds * 1000).toLocaleDateString("en-GB")
          : "",
      };
    });

  const transactionColumns: GridColDef[] = [
    { field: "date", headerName: "Date", flex: 1 },
    {
      field: "type",
      headerName: "Type",
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {params.row.isSettlement && (
            <Chip
              label="Settlement"
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontSize: 10, height: 20 }}
            />
          )}
          {!params.row.isSettlement && (
            <Typography variant="body2">
              {params.value.charAt(0).toUpperCase() + params.value.slice(1)}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 1,
      renderCell: (params) => `₹${params.value}`,
    },
    {
      field: "balance",
      headerName: "Balance",
      flex: 1,
      renderCell: (params) => (
        <span style={{ color: params.value >= 0 ? "green" : "red" }}>
          ₹{params.value}
        </span>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => (
        <Typography
          variant="body2"
          color={params.value === "completed" ? "success.main" : "text.secondary"}
          fontWeight={params.value === "completed" ? 600 : 400}
        >
          {params.value.charAt(0).toUpperCase() + params.value.slice(1)}
        </Typography>
      ),
    },
    {
      field: "description",
      headerName: "Description",
      flex: 1.5,
      renderCell: (params) =>
        params.value ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <InfoOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {params.value}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.disabled">—</Typography>
        ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <Button
            size="small"
            onClick={() => navigate(`/transactions/edit/${params.row.id}`)}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  const currentBalance =
    personRows.length > 0 ? personRows[personRows.length - 1].balance : 0;

  const pendingCount = transactions.filter(
    (t) => t.personId === selectedPerson?.id && t.status === "pending"
  ).length;

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 3 }}>
      {/* Person Balances List */}
      {!selectedPerson && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight={700}>
              Person Balances
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overview of all your contacts and their current balances
            </Typography>
          </Box>
          <DataGrid
            rows={personBalances}
            columns={personColumns}
            autoHeight
            disableRowSelectionOnClick
          />
        </>
      )}

      {/* Selected Person Ledger */}
      {selectedPerson && (
        <>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
              pb: 2.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            {/* Left: Back + Name */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => setSelectedPerson(null)}
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                  minWidth: "auto",
                  "&:hover": { backgroundColor: "action.hover" },
                }}
              >
                Back
              </Button>

              <Divider orientation="vertical" flexItem sx={{ height: 28, alignSelf: "center" }} />

              <Box>
                <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
                  {selectedPerson.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Transaction Ledger
                </Typography>
              </Box>
            </Box>

            {/* Right: Balance + Settle Up + Add */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* Current Balance box */}
              {personRows.length > 0 && (
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: currentBalance >= 0 ? "success.light" : "error.light",
                    backgroundColor: currentBalance >= 0
                      ? "rgba(46,125,50,0.06)"
                      : "rgba(211,47,47,0.06)",
                    minWidth: 120,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    Current Balance
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color={currentBalance >= 0 ? "success.main" : "error.main"}
                  >
                    ₹{currentBalance}
                  </Typography>
                </Box>
              )}

              {/* Settle Up — only show when there's a non-zero balance */}
              {currentBalance !== 0 && (
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<AccountBalanceWalletRoundedIcon />}
                  onClick={() => setSettleOpen(true)}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    px: 2.5,
                    borderColor: "success.main",
                    color: "success.main",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.success.main, 0.06),
                      borderColor: "success.dark",
                    },
                  }}
                >
                  Settle Up
                </Button>
              )}

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() =>
                  navigate(`/transactions/add?personId=${selectedPerson.id}`)
                }
                sx={{ borderRadius: 2, px: 2.5, fontWeight: 600 }}
              >
                Add Transaction
              </Button>
            </Box>
          </Box>

          {/* Transaction count + pending badge */}
          <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={`${personRows.length} transaction${personRows.length !== 1 ? "s" : ""}`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
            {pendingCount > 0 && (
              <Chip
                label={`${pendingCount} pending`}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            )}
          </Box>

          <DataGrid
            rows={personRows}
            columns={transactionColumns}
            autoHeight
            disableRowSelectionOnClick
          />
        </>
      )}

      {/* ── Settle Up Dialog ── */}
      <Dialog
        open={settleOpen}
        onClose={() => !settling && setSettleOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleOutlineRoundedIcon color="success" />
            <Typography variant="h6" fontWeight={700}>
              Settle Up with {selectedPerson?.name}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {/* Summary box */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.success.main, 0.06),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Settlement Amount
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                ₹{Math.abs(currentBalance).toLocaleString()}
              </Typography>
              {pendingCount > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  {pendingCount} pending transaction{pendingCount !== 1 ? "s" : ""} will be marked as completed
                </Typography>
              )}
            </Box>

            {/* Settlement date */}
            <DatePicker
              label="Settlement Date"
              value={settleDate}
              format="DD/MM/YYYY"
              onChange={(val) => setSettleDate(val ?? dayjs())}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  helperText: "Date the payment was made",
                  sx: {
                    "& .MuiOutlinedInput-root": { borderRadius: 2 },
                  },
                },
              }}
            />

            {/* Optional description */}
            <TextField
              label="Note (optional)"
              placeholder="e.g. Paid via UPI, Cash payment…"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={settleDescription}
              onChange={(e) => setSettleDescription(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setSettleOpen(false)}
            disabled={settling}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSettleUp}
            disabled={settling}
            startIcon={
              settling ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CheckCircleOutlineRoundedIcon />
              )
            }
            sx={{ borderRadius: 2, minWidth: 130 }}
          >
            {settling ? "Settling…" : "Confirm Settle"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}